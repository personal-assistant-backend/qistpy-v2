import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * GET /health  → quick check the API is up
 * GET /health/db → confirms Prisma can talk to PostgreSQL
 *
 * Used during development and by uptime monitors in production.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'qistpy-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  async checkDb() {
    // SELECT 1 — cheapest possible round-trip to confirm DB is reachable
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
