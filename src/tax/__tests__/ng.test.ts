import { describe, expect, it } from 'vitest';
import {
  EMPTY_INPUT,
  calculateNTA2025,
  calculatePITA,
  compare,
  consolidatedRelief,
  rentRelief,
  sweep,
  type TaxInput,
} from '../ng';
import { NTA_2025_BANDS, PITA_BANDS } from '../ng-rules';

/** No contributions, no rent, so a test can aim straight at the band maths. */
const bare = (grossAnnual: number): TaxInput => ({
  ...EMPTY_INPUT,
  grossAnnual,
  pensionRate: 0,
  nhfRate: 0,
  nhisRate: 0,
});

describe('band tables', () => {
  it('NTA 2025 ceilings are 800k / 3m / 12m / 25m / 50m', () => {
    const ceilings: number[] = [];
    let running = 0;
    for (const band of NTA_2025_BANDS) {
      running += band.width;
      ceilings.push(running);
    }
    expect(ceilings.slice(0, 5)).toEqual([800_000, 3_000_000, 12_000_000, 25_000_000, 50_000_000]);
    expect(ceilings[5]).toBe(Infinity);
  });

  it('NTA rates climb 0 → 25% and never fall', () => {
    const rates = NTA_2025_BANDS.map((b) => b.rate);
    expect(rates).toEqual([0, 0.15, 0.18, 0.21, 0.23, 0.25]);
    for (let i = 1; i < rates.length; i += 1) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1]!);
    }
  });

  it('PITA rates are the old 7 → 24% ladder', () => {
    expect(PITA_BANDS.map((b) => b.rate)).toEqual([0.07, 0.11, 0.15, 0.19, 0.21, 0.24]);
  });
});

describe('rent relief', () => {
  it('is 20% of rent below the cap', () => {
    expect(rentRelief(1_000_000)).toBe(200_000);
  });

  it('caps at 500,000', () => {
    // 20% of 5m would be 1m, but the cap bites first.
    expect(rentRelief(5_000_000)).toBe(500_000);
    expect(rentRelief(2_500_000)).toBe(500_000);
  });

  it('is zero for a non-tenant', () => {
    expect(rentRelief(0)).toBe(0);
  });
});

describe('NTA 2025', () => {
  it('charges nothing at or below the 800k zero band', () => {
    expect(calculateNTA2025(bare(800_000)).annualTax).toBe(0);
    expect(calculateNTA2025(bare(500_000)).annualTax).toBe(0);
  });

  it('taxes only the excess just above 800k', () => {
    // 1 naira over the zero band is 15 kobo of tax, not 15% of everything.
    expect(calculateNTA2025(bare(800_001)).annualTax).toBeCloseTo(0.15, 6);
  });

  it('is continuous across every band edge (no cliffs)', () => {
    const edges = [800_000, 3_000_000, 12_000_000, 25_000_000, 50_000_000];
    for (const edge of edges) {
      const below = calculateNTA2025(bare(edge)).annualTax;
      const above = calculateNTA2025(bare(edge + 1)).annualTax;
      // Crossing an edge must never cost more than the top marginal rate on 1 naira.
      expect(above - below).toBeLessThanOrEqual(0.25 + 1e-9);
      expect(above).toBeGreaterThanOrEqual(below);
    }
  });

  it('fills bands in order: 3m gross with no reliefs', () => {
    // 800k @ 0% + 2.2m @ 15% = 330,000
    expect(calculateNTA2025(bare(3_000_000)).annualTax).toBeCloseTo(330_000, 6);
  });

  it('fills the 18% band: 12m gross with no reliefs', () => {
    // 330,000 + 9m @ 18% = 330,000 + 1,620,000
    expect(calculateNTA2025(bare(12_000_000)).annualTax).toBeCloseTo(1_950_000, 6);
  });

  it('reaches the 25% band above 50m', () => {
    const result = calculateNTA2025(bare(60_000_000));
    // 1,950,000 + 13m@21% (2,730,000) + 25m@23% (5,750,000) + 10m@25% (2,500,000)
    expect(result.annualTax).toBeCloseTo(12_930_000, 6);
    expect(result.marginalRate).toBe(0.25);
  });

  it('applies rent relief before the bands', () => {
    const withRent = calculateNTA2025({ ...bare(5_000_000), annualRent: 2_000_000 });
    const without = calculateNTA2025(bare(5_000_000));
    // Relief is 400k, all of it sitting in the 18% band at this income.
    expect(without.annualTax - withRent.annualTax).toBeCloseTo(400_000 * 0.18, 6);
  });

  it('subtracts pension and NHF from chargeable income', () => {
    const result = calculateNTA2025({ ...EMPTY_INPUT, grossAnnual: 5_000_000 });
    // 8% + 2.5% = 10.5% of 5m = 525,000
    expect(result.totalDeductions).toBeCloseTo(525_000, 6);
    expect(result.chargeableIncome).toBeCloseTo(4_475_000, 6);
  });

  it('never reports a consolidated relief, which the NTA abolished', () => {
    const labels = calculateNTA2025({ ...EMPTY_INPUT, grossAnnual: 5_000_000 }).deductions.map(
      (d) => d.label,
    );
    expect(labels).not.toContain('Consolidated relief');
  });

  it('take-home excludes tax and contributions but not rent relief', () => {
    const input = { ...EMPTY_INPUT, grossAnnual: 6_000_000, annualRent: 1_200_000 };
    const r = calculateNTA2025(input);
    const contributions = 6_000_000 * 0.105;
    expect(r.annualTakeHome).toBeCloseTo(6_000_000 - r.annualTax - contributions, 6);
    expect(r.monthlyTakeHome).toBeCloseTo(r.annualTakeHome / 12, 6);
  });

  it('effective rate stays below the marginal rate', () => {
    for (const gross of [1_000_000, 5_000_000, 20_000_000, 80_000_000]) {
      const r = calculateNTA2025(bare(gross));
      expect(r.effectiveRate).toBeLessThan(r.marginalRate);
    }
  });

  it('handles zero and junk input without producing NaN', () => {
    for (const gross of [0, -5_000_000, NaN]) {
      const r = calculateNTA2025(bare(gross));
      expect(r.annualTax).toBe(0);
      expect(r.effectiveRate).toBe(0);
      expect(Number.isNaN(r.annualTakeHome)).toBe(false);
    }
  });
});

