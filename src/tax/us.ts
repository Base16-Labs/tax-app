/**
 * United States, 2026 tax year: federal income tax and FICA only.
 * State and local income taxes vary by state and are not modelled.
 *
 * Federal income tax runs on pay after the traditional 401(k) contribution,
 * less the standard deduction. Social Security and Medicare (FICA) run on gross
 * wages: a 401(k) does not reduce them.
 *
 * Sources: IRS Rev. Proc. 2025-32 (2026 brackets and standard deduction) and the
 * SSA's 2026 contribution and benefit base.
 */
import { fillBands, type Band } from './progressive';
import { clampPositive, sum, type FilingStatus, type Line, type Payslip, type TaxInput } from './types';

export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 16_100,
  joint: 32_200,
};

/** Bands written as widths; the comments are the cumulative ceilings. */
export const US_BANDS: Record<FilingStatus, readonly Band[]> = {
  single: [
    { width: 12_400, rate: 0.1 }, //   $12,400
    { width: 38_000, rate: 0.12 }, //  $50,400
    { width: 55_300, rate: 0.22 }, //  $105,700
    { width: 96_075, rate: 0.24 }, //  $201,775
    { width: 54_450, rate: 0.32 }, //  $256,225
    { width: 384_375, rate: 0.35 }, // $640,600
    { width: Infinity, rate: 0.37 },
  ],
  joint: [
    { width: 24_800, rate: 0.1 }, //   $24,800
    { width: 76_000, rate: 0.12 }, //  $100,800
    { width: 110_600, rate: 0.22 }, // $211,400
    { width: 192_150, rate: 0.24 }, // $403,550
    { width: 108_900, rate: 0.32 }, // $512,450
    { width: 256_250, rate: 0.35 }, // $768,700
    { width: Infinity, rate: 0.37 },
  ],
};

export const SOCIAL_SECURITY_RATE = 0.062;
export const SOCIAL_SECURITY_WAGE_BASE = 184_500;
export const MEDICARE_RATE = 0.0145;
export const ADDITIONAL_MEDICARE_RATE = 0.009;
export const ADDITIONAL_MEDICARE_FROM: Record<FilingStatus, number> = {
  single: 200_000,
  joint: 250_000,
};

export function socialSecurity(wages: number): number {
  return Math.min(wages, SOCIAL_SECURITY_WAGE_BASE) * SOCIAL_SECURITY_RATE;
}

export function medicare(wages: number, status: FilingStatus): number {
  const extra = Math.max(0, wages - ADDITIONAL_MEDICARE_FROM[status]);
  return wages * MEDICARE_RATE + extra * ADDITIONAL_MEDICARE_RATE;
}

export function calculateUS(input: TaxInput): Payslip {
  const status: FilingStatus = input.filingStatus === 'joint' ? 'joint' : 'single';
  const gross = clampPositive(input.grossAnnual);
  const retirement = gross * clampPositive(input.pensionRate);
  const afterRetirement = gross - retirement;
  const deduction = Math.min(STANDARD_DEDUCTION[status], afterRetirement);

  const contributions: Line[] = [{ label: '401(k)', amount: retirement }].filter((line) => line.amount > 0);
  const reliefs: Line[] = [{ label: 'Standard deduction', amount: deduction }].filter((line) => line.amount > 0);

  const taxableIncome = Math.max(0, afterRetirement - deduction);
  const bands = fillBands(taxableIncome, US_BANDS[status]);
  const incomeTax = bands.reduce((total, band) => total + band.tax, 0);
  const levies: Line[] = [
    { label: 'Social Security', amount: socialSecurity(gross) },
    { label: 'Medicare', amount: medicare(gross, status) },
  ].filter((line) => line.amount > 0);

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
