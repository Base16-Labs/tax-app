/**
 * Nigeria: the Nigeria Tax Act 2025 (from 1 January 2026) and the Personal
 * Income Tax Act it replaced, for comparison. Pure arithmetic over ng-rules.ts.
 */
import {
  CRA_FLOOR,
  CRA_PERCENT_OF_GROSS,
  CRA_RATE,
  NTA_2025_BANDS,
  PITA_BANDS,
  PITA_MINIMUM_TAX_RATE,
  RENT_RELIEF_CAP,
  RENT_RELIEF_RATE,
  type Band,
} from './ng-rules';
import type { Payslip, TaxInput } from './types';

export type { TaxInput };

export type Regime = 'nta2025' | 'pita';

/** One band's contribution, kept so the UI can chart where the tax came from. */
export type BandBreakdown = {
  /** e.g. `"15%"`, the marginal rate, for labels. */
  label: string;
  rate: number;
  /** How much income fell into this band. */
  taxableInBand: number;
  /** Tax charged by this band alone. */
  tax: number;
  /** Cumulative income ceiling for this band, `Infinity` at the top. */
  ceiling: number;
};

export type TaxResult = {
  regime: Regime;
  grossAnnual: number;
  /** Every relief and deduction, itemised, in the order the law applies them. */
  deductions: { label: string; amount: number }[];
  totalDeductions: number;
  /** What the bands are actually applied to. */
  chargeableIncome: number;
  /** Tax owed for the year. */
  annualTax: number;
  monthlyTax: number;
  /** Gross minus tax minus the contributions that actually leave the payslip. */
  annualTakeHome: number;
  monthlyTakeHome: number;
  /** Tax as a share of gross. 0 when gross is 0. */
  effectiveRate: number;
  /** The rate the next naira earned would be taxed at. */
  marginalRate: number;
  bands: BandBreakdown[];
  /** Set when PITA's 1% minimum tax rule produced the answer instead of the bands. */
  minimumTaxApplied: boolean;
};

export const EMPTY_INPUT: TaxInput = {
  grossAnnual: 0,
  annualRent: 0,
  pensionRate: 0.08,
  nhfRate: 0.025,
  nhisRate: 0,
  lifePremium: 0,
  filingStatus: 'single',
};

const clampPositive = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** Applies a band table bottom-up, returning per-band detail. */
function applyBands(chargeable: number, bands: readonly Band[]): BandBreakdown[] {
  let remaining = clampPositive(chargeable);
  let ceiling = 0;
  return bands.map((band) => {
    ceiling += band.width;
    const taxableInBand = Math.min(remaining, band.width);
    remaining -= taxableInBand;
    return {
      label: `${Math.round(band.rate * 100)}%`,
      rate: band.rate,
      taxableInBand,
      tax: taxableInBand * band.rate,
      ceiling,
    };
  });
}

/** The highest rate that actually has income sitting in it. */
function marginalRateOf(bands: BandBreakdown[]): number {
  let rate = 0;
  for (const band of bands) if (band.taxableInBand > 0) rate = band.rate;
  return rate;
}

/** Rent relief: the lesser of 20% of rent paid and ₦500,000. NTA 2025 only. */
export function rentRelief(annualRent: number): number {
  return Math.min(RENT_RELIEF_CAP, clampPositive(annualRent) * RENT_RELIEF_RATE);
}

/**
 * PITA Consolidated Relief Allowance: max(₦200,000, 1% of gross) + 20% of gross,
 * with gross already net of exempt contributions. Abolished by the NTA 2025.
 */
export function consolidatedRelief(grossIncomeAfterContributions: number): number {
  const base = clampPositive(grossIncomeAfterContributions);
  return Math.max(CRA_FLOOR, base * CRA_PERCENT_OF_GROSS) + base * CRA_RATE;
}

function contributionsOf(input: TaxInput) {
  const gross = clampPositive(input.grossAnnual);
  const pension = gross * clampPositive(input.pensionRate);
  const nhf = gross * clampPositive(input.nhfRate);
  const nhis = gross * clampPositive(input.nhisRate);
  const life = clampPositive(input.lifePremium);
  return { gross, pension, nhf, nhis, life, total: pension + nhf + nhis + life };
}

