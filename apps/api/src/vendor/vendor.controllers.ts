import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PayoutStatus, UserRole } from '@prisma/client';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestPayoutDto } from './dto/payout.dto';
import { PayoutsService } from './payouts.service';
import { VendorService } from './vendor.service';
import { WalletService } from './wallet/wallet.service';

class RejectPayoutDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

class NoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// ---------- Vendor dashboard ----------
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('vendor')
export class VendorController {
  constructor(
    private readonly vendor: VendorService,
    private readonly wallet: WalletService,
    private readonly payouts: PayoutsService,
  ) {}

  @Get()
  dashboard(@CurrentUser('id') userId: string) {
    return this.vendor.dashboard(userId);
  }

  @Get('profile')
  profile(@CurrentUser('id') userId: string) {
    return this.vendor.profile(userId);
  }

  @Get('wallet')
  myWallet(@CurrentUser('id') userId: string) {
    return this.wallet.myWallet(userId);
  }

  @Get('wallet/transactions')
  myTransactions(@CurrentUser('id') userId: string) {
    return this.wallet.listTransactions(userId);
  }

  @Get('payouts')
  myPayouts(@CurrentUser('id') userId: string) {
    return this.payouts.listMine(userId);
  }

  @Post('payouts')
  @HttpCode(HttpStatus.CREATED)
  requestPayout(@CurrentUser('id') userId: string, @Body() dto: RequestPayoutDto) {
    return this.payouts.request(userId, dto);
  }
}

// ---------- Admin payouts ----------
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get()
  list(@Query('status') status?: PayoutStatus) {
    return this.payouts.listAll(status);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: NoteDto,
  ) {
    return this.payouts.approve(adminId, id, dto.note);
  }

  @Post(':id/mark-paid')
  @HttpCode(HttpStatus.OK)
  markPaid(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.payouts.markPaid(adminId, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: RejectPayoutDto,
  ) {
    return this.payouts.reject(adminId, id, dto.reason);
  }
}
