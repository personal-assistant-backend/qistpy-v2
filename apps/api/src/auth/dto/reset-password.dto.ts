import { IsString, Matches, MinLength } from 'class-validator';

/**
 * Second step of password reset flow.
 * Uses the short-lived JWT (resetToken) issued by verify-otp with purpose=RESET.
 */
export class ResetPasswordDto {
  @IsString()
  resetToken!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must include upper-case, lower-case, and a digit',
  })
  newPassword!: string;
}
