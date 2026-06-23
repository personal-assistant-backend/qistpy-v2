import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  productId!: string;

  @IsString()
  installmentPlanId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity = 1;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;
}
