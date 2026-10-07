/** Derived data shared by the Explore hub previews and their full pages. */
import { useMemo } from 'react';
import type { ChartPoint, DonutSlice } from '../components/ui/chart';
import { useTokens } from '../lib/arloui/theme-provider';
import { useTax } from './state';
import { sum } from './tax/types';

const SWEEP_STEPS = 60;

export type PaySlice = DonutSlice & { color: string; tax: boolean };

/** Gross pay split into take-home, income tax, payroll taxes and contributions. */
export function usePaySlices(): PaySlice[] {
  const t = useTokens();
  const { payslip } = useTax();
  // All payroll taxes share one slice.
  const levyLabel = payslip.levies.length === 1 ? payslip.levies[0]!.label : 'Payroll taxes';
  const slices: PaySlice[] = [
    { label: 'Take-home', value: payslip.takeHome, color: t.colors.chartPositive, tax: false },
    { label: 'Income tax', value: payslip.incomeTax, color: t.colors.chartNegative, tax: true },
    { label: levyLabel, value: sum(payslip.levies), color: t.colors.chartSeries4, tax: true },
    { label: 'Contributions', value: payslip.contributionTotal, color: t.colors.chartSeries3, tax: false },
  ];
  return slices.filter((s) => s.value > 0);
}

/** Take-home and total tax from zero to past the user's salary, other inputs held fixed. */
export function useSalarySweep() {
  const { country, input } = useTax();
  return useMemo(() => {
    const to = Math.max(country.exploreTo, Math.ceil(input.grossAnnual * 1.5));
    const points = Array.from({ length: SWEEP_STEPS + 1 }, (_, i) => {
      const gross = (to * i) / SWEEP_STEPS;
      return { gross, payslip: country.calculate({ ...input, grossAnnual: gross }) };
    });
    return {
      takeHome: points.map((p): ChartPoint => ({ value: p.payslip.takeHome, at: p.gross })),
      tax: points.map((p): ChartPoint => ({ value: p.payslip.totalTax, at: p.gross })),
    };
  }, [country, input]);
}
