import { Type } from 'class-transformer';
import { IsNumber, IsString, Length, Min } from 'class-validator';

export class RequestPayoutDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100)
  amount!: number;

  @IsString()
  @Length(5, 40)
  bankAccount!: string; // e.g., "IBAN/Acc number"

  @IsString()
  @Length(2, 50)
  bankName!: string;

  @IsString()
  @Length(2, 80)
  accountTitle!: string;
}
