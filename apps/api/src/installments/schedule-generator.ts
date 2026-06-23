/**
 * Pure function: generate monthly installment schedule rows.
 *
 * Rules (brief Phase 4):
 *  - dueDate = orderDate + n months, where n = 1..durationMonths
 *  - Edge case: if the due-date day doesn't exist in the target month
 *    (e.g., 31st in February), shift to the LAST day of that month.
 *  - All amounts equal plan.monthlyAmount (no proration).
 *  - All dates stored UTC; presentation layer converts to Asia/Karachi.
 */
export interface ScheduleInput {
  orderDate: Date;
  durationMonths: number;
  monthlyAmount: number | string;
}

export interface ScheduleRow {
  installmentNo: number;
  dueDate: Date;
  amount: string; // keep as string for Decimal safety over the wire
}

export function generateSchedule(input: ScheduleInput): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  const amount = typeof input.monthlyAmount === 'string'
    ? input.monthlyAmount
    : input.monthlyAmount.toFixed(2);

  for (let n = 1; n <= input.durationMonths; n++) {
    rows.push({
      installmentNo: n,
      dueDate: addMonthsClamped(input.orderDate, n),
      amount,
    });
  }
  return rows;
}

/**
 * Adds `months` to `date` but clamps to the last day of the target month
 * when the original day doesn't exist there. E.g. Jan 31 + 1 month → Feb 28/29.
 * Uses UTC to avoid timezone drift.
 */
export function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonth = month + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;

  // Last day of target month in UTC (day 0 of next month)
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDay);

  return new Date(Date.UTC(
    targetYear,
    normalizedMonth,
    clampedDay,
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ));
}
