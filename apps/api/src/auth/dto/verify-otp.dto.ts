import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { OtpPurpose } from './request-otp.dto';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^(\+92|0)?3\d{9}$/, {
    message: 'phone must be a valid Pakistani mobile number',
  })
  phone!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  code!: string;

  /** Optional — controllers override purpose anyway */
  @IsOptional()
  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose;
}
