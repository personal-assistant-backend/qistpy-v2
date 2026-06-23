import { Controller, Get } from '@nestjs/common';
import { BannersService } from './banners.service';

/**
 * Public route. No auth. Homepage fetches active hero/offer banners from here
 * instead of localStorage, so changes saved in admin show on every browser/device.
 */
@Controller('banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  list() {
    return this.banners.listActive();
  }
}
