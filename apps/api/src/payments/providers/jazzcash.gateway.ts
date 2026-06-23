import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Stub implementation — real JazzCash integration reads POST params,
 * signs with HMAC-SHA256 using INTEGRITY_SALT, and redirects to gateway.
 * Signature verification on return/webhook is the security-critical part
 * (brief Phase 6: "signature/hash validation before marking SUCCESS").
 *
 * Replace buildRedirectUrl + verifyCallbackSignature with merchant-doc
 * implementation when credentials are ready. Contract stays stable.
 */
@Injectable()
export class JazzCashGateway {
  constructor(private readonly config: ConfigService) {}

  buildRedirectUrl(params: {
    amount: number;
    orderRef: string;
    customerPhone: string;
  }): string {
    // Real gateway returns a POST form; for v1 we expose a stub URL that the
    // frontend polls to simulate. When real creds are wired up, this returns
    // the gateway's hosted form URL.
    const base = this.config.get<string>('JAZZCASH_RETURN_URL') ?? 'http://localhost:4200';
    const q = new URLSearchParams({
      ref: params.orderRef,
      amount: params.amount.toFixed(2),
      phone: params.customerPhone,
      mock: '1',
    });
    return `${base}?${q.toString()}`;
  }

  /**
   * Verifies HMAC-SHA256 of the sorted callback params using INTEGRITY_SALT.
   * Called from webhook before marking payment SUCCESS.
   */
  verifyCallbackSignature(payload: Record<string, string>, receivedHash: string): boolean {
    const salt = this.config.get<string>('JAZZCASH_INTEGRITY_SALT') ?? '';
    if (!salt) return false;
    // Sort keys and concatenate values, prefixed with salt.
    const sortedKeys = Object.keys(payload).filter((k) => k !== 'pp_SecureHash').sort();
    const str = salt + '&' + sortedKeys.map((k) => payload[k]).join('&');
    const computed = crypto.createHmac('sha256', salt).update(str).digest('hex');
    return computed.toLowerCase() === receivedHash.toLowerCase();
  }
}
