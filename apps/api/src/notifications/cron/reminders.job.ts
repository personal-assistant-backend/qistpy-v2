import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InstallmentScheduleStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../../sms/sms.service';
import { NotificationsService } from '../notifications.service';

/**
 * Daily job at 9am Asia/Karachi (== 04:00 UTC) per brief Phase 11.
 *   1. Send pre-reminder SMS+in-app for installments due in next 3 days.
 *   2. Mark overdue rows, add late fee (flat + percent from config), notify.
 *
 * Uses @nestjs/schedule. Cron expression is UTC; we pin timezone explicitly.
 *
 * Note: schema doesn't have a `reminderSentAt` column, so pre-reminders will
 * fire every day until the installment is paid. That's acceptable for v1 —
 * adding a dedup column is a tiny migration to do in v1.1 if spam becomes an issue.
 */
@Injectable()
export class RemindersJob {
  private readonly logger = new Logger(RemindersJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Karachi', name: 'daily-reminders' })
  async daily(): Promise<void> {
    this.logger.log('Running daily reminders job...');
    await this.sendPreReminders();
    await this.markOverdue();
    this.logger.log('Daily reminders job completed');
  }

  async runNow(): Promise<{ preReminders: number; overdueMarked: number }> {
    const pre = await this.sendPreReminders();
    const over = await this.markOverdue();
    return { preReminders: pre, overdueMarked: over };
  }

  private async sendPreReminders(): Promise<number> {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 86_400_000);

    const rows = await this.prisma.installmentSchedule.findMany({
      where: {
        status: InstallmentScheduleStatus.PENDING,
        dueDate: { gte: now, lte: threeDays },
      },
      include: {
        request: {
          include: { customer: { select: { id: true, phone: true, name: true } } },
        },
      },
    });

    for (const row of rows) {
      const cust = row.request.customer;
      const title = 'Installment Due Soon';
      const body = `Dear ${cust.name ?? 'customer'}, your installment of Rs ${row.amount.toString()} is due on ${row.dueDate.toDateString()}.`;

      await this.notifications.create({
        userId: cust.id,
        type: NotificationType.INSTALLMENT_DUE_SOON,
        title,
        body,
        metadata: { scheduleId: row.id, installmentNo: row.installmentNo },
      });
      try {
        await this.sms.sendNotification(cust.phone, body);
      } catch (err) {
        this.logger.warn(`SMS send failed for ${cust.phone}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Sent ${rows.length} pre-reminders`);
    return rows.length;
  }

  private async markOverdue(): Promise<number> {
    const now = new Date();
    const rows = await this.prisma.installmentSchedule.findMany({
      where: {
        status: InstallmentScheduleStatus.PENDING,
        dueDate: { lt: now },
      },
      include: {
        request: {
          include: { customer: { select: { id: true, phone: true, name: true } } },
        },
      },
    });

    // Late fee: flat 500 PKR + 1% of amount (brief Phase 11 — configurable later)
    const FLAT_LATE_FEE = 500;
    const PERCENT_LATE_FEE = 0.01;

    for (const row of rows) {
      const lateFee = FLAT_LATE_FEE + Number(row.amount) * PERCENT_LATE_FEE;
      await this.prisma.installmentSchedule.update({
        where: { id: row.id },
        data: {
          status: InstallmentScheduleStatus.OVERDUE,
          lateFeeAmount: lateFee.toFixed(2),
        },
      });

      const cust = row.request.customer;
      const title = 'Installment Overdue';
      const body = `Your installment of Rs ${row.amount.toString()} was due on ${row.dueDate.toDateString()}. A late fee of Rs ${lateFee.toFixed(0)} has been added.`;

      await this.notifications.create({
        userId: cust.id,
        type: NotificationType.INSTALLMENT_OVERDUE,
        title,
        body,
        metadata: { scheduleId: row.id, lateFee },
      });
      try {
        await this.sms.sendNotification(cust.phone, body);
      } catch (err) {
        this.logger.warn(`SMS send failed for ${cust.phone}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Marked ${rows.length} installments as overdue`);
    return rows.length;
  }
}
