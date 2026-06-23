import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpsertSeoPageDto } from './dto/seo.dto';
import { SeoService } from './seo.service';

// ---------- Public ----------
@Controller()
export class PublicSeoController {
  constructor(private readonly seo: SeoService) {}

  @Public()
  @Get('seo-pages/*path')
  byPath(@Param('path') path: string | string[]) {
    const normalized = Array.isArray(path) ? '/' + path.join('/') : `/${path}`;
    return this.seo.getByPath(normalized);
  }

  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async sitemap() {
    return this.seo.buildSitemap();
  }
}

// ---------- Admin ----------
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/seo-pages')
export class AdminSeoController {
  constructor(private readonly seo: SeoService) {}

  @Get()
  list() {
    return this.seo.listAll();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  upsert(@Body() dto: UpsertSeoPageDto) {
    return this.seo.upsert(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: UpsertSeoPageDto) {
    return this.seo.upsert(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.seo.remove(id);
  }
}
