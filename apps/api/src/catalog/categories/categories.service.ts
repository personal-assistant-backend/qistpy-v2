import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/slugify';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Public reads
  // ============================================================

  /**
   * Returns a 2-level tree: top-level categories with their children.
   * Only active categories are included. Ordered by orderIndex then name.
   */
  async listTree() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            iconUrl: true,
          },
        },
      },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
    });
    return categories;
  }

  async getBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
        },
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  // ============================================================
  // Admin writes
  // ============================================================

  async create(dto: CreateCategoryDto) {
    const slug = await this.uniqueSlug(dto.name);

    // If parentId provided, verify it exists.
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new BadRequestException('Parent category not found');
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
        iconUrl: dto.iconUrl,
        orderIndex: dto.orderIndex ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    // Prevent loops: category cannot become its own descendant.
    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const data: Prisma.CategoryUpdateInput = {
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      iconUrl: dto.iconUrl,
      orderIndex: dto.orderIndex,
      isActive: dto.isActive,
    };

    // If name changed, regenerate slug (unique check).
    if (dto.name && dto.name !== existing.name) {
      data.slug = await this.uniqueSlug(dto.name, id);
    }

    if (dto.parentId !== undefined) {
      data.parent = dto.parentId ? { connect: { id: dto.parentId } } : { disconnect: true };
    }

    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string): Promise<{ message: string }> {
    const hasProducts = await this.prisma.product.count({ where: { categoryId: id } });
    if (hasProducts > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${hasProducts} products. Archive instead.`,
      );
    }
    const hasChildren = await this.prisma.category.count({ where: { parentId: id } });
    if (hasChildren > 0) {
      throw new BadRequestException('Cannot delete category with child categories');
    }

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }

  // ============================================================
  // Helpers
  // ============================================================

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.category.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${counter++}`;
    }
  }
}
