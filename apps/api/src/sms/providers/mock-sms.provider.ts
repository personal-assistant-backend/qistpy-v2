import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SmsSendResult } from '../sms.provider';

/**
 * Dev-only SMS provider. Prints message to the server console
 * instead of sending a real SMS. Enabled when SMS_PROVIDER=mock.
 *
 * During development, you copy the OTP from the API terminal
 * and paste it into the verify-otp request.
 */
@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger('MockSMS');

  async send(to: string, message: string): Promise<SmsSendResult> {
    this.logger.log(
      `\n` +
        `📱 ─────────────────────────────────────────\n` +
        `📱  MOCK SMS (dev only — no real SMS sent)\n` +
        `📱  To: ${to}\n` +
        `📱  Message: ${message}\n` +
        `📱 ─────────────────────────────────────────\n`,
    );
    return {
      success: true,
      providerMessageId: `mock-${Date.now()}`,
    };
  }
}
