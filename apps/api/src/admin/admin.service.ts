import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InstallmentRequestStatus,
  InstallmentScheduleStatus,
  ProductStatus,
  VendorStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Summary ──────────────────────────────────────────────────────────────

  async summary() {
    const [
      usersTotal, vendorsTotal, vendorsPending,
      productsTotal, kycPending,
      instPending, instActive,
      paymentsReview, todayPayments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vendor.count(),
      this.prisma.vendor.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count(),
      this.prisma.user.count({ where: { kycStatus: 'PENDING' } }),
      this.prisma.installmentRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.installmentRequest.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCESS', createdAt: { gte: this.startOfToday() } }, _sum: { amount: true } }),
    ]);

    return {
      users:        { total: usersTotal },
      vendors:      { total: vendorsTotal, pendingApproval: vendorsPending },
      products:     { total: productsTotal },
      kyc:          { pending: kycPending },
      installments: { pending: instPending, active: instActive },
      payments:     { pendingReview: paymentsReview, todayTotal: (todayPayments._sum?.amount ?? 0) },
    };
  }

  // ── Users ────────────────────────────────────────────────────────────────

  async listUsers(q?: string) {
    const where = q ? {
      OR: [
        { name:  { contains: q, mode: 'insensitive' as const } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {};
    return this.prisma.user.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 100,
      select: { id: true, name: true, phone: true, email: true, role: true, kycStatus: true, cnic: true, createdAt: true },
    });
  }

  // ── Vendors ──────────────────────────────────────────────────────────────

  async listVendors(status?: VendorStatus) {
    return this.prisma.vendor.findMany({
      where: status ? { status } : {},
      include: { user: { select: { name: true, phone: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveVendor(adminId: string, vendorId: string) {
    await this.prisma.vendor.update({ where: { id: vendorId }, data: { status: VendorStatus.APPROVED } });
    await this.prisma.auditLog.create({ data: { actorId: adminId, action: 'APPROVE', entity: 'Vendor', entityId: vendorId } });
    return { message: 'Vendor approved' };
  }

  async suspendVendor(adminId: string, vendorId: string, reason: string) {
    await this.prisma.vendor.update({ where: { id: vendorId }, data: { status: VendorStatus.SUSPENDED } });
    await this.prisma.auditLog.create({ data: { actorId: adminId, action: 'SUSPEND', entity: 'Vendor', entityId: vendorId, metadata: { reason } } });
    return { message: 'Vendor suspended' };
  }

  // ── KYC ─────────────────────────────────────────────────────────────────

  async listKycQueue() {
    return this.prisma.user.findMany({
      where: { kycStatus: 'PENDING' },
      select: { id: true, name: true, phone: true, cnic: true, email: true },
    });
  }

  async reviewKyc(adminId: string, userId: string, approve: boolean, reason?: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { kycStatus: approve ? 'APPROVED' : 'REJECTED' } }),
      this.prisma.auditLog.create({ data: { actorId: adminId, action: approve ? 'APPROVE' : 'REJECT', entity: 'KYC', entityId: userId, metadata: reason ? { reason } : undefined } }),
    ]);
    return { message: `KYC ${approve ? 'approved' : 'rejected'}` };
  }

  // ── Audit log ────────────────────────────────────────────────────────────

  async recentAudit(limit = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }, take: limit,
      include: { actor: { select: { name: true, role: true } } },
    });
  }

  // ── Payouts ──────────────────────────────────────────────────────────────

  async listPayouts() {
    return this.prisma.payout.findMany({
      orderBy: { requestedAt: 'desc' },
    });
  }

  async approvePayout(adminId: string, id: string) {
    await this.prisma.payout.update({ where: { id }, data: { status: 'APPROVED' } });
    await this.prisma.auditLog.create({ data: { actorId: adminId, action: 'APPROVE', entity: 'Payout', entityId: id } });
    return { message: 'Payout approved' };
  }

  async markPayoutPaid(adminId: string, id: string) {
    await this.prisma.payout.update({ where: { id }, data: { status: 'PAID' } });
    await this.prisma.auditLog.create({ data: { actorId: adminId, action: 'MARK_PAID', entity: 'Payout', entityId: id } });
    return { message: 'Payout marked paid' };
  }

  // ── Payments ─────────────────────────────────────────────────────────────

  async listPendingReview() {
    return this.prisma.payment.findMany({
      where: { status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'desc' },
      include: { request: { include: { customer: { select: { name: true, phone: true } } } } },
    });
  }

  async reviewPayment(adminId: string, id: string, decision: 'APPROVE' | 'REJECT') {
    await this.prisma.payment.update({ where: { id }, data: { status: decision === 'APPROVE' ? 'SUCCESS' : 'FAILED' } });
    await this.prisma.auditLog.create({ data: { actorId: adminId, action: decision, entity: 'Payment', entityId: id } });
    return { message: `Payment ${decision.toLowerCase()}d` };
  }

  // ── Categories (Admin manage) ─────────────────────────────────────────────

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { orderIndex: 'asc' } });
  }

  async createCategory(data: any) {
    const count = await this.prisma.category.count();
    const slug = (data.slug || data.name || 'category')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return this.prisma.category.create({
      data: {
        name: data.name,
        slug,
        imageUrl: data.imageUrl || null,
        description: data.description || null,
        isActive: data.isActive ?? true,
        orderIndex: count + 1,
      },
    });
  }

  async updateCategory(id: string, data: { name?: string; imageUrl?: string; description?: string; isActive?: boolean }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    const products = await this.prisma.product.count({ where: { categoryId: id } });
    if (products > 0) throw new BadRequestException(`Cannot delete: ${products} products in this category`);
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }

  // ── Products (Admin full access) ──────────────────────────────────────────

  async listAllProducts(q?: string, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } },
      { brand: { name: { contains: q, mode: 'insensitive' } } },
    ];
    return this.prisma.product.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand:    { select: { id: true, name: true, slug: true } },
        images:   { orderBy: { orderIndex: 'asc' } },
        plans:    { orderBy: { durationMonths: 'asc' } },
      },
    });
  }

  async addProductImage(productId: string, imageUrl: string, isPrimary: boolean) {
    if (isPrimary) {
      await this.prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    }
    const count = await this.prisma.productImage.count({ where: { productId } });
    await this.prisma.productImage.create({
      data: { productId, url: imageUrl, publicId: `admin/${productId}-${Date.now()}`, alt: '', orderIndex: count, isPrimary: isPrimary || count === 0 },
    });
    return { message: 'Image added' };
  }

  async deleteProductImage(imageId: string) {
    const img = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img) throw new NotFoundException('Image not found');
    await this.prisma.productImage.delete({ where: { id: imageId } });
    if (img.isPrimary) {
      const next = await this.prisma.productImage.findFirst({ where: { productId: img.productId }, orderBy: { orderIndex: 'asc' } });
      if (next) await this.prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
    return { message: 'Image deleted' };
  }

  // ── Installment Requests ──────────────────────────────────────────────────

  async listInstallmentRequests(status?: string) {
    const where = status ? { status: status as InstallmentRequestStatus } : {};
    return this.prisma.installmentRequest.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, cnic: true } },
        orderItem: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
        installmentPlan: true,
        schedules: { orderBy: { installmentNo: 'asc' } },
      },
    });
  }

  async approveInstallmentRequest(adminId: string, requestId: string) {
    const req = await this.prisma.installmentRequest.findUniqueOrThrow({
      where: { id: requestId }, include: { installmentPlan: true },
    });
    if (req.status !== 'PENDING') throw new BadRequestException(`Request is already ${req.status}`);

    const plan = req.installmentPlan;
    const now  = new Date();
    const schedules = Array.from({ length: plan.durationMonths }, (_, i) => {
      const due = new Date(now); due.setMonth(due.getMonth() + i + 1);
      return { requestId, installmentNo: i + 1, dueDate: due, amount: plan.monthlyAmount, status: 'PENDING' as const };
    });

    await this.prisma.$transaction([
      this.prisma.installmentRequest.update({ where: { id: requestId }, data: { status: 'APPROVED', approvedById: adminId, approvedByRole: 'ADMIN', approvedAt: now } }),
      this.prisma.installmentSchedule.createMany({ data: schedules }),
      this.prisma.auditLog.create({ data: { actorId: adminId, action: 'APPROVE', entity: 'InstallmentRequest', entityId: requestId } }),
    ]);
    return { message: 'Approved and schedule created' };
  }

  async rejectInstallmentRequest(adminId: string, requestId: string, reason?: string) {
    await this.prisma.installmentRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', rejectionReason: reason } });
    await this.prisma.auditLog.create({ data: { actorId: adminId, action: 'REJECT', entity: 'InstallmentRequest', entityId: requestId, metadata: reason ? { reason } : undefined } });
    return { message: 'Rejected' };
  }

  async recordManualPayment(
    adminId: string, requestId: string,
    body: { amount: number; note?: string; installmentNo?: number; screenshotUrl?: string },
  ) {
    const req = await this.prisma.installmentRequest.findUniqueOrThrow({
      where: { id: requestId }, include: { schedules: { orderBy: { installmentNo: 'asc' } } },
    });

    let scheduleId: string | null = null;
    if (body.installmentNo) {
      const s = req.schedules.find(s => s.installmentNo === body.installmentNo);
      if (s) scheduleId = s.id;
    } else {
      const s = req.schedules.find(s => s.status === 'PENDING' || s.status === 'OVERDUE');
      if (s) scheduleId = s.id;
    }

    if (scheduleId) {
      await this.prisma.installmentSchedule.update({
        where: { id: scheduleId },
        data: { status: InstallmentScheduleStatus.PAID, paidAt: new Date(), paidAmount: body.amount.toFixed(2) as any },
      });
    }

    // Check if all paid → COMPLETED
    const allSchedules = await this.prisma.installmentSchedule.findMany({ where: { requestId } });
    const allPaid = allSchedules.length > 0 && allSchedules.every(s => s.status === 'PAID');
    const newStatus = allPaid ? 'COMPLETED' : 'ACTIVE';
    await this.prisma.installmentRequest.update({ where: { id: requestId }, data: { status: newStatus as any } });

    // Record payment
    await this.prisma.payment.create({
      data: {
        requestId, amount: body.amount.toFixed(2) as any,
        method: 'BANK_TRANSFER', status: 'SUCCESS',
        screenshotUrl: body.screenshotUrl,
      },
    });

    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'RECORD_PAYMENT', entity: 'InstallmentRequest', entityId: requestId, metadata: { amount: body.amount, note: body.note } },
    });

    return { message: 'Payment recorded', allPaid, newStatus };
  }

  async updateInstallmentSchedule(adminId: string, scheduleId: string, data: { status?: string; paidAmount?: number; dueDate?: string }) {
    const update: any = {};
    if (data.status) update.status = data.status;
    if (data.paidAmount !== undefined) { update.paidAmount = data.paidAmount.toFixed(2); update.paidAt = new Date(); }
    if (data.dueDate) update.dueDate = new Date(data.dueDate);
    await this.prisma.installmentSchedule.update({ where: { id: scheduleId }, data: update });
    await this.prisma.auditLog.create({ data: { actorId: adminId, action: 'UPDATE_SCHEDULE', entity: 'InstallmentSchedule', entityId: scheduleId } });
    return { message: 'Schedule updated' };
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  async getSalesReport() {
    const [totalOrders, activeOrders, completedOrders, totalRevenue, monthlyRevenue, topProducts] = await Promise.all([
      this.prisma.installmentRequest.count(),
      this.prisma.installmentRequest.count({ where: { status: 'ACTIVE' } }),
      this.prisma.installmentRequest.count({ where: { status: 'COMPLETED' } }),
      this.prisma.installmentSchedule.aggregate({ where: { status: 'PAID' }, _sum: { paidAmount: true } }),
      this.prisma.installmentSchedule.aggregate({ where: { status: 'PAID', paidAt: { gte: new Date(new Date().setDate(1)) } }, _sum: { paidAmount: true } }),
      this.prisma.installmentRequest.groupBy({
        by: ['productId'], _count: { id: true },
        orderBy: { _count: { id: 'desc' } }, take: 5,
      }),
    ]);

    const topProductDetails = await Promise.all(
      topProducts.map(async (p) => {
        const product = await this.prisma.product.findUnique({ where: { id: p.productId }, select: { name: true } });
        return { name: product?.name ?? 'Unknown', count: p._count.id };
      })
    );

    return {
      orders: { total: totalOrders, active: activeOrders, completed: completedOrders },
      revenue: { total: Number(totalRevenue._sum.paidAmount ?? 0), thisMonth: Number(monthlyRevenue._sum.paidAmount ?? 0) },
      topProducts: topProductDetails,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private startOfToday(): Date {
    const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d;
  }
}
