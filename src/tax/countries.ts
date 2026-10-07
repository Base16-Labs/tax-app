/**
 * The three countries the app supports, and everything the screens need to know
 * about each: its currency, its tax year, its engine, and how to explain its rules.
 *
 * The currency follows the country. Tax is worked out in the currency it is paid
 * in, so a UK salary is always in pounds; showing it in naira would mean live
 * exchange rates and numbers that drift from the law.
 */
import { calculateGB, PERSONAL_ALLOWANCE } from './gb';
import { calculateNG } from './ng';
import { NHF_RATE, NHIS_RATE, NTA_2025_BANDS, PENSION_RATE } from './ng-rules';
import type { Band } from './progressive';
import type { CountryCode, FilingStatus, Payslip, TaxInput } from './types';
import { calculateUS, SOCIAL_SECURITY_WAGE_BASE, STANDARD_DEDUCTION, US_BANDS } from './us';

export type Currency = {
  code: 'GBP' | 'USD' | 'NGN';
  symbol: string;
  name: string;
};

/** A row in the Rules tab's reliefs-and-deductions list. */
export type RuleRow = { title: string; subtitle: string; value: string };

export type Country = {
  code: CountryCode;
  name: string;
  /** The name as it reads mid-sentence: "in the United States". */
  inProse: string;
  currency: Currency;
  /** e.g. "2026/27 tax year". */
  taxYear: string;
  /** What the engine covers, said plainly. */
  scope: string;
  calculate: (input: TaxInput) => Payslip;
  /** First-run inputs: a typical salary and the usual contributions. */
  defaults: TaxInput;
  /** What the pension contribution is called here, and the rates offered. */
  pension: { label: string; options: number[] };
  /** The meter's top: the highest combined rate anyone pays on their last unit of pay. */
  topRate: number;
  /** The raise the Explore tab prices, in local currency. */
  raiseStep: number;
  /** Explore's salary range starts at zero and runs to at least this. */
  exploreTo: number;
  /** The income tax bands, as the Rules tab lists them, in gross pay terms. */
  bandsFor: (input: TaxInput) => { rate: number; from: number; to: number }[];
  reliefRows: (input: TaxInput) => RuleRow[];
  steps: (input: TaxInput) => string[];
  /** One thing about this system worth knowing, shown on Explore. */
  insight: (format: (n: number) => string) => { title: string; body: string };
};

const base: Omit<TaxInput, 'grossAnnual'> = {
  pensionRate: 0,
  annualRent: 0,
  nhfRate: 0,
  nhisRate: 0,
  lifePremium: 0,
  filingStatus: 'single',
};

/** Cumulative ranges from band widths, shifted by any tax-free amount below them. */
function ranges(bands: readonly Band[], offset = 0) {
  let from = offset;
  return bands.map((band) => {
    const range = { rate: band.rate, from, to: from + band.width };
    from += band.width;
    return range;
  });
}

const filing = (input: TaxInput): FilingStatus => (input.filingStatus === 'joint' ? 'joint' : 'single');

