/**
 * Nigerian personal income tax band tables, annual, in naira.
 * `width` is the income a band holds; the top band is `Infinity`.
 */

export type Band = {
  /** How much income this layer holds. `Infinity` for the top band. */
  width: number;
  /** Marginal rate as a fraction, e.g. `0.15` for 15%. */
  rate: number;
};

/**
 * Nigeria Tax Act 2025, in force from 1 January 2026.
 * The first ₦800,000 is a 0% band, so there is no cliff at the exemption.
 */
export const NTA_2025_BANDS: readonly Band[] = [
  { width: 800_000, rate: 0 }, //        0 –   800k   0%
  { width: 2_200_000, rate: 0.15 }, //  800k –     3m  15%
  { width: 9_000_000, rate: 0.18 }, //    3m –    12m  18%
  { width: 13_000_000, rate: 0.21 }, //  12m –    25m  21%
  { width: 25_000_000, rate: 0.23 }, //  25m –    50m  23%
  { width: Infinity, rate: 0.25 }, //    50m +        25%
];

/** Personal Income Tax Act (as amended), in force before 2026. */
export const PITA_BANDS: readonly Band[] = [
  { width: 300_000, rate: 0.07 }, //      0 – 300k   7%
  { width: 300_000, rate: 0.11 }, //   300k – 600k  11%
  { width: 500_000, rate: 0.15 }, //   600k – 1.1m  15%
  { width: 500_000, rate: 0.19 }, //   1.1m – 1.6m  19%
  { width: 1_600_000, rate: 0.21 }, // 1.6m – 3.2m  21%
  { width: Infinity, rate: 0.24 }, //   3.2m +      24%
];

/** Rent relief under the NTA 2025: the lesser of 20% of rent paid and ₦500,000. */
export const RENT_RELIEF_RATE = 0.2;
export const RENT_RELIEF_CAP = 500_000;

/** Statutory contribution rates, as fractions of the base they apply to. */
export const PENSION_RATE = 0.08; // employee share, Pension Reform Act 2014
export const NHF_RATE = 0.025; // National Housing Fund
export const NHIS_RATE = 0.05; // employee share, commonly 5%

/** PITA's Consolidated Relief Allowance, abolished by the NTA 2025. */
export const CRA_FLOOR = 200_000;
export const CRA_PERCENT_OF_GROSS = 0.01;
export const CRA_RATE = 0.2;

/** PITA charged 1% of gross income when the banded result came out lower. */
export const PITA_MINIMUM_TAX_RATE = 0.01;
