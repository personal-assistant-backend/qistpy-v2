import { IsOptional, IsString, Length, Matches } from 'class-validator';

/**
 * Partial update — any subset of fields can be sent.
 * Use POST /addresses/:id/set-default for the default flag (separate endpoint
 * because it has special logic: unset others).
 */
export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @Length(1, 40)
  label?: string;

  @IsOptional()
  @IsString()
  @Length(3, 200)
  line1?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  line2?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+92|0)?3\d{9}$/, {
    message: 'phone must be a valid Pakistani mobile number',
  })
  phone?: string;
}
