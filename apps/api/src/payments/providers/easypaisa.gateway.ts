import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EasyPaisaGateway {
  constructor(private readonly config: ConfigService) {}

  buildRedirectUrl(params: {
    amount: number;
    orderRef: string;
    customerPhone: string;
  }): string {
    const base = this.config.get<string>('EASYPAISA_RETURN_URL') ?? 'http://localhost:4200';
    const q = new URLSearchParams({
      ref: params.orderRef,
      amount: params.amount.toFixed(2),
      phone: params.customerPhone,
      mock: '1',
    });
    return `${base}?${q.toString()}`;
  }

  /** SHA256 hash of storeId + amount + orderRef + hashKey (order per merchant docs) */
  verifyCallbackSignature(payload: Record<string, string>, receivedHash: string): boolean {
    const hashKey = this.config.get<string>('EASYPAISA_HASH_KEY') ?? '';
    if (!hashKey) return false;
    const storeId = this.config.get<string>('EASYPAISA_STORE_ID') ?? '';
    const str = `${storeId}${payload['amount']}${payload['orderRef']}${hashKey}`;
    const computed = crypto.createHash('sha256').update(str).digest('hex');
    return computed.toLowerCase() === receivedHash.toLowerCase();
  }
}
