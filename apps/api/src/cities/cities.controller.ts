import { Controller, Get } from '@nestjs/common';
import { CitiesService } from './cities.service';

/**
 * Public read-only city catalog. No auth required (used by signup,
 * address forms, SEO pages). Admin CRUD lives under /api/admin/cities.
 */
@Controller('cities')
export class CitiesController {
  constructor(private readonly cities: CitiesService) {}

  @Get()
  list() {
    return this.cities.listActive();
  }
}
