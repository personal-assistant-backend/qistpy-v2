import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateInstallmentPlanDto } from './dto/create-plan.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { VendorProductsService } from './vendor-products.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR, UserRole.ADMIN)
@Controller('vendor/products')
export class VendorProductsController {
  constructor(private readonly products: VendorProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateProductDto) {
    return this.products.create(userId, dto);
  }

  @Get()
  listMine(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.products.listMine(userId, page, pageSize);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.products.remove(userId, id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.products.publish(userId, id);
  }

  @Patch(':id/plans/:planId')
  @HttpCode(HttpStatus.OK)
  updatePlan(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Param('planId') planId: string,
    @Body() body: { advanceAmount?: number; monthlyAmount?: number; markupPercentage?: number; markupAmount?: number; isActive?: boolean },
  ) {
    return this.products.updatePlan(userId, productId, planId, body);
  }

  @Post(':id/plans')
  @HttpCode(HttpStatus.CREATED)
  addPlan(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Body() dto: CreateInstallmentPlanDto,
  ) {
    return this.products.addPlan(userId, productId, dto);
  }

  @Delete(':id/plans/:planId')
  @HttpCode(HttpStatus.OK)
  removePlan(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Param('planId') planId: string,
  ) {
    return this.products.removePlan(userId, productId, planId);
  }
}
