import { BannerType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpsertBannerDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(BannerType)
  type!: BannerType;

  @IsInt()
  @Min(1)
  @Max(3)
  position!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  ctaLink?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  bgColor?: string;

  @IsOptional()
  @IsString()
  advance?: string;

  @IsOptional()
  @IsString()
  monthly?: string;

  @IsOptional()
  @IsInt()
  months?: number;

  @IsOptional()
  @IsString()
  total?: string;
}