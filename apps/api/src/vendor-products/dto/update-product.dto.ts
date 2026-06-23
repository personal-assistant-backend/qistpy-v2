import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(3, 200)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(10, 10_000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cashPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;
}
