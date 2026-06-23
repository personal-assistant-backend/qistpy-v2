import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard)
@Controller('account/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  checkout(@CurrentUser('id') userId: string, @Body() dto: CheckoutDto) {
    return this.orders.checkout(userId, dto);
  }

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.orders.listMyOrders(userId);
  }

  @Get(':id')
  detail(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.orders.getMyOrder(userId, id);
  }
}

// Separate controller for installment requests at /orders/my-installment-requests
import { Controller as NestController } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@NestController('orders')
export class InstallmentRequestsController {
  constructor(private readonly orders: OrdersService) {}

  @Get('my-installment-requests')
  myRequests(@CurrentUser('id') userId: string) {
    return this.orders.listMyInstallmentRequests(userId);
  }
}
