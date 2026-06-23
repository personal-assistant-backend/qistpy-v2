import { Module } from '@nestjs/common';
import {
  AdminInstallmentsController,
  CustomerInstallmentsController,
  VendorInstallmentsController,
} from './installments.controllers';
import { InstallmentsService } from './installments.service';

@Module({
  controllers: [
    CustomerInstallmentsController,
    VendorInstallmentsController,
    AdminInstallmentsController,
  ],
  providers: [InstallmentsService],
  exports: [InstallmentsService],
})
export class InstallmentsModule {}
