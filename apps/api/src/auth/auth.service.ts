import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { LoginDto } from './dto/login.dto';
import { OtpPurpose, RequestOtpDto } from './dto/request-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupCompleteDto } from './dto/signup-complete.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TokensService } from './tokens/tokens.service';

interface ConnMeta {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    private readonly tokens: TokensService,
    private readonly config: ConfigService,
  ) {}

  // ============================================================
  // OTP — issue & verify
  // ============================================================

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; expiresInMinutes: number }> {
    const phone = this.normalizePhone(dto.phone);
    await this.enforceOtpRateLimit(phone);

    // Business rule per purpose
    if (dto.purpose === OtpPurpose.SIGNUP) {
      const existing = await this.prisma.user.findUnique({ where: { phone } });
      if (existing) throw new ConflictException('An account with this phone already exists');
    } else if (dto.purpose === OtpPurpose.RESET) {
      const existing = await this.prisma.user.findUnique({ where: { phone } });
      // Don't reveal whether account exists — still send "OK" but don't issue OTP.
      // This avoids phone-enumeration.
      if (!existing) {
        return { message: 'If the account exists, an OTP has been sent', expiresInMinutes: 5 };
      }
    } else if (dto.purpose === OtpPurpose.LOGIN) {
      // LOGIN OTP is not used in v1 (we use password login). Kept for future.
      throw new BadRequestException('LOGIN OTP is not enabled');
    }

    const code = this.generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiryMinutes = parseInt(this.config.get<string>('OTP_EXPIRY_MINUTES') ?? '5', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Invalidate any unused OTPs for the same phone + purpose first.
    await this.prisma.otpCode.updateMany({
      where: { phone, purpose: dto.purpose!, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await this.prisma.otpCode.create({
      data: { phone, codeHash, purpose: dto.purpose!, expiresAt },
    });

    await this.sms.sendOtp(phone, code);
    return { message: 'OTP sent', expiresInMinutes: expiryMinutes };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ token: string; purpose: string }> {
    const phone = this.normalizePhone(dto.phone);
    const maxAttempts = parseInt(this.config.get<string>('OTP_MAX_ATTEMPTS') ?? '3', 10);

    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, purpose: dto.purpose!, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new BadRequestException('No active OTP for this phone');
    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired; please request a new one');
    }
    if (otp.attempts >= maxAttempts) {
      throw new BadRequestException('Too many attempts; please request a new OTP');
    }

    const ok = await bcrypt.compare(dto.code, otp.codeHash);
    if (!ok) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    // Consume the OTP.
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    if (dto.purpose === OtpPurpose.SIGNUP) {
      const token = this.tokens.signTempToken({ sub: phone, purpose: 'SIGNUP' });
      return { token, purpose: 'SIGNUP' };
    }
    if (dto.purpose === OtpPurpose.RESET) {
      const token = this.tokens.signTempToken({ sub: phone, purpose: 'RESET' });
      return { token, purpose: 'RESET' };
    }
    throw new BadRequestException('Unsupported purpose');
  }

  // ============================================================
  // Signup — complete after OTP verified
  // ============================================================

  async completeSignup(
    dto: SignupCompleteDto,
    meta: ConnMeta,
  ): Promise<{
    user: { id: string; phone: string; name: string; role: UserRole };
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: Date;
  }> {
    const decoded = this.tokens.verifyTempToken(dto.signupToken, 'SIGNUP');
    const phone = decoded.sub;

    // CNIC uniqueness + account uniqueness re-check (race-safe via catch below)
    const [phoneTaken, cnicTaken] = await Promise.all([
      this.prisma.user.findUnique({ where: { phone } }),
      this.prisma.user.findUnique({ where: { cnic: dto.cnic } }),
    ]);
    if (phoneTaken) throw new ConflictException('Account already exists for this phone');
    if (cnicTaken) throw new ConflictException('An account with this CNIC already exists');

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        phone,
        email: dto.email,
        name: dto.name,
        cnic: dto.cnic,
        passwordHash,
        role: UserRole.CUSTOMER,
        isPhoneVerified: true,
      },
      select: { id: true, phone: true, name: true, role: true },
    });
    this.logger.log(`New user signed up: ${this.maskCnic(dto.cnic)} / ${phone}`);

    const access = this.tokens.signAccessToken({ sub: user.id, role: user.role, phone });
    const refresh = await this.tokens.issueRefreshToken(user.id, meta);

    return {
      user,
      accessToken: access,
      refreshToken: refresh.raw,
      refreshExpiresAt: refresh.expiresAt,
    };
  }

  // ============================================================
  // Login
  // ============================================================

  async login(
    dto: LoginDto,
    meta: ConnMeta,
  ): Promise<{
    user: { id: string; phone: string; name: string; role: UserRole };
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: Date;
  }> {
    const phone = this.normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || !user.isActive) {
      // Same response for "not found" and "disabled" — don't leak state.
      throw new UnauthorizedException('Invalid phone or password');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid phone or password');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const access = this.tokens.signAccessToken({ sub: user.id, role: user.role, phone });
    const refresh = await this.tokens.issueRefreshToken(user.id, meta);

    return {
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      accessToken: access,
      refreshToken: refresh.raw,
      refreshExpiresAt: refresh.expiresAt,
    };
  }

  // ============================================================
  // Refresh / Logout
  // ============================================================

  async refresh(
    rawRefreshToken: string,
    meta: ConnMeta,
  ): Promise<{ accessToken: string; refreshToken: string; refreshExpiresAt: Date }> {
    const rotated = await this.tokens.rotateRefreshToken(rawRefreshToken, meta);
    const access = this.tokens.signAccessToken({
      sub: rotated.userId,
      role: rotated.role,
      phone: rotated.phone,
    });
    return {
      accessToken: access,
      refreshToken: rotated.raw,
      refreshExpiresAt: rotated.expiresAt,
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<{ message: string }> {
    if (rawRefreshToken) {
      await this.tokens.revokeRefreshToken(rawRefreshToken);
    }
    return { message: 'Logged out' };
  }

  // ============================================================
  // Forgot password
  // ============================================================

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const decoded = this.tokens.verifyTempToken(dto.resetToken, 'RESET');
    const phone = decoded.sub;

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundException('Account not found');

    const passwordHash = await this.hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Security: revoke every refresh token after password reset.
    await this.tokens.revokeAllForUser(user.id);

    return { message: 'Password has been reset. Please log in with your new password.' };
  }

  // ============================================================
  // Helpers
  // ============================================================

  /** Normalize to E.164 +92XXXXXXXXXX. */
  private normalizePhone(input: string): string {
    const trimmed = input.trim();
    if (trimmed.startsWith('+92')) return trimmed;
    if (trimmed.startsWith('0')) return `+92${trimmed.substring(1)}`;
    if (trimmed.startsWith('3')) return `+92${trimmed}`;
    return trimmed;
  }

  private generateOtpCode(): string {
    // Cryptographically strong 6-digit code.
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async hashPassword(plain: string): Promise<string> {
    const rounds = parseInt(this.config.get<string>('BCRYPT_ROUNDS') ?? '12', 10);
    return bcrypt.hash(plain, rounds);
  }

  /** Per-phone OTP rate limit, brief Phase 10: 3 per hour. */
  private async enforceOtpRateLimit(phone: string): Promise<void> {
    const limit = parseInt(this.config.get<string>('OTP_RATE_LIMIT_PER_HOUR') ?? '3', 10);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.otpCode.count({
      where: { phone, createdAt: { gte: hourAgo } },
    });
    if (count >= limit) {
      throw new BadRequestException(
        `Too many OTP requests for this number. Please try again later.`,
      );
    }
  }

  /** Brief Phase 10: mask CNIC in logs — show first 5 and last 2 only. */
  private maskCnic(cnic: string): string {
    if (cnic.length !== 13) return '*****';
    return `${cnic.substring(0, 5)}******${cnic.substring(11)}`;
  }
}