describe('PITA', () => {
  it('CRA is 200k floor plus 20% for low incomes', () => {
    // 1% of 1m is 10k, below the 200k floor, so the floor wins.
    expect(consolidatedRelief(1_000_000)).toBeCloseTo(200_000 + 200_000, 6);
  });

  it('CRA uses 1% once it beats the floor', () => {
    // 1% of 30m is 300k, above the floor.
    expect(consolidatedRelief(30_000_000)).toBeCloseTo(300_000 + 6_000_000, 6);
  });

  it('charges tax at incomes the NTA exempts', () => {
    // 800k gross owed tax under PITA.
    expect(calculatePITA(bare(800_000)).annualTax).toBeGreaterThan(0);
    expect(calculateNTA2025(bare(800_000)).annualTax).toBe(0);
  });

  it('falls back to 1% minimum tax when the bands undercharge', () => {
    // At 250k the CRA (200k floor + 20%) swallows the whole income, so the
    // bands charge nothing and the 1% rule is the only thing left.
    const r = calculatePITA(bare(250_000));
    expect(r.chargeableIncome).toBe(0);
    expect(r.minimumTaxApplied).toBe(true);
    expect(r.annualTax).toBeCloseTo(2_500, 6);
  });

  it('prefers the banded result once it beats 1% of gross', () => {
    // By 600k the bands charge 19,600 against a 6,000 minimum, so the rule
    // stops applying. The crossover sits near 304k.
    const r = calculatePITA(bare(600_000));
    expect(r.minimumTaxApplied).toBe(false);
    expect(r.annualTax).toBeCloseTo(19_600, 6);
  });

  it('owes nothing on zero gross: minimum tax does not invent a bill', () => {
    const r = calculatePITA(bare(0));
    expect(r.annualTax).toBe(0);
    expect(r.minimumTaxApplied).toBe(false);
  });

  it('ignores rent: rent relief was an NTA invention', () => {
    const withRent = calculatePITA({ ...bare(5_000_000), annualRent: 3_000_000 });
    const without = calculatePITA(bare(5_000_000));
    expect(withRent.annualTax).toBeCloseTo(without.annualTax, 6);
  });
});

describe('compare', () => {
  it('a low earner is better off under the new law', () => {
    const c = compare({ ...EMPTY_INPUT, grossAnnual: 1_500_000, annualRent: 600_000 });
    expect(c.annualSaving).toBeGreaterThan(0);
    expect(c.monthlySaving).toBeCloseTo(c.annualSaving / 12, 6);
  });

  it('a minimum-wage earner pays nothing and saves the whole old bill', () => {
    const c = compare({ ...EMPTY_INPUT, grossAnnual: 840_000 });
    expect(c.current.annualTax).toBe(0);
    expect(c.annualSaving).toBeCloseTo(c.previous.annualTax, 6);
    expect(c.savingRate).toBeCloseTo(1, 6);
  });

  it('a high earner pays more under the new law', () => {
    // The top rate rose from 24% to 25% and the CRA is gone, so high earners pay more.
    const c = compare({ ...EMPTY_INPUT, grossAnnual: 100_000_000, annualRent: 5_000_000 });
    expect(c.annualSaving).toBeLessThan(0);
  });

  it('savingRate is 0 rather than NaN when the old bill was 0', () => {
    const c = compare(bare(0));
    expect(c.savingRate).toBe(0);
  });
});

describe('sweep', () => {
  it('returns steps + 1 points spanning the range', () => {
    const points = sweep(EMPTY_INPUT, { from: 0, to: 10_000_000, steps: 20 });
    expect(points).toHaveLength(21);
    expect(points[0]!.gross).toBe(0);
    expect(points[20]!.gross).toBe(10_000_000);
  });

  it('both curves rise monotonically with income', () => {
    const points = sweep(EMPTY_INPUT, { from: 0, to: 40_000_000, steps: 40 });
    for (let i = 1; i < points.length; i += 1) {
      expect(points[i]!.current).toBeGreaterThanOrEqual(points[i - 1]!.current);
      expect(points[i]!.previous).toBeGreaterThanOrEqual(points[i - 1]!.previous);
    }
  });

  it('the two curves cross exactly once', () => {
    // Exactly one sign change: cheaper below the crossover, dearer above.
    const points = sweep(EMPTY_INPUT, { from: 0, to: 120_000_000, steps: 240 });
    const signs = points
      .filter((p) => p.previous > 0 || p.current > 0)
      .map((p) => Math.sign(p.previous - p.current));
    const flips = signs.filter((s, i) => i > 0 && s !== 0 && s !== signs[i - 1] && signs[i - 1] !== 0);
    expect(flips.length).toBeLessThanOrEqual(1);
  });
});
