import { Module } from '@nestjs/common';
import { OrdersController, InstallmentRequestsController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController, InstallmentRequestsController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
