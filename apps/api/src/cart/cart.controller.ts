import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser('id') userId: string) {
    return this.cart.getCart(userId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  add(@CurrentUser('id') userId: string, @Body() dto: AddToCartDto) {
    return this.cart.addItem(userId, dto);
  }

  @Patch('items/:id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(userId, id, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.cart.removeItem(userId, id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  clear(@CurrentUser('id') userId: string) {
    return this.cart.clear(userId);
  }
}