export const COUNTRIES: Record<CountryCode, Country> = {
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    inProse: 'the United Kingdom',
    currency: { code: 'GBP', symbol: '£', name: 'Pound sterling' },
    taxYear: '2026/27 tax year',
    scope: 'Income tax and National Insurance for England, Wales and Northern Ireland.',
    calculate: calculateGB,
    defaults: { ...base, grossAnnual: 45_000, pensionRate: 0.05 },
    pension: { label: 'Workplace pension', options: [0, 0.03, 0.05, 0.08] },
    topRate: 0.47,
    raiseStep: 1_000,
    exploreTo: 160_000,
    // HMRC's own table. Shifting the bands by the allowance would put 45% above
    // £137,710, but the allowance is gone by £125,140, which is where it starts.
    bandsFor: () => [
      { rate: 0, from: 0, to: PERSONAL_ALLOWANCE },
      { rate: 0.2, from: PERSONAL_ALLOWANCE, to: 50_270 },
      { rate: 0.4, from: 50_270, to: 125_140 },
      { rate: 0.45, from: 125_140, to: Infinity },
    ],
    reliefRows: () => [
      {
        title: 'Personal allowance',
        subtitle: 'Tax-free. Shrinks by £1 for every £2 earned over £100,000.',
        value: '£12,570',
      },
      {
        title: 'National Insurance',
        subtitle: '8% between £12,570 and £50,270, then 2% above.',
        value: '8% / 2%',
      },
      {
        title: 'Workplace pension',
        subtitle: 'Taken before income tax, but not before National Insurance.',
        value: 'Your choice',
      },
    ],
    steps: () => [
      'Start from gross annual pay.',
      'Take off your workplace pension.',
      'Take off the personal allowance, reduced if you earn over £100,000.',
      'Fill the bands from the bottom: 20%, then 40%, then 45%.',
      'Add National Insurance, worked out on gross pay.',
    ],
    insight: (money) => ({
      title: 'The 60% band',
      body: `Between ${money(100_000)} and ${money(125_140)} you lose £1 of tax-free allowance for every £2 you earn, so each extra pound is taxed at an effective 60%, plus National Insurance. Paying more into your pension in that range keeps the allowance.`,
    }),
  },

  US: {
    code: 'US',
    name: 'United States',
    inProse: 'the United States',
    currency: { code: 'USD', symbol: '$', name: 'US dollar' },
    taxYear: '2026 tax year',
    scope: 'Federal income tax, Social Security and Medicare. State and local taxes are not included.',
    calculate: calculateUS,
    defaults: { ...base, grossAnnual: 75_000, pensionRate: 0.06 },
    pension: { label: '401(k)', options: [0, 0.03, 0.06, 0.1] },
    topRate: 0.4,
    raiseStep: 1_000,
    exploreTo: 250_000,
    bandsFor: (input) => ranges(US_BANDS[filing(input)]),
    reliefRows: (input) => [
      {
        title: 'Standard deduction',
        subtitle: filing(input) === 'joint' ? 'Married, filing jointly.' : 'Single filer.',
        value: `$${STANDARD_DEDUCTION[filing(input)].toLocaleString('en-US')}`,
      },
      {
        title: 'Social Security',
        subtitle: `6.2% of wages, up to $${SOCIAL_SECURITY_WAGE_BASE.toLocaleString('en-US')}.`,
        value: '6.2%',
      },
      {
        title: 'Medicare',
        subtitle: 'Plus 0.9% on wages over $200,000 ($250,000 filing jointly).',
        value: '1.45%',
      },
      {
        title: '401(k)',
        subtitle: 'Traditional contributions come off before federal income tax, not before FICA.',
        value: 'Your choice',
      },
    ],
    steps: (input) => [
      'Start from gross annual wages.',
      'Take off your 401(k) contribution.',
      `Take off the standard deduction: $${STANDARD_DEDUCTION[filing(input)].toLocaleString('en-US')}.`,
      'Fill the federal brackets from 10% up to 37%.',
      'Add Social Security and Medicare, worked out on gross wages.',
    ],
    insight: (money) => ({
      title: 'Social Security stops at a cap',
      body: `The 6.2% Social Security tax only applies to the first ${money(SOCIAL_SECURITY_WAGE_BASE)} of wages, so past that point a raise keeps more of each dollar. Medicare has no cap.`,
    }),
  },

  NG: {
    code: 'NG',
    name: 'Nigeria',
    inProse: 'Nigeria',
    currency: { code: 'NGN', symbol: '₦', name: 'Naira' },
    taxYear: '2026, Nigeria Tax Act 2025',
    scope: 'Personal income tax under the Nigeria Tax Act 2025, in force since January 2026.',
    calculate: calculateNG,
    defaults: {
      ...base,
      grossAnnual: 6_000_000,
      annualRent: 1_800_000,
      pensionRate: PENSION_RATE,
      nhfRate: NHF_RATE,
    },
    pension: { label: 'Pension', options: [0, PENSION_RATE] },
    topRate: 0.25,
    raiseStep: 100_000,
    exploreTo: 40_000_000,
    bandsFor: () => ranges(NTA_2025_BANDS),
    reliefRows: () => [
      {
        title: 'Rent relief',
        subtitle: 'Tenants only: 20% of rent paid, capped.',
        value: 'Up to ₦500,000',
      },
      { title: 'Pension', subtitle: 'Employee share, Pension Reform Act 2014.', value: '8% of gross' },
      { title: 'NHF', subtitle: 'National Housing Fund.', value: `${NHF_RATE * 100}% of gross` },
      { title: 'NHIS', subtitle: 'Health insurance, where you contribute.', value: `${NHIS_RATE * 100}% of gross` },
      {
        title: 'Consolidated relief',
        subtitle: 'The old allowance, replaced by the tax-free first ₦800,000 and rent relief.',
        value: 'Abolished',
      },
    ],
    steps: () => [
      'Start from gross annual income.',
      'Take off pension, NHF, NHIS and life assurance.',
      'Take off rent relief: 20% of rent paid, up to ₦500,000.',
      'Fill the bands from the bottom: 0%, then 15%, 18%, 21%, 23%, 25%.',
    ],
    insight: (money) => ({
      title: 'The first ₦800,000 is tax-free',
      body: `It is a zero-rated band, not a cliff, so earning ${money(800_001)} costs you 15 kobo, not 15% of everything. Minimum-wage earners pay nothing.`,
    }),
  },
};

export const COUNTRY_ORDER: CountryCode[] = ['GB', 'US', 'NG'];
