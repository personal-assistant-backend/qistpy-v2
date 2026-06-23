import { Module } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module';
import { RemindersJob } from './cron/reminders.job';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [SmsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RemindersJob],
  exports: [NotificationsService, RemindersJob],
})
export class NotificationsModule {}
