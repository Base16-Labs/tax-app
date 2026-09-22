/**
 * One input, four screens.
 *
 * The income you type on Calculate is the income Breakdown charts and Compare
 * sweeps, so it lives above all of them rather than being passed around. The
 * derived results are memoised here too — three screens asking the engine the
 * same question should not compute it three times.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  EMPTY_INPUT,
  calculateNTA2025,
  calculatePITA,
  compare,
  type Comparison,
  type TaxInput,
  type TaxResult,
} from './tax/calculate';

/** A starting income so the charts have something to draw on first launch. */
const SEED: TaxInput = {
  ...EMPTY_INPUT,
  grossAnnual: 6_000_000,
  annualRent: 1_800_000,
};

type Ctx = {
  input: TaxInput;
  /** Patch one or more fields; everything downstream recomputes. */
  update: (patch: Partial<TaxInput>) => void;
  reset: () => void;
  current: TaxResult;
  previous: TaxResult;
  comparison: Comparison;
};

const TaxContext = createContext<Ctx | null>(null);

export function TaxProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState<TaxInput>(SEED);

  const value = useMemo<Ctx>(
    () => ({
      input,
      update: (patch) => setInput((prev) => ({ ...prev, ...patch })),
      reset: () => setInput(SEED),
      current: calculateNTA2025(input),
      previous: calculatePITA(input),
      comparison: compare(input),
    }),
    [input],
  );

  return <TaxContext.Provider value={value}>{children}</TaxContext.Provider>;
}

export function useTax() {
  const ctx = useContext(TaxContext);
  if (!ctx) throw new Error('useTax() must be used inside <TaxProvider>');
  return ctx;
}
