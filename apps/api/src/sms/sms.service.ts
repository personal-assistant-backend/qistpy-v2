import { Inject, Injectable, Logger } from '@nestjs/common';
import { SMS_PROVIDER, SmsProvider, SmsSendResult } from './sms.provider';

/**
 * Thin facade over the chosen SmsProvider.
 * Feature code injects SmsService, not the underlying provider —
 * that way swapping providers is a one-line change in sms.module.ts.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(@Inject(SMS_PROVIDER) private readonly provider: SmsProvider) {}

  async sendOtp(phone: string, code: string): Promise<SmsSendResult> {
    const message = `Your QistPY verification code is ${code}. Valid for 5 minutes. Do not share this code.`;
    return this.sendWithLog(phone, message);
  }

  async sendNotification(phone: string, message: string): Promise<SmsSendResult> {
    return this.sendWithLog(phone, message);
  }

  private async sendWithLog(phone: string, message: string): Promise<SmsSendResult> {
    try {
      const result = await this.provider.send(phone, message);
      if (!result.success) {
        this.logger.warn(`SMS send failed to ${phone}: ${result.error}`);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`SMS provider threw for ${phone}: ${error}`);
      return { success: false, error };
    }
  }
}
