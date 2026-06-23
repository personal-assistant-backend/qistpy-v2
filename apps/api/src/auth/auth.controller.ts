import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { OtpPurpose, RequestOtpDto } from './dto/request-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupCompleteDto } from './dto/signup-complete.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';

const REFRESH_COOKIE = 'qp_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ---------- SIGNUP ----------

  // Stricter throttle: 5 requests / 15 minutes per IP, mirrors brief Phase 10.
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @Post('signup/request-otp')
  @HttpCode(HttpStatus.OK)
  signupRequestOtp(@Body() dto: RequestOtpDto) {
    // Force purpose to SIGNUP regardless of client input.
    return this.auth.requestOtp({ ...dto, purpose: OtpPurpose.SIGNUP });
  }

  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @Post('signup/verify-otp')
  @HttpCode(HttpStatus.OK)
  signupVerifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp({ ...dto, purpose: OtpPurpose.SIGNUP });
  }

  @Post('signup/complete')
  @HttpCode(HttpStatus.CREATED)
  async signupComplete(
    @Body() dto: SignupCompleteDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.completeSignup(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  // ---------- LOGIN / LOGOUT / REFRESH ----------

  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? undefined;
    if (!raw) throw new UnauthorizedException('Missing refresh token');
    const result = await this.auth.refresh(raw, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? undefined;
    const result = await this.auth.logout(raw);
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return result;
  }

  // ---------- FORGOT PASSWORD ----------

  @Throttle({ default: { limit: 3, ttl: 60 * 60_000 } })
  @Post('forgot-password/request-otp')
  @HttpCode(HttpStatus.OK)
  forgotRequestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp({ ...dto, purpose: OtpPurpose.RESET });
  }

  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @Post('forgot-password/verify-otp')
  @HttpCode(HttpStatus.OK)
  forgotVerifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp({ ...dto, purpose: OtpPurpose.RESET });
  }

  @Post('forgot-password/reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  // ---------- ME (testing the JWT guard) ----------

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  // ---------- Helpers ----------

  private setRefreshCookie(res: Response, raw: string, expiresAt: Date): void {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE, raw, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });
  }
}
