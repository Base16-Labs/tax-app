import { describe, expect, it } from 'vitest';
import { marginalRate } from '../progressive';
import type { FilingStatus, TaxInput } from '../types';
import { calculateUS, medicare, socialSecurity, US_BANDS } from '../us';

const pay = (grossAnnual: number, filingStatus: FilingStatus = 'single', pensionRate = 0): TaxInput => ({
  grossAnnual,
  pensionRate,
  annualRent: 0,
  nhfRate: 0,
  nhisRate: 0,
  lifePremium: 0,
  filingStatus,
});

const ceilings = (status: FilingStatus) => {
  let running = 0;
  return US_BANDS[status].slice(0, -1).map((band) => (running += band.width));
};

describe('2026 brackets', () => {
  it('single ceilings match Rev. Proc. 2025-32', () => {
    expect(ceilings('single')).toEqual([12_400, 50_400, 105_700, 201_775, 256_225, 640_600]);
  });

  it('joint ceilings match Rev. Proc. 2025-32', () => {
    expect(ceilings('joint')).toEqual([24_800, 100_800, 211_400, 403_550, 512_450, 768_700]);
  });
});

describe('FICA', () => {
  it('Social Security stops at the $184,500 wage base', () => {
    expect(socialSecurity(100_000)).toBeCloseTo(6_200, 2);
    expect(socialSecurity(300_000)).toBeCloseTo(11_439, 2);
  });

  it('Medicare adds 0.9% above $200,000 for a single filer', () => {
    expect(medicare(100_000, 'single')).toBeCloseTo(1_450, 2);
    expect(medicare(300_000, 'single')).toBeCloseTo(4_350 + 900, 2);
    expect(medicare(300_000, 'joint')).toBeCloseTo(4_350 + 450, 2);
  });
});

describe('calculateUS', () => {
  it('$75,000 single: $7,670 federal income tax', () => {
    // Taxable $58,900: $12,400 at 10%, $38,000 at 12%, $8,500 at 22%.
    const p = calculateUS(pay(75_000));
    expect(p.taxableIncome).toBe(58_900);
    expect(p.incomeTax).toBeCloseTo(7_670, 2);
    expect(p.totalTax).toBeCloseTo(7_670 + 4_650 + 1_087.5, 2);
  });

  it('filing jointly doubles the deduction and widens the brackets', () => {
    expect(calculateUS(pay(150_000, 'joint')).incomeTax).toBeLessThan(
      calculateUS(pay(150_000, 'single')).incomeTax,
    );
  });

  it('a 401(k) cuts income tax but not FICA', () => {
    const without = calculateUS(pay(75_000));
    const with401k = calculateUS(pay(75_000, 'single', 0.06));
    expect(with401k.incomeTax).toBeCloseTo(without.incomeTax - 4_500 * 0.22, 2);
    expect(with401k.levies).toEqual(without.levies);
  });

  it('crossing the Social Security cap lowers the marginal rate', () => {
    const below = marginalRate(calculateUS, pay(180_000), 100);
    const above = marginalRate(calculateUS, pay(190_000), 100);
    expect(above).toBeLessThan(below);
  });

  it('owes nothing on zero pay', () => {
    expect(calculateUS(pay(0)).totalTax).toBe(0);
  });
});
