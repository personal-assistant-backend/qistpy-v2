import { Module } from '@nestjs/common';
import { AdminSeoController, PublicSeoController } from './seo.controller';
import { SeoService } from './seo.service';

@Module({
  controllers: [PublicSeoController, AdminSeoController],
  providers: [SeoService],
})
export class SeoModule {}
