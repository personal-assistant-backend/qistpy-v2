import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductImageDto {
  @IsString()
  publicId!: string;

  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class ProductSpecDto {
  @IsString()
  @Length(1, 60)
  label!: string;

  @IsString()
  @Length(1, 200)
  value!: string;
}

export class CreateProductDto {
  @IsString()
  @Length(3, 200)
  name!: string;

  @IsString()
  @Length(10, 10_000)
  description!: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  shortDescription?: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cashPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @ArrayMaxSize(8, { message: 'Max 8 images per product' })
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  specs?: ProductSpecDto[];
}
