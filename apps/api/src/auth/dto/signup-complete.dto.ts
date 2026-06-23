import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

/**
 * Final signup step — called after phone OTP is verified.
 * The signupToken is the short-lived JWT returned by verify-otp.
 *
 * CNIC collected here per brief Phase 3 (CNIC number required at signup,
 * CNIC images uploaded later in /account/kyc).
 */
export class SignupCompleteDto {
  @IsString()
  signupToken!: string;

  @IsString()
  @Length(2, 80, { message: 'name must be between 2 and 80 characters' })
  name!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must include upper-case, lower-case, and a digit',
  })
  password!: string;

  @IsString()
  @Matches(/^\d{13}$/, { message: 'CNIC must be exactly 13 digits (no dashes)' })
  cnic!: string;

  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string;
}
