import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

/**
 * All routes are /api/users/me... because a customer can only
 * manage their own profile. Admin uses a separate /api/admin/users route.
 */
@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ---------- Profile ----------

  @Get()
  getProfile(@CurrentUser('id') userId: string) {
    return this.users.getProfile(userId);
  }

  @Patch()
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(userId, dto);
  }

  // ---------- Addresses ----------

  @Get('addresses')
  listAddresses(@CurrentUser('id') userId: string) {
    return this.users.listAddresses(userId);
  }

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  createAddress(@CurrentUser('id') userId: string, @Body() dto: CreateAddressDto) {
    return this.users.createAddress(userId, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.users.updateAddress(userId, addressId, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.OK)
  deleteAddress(@CurrentUser('id') userId: string, @Param('id') addressId: string) {
    return this.users.deleteAddress(userId, addressId);
  }

  @Post('addresses/:id/set-default')
  @HttpCode(HttpStatus.OK)
  setDefaultAddress(@CurrentUser('id') userId: string, @Param('id') addressId: string) {
    return this.users.setDefaultAddress(userId, addressId);
  }
}
