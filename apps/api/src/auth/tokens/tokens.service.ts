import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string; // userId
  role: UserRole;
  phone: string;
}

export interface TempTokenPayload {
  sub: string; // phone (no user yet during signup)
  purpose: 'SIGNUP' | 'RESET';
}

/**
 * All JWT signing/verification lives here.
 *
 * Design notes:
 *  - Access token:   short-lived (15m), stateless, role-bearing.
 *  - Refresh token:  long-lived (7d), stored server-side *hashed*,
 *                    so we can revoke on logout or compromise.
 *  - Temp tokens:    1h, used to gate signup-complete and reset-password
 *                    after OTP verification. Carry no user privileges.
 */
@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ---------- Access token ----------

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwt.sign(payload, {
      secret: this.getSecret('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.jwt.verify<AccessTokenPayload>(token, {
        secret: this.getSecret('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  // ---------- Refresh token (rotated on every use) ----------

  /**
   * Creates a raw refresh token, stores only its SHA-256 hash,
   * and returns the raw token to the caller (goes into httpOnly cookie).
   */
  async issueRefreshToken(
    userId: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ raw: string; expiresAt: Date }> {
    const raw = crypto.randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(raw);
    const expiresAt = new Date(Date.now() + this.refreshTtlMs());

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });
    return { raw, expiresAt };
  }

  /**
   * Rotation: given a raw refresh token, verify + revoke + issue a new one.
   * If the token is invalid/expired/revoked, throw.
   */
  async rotateRefreshToken(
    raw: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ userId: string; role: UserRole; phone: string; raw: string; expiresAt: Date }> {
    const tokenHash = this.hashToken(raw);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (!stored.user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Revoke old, issue new — atomic-ish (two writes; good enough for v1).
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const fresh = await this.issueRefreshToken(stored.userId, meta);

    return {
      userId: stored.userId,
      role: stored.user.role,
      phone: stored.user.phone,
      raw: fresh.raw,
      expiresAt: fresh.expiresAt,
    };
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    const tokenHash = this.hashToken(raw);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ---------- Temp tokens (signup / reset gates) ----------

  signTempToken(payload: TempTokenPayload): string {
    return this.jwt.sign(payload, {
      secret: this.getSecret('JWT_ACCESS_SECRET'),
      expiresIn: '1h',
    });
  }

  verifyTempToken(token: string, expectedPurpose: TempTokenPayload['purpose']): TempTokenPayload {
    try {
      const decoded = this.jwt.verify<TempTokenPayload>(token, {
        secret: this.getSecret('JWT_ACCESS_SECRET'),
      });
      if (decoded.purpose !== expectedPurpose) {
        throw new UnauthorizedException('Token purpose mismatch');
      }
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // ---------- Internals ----------

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private refreshTtlMs(): number {
    // We store an absolute expiry, so compute from config here.
    // Default 7 days.
    const days = parseInt(
      (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d').replace('d', ''),
      10,
    );
    return days * 24 * 60 * 60 * 1000;
  }

  private getSecret(key: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
    const value = this.config.get<string>(key);
    if (!value || value.length < 16) {
      throw new Error(`${key} is missing or too short in .env`);
    }
    return value;
  }
}
