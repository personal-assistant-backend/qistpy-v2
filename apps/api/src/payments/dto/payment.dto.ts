import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class InitiatePaymentDto {
  @IsString()
  requestId!: string;

  /** omit for advance payment, include for specific installment schedule row */
  @IsOptional()
  @IsString()
  scheduleId?: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  /** Required for BANK_TRANSFER / RAAST — Cloudinary URL of payment screenshot */
  @IsOptional()
  @IsUrl()
  screenshotUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AdminReviewPaymentDto {
  @IsEnum({ APPROVE: 'APPROVE', REJECT: 'REJECT' } as const)
  decision!: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
