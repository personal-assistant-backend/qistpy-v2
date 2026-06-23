import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayoutStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestPayoutDto } from './dto/payout.dto';
import { WalletService } from './wallet/wallet.service';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async listMine(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Not a vendor');
    return this.prisma.payout.findMany({
      where: { vendorId: vendor.id },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async request(userId: string, dto: RequestPayoutDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Not a vendor');

    const snapshot = await this.wallet.myWallet(userId);
    if (dto.amount > Number(snapshot.withdrawableBalance)) {
      throw new BadRequestException(
        `Requested amount exceeds withdrawable balance (${snapshot.withdrawableBalance})`,
      );
    }

    const payout = await this.prisma.payout.create({
      data: {
        vendorId: vendor.id,
        amount: dto.amount,
        bankAccount: dto.bankAccount,
        bankName: dto.bankName,
        accountTitle: dto.accountTitle,
        status: PayoutStatus.REQUESTED,
      },
    });
    await this.wallet.recomputeForVendor(vendor.id);
    return payout;
  }

  // ---------- Admin ----------

  async listAll(status?: PayoutStatus) {
    return this.prisma.payout.findMany({
      where: status ? { status } : {},
      orderBy: { requestedAt: 'desc' },
      take: 100,
      include: {
        vendor: { select: { id: true, businessName: true, slug: true } },
      },
    });
  }

  async approve(adminId: string, payoutId: string, note?: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== PayoutStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED payouts can be approved');
    }
    await this.prisma.$transaction([
      this.prisma.payout.update({
        where: { id: payoutId },
        data: { status: PayoutStatus.APPROVED, approvedAt: new Date(), adminNote: note },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'PAYOUT_APPROVE',
          entity: 'Payout',
          entityId: payoutId,
          metadata: { note: note ?? null },
        },
      }),
    ]);
    await this.wallet.recomputeForVendor(payout.vendorId);
    return { message: 'Payout approved' };
  }

  async markPaid(adminId: string, payoutId: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== PayoutStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED payouts can be marked paid');
    }
    await this.prisma.$transaction([
      this.prisma.payout.update({
        where: { id: payoutId },
        data: { status: PayoutStatus.PAID, paidAt: new Date() },
      }),
      this.prisma.walletTransaction.create({
        data: {
          vendorId: payout.vendorId,
          payoutId: payout.id,
          type: 'DEBIT_PAYOUT',
          amount: payout.amount.toString(),
          balanceAfter: '0', // recompute next
          note: 'Payout paid to vendor',
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'PAYOUT_PAID',
          entity: 'Payout',
          entityId: payoutId,
        },
      }),
    ]);
    await this.wallet.recomputeForVendor(payout.vendorId);
    return { message: 'Payout marked as paid' };
  }

  async reject(adminId: string, payoutId: string, reason: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status === PayoutStatus.PAID) {
      throw new BadRequestException('Cannot reject an already-paid payout');
    }
    await this.prisma.$transaction([
      this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'PAYOUT_REJECT',
          entity: 'Payout',
          entityId: payoutId,
          metadata: { reason },
        },
      }),
    ]);
    await this.wallet.recomputeForVendor(payout.vendorId);
    return { message: 'Payout rejected' };
  }
}
