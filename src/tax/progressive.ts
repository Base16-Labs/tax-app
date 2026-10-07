/** Progressive bands shared by every country. `width` is the income a band holds; the top is `Infinity`. */
import { clampPositive, type BandLine, type Payslip, type TaxInput } from './types';

export type Band = { width: number; rate: number };

/** Fills the bands from the bottom and reports what each one charged. */
export function fillBands(taxable: number, bands: readonly Band[]): BandLine[] {
  let remaining = clampPositive(taxable);
  let from = 0;
  return bands.map((band) => {
    const to = from + band.width;
    const taxableInBand = Math.min(remaining, band.width);
    remaining -= taxableInBand;
    const line = {
      label: `${Math.round(band.rate * 100)}%`,
      rate: band.rate,
      from,
      to,
      taxableInBand,
      tax: taxableInBand * band.rate,
    };
    from = to;
    return line;
  });
}

/**
 * Tax on the next slice of pay, measured by recomputing, so it includes payroll
 * taxes and the UK allowance taper (62% between £100,000 and £125,140).
 */
export function marginalRate(
  calculate: (input: TaxInput) => Payslip,
  input: TaxInput,
  step: number,
): number {
  const now = calculate(input).totalTax;
  const next = calculate({ ...input, grossAnnual: input.grossAnnual + step }).totalTax;
  return Math.max(0, (next - now) / step);
}
