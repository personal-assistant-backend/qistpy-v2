import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from '../auth/tokens/tokens.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tokens: TokensService,
  ) {}

  // ============================================================
  // Profile
  // ============================================================

  /**
   * Full profile for the logged-in user.
   * Includes address count + masked CNIC (never return raw CNIC to client).
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        cnic: true,
        role: true,
        kycStatus: true,
        isPhoneVerified: true,
        createdAt: true,
        _count: {
          select: { addresses: true, orders: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      cnic: this.maskCnic(user.cnic), // brief Phase 10: never leak full CNIC
      role: user.role,
      kycStatus: user.kycStatus,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
      addressCount: user._count.addresses,
      orderCount: user._count.orders,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (!dto.name && dto.email === undefined) {
      throw new BadRequestException('Provide at least one field to update');
    }

    // Email uniqueness check (only if changing)
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email is already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email,
      },
      select: { id: true, name: true, email: true, phone: true },
    });
    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    // Don't let users "change" to the same password (UX nicety).
    const sameAsOld = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (sameAsOld) {
      throw new BadRequestException('New password must be different from current password');
    }

    const rounds = parseInt(this.config.get<string>('BCRYPT_ROUNDS') ?? '12', 10);
    const newHash = await bcrypt.hash(dto.newPassword, rounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Security: revoke every refresh token after password change.
    // Forces re-login on all devices.
    await this.tokens.revokeAllForUser(userId);

    return { message: 'Password changed successfully. Please log in again on other devices.' };
  }

  // ============================================================
  // Addresses
  // ============================================================

  async listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      include: {
        city: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [
        { isDefault: 'desc' }, // default first
        { createdAt: 'desc' },
      ],
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    // City must exist + be active
    const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
    if (!city || !city.isActive) {
      throw new BadRequestException('Selected city is not available');
    }

    const phone = dto.phone ? this.normalizePhone(dto.phone) : '';

    // First address → automatically default.
    const count = await this.prisma.address.count({ where: { userId } });
    const shouldBeDefault = count === 0 || dto.isDefault === true;

    // If making this one default, unset the others in a transaction.
    const address = await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId,
          label: dto.label,
          line1: dto.line1,
          line2: dto.line2,
          cityId: dto.cityId,
          phone,
          isDefault: shouldBeDefault,
        },
        include: {
          city: { select: { id: true, name: true, slug: true } },
        },
      });
    });

    return address;
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.assertOwnsAddress(userId, addressId);

    if (dto.cityId) {
      const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
      if (!city || !city.isActive) {
        throw new BadRequestException('Selected city is not available');
      }
    }

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        label: dto.label,
        line1: dto.line1,
        line2: dto.line2,
        cityId: dto.cityId,
        phone: dto.phone ? this.normalizePhone(dto.phone) : undefined,
      },
      include: {
        city: { select: { id: true, name: true, slug: true } },
      },
    });
    return updated;
  }

  async deleteAddress(userId: string, addressId: string): Promise<{ message: string }> {
    const address = await this.assertOwnsAddress(userId, addressId);

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: addressId } });

      // If we deleted the default, promote the most recent remaining address.
      if (address.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { message: 'Address deleted' };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    await this.assertOwnsAddress(userId, addressId);

    await this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      await tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return { message: 'Default address updated' };
  }

  // ============================================================
  // Helpers
  // ============================================================

  private async assertOwnsAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) {
      // Don't reveal existence — treat as not-found to avoid enumeration.
      throw new ForbiddenException('You do not have access to this resource');
    }
    return address;
  }

  private normalizePhone(input: string): string {
    const trimmed = input.trim();
    if (trimmed.startsWith('+92')) return trimmed;
    if (trimmed.startsWith('0')) return `+92${trimmed.substring(1)}`;
    if (trimmed.startsWith('3')) return `+92${trimmed}`;
    return trimmed;
  }

  /** Brief Phase 10: show first 5 + last 2 digits only. */
  private maskCnic(cnic: string): string {
    if (cnic.length !== 13) return '*****';
    return `${cnic.substring(0, 5)}******${cnic.substring(11)}`;
  }
}
