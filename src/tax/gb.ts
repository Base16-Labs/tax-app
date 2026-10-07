/**
 * United Kingdom, 2026/27 tax year: England, Wales and Northern Ireland.
 * Scotland sets its own income tax bands and is not modelled.
 *
 * Income tax runs on pay after pension, less the personal allowance. National
 * Insurance runs on gross pay. The pension is treated as a "net pay" workplace
 * scheme: it comes off before income tax but not before National Insurance,
 * which is how most employer schemes work.
 *
 * Sources: gov.uk income tax rates and National Insurance rates, 2026/27.
 * Every threshold here has been frozen since 2021/22.
 */
import { fillBands, type Band } from './progressive';
import { clampPositive, sum, type Line, type Payslip, type TaxInput } from './types';

export const PERSONAL_ALLOWANCE = 12_570;
/** The allowance shrinks by £1 for every £2 of income above this, to nothing at £125,140. */
export const ALLOWANCE_TAPER_FROM = 100_000;

/** Rates on taxable income, i.e. income after the personal allowance. */
export const GB_BANDS: readonly Band[] = [
  { width: 37_700, rate: 0.2 }, //  basic rate
  { width: 87_440, rate: 0.4 }, //  higher rate, up to £125,140 of taxable income
  { width: Infinity, rate: 0.45 }, // additional rate
];

/** Employee Class 1 National Insurance. */
export const NI_PRIMARY_THRESHOLD = 12_570;
export const NI_UPPER_EARNINGS_LIMIT = 50_270;
export const NI_MAIN_RATE = 0.08;
export const NI_UPPER_RATE = 0.02;

/** The allowance after the taper. */
export function personalAllowance(adjustedIncome: number): number {
  const over = Math.max(0, adjustedIncome - ALLOWANCE_TAPER_FROM);
  return Math.max(0, PERSONAL_ALLOWANCE - Math.floor(over / 2));
}

export function nationalInsurance(gross: number): number {
  const main = Math.max(0, Math.min(gross, NI_UPPER_EARNINGS_LIMIT) - NI_PRIMARY_THRESHOLD);
  const upper = Math.max(0, gross - NI_UPPER_EARNINGS_LIMIT);
  return main * NI_MAIN_RATE + upper * NI_UPPER_RATE;
}

export function calculateGB(input: TaxInput): Payslip {
  const gross = clampPositive(input.grossAnnual);
  const pension = gross * clampPositive(input.pensionRate);
  const adjustedIncome = gross - pension;
  const allowance = personalAllowance(adjustedIncome);

  const contributions: Line[] = [{ label: 'Workplace pension', amount: pension }].filter(
    (line) => line.amount > 0,
  );
  const reliefs: Line[] = [{ label: 'Personal allowance', amount: Math.min(allowance, adjustedIncome) }].filter(
    (line) => line.amount > 0,
  );

  const taxableIncome = Math.max(0, adjustedIncome - allowance);
  const bands = fillBands(taxableIncome, GB_BANDS);
  const incomeTax = bands.reduce((total, band) => total + band.tax, 0);
  const levies: Line[] = [{ label: 'National Insurance', amount: nationalInsurance(gross) }].filter(
    (line) => line.amount > 0,
  );

  const totalTax = incomeTax + sum(levies);
  const contributionTotal = sum(contributions);
  return {
    grossAnnual: gross,
    contributions,
    reliefs,
    taxableIncome,
    bands,
    incomeTax,
    levies,
    totalTax,
    contributionTotal,
    takeHome: gross - totalTax - contributionTotal,
    effectiveRate: gross > 0 ? totalTax / gross : 0,
  };
}
