/**
 * Brief Phase 15: format currency using Intl.NumberFormat('en-PK', ...).
 * Reason to centralize: same symbol, grouping, and decimal handling everywhere.
 *
 * Input can be string (Decimal over wire) or number. Handles null/undefined.
 */
export function formatPkr(value: string | number | null | undefined, showDecimals = false): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '—';

  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
}

/** Quick number formatter for non-currency numbers (count, stock, etc.) */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PK').format(num);
}
