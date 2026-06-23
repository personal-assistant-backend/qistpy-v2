import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^(\+92|0)?3\d{9}$/, {
    message: 'phone must be a valid Pakistani mobile number',
  })
  phone!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password!: string;
}
