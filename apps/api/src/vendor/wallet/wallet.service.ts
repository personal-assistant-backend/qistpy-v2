import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InstallmentScheduleStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Wallet balances computed on read using SQL aggregates (brief Phase 5).
 *   pendingBalance     = unpaid schedule rows on vendor's products
 *   clearedBalance     = successful payments − platform fee − already paid payouts
 *   withdrawableBalance = clearedBalance − pending payout requests
 *
 * VendorWallet table caches these; recomputeForVendor refreshes after payment
 * confirmations and payout status changes.
 */
@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async myWallet(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Not a vendor');
    return this.computeAndSync(vendor.id, Number(vendor.platformFeePercent));
  }

  async listTransactions(userId: string, limit = 50) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Not a vendor');
    return this.prisma.walletTransaction.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Called after a payment succeeds or payout changes state.
   * Also usable from admin tools.
   */
  async recomputeForVendor(vendorId: string): Promise<void> {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    await this.computeAndSync(vendorId, Number(vendor.platformFeePercent));
  }

  private async computeAndSync(vendorId: string, feePercent: number) {
    // Pending: unpaid schedule rows * share of vendor's cut
    const pendingAgg = await this.prisma.installmentSchedule.aggregate({
      where: {
        status: { in: [InstallmentScheduleStatus.PENDING, InstallmentScheduleStatus.OVERDUE] },
        request: { vendorId },
      },
      _sum: { amount: true },
    });

    // Gross from paid installments on this vendor's requests
    const paidAgg = await this.prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCESS,
        request: { vendorId },
      },
      _sum: { amount: true },
    });

    const paidTotal = Number(paidAgg._sum.amount ?? 0);
    const platformFee = paidTotal * (feePercent / 100);
    const gross = paidTotal - platformFee;

    // Subtract payouts already paid
    const paidOut = await this.prisma.payout.aggregate({
      where: { vendorId, status: 'PAID' },
      _sum: { amount: true },
    });
    const clearedBalance = gross - Number(paidOut._sum.amount ?? 0);

    // Subtract pending/approved payouts
    const holds = await this.prisma.payout.aggregate({
      where: { vendorId, status: { in: ['REQUESTED', 'APPROVED'] } },
      _sum: { amount: true },
    });
    const withdrawableBalance = clearedBalance - Number(holds._sum.amount ?? 0);

    const pendingBalance = Number(pendingAgg._sum.amount ?? 0);

    const snapshot = {
      pendingBalance: pendingBalance.toFixed(2),
      clearedBalance: Math.max(0, clearedBalance).toFixed(2),
      withdrawableBalance: Math.max(0, withdrawableBalance).toFixed(2),
      lastRecomputedAt: new Date(),
    };

    return this.prisma.vendorWallet.upsert({
      where: { vendorId },
      update: snapshot,
      create: { vendorId, ...snapshot },
    });
  }
}
