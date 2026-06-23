import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentMethod, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminReviewPaymentDto, InitiatePaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

// ---------- Customer ----------
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  initiate(@CurrentUser('id') userId: string, @Body() dto: InitiatePaymentDto) {
    return this.payments.initiate(userId, dto);
  }
}

// ---------- Webhooks (public, signature-verified) ----------
@Controller('payments/callback')
export class PaymentsWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post('jazzcash')
  @HttpCode(HttpStatus.OK)
  jazz(@Req() req: Request, @Headers('x-signature') headerHash?: string) {
    const body = (req.body ?? {}) as Record<string, string>;
    const hash = headerHash ?? body['pp_SecureHash'] ?? '';
    return this.payments.handleGatewayCallback(PaymentMethod.JAZZCASH, body, hash);
  }

  @Public()
  @Post('easypaisa')
  @HttpCode(HttpStatus.OK)
  easy(@Req() req: Request, @Headers('x-signature') headerHash?: string) {
    const body = (req.body ?? {}) as Record<string, string>;
    const hash = headerHash ?? body['hash'] ?? '';
    return this.payments.handleGatewayCallback(PaymentMethod.EASYPAISA, body, hash);
  }
}

// ---------- Admin bank-transfer review ----------
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('pending-review')
  pending() {
    return this.payments.listPendingReview();
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  review(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AdminReviewPaymentDto,
  ) {
    return this.payments.reviewBankTransfer(adminId, id, dto);
  }
}
