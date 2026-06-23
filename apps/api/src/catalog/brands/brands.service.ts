import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/slugify';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    return this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  }

  async getBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand || !brand.isActive) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async create(dto: CreateBrandDto) {
    const slug = await this.uniqueSlug(dto.name);
    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        logoUrl: dto.logoUrl,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Brand not found');

    const data: {
      name?: string;
      slug?: string;
      logoUrl?: string;
      isActive?: boolean;
    } = {
      name: dto.name,
      logoUrl: dto.logoUrl,
      isActive: dto.isActive,
    };

    if (dto.name && dto.name !== existing.name) {
      data.slug = await this.uniqueSlug(dto.name, id);
    }

    return this.prisma.brand.update({ where: { id }, data });
  }

  async remove(id: string): Promise<{ message: string }> {
    const hasProducts = await this.prisma.product.count({ where: { brandId: id } });
    if (hasProducts > 0) {
      throw new BadRequestException(
        `Cannot delete brand with ${hasProducts} products. Deactivate instead.`,
      );
    }
    await this.prisma.brand.delete({ where: { id } });
    return { message: 'Brand deleted' };
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 1;
    while (true) {
      const existing = await this.prisma.brand.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${counter++}`;
    }
  }
}
