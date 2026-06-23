import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InstallmentRequestStatus,
  InstallmentScheduleStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateSchedule } from './schedule-generator';

/**
 * Installment workflow (brief Phase 4):
 *   PENDING → APPROVED → ADVANCE_PAID → ACTIVE → COMPLETED
 *         ↓           ↓
 *       REJECTED    CANCELLED
 *                     ↓
 *                  DEFAULTED (60+ days overdue, manual admin action)
 *
 * Approval authority:
 *   - Vendor approves for own products (default)
 *   - Admin can override
 *   - If vendor inactive 48h, admin notified
 */
@Injectable()
export class InstallmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ============================================================
  // Listings
  // ============================================================

  /** Customer: my installment requests */
  async listMyRequests(userId: string) {
    return this.prisma.installmentRequest.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        installmentPlan: { select: { durationMonths: true, totalPayable: true } },
        orderItem: { include: { product: { select: { name: true, slug: true } } } },
        schedules: { orderBy: { installmentNo: 'asc' } },
      },
    });
  }

  async getMyRequest(userId: string, requestId: string) {
    const req = await this.prisma.installmentRequest.findUnique({
      where: { id: requestId },
      include: {
        installmentPlan: true,
        orderItem: { include: { product: true } },
        schedules: { orderBy: { installmentNo: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!req) throw new NotFoundException('Request not found');
    if (req.customerId !== userId) throw new ForbiddenException('Not your request');
    return req;
  }

  /** Vendor: requests for my products */
  async listVendorRequests(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Not a vendor');
    return this.prisma.installmentRequest.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true, kycStatus: true } },
        orderItem: { include: { product: { select: { name: true, slug: true } } } },
        installmentPlan: { select: { durationMonths: true, totalPayable: true } },
      },
    });
  }

  /** Admin: all requests */
  async listAllRequests(status?: InstallmentRequestStatus) {
    const where: Prisma.InstallmentRequestWhereInput = {};
    if (status) where.status = status;
    return this.prisma.installmentRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // simple cap for admin panel
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        orderItem: { include: { product: { select: { name: true, slug: true } } } },
        installmentPlan: { select: { durationMonths: true, totalPayable: true } },
      },
    });
  }

  // ============================================================
  // Approve / Reject (vendor or admin)
  // ============================================================

  async approve(actorId: string, actorRole: UserRole, requestId: string) {
    const req = await this.loadPendingForAction(actorId, actorRole, requestId);

    await this.prisma.$transaction(async (tx) => {
      await tx.installmentRequest.update({
        where: { id: req.id },
        data: {
          status: InstallmentRequestStatus.APPROVED,
          approvedById: actorId,
          approvedByRole: actorRole,
          approvedAt: new Date(),
        },
      });

      // Generate schedule rows immediately on approval (brief Phase 4)
      const plan = req.installmentPlan;
      const rows = generateSchedule({
        orderDate: new Date(),
        durationMonths: plan.durationMonths,
        monthlyAmount: plan.monthlyAmount.toString(),
      });
      await tx.installmentSchedule.createMany({
        data: rows.map((r) => ({
          requestId: req.id,
          installmentNo: r.installmentNo,
          dueDate: r.dueDate,
          amount: r.amount,
          status: InstallmentScheduleStatus.PENDING,
        })),
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'INSTALLMENT_APPROVE',
          entity: 'InstallmentRequest',
          entityId: req.id,
          metadata: { role: actorRole },
        },
      });
    });

    return { message: 'Request approved. Advance payment can now be collected.' };
  }

  async reject(actorId: string, actorRole: UserRole, requestId: string, reason?: string) {
    const req = await this.loadPendingForAction(actorId, actorRole, requestId);

    await this.prisma.$transaction(async (tx) => {
      await tx.installmentRequest.update({
        where: { id: req.id },
        data: {
          status: InstallmentRequestStatus.REJECTED,
          approvedById: actorId,
          approvedByRole: actorRole,
          approvedAt: new Date(),
          rejectionReason: reason,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'INSTALLMENT_REJECT',
          entity: 'InstallmentRequest',
          entityId: req.id,
          metadata: { role: actorRole, reason: reason ?? null },
        },
      });
    });
    return { message: 'Request rejected.' };
  }

  // ============================================================
  // Cancel (customer or admin per brief rules)
  // ============================================================

  async cancel(userId: string, requestId: string, note?: string) {
    const req = await this.prisma.installmentRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.customerId !== userId) throw new ForbiddenException('Not your request');

    // Brief rules:
    //   Before ADVANCE_PAID → customer can cancel freely
    //   After ADVANCE_PAID before delivery → requires admin (skip here)
    //   After delivery → not allowed
    if (
      req.status !== InstallmentRequestStatus.PENDING &&
      req.status !== InstallmentRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Cancellation after advance payment requires admin approval. Please contact support.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.installmentRequest.update({
        where: { id: req.id },
        data: {
          status: InstallmentRequestStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: userId,
          cancellationNote: note,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'INSTALLMENT_CANCEL',
          entity: 'InstallmentRequest',
          entityId: req.id,
          metadata: { note: note ?? null },
        },
      });
    });
    return { message: 'Request cancelled.' };
  }

  // ============================================================
  // Mark as defaulted (admin only, after 60+ days overdue)
  // ============================================================

  async markDefaulted(adminId: string, requestId: string) {
    const req = await this.prisma.installmentRequest.findUnique({
      where: { id: requestId },
      include: { schedules: true },
    });
    if (!req) throw new NotFoundException('Request not found');

    const threshold = parseInt(this.config.get<string>('DEFAULT_THRESHOLD_DAYS') ?? '60', 10);
    const oldestOverdue = req.schedules
      .filter((s) => s.status !== InstallmentScheduleStatus.PAID && s.dueDate < new Date())
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

    if (!oldestOverdue) {
      throw new BadRequestException('No overdue installments on this request');
    }
    const daysOverdue = Math.floor((Date.now() - oldestOverdue.dueDate.getTime()) / 86400000);
    if (daysOverdue < threshold) {
      throw new BadRequestException(
        `Earliest overdue installment is ${daysOverdue} days old; threshold is ${threshold} days`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.installmentRequest.update({
        where: { id: req.id },
        data: { status: InstallmentRequestStatus.DEFAULTED },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'INSTALLMENT_DEFAULTED',
          entity: 'InstallmentRequest',
          entityId: req.id,
          metadata: { daysOverdue },
        },
      }),
    ]);
    return { message: `Request marked as defaulted (${daysOverdue} days overdue).` };
  }

  // ============================================================
  // Internal helpers
  // ============================================================

  private async loadPendingForAction(actorId: string, role: UserRole, requestId: string) {
    const req = await this.prisma.installmentRequest.findUnique({
      where: { id: requestId },
      include: { installmentPlan: true },
    });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== InstallmentRequestStatus.PENDING) {
      throw new BadRequestException(`Request is already ${req.status.toLowerCase()}`);
    }

    if (role === UserRole.ADMIN) return req;

    if (role === UserRole.VENDOR) {
      const vendor = await this.prisma.vendor.findUnique({ where: { userId: actorId } });
      if (!vendor || vendor.id !== req.vendorId) {
        throw new ForbiddenException('You can only act on your own products');
      }
      return req;
    }

    throw new ForbiddenException('Only vendor or admin can act on requests');
  }
}
