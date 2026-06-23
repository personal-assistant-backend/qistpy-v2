/**
 * Abstract SMS provider interface (brief Phase 1: "no Twilio hard dependency").
 *
 * Implementations:
 *  - MockSmsProvider  → console.log (dev)
 *  - JazzSmsProvider  → real provider (added later)
 *  - TelenorSmsProvider → real provider (added later)
 *
 * Switch via SMS_PROVIDER env var.
 */
export interface SmsProvider {
  send(to: string, message: string): Promise<SmsSendResult>;
}

export interface SmsSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

// Injection token — avoids depending on a concrete class.
export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
