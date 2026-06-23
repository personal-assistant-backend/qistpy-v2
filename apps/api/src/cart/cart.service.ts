import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures the user has a cart row; creates one on first add.
   * Cart is 1:1 with User (Prisma schema).
   */
  private async ensureCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.ensureCart(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
        installmentPlan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute totals on the fly (plans snapshot happens at order creation).
    let totalAdvance = 0;
    let totalMonthly = 0;
    let totalPayable = 0;
    for (const it of items) {
      const q = it.quantity;
      totalAdvance += Number(it.installmentPlan.advanceAmount) * q;
      totalMonthly += Number(it.installmentPlan.monthlyAmount) * q;
      totalPayable += Number(it.installmentPlan.totalPayable) * q;
    }

    return {
      id: cart.id,
      items,
      totals: {
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        totalAdvance: totalAdvance.toFixed(2),
        totalMonthly: totalMonthly.toFixed(2),
        totalPayable: totalPayable.toFixed(2),
      },
    };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const [product, plan] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: dto.productId } }),
      this.prisma.installmentPlan.findUnique({ where: { id: dto.installmentPlanId } }),
    ]);
    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new BadRequestException('Product not available');
    }
    if (!plan || plan.productId !== product.id || !plan.isActive) {
      throw new BadRequestException('Invalid plan for this product');
    }
    if (product.stock < dto.quantity) {
      throw new BadRequestException(`Only ${product.stock} in stock`);
    }

    const cart = await this.ensureCart(userId);

    // Unique on (cartId, productId, installmentPlanId) — upsert quantity.
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        installmentPlanId: dto.installmentPlanId,
      },
    });
    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    }
    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: dto.productId,
        installmentPlanId: dto.installmentPlanId,
        quantity: dto.quantity,
      },
    });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.assertOwns(userId, itemId);
    return this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });
  }

  async removeItem(userId: string, itemId: string): Promise<{ message: string }> {
    const item = await this.assertOwns(userId, itemId);
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return { message: 'Item removed' };
  }

  async clear(userId: string): Promise<{ message: string }> {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { message: 'Cart cleared' };
  }

  private async assertOwns(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (item.cart.userId !== userId) throw new ForbiddenException('Not your item');
    return item;
  }
}
