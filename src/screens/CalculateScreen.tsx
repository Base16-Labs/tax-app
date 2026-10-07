/**
 * What you earn, what you keep.
 *
 * Your pay comes first, so the first thing on screen is where to type, and the
 * result sits right under it and updates as you type. The hero figure is monthly
 * take-home, because that is the number people actually recognise.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { Chart } from '../../components/ui/chart';
import { Chip } from '../../components/ui/chip';
import { Input } from '../../components/ui/input';
import { List } from '../../components/ui/list';
import { Tabs } from '../../components/ui/tabs';
import { useCountrySheet } from '../components/CountrySheet';
import { Flag } from '../components/Flag';
import { HostBlur } from '../components/HostBlur';
import { InView, ListCard, Screen, SectionLabel } from '../components/Screen';
import { Text } from '../components/Text';
import { useTax, type IncomePeriod } from '../state';
import { groupDigits, parseAmount, percent } from '../tax/format';
import { NHF_RATE, NHIS_RATE, PENSION_RATE } from '../tax/ng-rules';
import type { FilingStatus, TaxInput } from '../tax/types';

/** Nigeria's statutory contributions, each switched on or off on its own. */
const NG_CONTRIBUTIONS = [
  { key: 'pensionRate', label: 'Pension 8%', rate: PENSION_RATE },
  { key: 'nhfRate', label: 'NHF 2.5%', rate: NHF_RATE },
  { key: 'nhisRate', label: 'NHIS 5%', rate: NHIS_RATE },
] as const;

