import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('account/notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.svc.listMine(userId);
  }

  @Get('unread-count')
  unread(@CurrentUser('id') userId: string) {
    return this.svc.unreadCount(userId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.svc.markRead(userId, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAll(@CurrentUser('id') userId: string) {
    return this.svc.markAllRead(userId);
  }
}
