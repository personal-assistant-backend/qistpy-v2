import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slugify';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog-post.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Public ----------

  async listPublished(page = 1, pageSize = 9) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: pageSize,
        include: { category: true },
      }),
      this.prisma.blogPost.count({ where: { isPublished: true } }),
    ]);
    return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async getBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!post || !post.isPublished) throw new NotFoundException('Post not found');
    return post;
  }

  async related(postId: string, categoryId: string | null, limit = 3) {
    return this.prisma.blogPost.findMany({
      where: {
        isPublished: true,
        id: { not: postId },
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  // ---------- Admin ----------

  listAll() {
    return this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  async create(dto: CreateBlogPostDto) {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.title);
    return this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        categoryId: dto.categoryId,
        language: dto.language ?? 'en',
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date() : null,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
    });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');

    const becomingPublished = dto.isPublished && !existing.isPublished;

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug ? slugify(dto.slug) : undefined,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        categoryId: dto.categoryId,
        language: dto.language,
        isPublished: dto.isPublished,
        publishedAt: becomingPublished ? new Date() : undefined,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    await this.prisma.blogPost.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  listCategories() {
    return this.prisma.blogCategory.findMany({ orderBy: { name: 'asc' } });
  }
}
