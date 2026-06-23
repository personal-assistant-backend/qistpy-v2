import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

/**
 * Profile update: only name + email are user-editable.
 * Phone requires OTP re-verification (v2 feature).
 * CNIC is immutable — linked to KYC verification.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 80, { message: 'name must be between 2 and 80 characters' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string;
}