export function CalculateScreen() {
  const t = useTokens();
  const { country, input, update, payslip, marginal, reform, money, incomePeriod, setIncomePeriod } = useTax();
  const sheet = useCountrySheet();
  const perMonth = incomePeriod === 'month';
  const joint = country.code === 'US' && input.filingStatus === 'joint';

  /** The stored income is always a year; this is how it reads in the chosen period. */
  const grossFor = (period: IncomePeriod, gross = input.grossAnnual) =>
    groupDigits(String(period === 'month' ? Math.round(gross / 12) : gross));

  // The fields hold text so typing "1,2" is not reformatted mid-keystroke. They
  // reload when the country changes, since each country keeps its own figures.
  const [grossText, setGrossText] = useState(() => grossFor(incomePeriod));
  const [rentText, setRentText] = useState(() => groupDigits(String(input.annualRent)));
  useEffect(() => {
    setGrossText(grossFor(incomePeriod));
    setRentText(groupDigits(String(input.annualRent)));
    // Only on a country switch: while typing, the text is the source of truth.
  }, [country.code]);

  const salaryLabel = `${joint ? 'Household' : 'Gross'} ${perMonth ? 'monthly' : 'annual'} pay`;
  const step = money(country.raiseStep);

  return (
    <Screen
      title="What you keep"
      subtitle={country.taxYear}
      accessory={
        <Chip
          type="assist"
          leadingIcon={<Flag code={country.code} width={21} />}
          onPress={sheet.open}
          accessibilityLabel={`${country.name}, ${country.currency.code}. Change country`}
        >
          {country.currency.code}
        </Chip>
      }
    >
      {/* ------------------------------------------------------- your pay --- */}
      <SectionLabel>Your pay</SectionLabel>
      <Card padding="md">
        <View style={{ gap: t.spacing[4] }}>
          {/* Only changes how the pay is typed. The stored yearly figure is left
              alone, so flipping back and forth cannot drift it through rounding. */}
          <Tabs
            appearance="segmented"
            surface="glass"
            blurComponent={<HostBlur />}
            value={incomePeriod}
            onValueChange={(next) => {
              const period = next as IncomePeriod;
              setIncomePeriod(period);
              setGrossText(grossFor(period));
            }}
            accessibilityLabel="Enter pay per year or per month"
          >
            <Tabs.Item value="year" label="Per year" />
            <Tabs.Item value="month" label="Per month" />
          </Tabs>

          {/* Arlo's plain (no-background) field: the card already frames it, so
              a filled box inside it would be a frame inside a frame. */}
          <Input
            appearance="plain"
            label={salaryLabel}
            value={grossText}
            onChangeText={(text) => {
              setGrossText(groupDigits(text));
              update({ grossAnnual: parseAmount(text) * (perMonth ? 12 : 1) });
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="0"
            leadingIcon={<CurrencyMark symbol={country.currency.symbol} large />}
            // Arlo draws a plain field's value in secondary ink; a typed amount is
            // the most important thing on the screen, so it gets primary ink and
            // reads as a value, not a placeholder.
            inputStyle={{ color: t.colors.textPrimary }}
            fullWidth
          />
          {/* Arlo centres a plain field's helper, which suits a centred amount
              entry. These fields are left-aligned under their labels, so the
              note is a caption of its own, aligned with them. */}
          <FieldNote>
            {perMonth ? `Before tax. Taxed as ${money(input.grossAnnual)} a year.` : 'Before tax and deductions.'}
          </FieldNote>

          {country.code === 'NG' ? (
            <>
              <Hairline />
              <Input
                appearance="plain"
                size="sm"
                label="Annual rent paid"
                value={rentText}
                onChangeText={(text) => {
                  setRentText(groupDigits(text));
                  update({ annualRent: parseAmount(text) });
                }}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="0"
                leadingIcon={<CurrencyMark symbol={country.currency.symbol} />}
                inputStyle={{ color: t.colors.textPrimary }}
                fullWidth
              />
              <FieldNote>Tenants only. Relief is 20% of rent, up to ₦500,000.</FieldNote>
            </>
          ) : null}

          {country.code === 'US' ? (
            <>
              <Hairline />
              <View style={{ gap: t.spacing[2] }}>
                <Text variant="caption">Filing status</Text>
                <Tabs
                  appearance="segmented"
                  surface="glass"
                  blurComponent={<HostBlur />}
                  value={input.filingStatus}
                  onValueChange={(next) => update({ filingStatus: next as FilingStatus })}
                  accessibilityLabel="Filing status"
                >
                  <Tabs.Item value="single" label="Single" />
                  <Tabs.Item value="joint" label="Married, joint" />
                </Tabs>
              </View>
            </>
          ) : null}
        </View>
      </Card>

      {/* ---------------------------------------------------------- result --- */}
      <Card padding="lg" surface="elevated" elevation="sm">
        <Text variant="overline" tone="secondary">
          Monthly take-home
        </Text>
        <Text variant="display" style={{ marginTop: t.spacing[1] }}>
          {money(payslip.takeHome / 12)}
        </Text>
        <Text style={{ marginTop: t.spacing[1] }}>
          {money(payslip.takeHome)} a year, after {money(payslip.totalTax)} tax
        </Text>

        <View style={{ marginTop: t.spacing[5], gap: t.spacing[2] }}>
          {/* Total tax as a share of pay, against the highest rate anyone here
              pays on their last unit of pay, so a real rate never looks like a sliver. */}
          <InView>
            <Chart.Meter
              value={payslip.effectiveRate}
              max={country.topRate}
              shape="bar"
              tone={payslip.totalTax === 0 ? 'positive' : 'brand'}
              accessibilityLabel={`${percent(payslip.effectiveRate)} of your pay goes in tax`}
            >
              <Chart.Meter.Value value={percent(payslip.effectiveRate)} />
            </Chart.Meter>
          </InView>
          <Text variant="caption">
            {payslip.totalTax === 0 && payslip.grossAnnual > 0
              ? 'You owe no tax at this income.'
              : `Of your pay in tax · ${percent(marginal, 0)} of your next ${step}`}
          </Text>
        </View>
      </Card>

      {/* ------------------------------------------------------- pension --- */}
      {/* Section labels are set in capitals, which would turn "401(k)" into
          "401(K)", so the scheme is named in the sentence instead. */}
      <SectionLabel>{country.code === 'NG' ? 'Contributions' : country.code === 'US' ? 'Retirement' : 'Pension'}</SectionLabel>
      <Card padding="md">
        <Text style={{ marginBottom: t.spacing[3] }}>
          {country.code === 'NG'
            ? 'Statutory contributions come off before tax is worked out. Tap to include.'
            : `Your ${country.pension.label.toLowerCase()} is paid in before income tax, so it lowers your tax bill. The money is still yours.`}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing[2] }}>
          {country.code === 'NG'
            ? NG_CONTRIBUTIONS.map(({ key, label, rate }) => (
                <Chip
                  key={key}
                  type="filter"
                  selected={input[key] > 0}
                  onPress={() => update({ [key]: input[key] > 0 ? 0 : rate } as Partial<TaxInput>)}
                >
                  {label}
                </Chip>
              ))
            : country.pension.options.map((rate) => (
                <Chip
                  key={rate}
                  type="filter"
                  selected={Math.abs(input.pensionRate - rate) < 1e-9}
                  onPress={() => update({ pensionRate: rate })}
                >
                  {rate === 0 ? 'None' : percent(rate, 0)}
                </Chip>
              ))}
        </View>
      </Card>

      {/* ------------------------------------------------------ the maths --- */}
      <SectionLabel>How it was worked out</SectionLabel>
      <ListCard>
        <List.Row title="Gross annual pay" value={money(payslip.grossAnnual)} />
        {payslip.contributions.map((line) => (
          <List.Row key={line.label} title={line.label} value={`− ${money(line.amount)}`} />
        ))}
        {payslip.reliefs.map((line) => (
          <List.Row key={line.label} title={line.label} subtitle="Tax-free" value={`− ${money(line.amount)}`} />
        ))}
        <List.Row title="Taxable income" value={money(payslip.taxableIncome)} />
        <List.Row
          title="Income tax"
          value={money(payslip.incomeTax)}
          valueCaption={`${money(payslip.incomeTax / 12)} a month`}
          valueTone={payslip.incomeTax > 0 ? 'negative' : 'positive'}
        />
        {payslip.levies.map((line) => (
          <List.Row
            key={line.label}
            title={line.label}
            value={money(line.amount)}
            valueCaption={`${money(line.amount / 12)} a month`}
            valueTone="negative"
          />
        ))}
        <List.Row
          title="Take-home"
          value={money(payslip.takeHome)}
          valueCaption={`${money(payslip.takeHome / 12)} a month`}
          valueTone="positive"
        />
      </ListCard>

      {reform && reform.annualSaving !== 0 ? (
        <Card padding="md">
          <Text>
            {reform.annualSaving > 0
              ? `The 2026 reform saves you ${money(reform.annualSaving)} a year against the old law.`
              : `The 2026 reform costs you ${money(-reform.annualSaving)} a year against the old law.`}{' '}
            See Explore for more.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

/** The currency symbol that sits inside the amount fields, sized to the amount. */
function CurrencyMark({ symbol, large = false }: { symbol: string; large?: boolean }) {
  const t = useTokens();
  return (
    <Text tone="tertiary" style={large ? t.typography.headingLarge : t.typography.headingSmall}>
      {symbol}
    </Text>
  );
}

/** The note under a plain field, left-aligned with its label. */
function FieldNote({ children }: { children: string }) {
  const t = useTokens();
  return (
    <Text variant="caption" style={{ marginTop: -t.spacing[3] }}>
      {children}
    </Text>
  );
}

/** A rule between two plain fields, so each reads as its own row. */
function Hairline() {
  const t = useTokens();
  return <View style={{ height: 1, backgroundColor: t.colors.border }} />;
}
