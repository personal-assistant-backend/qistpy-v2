import { Module } from '@nestjs/common';
import { AdminPayoutsController, VendorController } from './vendor.controllers';
import { PayoutsService } from './payouts.service';
import { VendorService } from './vendor.service';
import { WalletService } from './wallet/wallet.service';

@Module({
  controllers: [VendorController, AdminPayoutsController],
  providers: [VendorService, WalletService, PayoutsService],
  exports: [WalletService],
})
export class VendorModule {}
