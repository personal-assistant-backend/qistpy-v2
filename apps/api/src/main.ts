import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  // ---------- Security middleware ----------
  app.use(helmet());
  app.use(cookieParser());

  // ---------- CORS allowlist (Phase 10) ----------
  const corsOrigins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ---------- Global validation ----------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  const port = parseInt(config.get<string>('API_PORT') ?? '3000', 10);
  // '0.0.0.0' = accessible from all network interfaces (same WiFi/LAN)
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 QistPY API running on http://localhost:${port}/api`);
  logger.log(`🌐 LAN access:   http://YOUR_IP:${port}/api`);
  logger.log(`💚 Health check: http://localhost:${port}/api/health`);
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
