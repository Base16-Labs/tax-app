/**
 * Naira formatting.
 *
 * Arlo's own `formatMoney('NGN')` is what the charts use for their readouts —
 * these are for the places where the chart isn't doing the formatting: the hero
 * figure, the deduction rows, the guide.
 */

/** ₦1,234,567 — no kobo. Money this size is never read to two decimal places. */
export const naira = (value: number): string =>
  `₦${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('en-NG')}`;

/** ₦1.2m / ₦840k — for axis-free labels where the exact figure is stated nearby. */
export function nairaShort(value: number): string {
  const n = Number.isFinite(value) ? Math.abs(value) : 0;
  const sign = value < 0 ? '-' : '';
  if (n >= 1_000_000_000) return `${sign}₦${trim(n / 1_000_000_000)}b`;
  if (n >= 1_000_000) return `${sign}₦${trim(n / 1_000_000)}m`;
  if (n >= 1_000) return `${sign}₦${trim(n / 1_000)}k`;
  return `${sign}₦${Math.round(n)}`;
}

/** One decimal place, but only when it says something — 1.2m, not 1.0m. */
function trim(n: number): string {
  return n >= 10 || Number.isInteger(n) ? String(Math.round(n)) : n.toFixed(1);
}

/** 18.2% — one decimal, enough to show movement between bands. */
export const percent = (fraction: number, digits = 1): string =>
  `${((Number.isFinite(fraction) ? fraction : 0) * 100).toFixed(digits)}%`;

/** Strips everything but digits, so a user can type "1,200,000" or "₦1.2m". */
export function parseAmount(text: string): number {
  const digits = text.replace(/[^0-9]/g, '');
  return digits === '' ? 0 : Number(digits);
}

/** Groups digits as the user types, without imposing a currency symbol. */
export function groupDigits(text: string): string {
  const n = parseAmount(text);
  return n === 0 ? '' : n.toLocaleString('en-NG');
}
