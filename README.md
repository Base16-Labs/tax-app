# Take Home

Take Home shows your pay after tax in the United Kingdom, the United States and Nigeria. It is built with [Arlo UI](https://arloui.com) by [Base16 Labs](https://base16.studio).

Pick your country on first launch and the app switches to that country's tax rules and currency. You can change country at any time, and each country keeps its own figures.

## Features

- Take-home pay per month and per year, updated as you type
- Pension, 401(k) and Nigerian statutory contributions
- Breakdown of where your pay goes, band by band
- How much of a raise you keep, and tax across a range of salaries
- Light, dark and system appearance

## Tax rules

| | United Kingdom | United States | Nigeria |
| --- | --- | --- | --- |
| Tax year | 2026/27 | 2026 | 2026 (Nigeria Tax Act 2025) |
| Income tax | 20%, 40%, 45% after a £12,570 allowance | Federal brackets, 10% to 37% | 0% on the first ₦800,000, then 15% to 25% |
| Payroll tax | National Insurance | Social Security and Medicare | None |
| Not included | Scottish rates | State and local taxes | Business and capital income |

Sources: gov.uk (2026/27 rates), IRS Rev. Proc. 2025-32, the SSA 2026 wage base and the Nigeria Tax Act 2025.

Take Home gives estimates, not tax advice.

## Getting started

```bash
npm install
npx expo start
```

Open the project in Expo Go (SDK 57), or run a development build with `npm run ios`.

```bash
npm test
npm run typecheck
```

## Project structure

```
src/
  tax/          tax engines for each country, with tests
  screens/      onboarding, Calculate, Explore and Settings
  components/   shared app components
  state.tsx     selected country and inputs, saved between launches
components/ui/  Arlo UI components
lib/arloui/     Arlo UI theme and tokens
```

## License

MIT
