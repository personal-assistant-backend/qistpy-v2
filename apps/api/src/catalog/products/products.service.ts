import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListProductsDto, ProductSort } from './dto/list-products.dto';

const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public product listing with filters + pagination.
   * Only PUBLISHED products visible.
   * Returns standard envelope: { data, meta }.
   */
  async list(dto: ListProductsDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? DEFAULT_PAGE_SIZE;

    const where: Prisma.ProductWhereInput = { status: ProductStatus.PUBLISHED };

    if (dto.categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: dto.categorySlug },
      });
      if (category) where.categoryId = category.id;
      else where.id = 'no-match'; // ensures empty result
    }

    if (dto.brandSlug) {
      const brand = await this.prisma.brand.findUnique({ where: { slug: dto.brandSlug } });
      if (brand) where.brandId = brand.id;
      else where.id = 'no-match';
    }

    if (dto.q) {
      // Simple ILIKE search for now. Full-text search (tsvector) will be
      // added by the Search module later with a raw SQL migration.
      where.OR = [
        { name: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      where.cashPrice = {};
      if (dto.minPrice !== undefined) where.cashPrice.gte = dto.minPrice;
      if (dto.maxPrice !== undefined) where.cashPrice.lte = dto.maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = this.resolveSort(dto.sort);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          cashPrice: true,
          lowestAdvance: true,
          lowestMonthly: true,
          stock: true,
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, alt: true },
          },
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

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
        vendor: { select: { id: true, businessName: true, slug: true, logoUrl: true } },
        images: { orderBy: { orderIndex: 'asc' } },
        specs: { orderBy: { orderIndex: 'asc' } },
        variants: true,
        plans: {
          where: { isActive: true },
          orderBy: { durationMonths: 'asc' },
        },
      },
    });

    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private resolveSort(sort: ProductSort | undefined): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case ProductSort.PRICE_ASC:
        return { cashPrice: 'asc' };
      case ProductSort.PRICE_DESC:
        return { cashPrice: 'desc' };
      case ProductSort.NAME_ASC:
        return { name: 'asc' };
      case ProductSort.LATEST:
      default:
        return { createdAt: 'desc' };
    }
  }
}
