import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @Length(1, 40, { message: 'label must be 1-40 characters' })
  label!: string;

  @IsString()
  @Length(3, 200)
  line1!: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  line2?: string;

  @IsString()
  cityId!: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+92|0)?3\d{9}$/, {
    message: 'phone must be a valid Pakistani mobile number',
  })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
