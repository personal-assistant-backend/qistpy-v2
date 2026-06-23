import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Marked @Global so feature modules don't need to import PrismaModule
 * individually — they just inject PrismaService.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
