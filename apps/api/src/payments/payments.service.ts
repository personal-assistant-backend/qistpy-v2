import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InstallmentRequestStatus,
  InstallmentScheduleStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../vendor/wallet/wallet.service';
import { AdminReviewPaymentDto, InitiatePaymentDto } from './dto/payment.dto';
import { EasyPaisaGateway } from './providers/easypaisa.gateway';
import { JazzCashGateway } from './providers/jazzcash.gateway';

/**
 * Payments (brief Phase 6):
 *   - initiate(): creates Payment(INITIATED) and returns redirect URL (for gateways)
 *     or stays PENDING_REVIEW (for manual bank transfer).
 *   - webhook(): verifies signature, marks SUCCESS/FAILED, advances installment state.
 *   - adminReviewBankTransfer(): approve/reject uploaded screenshot.
 *
 * On SUCCESS advance payment → InstallmentRequest moves to ADVANCE_PAID then ACTIVE.
 * On SUCCESS installment payment → schedule row marked PAID; if last row then
 * request moves to COMPLETED.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly jazz: JazzCashGateway,
    private readonly easy: EasyPaisaGateway,
  ) {}

  // ============================================================
  // Initiate
  // ============================================================

  async initiate(userId: string, dto: InitiatePaymentDto) {
    const req = await this.prisma.installmentRequest.findUnique({
      where: { id: dto.requestId },
      include: { installmentPlan: true },
    });
    if (!req) throw new NotFoundException('Installment request not found');
    if (req.customerId !== userId) throw new ForbiddenException('Not your request');

    // Determine what's being paid (advance vs specific schedule row)
    let amount = 0;
    let schedule = null;
    if (dto.scheduleId) {
      schedule = await this.prisma.installmentSchedule.findUnique({
        where: { id: dto.scheduleId },
      });
      if (!schedule || schedule.requestId !== req.id) {
        throw new BadRequestException('Schedule row not found for this request');
      }
      if (schedule.status === InstallmentScheduleStatus.PAID) {
        throw new BadRequestException('This installment is already paid');
      }
      amount = Number(schedule.amount) + Number(schedule.lateFeeAmount);
    } else {
      // advance payment
      if (req.status !== InstallmentRequestStatus.APPROVED) {
        throw new BadRequestException(
          `Cannot pay advance on a request that is ${req.status.toLowerCase()}`,
        );
      }
      amount = Number(req.installmentPlan.advanceAmount);
    }

    const initialStatus =
      dto.method === PaymentMethod.BANK_TRANSFER || dto.method === PaymentMethod.RAAST
        ? PaymentStatus.PENDING_REVIEW
        : PaymentStatus.INITIATED;

    const payment = await this.prisma.payment.create({
      data: {
        requestId: req.id,
        scheduleId: schedule?.id,
        method: dto.method,
        status: initialStatus,
        amount: amount.toFixed(2),
        screenshotUrl: dto.screenshotUrl,
      },
    });

    // Build redirect URL for gateways
    let redirectUrl: string | null = null;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (dto.method === PaymentMethod.JAZZCASH) {
      redirectUrl = this.jazz.buildRedirectUrl({
        amount,
        orderRef: payment.id,
        customerPhone: user?.phone ?? '',
      });
    } else if (dto.method === PaymentMethod.EASYPAISA) {
      redirectUrl = this.easy.buildRedirectUrl({
        amount,
        orderRef: payment.id,
        customerPhone: user?.phone ?? '',
      });
    }

    return {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      redirectUrl,
      message:
        initialStatus === PaymentStatus.PENDING_REVIEW
          ? 'Payment submitted. Admin will verify within 24 hours.'
          : 'Redirect to gateway to complete payment.',
    };
  }

  // ============================================================
  // Webhook / callback handler
  // ============================================================

  async handleGatewayCallback(
    method: PaymentMethod,
    payload: Record<string, string>,
    receivedHash: string,
  ) {
    let verified = false;
    if (method === PaymentMethod.JAZZCASH) {
      verified = this.jazz.verifyCallbackSignature(payload, receivedHash);
    } else if (method === PaymentMethod.EASYPAISA) {
      verified = this.easy.verifyCallbackSignature(payload, receivedHash);
    }

    const paymentId = payload['orderRef'] ?? payload['pp_TxnRefNo'];
    const gatewayTxnId = payload['txnId'] ?? payload['pp_ResponseCode'];
    const success = verified && payload['status'] === 'SUCCESS';

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      return { received: true, matched: false };
    }

    await this.markPaymentResolved(
      payment.id,
      success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      {
        gatewayTxnId,
        gatewayResponse: payload,
        signatureVerified: verified,
      },
    );
    return { received: true, matched: true, success };
  }

  // ============================================================
  // Admin review of bank-transfer screenshots
  // ============================================================

  async listPendingReview() {
    return this.prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING_REVIEW },
      orderBy: { createdAt: 'asc' },
      include: {
        request: { include: { customer: { select: { name: true, phone: true } } } },
      },
    });
  }

  async reviewBankTransfer(adminId: string, paymentId: string, dto: AdminReviewPaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PENDING_REVIEW) {
      throw new BadRequestException('Payment is not pending review');
    }

    const nextStatus =
      dto.decision === 'APPROVE' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        reviewedAt: new Date(),
        reviewedById: adminId,
        reviewNote: dto.note,
      },
    });

    await this.markPaymentResolved(payment.id, nextStatus, {
      signatureVerified: true, // manually verified by admin
    });

    return { message: `Payment ${dto.decision === 'APPROVE' ? 'approved' : 'rejected'}` };
  }

  // ============================================================
  // Core resolver — single source of truth for status transitions
  // ============================================================

  private async markPaymentResolved(
    paymentId: string,
    status: PaymentStatus,
    extra: {
      gatewayTxnId?: string;
      gatewayResponse?: Record<string, unknown>;
      signatureVerified?: boolean;
    },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        request: { include: { installmentPlan: true, schedules: true } },
        schedule: true,
      },
    });
    if (!payment) return;
    if (payment.status === PaymentStatus.SUCCESS) return; // idempotent

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status,
          gatewayTxnId: extra.gatewayTxnId,
          gatewayResponse: extra.gatewayResponse as never,
          signatureVerified: extra.signatureVerified ?? false,
        },
      });

      if (status !== PaymentStatus.SUCCESS) return;

      if (payment.scheduleId && payment.schedule) {
        // Installment payment → mark schedule row PAID
        await tx.installmentSchedule.update({
          where: { id: payment.scheduleId },
          data: {
            status: InstallmentScheduleStatus.PAID,
            paidAt: new Date(),
            paidAmount: payment.amount,
          },
        });

        // If all schedule rows PAID → request COMPLETED
        const remaining = await tx.installmentSchedule.count({
          where: { requestId: payment.requestId, status: { not: InstallmentScheduleStatus.PAID } },
        });
        if (remaining === 0) {
          await tx.installmentRequest.update({
            where: { id: payment.requestId },
            data: { status: InstallmentRequestStatus.COMPLETED },
          });
        }
      } else {
        // Advance payment → request moves to ADVANCE_PAID, then ACTIVE
        await tx.installmentRequest.update({
          where: { id: payment.requestId },
          data: { status: InstallmentRequestStatus.ACTIVE },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_SUCCESS',
          entity: 'Payment',
          entityId: payment.id,
          metadata: {
            method: payment.method,
            amount: payment.amount.toString(),
            verified: extra.signatureVerified ?? false,
          },
        },
      });
    });

    // Refresh vendor wallet after successful payment
    if (status === PaymentStatus.SUCCESS) {
      await this.wallet.recomputeForVendor(payment.request.vendorId);
    }
  }
}
