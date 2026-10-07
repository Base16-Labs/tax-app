/**
 * One country, one set of inputs, every screen.
 *
 * The income you type on Calculate is the income Breakdown charts and Explore
 * sweeps, so it lives above all of them. Each country keeps its own inputs (a
 * salary in pounds means nothing in naira), and all of it is saved, so the app
 * reopens where you left it.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { load, save } from './storage';
import { COUNTRIES, type Country } from './tax/countries';
import { money, moneyShort } from './tax/format';
import { compare, type Comparison } from './tax/ng';
import { marginalRate } from './tax/progressive';
import type { CountryCode, Payslip, TaxInput } from './tax/types';

/**
 * How the income is typed, not how it is taxed: the engines always work on a
 * year. Most people know their monthly pay, so Calculate lets them enter it that
 * way and multiplies up.
 */
export type IncomePeriod = 'year' | 'month';

type Inputs = Partial<Record<CountryCode, TaxInput>>;

type SetupCtx = {
  /** `null` until onboarding picks one. */
  country: Country | null;
  setCountry: (code: CountryCode | null) => void;
};

type TaxCtx = {
  country: Country;
  input: TaxInput;
  /** Patch one or more fields; everything downstream recomputes. */
  update: (patch: Partial<TaxInput>) => void;
  incomePeriod: IncomePeriod;
  setIncomePeriod: (period: IncomePeriod) => void;
  payslip: Payslip;
  /** Share of the next `country.raiseStep` that goes in tax. */
  marginal: number;
  /** Nigeria only: the same pay under the law the 2026 reform replaced. */
  reform: Comparison | null;
  money: (value: number) => string;
  moneyShort: (value: number) => string;
};

const SetupContext = createContext<SetupCtx | null>(null);
const TaxContext = createContext<TaxCtx | null>(null);

export function TaxProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CountryCode | null>(() => load<CountryCode | null>('country', null));
  const [inputs, setInputs] = useState<Inputs>(() => load<Inputs>('inputs', {}));
  const [incomePeriod, setIncomePeriod] = useState<IncomePeriod>(() => load<IncomePeriod>('period', 'year'));

  useEffect(() => save('country', code), [code]);
  useEffect(() => save('inputs', inputs), [inputs]);
  useEffect(() => save('period', incomePeriod), [incomePeriod]);

  const country = code ? COUNTRIES[code] : null;

  const update = useCallback(
    (patch: Partial<TaxInput>) => {
      if (!code) return;
      setInputs((prev) => ({ ...prev, [code]: { ...(prev[code] ?? COUNTRIES[code].defaults), ...patch } }));
    },
    [code],
  );

  const setup = useMemo<SetupCtx>(() => ({ country, setCountry: setCode }), [country]);

  const tax = useMemo<TaxCtx | null>(() => {
    if (!country) return null;
    const input = { ...country.defaults, ...inputs[country.code] };
    return {
      country,
      input,
      update,
      incomePeriod,
      setIncomePeriod,
      payslip: country.calculate(input),
      marginal: marginalRate(country.calculate, input, country.raiseStep),
      reform: country.code === 'NG' ? compare(input) : null,
      money: (value) => money(value, country.currency),
      moneyShort: (value) => moneyShort(value, country.currency),
    };
  }, [country, inputs, update, incomePeriod]);

  return (
    <SetupContext.Provider value={setup}>
      <TaxContext.Provider value={tax}>{children}</TaxContext.Provider>
    </SetupContext.Provider>
  );
}

/** The chosen country, or `null` before onboarding. */
export function useSetup() {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error('useSetup() must be used inside <TaxProvider>');
  return ctx;
}

/** Everything a screen needs. Only valid once a country is chosen. */
export function useTax() {
  const ctx = useContext(TaxContext);
  if (!ctx) throw new Error('useTax() needs a chosen country inside <TaxProvider>');
  return ctx;
}
