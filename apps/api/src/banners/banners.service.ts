import { Injectable } from '@nestjs/common';
import { BannerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBannerDto } from './dto/upsert-banner.dto';

/**
 * Homepage hero + offer banners.
 * Always exactly 3 slides per type (position 1..3), upserted by admin.
 * Public homepage reads only isActive slides, ordered by position.
 */
@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: active slides for the homepage, grouped by type. */
  async listActive() {
    const rows = await this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { position: 'asc' }],
    });
    return {
      hero: rows.filter((b) => b.type === BannerType.HERO),
      offer: rows.filter((b) => b.type === BannerType.OFFER),
    };
  }

  /** Admin: all slides (active + inactive) for the editor, grouped by type. */
  async listAll() {
    const rows = await this.prisma.banner.findMany({
      orderBy: [{ type: 'asc' }, { position: 'asc' }],
    });
    return {
      hero: rows.filter((b) => b.type === BannerType.HERO),
      offer: rows.filter((b) => b.type === BannerType.OFFER),
    };
  }

  /** Admin: create or update one slide (type + position is the unique key). */
  async upsert(dto: UpsertBannerDto) {
    return this.prisma.banner.upsert({
      where: { type_position: { type: dto.type, position: dto.position } },
      update: {
        isActive: dto.isActive ?? true,
        badge: dto.badge,
        headline: dto.headline,
        subtitle: dto.subtitle,
        ctaText: dto.ctaText,
        ctaLink: dto.ctaLink,
        imageUrl: dto.imageUrl,
        bgColor: dto.bgColor,
        advance: dto.advance,
        monthly: dto.monthly,
        months: dto.months,
        total: dto.total,
      },
      create: {
        type: dto.type,
        position: dto.position,
        isActive: dto.isActive ?? true,
        badge: dto.badge,
        headline: dto.headline,
        subtitle: dto.subtitle,
        ctaText: dto.ctaText,
        ctaLink: dto.ctaLink,
        imageUrl: dto.imageUrl,
        bgColor: dto.bgColor,
        advance: dto.advance,
        monthly: dto.monthly,
        months: dto.months,
        total: dto.total,
      },
    });
  }
}