/** Nigeria Tax Act 2025: contributions and rent relief come off, then the 0-25% bands. */
export function calculateNTA2025(input: TaxInput): TaxResult {
  const c = contributionsOf(input);
  const rent = rentRelief(input.annualRent);

  const deductions = [
    { label: 'Pension (8%)', amount: c.pension },
    { label: 'NHF (2.5%)', amount: c.nhf },
    { label: 'NHIS', amount: c.nhis },
    { label: 'Life assurance', amount: c.life },
    { label: 'Rent relief', amount: rent },
  ].filter((d) => d.amount > 0);

  const totalDeductions = c.total + rent;
  const chargeableIncome = Math.max(0, c.gross - totalDeductions);
  const bands = applyBands(chargeableIncome, NTA_2025_BANDS);
  const annualTax = bands.reduce((sum, b) => sum + b.tax, 0);

  // Rent relief only lowers taxable income; it is not deducted from take-home.
  const annualTakeHome = c.gross - annualTax - c.total;

  return {
    regime: 'nta2025',
    grossAnnual: c.gross,
    deductions,
    totalDeductions,
    chargeableIncome,
    annualTax,
    monthlyTax: annualTax / 12,
    annualTakeHome,
    monthlyTakeHome: annualTakeHome / 12,
    effectiveRate: c.gross > 0 ? annualTax / c.gross : 0,
    marginalRate: marginalRateOf(bands),
    bands,
    minimumTaxApplied: false,
  };
}

/** Pre-2026 PITA: contributions, then CRA, then the 7-24% bands, with a minimum tax of 1% of gross. */
export function calculatePITA(input: TaxInput): TaxResult {
  const c = contributionsOf(input);
  const grossIncome = Math.max(0, c.gross - c.total);
  const cra = consolidatedRelief(grossIncome);

  const deductions = [
    { label: 'Pension (8%)', amount: c.pension },
    { label: 'NHF (2.5%)', amount: c.nhf },
    { label: 'NHIS', amount: c.nhis },
    { label: 'Life assurance', amount: c.life },
    { label: 'Consolidated relief', amount: cra },
  ].filter((d) => d.amount > 0);

  const totalDeductions = c.total + cra;
  const chargeableIncome = Math.max(0, grossIncome - cra);
  const bands = applyBands(chargeableIncome, PITA_BANDS);
  const bandedTax = bands.reduce((sum, b) => sum + b.tax, 0);

  // PITA minimum tax: 1% of gross, only when there is gross income.
  const minimumTax = grossIncome * PITA_MINIMUM_TAX_RATE;
  const minimumTaxApplied = c.gross > 0 && bandedTax < minimumTax;
  const annualTax = minimumTaxApplied ? minimumTax : bandedTax;

  const annualTakeHome = c.gross - annualTax - c.total;

  return {
    regime: 'pita',
    grossAnnual: c.gross,
    deductions,
    totalDeductions,
    chargeableIncome,
    annualTax,
    monthlyTax: annualTax / 12,
    annualTakeHome,
    monthlyTakeHome: annualTakeHome / 12,
    effectiveRate: c.gross > 0 ? annualTax / c.gross : 0,
    marginalRate: marginalRateOf(bands),
    bands,
    minimumTaxApplied,
  };
}

export function calculate(input: TaxInput, regime: Regime): TaxResult {
  return regime === 'pita' ? calculatePITA(input) : calculateNTA2025(input);
}

export type Comparison = {
  current: TaxResult;
  previous: TaxResult;
  /** Positive when the new law charges less. */
  annualSaving: number;
  monthlySaving: number;
  /** Saving as a share of the old bill. 0 when the old bill was 0. */
  savingRate: number;
};

/** Runs one input through both laws. Positive `annualSaving` = better off now. */
export function compare(input: TaxInput): Comparison {
  const current = calculateNTA2025(input);
  const previous = calculatePITA(input);
  const annualSaving = previous.annualTax - current.annualTax;
  return {
    current,
    previous,
    annualSaving,
    monthlySaving: annualSaving / 12,
    savingRate: previous.annualTax > 0 ? annualSaving / previous.annualTax : 0,
  };
}

/** Both laws across a range of incomes, with fixed reliefs (rent, life premium) held constant. */
export function sweep(
  input: TaxInput,
  { from = 0, to = 30_000_000, steps = 40 }: { from?: number; to?: number; steps?: number } = {},
): { gross: number; current: number; previous: number }[] {
  const span = to - from;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const gross = from + (span * i) / steps;
    const at = { ...input, grossAnnual: gross };
    return {
      gross,
      current: calculateNTA2025(at).annualTax,
      previous: calculatePITA(at).annualTax,
    };
  });
}

/** The current law as a `Payslip`. No payroll levies; pension, NHF and NHIS are contributions. */
export function calculateNG(input: TaxInput): Payslip {
  const result = calculateNTA2025(input);
  const contributions = result.deductions.filter((d) => d.label !== 'Rent relief');
  const reliefs = result.deductions.filter((d) => d.label === 'Rent relief');
  const contributionTotal = contributions.reduce((total, d) => total + d.amount, 0);
  let from = 0;
  const bands = result.bands.map((band) => {
    const line = { ...band, from, to: band.ceiling };
    from = band.ceiling;
    return line;
  });
  return {
    grossAnnual: result.grossAnnual,
    contributions,
    reliefs,
    taxableIncome: result.chargeableIncome,
    bands,
    incomeTax: result.annualTax,
    levies: [],
    totalTax: result.annualTax,
    contributionTotal,
    takeHome: result.annualTakeHome,
    effectiveRate: result.effectiveRate,
  };
}
