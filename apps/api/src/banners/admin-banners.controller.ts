import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BannersService } from './banners.service';
import { UpsertBannerDto } from './dto/upsert-banner.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/banners')
export class AdminBannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  list() {
    return this.banners.listAll();
  }

  @Put()
  upsert(@Body() dto: UpsertBannerDto) {
    return this.banners.upsert(dto);
  }
}
