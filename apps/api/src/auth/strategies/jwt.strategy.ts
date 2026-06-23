import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  phone: string;
  kycStatus: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Passport calls this with the decoded JWT payload.
   * We hit the DB to pick up fresh role/isActive/kycStatus so a revoked
   * or demoted user can't keep using a still-valid JWT for too long.
   */
  async validate(payload: { sub: string }): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, phone: true, kycStatus: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is disabled or does not exist');
    }
    return {
      id: user.id,
      role: user.role,
      phone: user.phone,
      kycStatus: user.kycStatus,
    };
  }
}
