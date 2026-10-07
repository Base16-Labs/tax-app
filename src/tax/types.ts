/** Types shared by every country's tax engine. */

export type CountryCode = 'GB' | 'US' | 'NG';

/** US only: how the household files. Joint filers combine both incomes. */
export type FilingStatus = 'single' | 'joint';

export type TaxInput = {
  /** Gross annual pay, in the country's own currency. */
  grossAnnual: number;
  /** Pension contribution as a fraction of gross: UK workplace pension, US 401(k), Nigerian pension. */
  pensionRate: number;
  /** Nigeria only: annual rent paid, for rent relief. */
  annualRent: number;
  /** Nigeria only: National Housing Fund contribution as a fraction of gross. */
  nhfRate: number;
  /** Nigeria only: health insurance contribution as a fraction of gross. */
  nhisRate: number;
  /** Nigeria only: annual life assurance premium. */
  lifePremium: number;
  /** US only. */
  filingStatus: FilingStatus;
};

/** One labelled amount on the payslip. */
export type Line = { label: string; amount: number };

/** One income tax band and what it charged. */
export type BandLine = {
  /** The rate as a label, e.g. `"20%"`. */
  label: string;
  rate: number;
  /** Where the band starts and stops, in taxable income. `to` is `Infinity` at the top. */
  from: number;
  to: number;
  /** How much income fell into this band. */
  taxableInBand: number;
  /** Tax charged by this band alone. */
  tax: number;
};

export type Payslip = {
  grossAnnual: number;
  /** Deducted from pay but not tax: pension, 401(k), NHF. */
  contributions: Line[];
  /** Amounts that only shrink the taxed income: allowances, standard deduction, rent relief. */
  reliefs: Line[];
  /** What the income tax bands are applied to. */
  taxableIncome: number;
  bands: BandLine[];
  incomeTax: number;
  /** Payroll taxes charged alongside income tax: National Insurance, Social Security, Medicare. */
  levies: Line[];
  /** Income tax plus every levy. */
  totalTax: number;
  contributionTotal: number;
  /** Gross, less all tax, less contributions. */
  takeHome: number;
  /** Total tax as a share of gross. 0 when gross is 0. */
  effectiveRate: number;
};

export const sum = (lines: readonly Line[]) => lines.reduce((total, line) => total + line.amount, 0);

export const clampPositive = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
