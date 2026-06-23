import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

/**
 * Public catalog routes. No auth. Used by website to render
 * the category mega-menu and category landing pages.
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.listTree();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.categories.getBySlug(slug);
  }
}
