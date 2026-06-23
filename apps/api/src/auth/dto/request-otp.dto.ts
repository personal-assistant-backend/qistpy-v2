import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export enum OtpPurpose {
  SIGNUP = 'SIGNUP',
  LOGIN = 'LOGIN',
  RESET = 'RESET',
}

export class RequestOtpDto {
  @IsString()
  @Matches(/^(\+92|0)?3\d{9}$/, {
    message: 'phone must be a valid Pakistani mobile number',
  })
  phone!: string;

  /**
   * Optional — controllers override this to their fixed purpose anyway.
   * Making it optional avoids validation failure when frontend omits it.
   */
  @IsOptional()
  @IsEnum(OtpPurpose, { message: 'purpose must be SIGNUP, LOGIN, or RESET' })
  purpose?: OtpPurpose;
}
