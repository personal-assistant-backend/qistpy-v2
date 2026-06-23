import { Module } from '@nestjs/common';
import { VendorModule } from '../vendor/vendor.module';
import {
  AdminPaymentsController,
  PaymentsController,
  PaymentsWebhookController,
} from './payments.controller';
import { PaymentsService } from './payments.service';
import { EasyPaisaGateway } from './providers/easypaisa.gateway';
import { JazzCashGateway } from './providers/jazzcash.gateway';

@Module({
  imports: [VendorModule], // for WalletService
  controllers: [PaymentsController, PaymentsWebhookController, AdminPaymentsController],
  providers: [PaymentsService, JazzCashGateway, EasyPaisaGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
