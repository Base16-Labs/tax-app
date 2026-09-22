# Naija Tax

A Nigerian income tax calculator, built to demo [Arlo UI](https://arloui.com)'s **Chart** and
**Tab Bar** components in a real app rather than a storybook.

It works out what you owe under the **Nigeria Tax Act 2025** — the law in force since
1 January 2026 — and shows you what the same income would have cost under the Personal Income
Tax Act it replaced.

## What it demos

| Arlo UI component | Where it's used |
| --- | --- |
| `TabBar` (floating, glass, `jelly` selection) | App shell — reacts to scroll via `useTabBarScroll` |
| `Chart` (line plot + scrub) | Compare — two regimes, linked scrubbing through `activeAt` |
| `Chart.Donut` | Breakdown — gross split into take-home, tax, contributions |
| `Chart.Bar` | Breakdown — tax charged by each marginal band |
| `Chart.Meter` | Calculate — effective rate against the 25% ceiling |
| `Card`, `Input`, `Chip` | Throughout |

Every component was installed with the real CLI against the public registry:

```bash
npx arloui init
npx arloui add chart tab-bar card button input field badge chip
```

## The tax rules

**Nigeria Tax Act 2025** (current). Chargeable income is gross, less pension / NHF / NHIS /
life assurance, less rent relief. Then:

| Rate | Band |
| --- | --- |
| 0% | first ₦800,000 |
| 15% | ₦800,000 – ₦3m |
| 18% | ₦3m – ₦12m |
| 21% | ₦12m – ₦25m |
| 23% | ₦25m – ₦50m |
| 25% | above ₦50m |

- **Rent relief** — 20% of annual rent, capped at ₦500,000. Tenants only.
- **The ₦800,000 exemption** is a zero-rated band, not a cliff. Earning ₦800,001 costs you
  15 kobo, not 15% of everything.
- The **Consolidated Relief Allowance was abolished** — the zero band and rent relief replaced it.

**Personal Income Tax Act** (old, kept for comparison). CRA of the higher of ₦200,000 or 1% of
gross income, plus 20% of gross income; bands 7 / 11 / 15 / 19 / 21 / 24%; a 1% minimum tax when
the bands charged less.

### What the reform actually did

Most earners pay less. Above roughly **₦25.6m a year** they pay more — the top rate rose from
24% to 25% and the CRA that softened the old bands is gone. The Compare tab plots both curves
and finds the crossover for your own reliefs by bisection.

## Running it

```bash
npm install
npm run ios
```

`npm run ios` does a dev build, which is what gets you the real Liquid Glass tab bar on
iOS 26. Expo Go works too and falls back to the translucent overlay.

```bash
npm test        # 32 tests over the tax engine
npm run typecheck
```

## Layout

```
src/
  tax/
    bands.ts          the two band tables, as layers not brackets
    calculate.ts      pure engine — no React, no formatting
    format.ts         naira formatting and input parsing
    __tests__/        band edges, reliefs, minimum tax, crossover
  screens/            Calculate · Breakdown · Compare · Guide
  components/         shared Screen / Row / Divider
  state.tsx           one input, four screens
components/ui/        Arlo UI, copied in by the CLI — yours to edit
lib/arloui/           tokens, theme provider, glass, haptics
```

The engine is deliberately free of React: three screens ask it the same question, and a total
alone could never say which band did the damage, so it returns per-band detail.

## A note on accuracy

An estimate, not tax advice. It models PAYE on employment income for a resident individual and
leaves out capital gains, business income, and anything an employer treats unusually.

## Patched after install

`npx arloui add chart` copies five files that import `rgbaFromHex` from `@arloui/tokens` — a
package a consumer app does not have, and an import the CLI does not rewrite. The helper was
added to `lib/arloui/tokens.ts` and the imports repointed there. Without it the project does not
typecheck or bundle.
