import { addMonthsClamped, generateSchedule } from './schedule-generator';

describe('addMonthsClamped', () => {
  it('adds months normally', () => {
    const d = new Date(Date.UTC(2026, 0, 15)); // Jan 15
    const result = addMonthsClamped(d, 2);
    expect(result.getUTCMonth()).toBe(2); // March
    expect(result.getUTCDate()).toBe(15);
  });

  it('clamps Jan 31 + 1 month to Feb 28 in non-leap year', () => {
    const d = new Date(Date.UTC(2026, 0, 31));
    const result = addMonthsClamped(d, 1);
    expect(result.getUTCMonth()).toBe(1); // Feb
    expect(result.getUTCDate()).toBe(28);
  });

  it('clamps Jan 31 + 1 month to Feb 29 in leap year', () => {
    const d = new Date(Date.UTC(2028, 0, 31));
    const result = addMonthsClamped(d, 1);
    expect(result.getUTCMonth()).toBe(1);
    expect(result.getUTCDate()).toBe(29);
  });

  it('handles year rollover', () => {
    const d = new Date(Date.UTC(2026, 10, 30)); // Nov 30
    const result = addMonthsClamped(d, 3);
    expect(result.getUTCFullYear()).toBe(2027);
    expect(result.getUTCMonth()).toBe(1); // Feb
    expect(result.getUTCDate()).toBe(28); // clamped
  });
});

describe('generateSchedule', () => {
  it('generates the correct number of rows', () => {
    const rows = generateSchedule({
      orderDate: new Date(Date.UTC(2026, 0, 15)),
      durationMonths: 6,
      monthlyAmount: 5000,
    });
    expect(rows).toHaveLength(6);
  });

  it('increments installmentNo starting at 1', () => {
    const rows = generateSchedule({
      orderDate: new Date(Date.UTC(2026, 0, 15)),
      durationMonths: 3,
      monthlyAmount: 1000,
    });
    expect(rows.map((r) => r.installmentNo)).toEqual([1, 2, 3]);
  });

  it('uses same amount for every row', () => {
    const rows = generateSchedule({
      orderDate: new Date(Date.UTC(2026, 0, 15)),
      durationMonths: 3,
      monthlyAmount: '2500.00',
    });
    for (const row of rows) {
      expect(row.amount).toBe('2500.00');
    }
  });

  it('applies month-end clamping across the schedule', () => {
    const rows = generateSchedule({
      orderDate: new Date(Date.UTC(2026, 0, 31)), // Jan 31
      durationMonths: 3,
      monthlyAmount: 1000,
    });
    expect(rows[0].dueDate.getUTCMonth()).toBe(1); // Feb
    expect(rows[0].dueDate.getUTCDate()).toBe(28); // clamped
    expect(rows[1].dueDate.getUTCMonth()).toBe(2); // March
    expect(rows[1].dueDate.getUTCDate()).toBe(31); // restored
    expect(rows[2].dueDate.getUTCMonth()).toBe(3); // April
    expect(rows[2].dueDate.getUTCDate()).toBe(30); // clamped
  });
});
