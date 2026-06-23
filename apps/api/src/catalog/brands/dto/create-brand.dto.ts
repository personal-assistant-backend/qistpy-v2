import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @Length(2, 60)
  name!: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
