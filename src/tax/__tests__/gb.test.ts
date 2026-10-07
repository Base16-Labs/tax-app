import { describe, expect, it } from 'vitest';
import { calculateGB, nationalInsurance, personalAllowance } from '../gb';
import { marginalRate } from '../progressive';
import type { TaxInput } from '../types';

const pay = (grossAnnual: number, pensionRate = 0): TaxInput => ({
  grossAnnual,
  pensionRate,
  annualRent: 0,
  nhfRate: 0,
  nhisRate: 0,
  lifePremium: 0,
  filingStatus: 'single',
});

describe('personal allowance', () => {
  it('is £12,570 up to £100,000', () => {
    expect(personalAllowance(40_000)).toBe(12_570);
    expect(personalAllowance(100_000)).toBe(12_570);
  });

  it('tapers by £1 for every £2 over £100,000', () => {
    expect(personalAllowance(110_000)).toBe(7_570);
  });

  it('is gone by £125,140', () => {
    expect(personalAllowance(125_140)).toBe(0);
    expect(personalAllowance(200_000)).toBe(0);
  });
});

describe('National Insurance', () => {
  it('charges nothing up to £12,570', () => {
    expect(nationalInsurance(12_570)).toBe(0);
  });

  it('is 8% between the thresholds', () => {
    expect(nationalInsurance(50_000)).toBeCloseTo(2_994.4, 2);
  });

  it('drops to 2% above £50,270', () => {
    expect(nationalInsurance(110_000)).toBeCloseTo(3_016 + 1_194.6, 2);
  });
});

describe('calculateGB', () => {
  it('£50,000 with no pension: £7,486 income tax', () => {
    const p = calculateGB(pay(50_000));
    expect(p.incomeTax).toBeCloseTo(7_486, 2);
    expect(p.takeHome).toBeCloseTo(50_000 - 7_486 - 2_994.4, 2);
  });

  it('£110,000 loses half the allowance above £100,000', () => {
    // Taxable £102,430: £37,700 at 20% and £64,730 at 40%.
    expect(calculateGB(pay(110_000)).incomeTax).toBeCloseTo(7_540 + 25_892, 2);
  });

  it('£150,000 reaches the 45% band with no allowance left', () => {
    expect(calculateGB(pay(150_000)).incomeTax).toBeCloseTo(7_540 + 34_976 + 11_187, 2);
  });

  it('a pension cuts income tax but not National Insurance', () => {
    const without = calculateGB(pay(50_000));
    const withPension = calculateGB(pay(50_000, 0.05));
    expect(withPension.incomeTax).toBeCloseTo(without.incomeTax - 2_500 * 0.2, 2);
    expect(withPension.levies).toEqual(without.levies);
    expect(withPension.contributionTotal).toBe(2_500);
  });

  it('the taper makes the marginal rate 62% between £100,000 and £125,140', () => {
    expect(marginalRate(calculateGB, pay(110_000), 100)).toBeCloseTo(0.62, 2);
  });

  it('handles zero and junk input without NaN', () => {
    for (const gross of [0, -5, Number.NaN]) {
      const p = calculateGB(pay(gross));
      expect(p.totalTax).toBe(0);
      expect(p.effectiveRate).toBe(0);
    }
  });
});
