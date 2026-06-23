import { Controller, Get, Param } from '@nestjs/common';
import { BrandsService } from './brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  list() {
    return this.brands.listActive();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.brands.getBySlug(slug);
  }
}
