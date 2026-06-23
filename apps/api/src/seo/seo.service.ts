import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSeoPageDto } from './dto/seo.dto';

@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ---------- Static pages ----------
  listAll() {
    return this.prisma.seoPage.findMany({ orderBy: { path: 'asc' } });
  }

  async getByPath(path: string) {
    const page = await this.prisma.seoPage.findUnique({
      where: { path },
      include: { category: true, city: true },
    });
    if (!page || !page.isPublished) throw new NotFoundException('Page not found');
    return page;
  }

  async upsert(dto: UpsertSeoPageDto) {
    return this.prisma.seoPage.upsert({
      where: { path: dto.path },
      update: {
        categoryId: dto.categoryId,
        cityId: dto.cityId,
        title: dto.title,
        metaDescription: dto.metaDescription,
        introHtml: dto.introHtml,
        isPublished: dto.isPublished ?? false,
      },
      create: {
        path: dto.path,
        categoryId: dto.categoryId,
        cityId: dto.cityId,
        title: dto.title,
        metaDescription: dto.metaDescription,
        introHtml: dto.introHtml,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async remove(id: string) {
    const page = await this.prisma.seoPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    await this.prisma.seoPage.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ---------- Sitemap ----------
  async buildSitemap(): Promise<string> {
    const base = this.config.get<string>('PUBLIC_SITE_URL') ?? 'https://qistpy.com';

    const [categories, products, seoPages, brands, posts] = await Promise.all([
      this.prisma.category.findMany({
        where: { isActive: true, parentId: null },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.seoPage.findMany({
        where: { isPublished: true },
        select: { path: true, updatedAt: true },
      }),
      this.prisma.brand.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const urls: Array<{ loc: string; lastmod?: Date; priority: string }> = [];
    urls.push({ loc: `${base}/`, priority: '1.0' });
    urls.push({ loc: `${base}/shop`, priority: '0.9' });
    urls.push({ loc: `${base}/how-it-works`, priority: '0.7' });
    urls.push({ loc: `${base}/blog`, priority: '0.7' });
    for (const c of categories) {
      urls.push({ loc: `${base}/shop/${c.slug}`, lastmod: c.updatedAt, priority: '0.8' });
    }
    for (const b of brands) {
      urls.push({ loc: `${base}/brand/${b.slug}`, lastmod: b.updatedAt, priority: '0.6' });
    }
    for (const p of products) {
      urls.push({ loc: `${base}/product/${p.slug}`, lastmod: p.updatedAt, priority: '0.6' });
    }
    for (const page of seoPages) {
      urls.push({ loc: `${base}${page.path}`, lastmod: page.updatedAt, priority: '0.5' });
    }
    for (const post of posts) {
      urls.push({ loc: `${base}/blog/${post.slug}`, lastmod: post.updatedAt, priority: '0.6' });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>`;
    return xml;
  }
}
