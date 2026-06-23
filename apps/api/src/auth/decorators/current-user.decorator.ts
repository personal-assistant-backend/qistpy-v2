import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * Usage:
 *   @Get('me')
 *   getMe(@CurrentUser() user: AuthenticatedUser) { ... }
 *
 * Or to pluck a single field:
 *   @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (key: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return key ? req.user?.[key] : req.user;
  },
);
