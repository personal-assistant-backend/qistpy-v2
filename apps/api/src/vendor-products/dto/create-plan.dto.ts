import { Type } from 'class-transformer';
import { IsIn, IsNumber, Min } from 'class-validator';

/**
 * Vendor sets installment plan values manually (brief Phase 4: no algorithmic pricing).
 * totalPayable is computed server-side: advance + (monthly * months).
 * markup fields are informational — vendor provides them for transparency.
 *
 * Allowed durations inlined to avoid workspace package resolution issues.
 */
const ALLOWED_DURATIONS = [3, 6, 9, 12] as const;
type AllowedDuration = (typeof ALLOWED_DURATIONS)[number];

export class CreateInstallmentPlanDto {
  @Type(() => Number)
  @IsIn(ALLOWED_DURATIONS as unknown as number[], {
    message: 'durationMonths must be 3, 6, 9, or 12',
  })
  durationMonths!: AllowedDuration;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  advanceAmount!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyAmount!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  markupPercentage!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  markupAmount!: number;
}
