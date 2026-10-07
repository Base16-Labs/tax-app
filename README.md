# Take Home

Your pay after tax in the **United Kingdom**, the **United States** or **Nigeria**, built entirely
with [Arlo UI](https://arloui.com) as a real app rather than a storybook.

The first screen asks where you are paid. That one choice sets the tax rules and the currency
together (pounds, dollars or naira), and the app opens on a typical salary for that country. You
can switch country at any time; each country keeps its own figures.

## What it demos

| Arlo UI component | Where it's used |
| --- | --- |
| `List`, `Card`, `Radio`, `Button` | Onboarding: pick a country |
| `Sheet` | Calculate: switch country from the title |
| `Input` (plain, no background) | Calculate: your pay, framed by its card |
| `Tabs` (segmented, glass) | Per year or per month, US filing status, theme in Settings |
| `Chip` | Pension, 401(k) and Nigerian contributions |
| `Chart.Meter` | Calculate: tax as a share of pay |
| `Card` (pressable), `Chart.Donut`, `Chart.Sparkline` | Explore: two cards that preview and open their pages |
| `Chart.Donut`, `Chart.Bar` | Breakdown: where pay goes, tax by band |
| `Chart` (line plot, linked scrub) | Explore more: take-home and tax across salaries |
| `TabBar` (floating, glass, `jelly`) | App shell, reacting to scroll |

Every component was installed with the real CLI against the public registry:

```bash
npx arloui init
npx arloui add chart tab-bar tabs list card input chip radio button sheet
```

## The tax rules

| | United Kingdom | United States | Nigeria |
| --- | --- | --- | --- |
| Year | 2026/27 | 2026 | 2026 (Nigeria Tax Act 2025) |
| Income tax | 20 / 40 / 45% after a £12,570 allowance, tapered above £100,000 | Federal brackets 10% to 37% after the standard deduction | 0% on the first ₦800,000, then 15% to 25% |
| Payroll tax | National Insurance: 8%, then 2% above £50,270 | Social Security 6.2% up to $184,500; Medicare 1.45% plus 0.9% on high wages | None |
| Pension | Workplace pension, before income tax | Traditional 401(k), before income tax | Pension, NHF and NHIS, plus rent relief |
| Not covered | Scottish rates | State and local taxes | Business and capital income |

Sources: gov.uk rates for 2026/27, IRS Rev. Proc. 2025-32, the SSA's 2026 wage base, and the
Nigeria Tax Act 2025. The Explore tab prices a raise at your own salary, and for Nigeria it also
compares the same pay under the Personal Income Tax Act the 2026 reform replaced.

## Running it

```bash
npm install
npx expo start
```

Then open it in **Expo Go** (SDK 57). The glass tab bar and segmented controls take their supported
translucent fallback there.

`npm run ios` does a native dev build, which is what gets you the real Liquid Glass material on
iOS 26. It needs Xcode 26.1 or later: `expo-modules-jsi@57.1.0` uses `weak let` (SE-0481), which
Xcode 26.0.1's Swift 6.2 does not accept.

```bash
npm test        # the three tax engines
npm run typecheck
```

## Layout

```
src/
  tax/
    types.ts          the input and payslip every country shares
    progressive.ts    band filling and the measured marginal rate
    gb.ts  us.ts  ng.ts   one engine per country, no React, no formatting
    countries.ts      currency, defaults and rules text for each country
    format.ts         money in the chosen currency, input parsing
    __tests__/        hand-worked figures for each country
  screens/            Onboarding · Calculate · Explore (Breakdown, Explore more, rules) · Settings
  components/         Screen, Text, the country list and sheet
  state.tsx           one country, its inputs, every screen; saved between launches
components/ui/        Arlo UI, copied in by the CLI, yours to edit
lib/arloui/           tokens, theme provider, glass, haptics
```

Each engine turns the same input into the same payslip, so the screens never need to know which
tax system produced a number.

## A note on accuracy

An estimate, not tax advice. It models tax on employment income for a resident with a single job,
using the published rates for the year shown.
