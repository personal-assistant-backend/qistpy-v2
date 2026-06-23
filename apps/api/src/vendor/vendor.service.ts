import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InstallmentRequestStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dashboard summary — counts and balances */
  async dashboard(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: { wallet: true },
    });
    if (!vendor) throw new ForbiddenException('Not a vendor');

    const [products, pendingRequests, activeRequests, totalOrders] = await Promise.all([
      this.prisma.product.count({
        where: { vendorId: vendor.id, status: ProductStatus.PUBLISHED },
      }),
      this.prisma.installmentRequest.count({
        where: { vendorId: vendor.id, status: InstallmentRequestStatus.PENDING },
      }),
      this.prisma.installmentRequest.count({
        where: { vendorId: vendor.id, status: InstallmentRequestStatus.ACTIVE },
      }),
      this.prisma.orderItem.count({ where: { vendorId: vendor.id } }),
    ]);

    return {
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        slug: vendor.slug,
        status: vendor.status,
        platformFeePercent: vendor.platformFeePercent,
      },
      counts: { products, pendingRequests, activeRequests, totalOrders },
      wallet: vendor.wallet ?? {
        pendingBalance: '0',
        clearedBalance: '0',
        withdrawableBalance: '0',
      },
    };
  }

  async profile(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    return vendor;
  }
}
