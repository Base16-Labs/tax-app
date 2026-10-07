/**
 * Money formatting in whichever currency the chosen country pays in.
 *
 * Arlo's charts format their own readouts through the `format` prop; these are
 * for everything else: the hero figure, the payslip rows, the rules.
 */
import type { Currency } from './countries';

const finite = (n: number) => (Number.isFinite(n) ? n : 0);

/** £1,234,567 / $1,234,567 / ₦1,234,567. Whole units: pay this size is never read to the penny. */
export function money(value: number, currency: Currency): string {
  const n = Math.round(finite(value));
  const sign = n < 0 ? '−' : '';
  return `${sign}${currency.symbol}${Math.abs(n).toLocaleString('en-US')}`;
}

/** £1.2m / $840k, for chart labels where the exact figure is stated nearby. */
export function moneyShort(value: number, currency: Currency): string {
  const n = Math.abs(finite(value));
  const sign = value < 0 ? '−' : '';
  const s = currency.symbol;
  if (n >= 1_000_000_000) return `${sign}${s}${trim(n / 1_000_000_000)}b`;
  if (n >= 1_000_000) return `${sign}${s}${trim(n / 1_000_000)}m`;
  if (n >= 1_000) return `${sign}${s}${trim(n / 1_000)}k`;
  return `${sign}${s}${Math.round(n)}`;
}

/** One decimal place, but only when it says something: 1.2m, not 1.0m. */
function trim(n: number): string {
  return n >= 10 || Number.isInteger(n) ? String(Math.round(n)) : n.toFixed(1);
}

/** 18.2%, one decimal: enough to show movement between bands. */
export const percent = (fraction: number, digits = 1): string =>
  `${(finite(fraction) * 100).toFixed(digits)}%`;

/** Strips everything but digits, so a user can type "1,200,000" or "£1.2m". */
export function parseAmount(text: string): number {
  const digits = text.replace(/[^0-9]/g, '');
  return digits === '' ? 0 : Number(digits);
}

/** Groups digits as the user types, without imposing a currency symbol. */
export function groupDigits(text: string): string {
  const n = parseAmount(text);
  return n === 0 ? '' : n.toLocaleString('en-US');
}
