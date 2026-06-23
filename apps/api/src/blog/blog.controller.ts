import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';

/** Public route. No auth. Blog list + post detail for the website. */
@Controller('blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.blog.listPublished(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 9,
    );
  }

  @Get('categories')
  categories() {
    return this.blog.listCategories();
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const post = await this.blog.getBySlug(slug);
    const related = await this.blog.related(post.id, post.categoryId);
    return { ...post, related };
  }
}
