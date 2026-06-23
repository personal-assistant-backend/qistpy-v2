import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Global product search.
 * Searches name + shortDescription + description (insensitive).
 * Returns paginated envelope. Full-text tsvector upgrade deferred to v1.1.
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string, page = 1, pageSize = 20) {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      return { data: [], meta: { page, pageSize, total: 0, totalPages: 0 } };
    }

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      OR: [
        { name: { contains: trimmed, mode: 'insensitive' } },
        { shortDescription: { contains: trimmed, mode: 'insensitive' } },
        { description: { contains: trimmed, mode: 'insensitive' } },
      ],
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, name: true, slug: true, shortDescription: true,
          cashPrice: true, lowestAdvance: true, lowestMonthly: true, stock: true,
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }
}
