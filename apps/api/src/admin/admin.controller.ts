import {
  Body, Controller, DefaultValuePipe, Delete, Get,
  HttpCode, HttpStatus, Param, ParseIntPipe, Patch,
  Post, Query, UseGuards,
} from '@nestjs/common';
import { UserRole, VendorStatus } from '@prisma/client';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RemindersJob } from '../notifications/cron/reminders.job';
import { AdminService } from './admin.service';

class SuspendVendorDto { @IsString() @MinLength(5) @MaxLength(500) reason!: string; }
class KycReviewDto { @IsBoolean() approve!: boolean; @IsOptional() @IsString() @MaxLength(500) reason?: string; }

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly reminders: RemindersJob,
  ) {}

  @Get('summary')
  summary() { return this.admin.summary(); }

  // ── Users ──
  @Get('users')
  users(@Query('q') q?: string) { return this.admin.listUsers(q); }

  // ── Vendors ──
  @Get('vendors')
  vendors(@Query('status') status?: VendorStatus) { return this.admin.listVendors(status); }

  @Post('vendors/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveVendor(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.admin.approveVendor(adminId, id);
  }

  @Post('vendors/:id/suspend')
  @HttpCode(HttpStatus.OK)
  suspendVendor(@CurrentUser('id') adminId: string, @Param('id') id: string, @Body() dto: SuspendVendorDto) {
    return this.admin.suspendVendor(adminId, id, dto.reason);
  }

  // ── KYC ──
  @Get('kyc')
  kycQueue() { return this.admin.listKycQueue(); }

  @Post('kyc/:userId/review')
  @HttpCode(HttpStatus.OK)
  reviewKyc(@CurrentUser('id') adminId: string, @Param('userId') userId: string, @Body() dto: KycReviewDto) {
    return this.admin.reviewKyc(adminId, userId, dto.approve, dto.reason);
  }

  // ── Categories ──
  @Get('categories')
  listCategories() { return this.admin.listCategories(); }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(@Body() body: any) {
    return this.admin.createCategory(body);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  deleteCategory(@Param('id') id: string) { return this.admin.deleteCategory(id); }

  // ── Products ──
  @Get('products')
  adminListProducts(@Query('q') q?: string, @Query('status') status?: string) {
    return this.admin.listAllProducts(q, status);
  }

  @Post('products/:productId/add-image')
  @HttpCode(HttpStatus.CREATED)
  addProductImage(@Param('productId') productId: string, @Body() body: { imageUrl: string; isPrimary?: boolean }) {
    return this.admin.addProductImage(productId, body.imageUrl, body.isPrimary ?? false);
  }

  @Post('products/:productId/update-image')
  @HttpCode(HttpStatus.OK)
  updateProductImage(@Param('productId') productId: string, @Body() body: { imageUrl: string; isPrimary?: boolean }) {
    return this.admin.addProductImage(productId, body.imageUrl, body.isPrimary ?? false);
  }

  @Delete('images/:imageId')
  @HttpCode(HttpStatus.OK)
  deleteProductImage(@Param('imageId') imageId: string) { return this.admin.deleteProductImage(imageId); }

  // ── Payouts ──
  @Get('payouts')
  payouts() { return this.admin.listPayouts(); }

  @Post('payouts/:id/approve')
  @HttpCode(HttpStatus.OK)
  approvePayout(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.admin.approvePayout(adminId, id);
  }

  @Post('payouts/:id/mark-paid')
  @HttpCode(HttpStatus.OK)
  markPayoutPaid(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.admin.markPayoutPaid(adminId, id);
  }

  // ── Payments ──
  @Get('payments/pending-review')
  pendingPayments() { return this.admin.listPendingReview(); }

  @Post('payments/:id/review')
  @HttpCode(HttpStatus.OK)
  reviewPayment(@CurrentUser('id') adminId: string, @Param('id') id: string, @Body() body: { decision: 'APPROVE' | 'REJECT' }) {
    return this.admin.reviewPayment(adminId, id, body.decision);
  }

  // ── Installment Requests ──
  @Get('installment-requests')
  listInstallmentRequests(@Query('status') status?: string) {
    return this.admin.listInstallmentRequests(status);
  }

  @Post('installment-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveRequest(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.admin.approveInstallmentRequest(adminId, id);
  }

  @Post('installment-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectRequest(@CurrentUser('id') adminId: string, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.admin.rejectInstallmentRequest(adminId, id, body.reason);
  }

  @Post('installment-requests/:id/record-payment')
  @HttpCode(HttpStatus.CREATED)
  recordPayment(
    @CurrentUser('id') adminId: string, @Param('id') requestId: string,
    @Body() body: { amount: number; note?: string; installmentNo?: number; screenshotUrl?: string },
  ) {
    return this.admin.recordManualPayment(adminId, requestId, body);
  }

  @Patch('installment-schedules/:id')
  updateSchedule(@CurrentUser('id') adminId: string, @Param('id') id: string, @Body() body: any) {
    return this.admin.updateInstallmentSchedule(adminId, id, body);
  }

  // ── Reports ──
  @Get('reports/sales')
  salesReport() { return this.admin.getSalesReport(); }

  // ── Audit ──
  @Get('audit-log')
  audit(@Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number) {
    return this.admin.recentAudit(limit);
  }

  // ── Cron ──
  @Post('cron/reminders/run-now')
  @HttpCode(HttpStatus.OK)
  runReminders() { return this.reminders.runNow(); }
}
