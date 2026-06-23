import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutDto {
  @IsString()
  addressId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
