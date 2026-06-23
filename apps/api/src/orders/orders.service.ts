import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InstallmentRequestStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';

/**
 * Orders:
 *   - Checkout creates one Order containing all cart items.
 *   - One InstallmentRequest per OrderItem (PENDING → vendor/admin approves).
 *   - Cart is emptied after successful checkout (brief Phase 4).
 */
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    // KYC gate: customer must have APPROVED KYC before first installment (brief Phase 7).
    // Graceful message here; strict enforcement can be enabled later.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Load cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            installmentPlan: true,
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    // Validate address
    const address = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
    if (!address || address.userId !== userId) {
      throw new ForbiddenException('Invalid address');
    }

    // Validate products/plans still active + stock ok
    for (const item of cart.items) {
      if (item.product.status !== ProductStatus.PUBLISHED) {
        throw new BadRequestException(`"${item.product.name}" is no longer available`);
      }
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `"${item.product.name}" has only ${item.product.stock} in stock`,
        );
      }
      if (!item.installmentPlan.isActive || item.installmentPlan.productId !== item.product.id) {
        throw new BadRequestException(`Plan invalid for "${item.product.name}"`);
      }
    }

    // Compute totals
    let subtotal = 0;
    let totalAdvance = 0;
    let totalMonthly = 0;
    let totalPayable = 0;
    for (const item of cart.items) {
      const q = item.quantity;
      subtotal += Number(item.product.cashPrice) * q;
      totalAdvance += Number(item.installmentPlan.advanceAmount) * q;
      totalMonthly += Number(item.installmentPlan.monthlyAmount) * q;
      totalPayable += Number(item.installmentPlan.totalPayable) * q;
    }

    const orderNumber = await this.generateOrderNumber();

    // Atomic transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: dto.addressId,
          subtotal: subtotal.toFixed(2),
          totalAdvance: totalAdvance.toFixed(2),
          totalMonthly: totalMonthly.toFixed(2),
          totalPayable: totalPayable.toFixed(2),
          notes: dto.notes,
        },
      });

      for (const item of cart.items) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: item.productId,
            installmentPlanId: item.installmentPlanId,
            vendorId: item.product.vendorId,
            quantity: item.quantity,
            durationMonths: item.installmentPlan.durationMonths,
            advanceAmount: item.installmentPlan.advanceAmount,
            monthlyAmount: item.installmentPlan.monthlyAmount,
            totalPayable: item.installmentPlan.totalPayable,
          },
        });

        await tx.installmentRequest.create({
          data: {
            orderId: created.id,
            orderItemId: orderItem.id,
            customerId: userId,
            vendorId: item.product.vendorId,
            productId: item.productId,
            installmentPlanId: item.installmentPlanId,
            status: InstallmentRequestStatus.PENDING,
            vendorNotifiedAt: new Date(),
          },
        });

        // Decrement stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Empty cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'ORDER_PLACED',
          entity: 'Order',
          entityId: created.id,
          metadata: { orderNumber, itemCount: cart.items.length },
        },
      });

      return created;
    });

    return { orderId: order.id, orderNumber: order.orderNumber };
  }

  async listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
        address: { include: { city: true } },
      },
    });
  }

  async getMyOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { include: { images: true } },
            installmentPlan: true,
            request: { include: { schedules: { orderBy: { installmentNo: 'asc' } } } },
          },
        },
        address: { include: { city: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');
    return order;
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const count = await this.prisma.order.count();
    return `QP-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  async listMyInstallmentRequests(userId: string) {
    return this.prisma.installmentRequest.findMany({
      where:   { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItem: {
          include: {
            product: {
              select: {
                id: true, name: true, slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        installmentPlan: true,
        schedules: { orderBy: { installmentNo: 'asc' } },
      },
    });
  }
}
