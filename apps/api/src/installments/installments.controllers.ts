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
import { InstallmentRequestStatus, UserRole } from '@prisma/client';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { InstallmentsService } from './installments.service';

class ReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

class NoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// ---------- Customer ----------
@UseGuards(JwtAuthGuard)
@Controller('account/installments')
export class CustomerInstallmentsController {
  constructor(private readonly svc: InstallmentsService) {}

  @Get()
  mine(@CurrentUser('id') userId: string) {
    return this.svc.listMyRequests(userId);
  }

  @Get(':id')
  one(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.svc.getMyRequest(userId, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: NoteDto) {
    return this.svc.cancel(userId, id, dto.note);
  }
}

// ---------- Vendor ----------
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('vendor/installment-requests')
export class VendorInstallmentsController {
  constructor(private readonly svc: InstallmentsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.svc.listVendorRequests(userId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.svc.approve(user.id, user.role, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.svc.reject(user.id, user.role, id, dto.reason);
  }
}

// ---------- Admin ----------
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/installment-requests')
export class AdminInstallmentsController {
  constructor(private readonly svc: InstallmentsService) {}

  @Get()
  list(@Query('status') status?: InstallmentRequestStatus) {
    return this.svc.listAllRequests(status);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.svc.approve(user.id, user.role, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.svc.reject(user.id, user.role, id, dto.reason);
  }

  @Post(':id/mark-defaulted')
  @HttpCode(HttpStatus.OK)
  defaulted(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.svc.markDefaulted(adminId, id);
  }
}
