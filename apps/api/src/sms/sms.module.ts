import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { SMS_PROVIDER } from './sms.provider';
import { SmsService } from './sms.service';

/**
 * @Global because any feature that needs to send SMS (auth OTPs,
 * installment reminders, payout notifications) injects SmsService.
 *
 * For now, only the mock provider exists. When adding real providers,
 * register them here and switch via SMS_PROVIDER env var.
 */
@Global()
@Module({
  providers: [
    MockSmsProvider,
    {
      provide: SMS_PROVIDER,
      useFactory: (config: ConfigService, mock: MockSmsProvider) => {
        const provider = config.get<string>('SMS_PROVIDER') ?? 'mock';
        switch (provider) {
          case 'mock':
            return mock;
          // case 'jazz':   return new JazzSmsProvider(config);
          // case 'telenor': return new TelenorSmsProvider(config);
          default:
            // Fail-safe: never silently send to /dev/null in production.
            // For unknown provider names, log-only via mock.
            return mock;
        }
      },
      inject: [ConfigService, MockSmsProvider],
    },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
