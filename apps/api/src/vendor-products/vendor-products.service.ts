import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slugify';
import { CreateInstallmentPlanDto } from './dto/create-plan.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class VendorProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Vendor context — resolves vendorId from userId + enforces approval
  // ADMIN: automatically uses the first APPROVED vendor (for product management)
  // ============================================================

  private async getApprovedVendor(userId: string) {
    // Check if user is admin — use first approved vendor
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === 'ADMIN') {
      const vendor = await this.prisma.vendor.findFirst({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'asc' },
      });
      if (!vendor) throw new ForbiddenException('No approved vendor found. Please seed the database first.');
      return vendor;
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });
    if (!vendor) throw new ForbiddenException('No vendor profile found for this user');
    if (vendor.status !== 'APPROVED') {
      throw new ForbiddenException(`Vendor account is ${vendor.status.toLowerCase()}`);
    }
    return vendor;
  }

  // ============================================================
  // Products — create/list/update/delete/publish
  // ============================================================

  async create(userId: string, dto: CreateProductDto) {
    const vendor = await this.getApprovedVendor(userId);

    // Validate category exists + active
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category || !category.isActive) {
      throw new BadRequestException('Selected category is not available');
    }

    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
      if (!brand || !brand.isActive) {
        throw new BadRequestException('Selected brand is not available');
      }
    }

    const slug = await this.uniqueSlug(dto.name);

    // Ensure at most one image flagged primary; if none, make the first primary.
    const images = (dto.images ?? []).map((img, idx) => ({
      ...img,
      orderIndex: idx,
      isPrimary: img.isPrimary ?? idx === 0,
    }));
    const primaryCount = images.filter((i) => i.isPrimary).length;
    if (primaryCount > 1) {
      throw new BadRequestException('Only one image can be marked primary');
    }

    return this.prisma.product.create({
      data: {
        vendorId: vendor.id,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        cashPrice: dto.cashPrice,
        stock: dto.stock,
        sku: dto.sku,
        status: ProductStatus.DRAFT, // new products start as drafts
        images: images.length ? { create: images } : undefined,
        specs: dto.specs?.length
          ? {
              create: dto.specs.map((s, idx) => ({
                label: s.label,
                value: s.value,
                orderIndex: idx,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        specs: true,
        plans: true,
      },
    });
  }

  async listMine(userId: string, page = 1, pageSize = 20) {
    const vendor = await this.getApprovedVendor(userId);
    const where = { vendorId: vendor.id };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { plans: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async update(userId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.assertOwnsProduct(userId, productId);

    if (dto.categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!cat) throw new BadRequestException('Category not found');
    }
    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
      if (!brand) throw new BadRequestException('Brand not found');
    }

    const data: Prisma.ProductUpdateInput = {
      name: dto.name,
      description: dto.description,
      shortDescription: dto.shortDescription,
      cashPrice: dto.cashPrice,
      stock: dto.stock,
    };

    if (dto.name && dto.name !== product.name) {
      data.slug = await this.uniqueSlug(dto.name, productId);
    }
    if (dto.categoryId) data.category = { connect: { id: dto.categoryId } };
    if (dto.brandId !== undefined) {
      data.brand = dto.brandId ? { connect: { id: dto.brandId } } : { disconnect: true };
    }

    return this.prisma.product.update({
      where: { id: productId },
      data,
    });
  }

  async remove(userId: string, productId: string): Promise<{ message: string }> {
    const product = await this.assertOwnsProduct(userId, productId);

    // Soft-rule: if product has any installment requests, archive instead of delete.
    const requests = await this.prisma.installmentRequest.count({ where: { productId } });
    if (requests > 0) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { status: ProductStatus.ARCHIVED },
      });
      return { message: 'Product has installment requests — archived instead of deleted' };
    }

    await this.prisma.product.delete({ where: { id: product.id } });
    return { message: 'Product deleted' };
  }

  async publish(userId: string, productId: string) {
    const product = await this.assertOwnsProduct(userId, productId);

    // Must have at least one plan before publishing (brief: installments required).
    const planCount = await this.prisma.installmentPlan.count({
      where: { productId: product.id, isActive: true },
    });
    if (planCount === 0) {
      throw new BadRequestException(
        'Product must have at least one installment plan before publishing',
      );
    }
    if (product.stock <= 0) {
      throw new BadRequestException('Cannot publish a product with zero stock');
    }

    return this.prisma.product.update({
      where: { id: product.id },
      data: { status: ProductStatus.PUBLISHED },
    });
  }

  // ============================================================
  // Plans — attached to a product
  // ============================================================

  async addPlan(userId: string, productId: string, dto: CreateInstallmentPlanDto) {
    const product = await this.assertOwnsProduct(userId, productId);

    // Derived total — single source of truth.
    const totalPayable = Number(dto.advanceAmount) + Number(dto.monthlyAmount) * dto.durationMonths;

    // Upsert pattern: @@unique([productId, durationMonths]) means we replace if exists.
    const plan = await this.prisma.installmentPlan.upsert({
      where: {
        productId_durationMonths: {
          productId: product.id,
          durationMonths: dto.durationMonths,
        },
      },
      create: {
        productId: product.id,
        durationMonths: dto.durationMonths,
        advanceAmount: dto.advanceAmount,
        monthlyAmount: dto.monthlyAmount,
        markupPercentage: dto.markupPercentage,
        markupAmount: dto.markupAmount,
        totalPayable,
        isActive: true,
      },
      update: {
        advanceAmount: dto.advanceAmount,
        monthlyAmount: dto.monthlyAmount,
        markupPercentage: dto.markupPercentage,
        markupAmount: dto.markupAmount,
        totalPayable,
        isActive: true,
      },
    });

    // Recompute denormalized product min-advance/monthly.
    await this.recomputeProductPlanMins(product.id);

    return plan;
  }

  async removePlan(userId: string, productId: string, planId: string): Promise<{ message: string }> {
    await this.assertOwnsProduct(userId, productId);
    const plan = await this.prisma.installmentPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.productId !== productId) {
      throw new NotFoundException('Plan not found for this product');
    }

    await this.prisma.installmentPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });
    await this.recomputeProductPlanMins(productId);
    return { message: 'Plan removed' };
  }

  async updatePlan(userId: string, productId: string, planId: string, data: { advanceAmount?: number; monthlyAmount?: number; markupPercentage?: number; markupAmount?: number; isActive?: boolean }) {
    await this.assertOwnsProduct(userId, productId);
    const update: any = {};
    if (data.advanceAmount !== undefined) update.advanceAmount = data.advanceAmount.toFixed(2);
    if (data.monthlyAmount !== undefined) update.monthlyAmount = data.monthlyAmount.toFixed(2);
    if (data.markupPercentage !== undefined) update.markupPercentage = data.markupPercentage.toFixed(2);
    if (data.markupAmount !== undefined) update.markupAmount = data.markupAmount.toFixed(2);
    if (data.isActive !== undefined) update.isActive = data.isActive;
    // Recalculate totalPayable
    if (data.advanceAmount !== undefined || data.monthlyAmount !== undefined) {
      const plan = await this.prisma.installmentPlan.findUnique({ where: { id: planId } });
      if (plan) {
        const adv = data.advanceAmount ?? Number(plan.advanceAmount);
        const mo  = data.monthlyAmount ?? Number(plan.monthlyAmount);
        const ma  = data.markupAmount ?? Number(plan.markupAmount ?? 0);
        update.totalPayable = (adv + mo * plan.durationMonths).toFixed(2);
        if (data.markupAmount === undefined) update.markupAmount = ma.toFixed(2);
      }
    }
    await this.prisma.installmentPlan.update({ where: { id: planId }, data: update });
    await this.recomputeProductPlanMins(productId);
    return { message: 'Plan updated' };
  }

  // ============================================================
  // Helpers
  // ============================================================

  private async assertOwnsProduct(userId: string, productId: string) {
    const vendor = await this.getApprovedVendor(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.vendorId !== vendor.id) {
      throw new ForbiddenException('You do not own this product');
    }
    return product;
  }

  /** Keep the denormalized Product.lowestAdvance/lowestMonthly fields in sync. */
  private async recomputeProductPlanMins(productId: string): Promise<void> {
    const agg = await this.prisma.installmentPlan.aggregate({
      where: { productId, isActive: true },
      _min: { advanceAmount: true, monthlyAmount: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        lowestAdvance: agg._min.advanceAmount,
        lowestMonthly: agg._min.monthlyAmount,
      },
    });
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 1;
    while (true) {
      const existing = await this.prisma.product.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${counter++}`;
    }
  }
}
