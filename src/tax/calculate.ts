/**
 * The engine. Pure arithmetic over `bands.ts` — no React, no formatting, so it
 * is testable on its own and the screens can never disagree about a number.
 *
 * Both regimes take the same `TaxInput` and return the same `TaxResult`, which
 * is what lets the Compare screen run one input through two laws and subtract.
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
} from './bands';

export type Regime = 'nta2025' | 'pita';

export type TaxInput = {
  /** Gross annual emolument, in naira. */
  grossAnnual: number;
  /** Annual rent paid. Only tenants get rent relief, and only under the NTA. */
  annualRent: number;
  /** Employee pension contribution as a fraction of gross. 0 to opt out. */
  pensionRate: number;
  /** National Housing Fund contribution as a fraction of gross. 0 to opt out. */
  nhfRate: number;
  /** Health insurance contribution as a fraction of gross. 0 to opt out. */
  nhisRate: number;
  /** Annual life assurance / annuity premium, in naira. */
  lifePremium: number;
};

/** One band's contribution, kept so the UI can chart where the tax came from. */
export type BandBreakdown = {
  /** e.g. `"15%"` — the marginal rate, for labels. */
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
};

const clampPositive = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/**
 * Walks a band table, filling each layer before moving up.
 *
 * Returns per-band detail rather than just a total — the Breakdown screen
 * charts these bars, and a total alone could not say which rate did the damage.
 */
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
 * PITA's Consolidated Relief Allowance: the higher of ₦200,000 and 1% of gross
 * income, plus 20% of gross income — where "gross income" is already net of the
 * tax-exempt contributions. Abolished by the NTA 2025.
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

/**
 * Nigeria Tax Act 2025.
 *
 * Contributions come off, rent relief comes off, and the remainder meets the
 * 0/15/18/21/23/25 ladder. There is no consolidated relief — the zero-rated
 * first ₦800,000 replaced it.
 */
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

  // Take-home is gross less tax and less the contributions that actually leave
  // the payslip. Rent relief is not one of them — it lowers the tax bill, it is
  // not money deducted from pay — so it is excluded here on purpose.
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

/**
 * The pre-2026 Personal Income Tax Act.
 *
 * Contributions come off first, then the CRA is computed on what is left, then
 * the 7–24% ladder runs. If the banded result falls below 1% of gross income,
 * the old minimum-tax rule charges that 1% instead.
 */
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

  // The old 1% minimum tax. Only bites where there is income to tax at all —
  // a zero gross owes zero, not a rounding of zero.
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
  /** Positive means the new law charges less — the taxpayer is better off. */
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

/**
 * The same comparison across a sweep of incomes, for the Compare screen's plot.
 *
 * Reliefs that are fixed amounts (rent, life premium) are held at the user's own
 * values while gross moves, which is what makes the two curves comparable: only
 * the income is varying.
 */
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
