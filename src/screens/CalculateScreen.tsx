/** Calculate: income entry and take-home result. */
import { useEffect, useRef, useState } from 'react';
import { Pressable, View, type TextInput } from 'react-native';
import { OutlinePencilSimple } from '@arloui/icons';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { Chart } from '../../components/ui/chart';
import { Chip } from '../../components/ui/chip';
import { Input, InputAction } from '../../components/ui/input';
import { List } from '../../components/ui/list';
import { Radio } from '../../components/ui/radio';
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

const FILING: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'joint', label: 'Married, joint' },
];

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
  const grossRef = useRef<TextInput>(null);
  // Arlo's chip outline matches the elevated card in dark mode; use the stronger border.
  const chipEdge = { borderColor: t.colors.borderPrimary };
  const rentRef = useRef<TextInput>(null);
  const perMonth = incomePeriod === 'month';
  const joint = country.code === 'US' && input.filingStatus === 'joint';

  /** The stored income is always a year; this is how it reads in the chosen period. */
  const grossFor = (period: IncomePeriod, gross = input.grossAnnual) =>
    groupDigits(String(period === 'month' ? Math.round(gross / 12) : gross));

  // Fields hold raw text so typing isn't reformatted; they reset on country change.
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
      <SectionLabel>Your pay</SectionLabel>
      <Card padding="md" surface="elevated">
        <View style={{ gap: t.spacing[4] }}>
          {/* Only changes the entry period; the stored annual figure is untouched. */}
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

          <Input
            ref={grossRef}
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
            trailingAction={<EditAction label={`Edit ${salaryLabel.toLowerCase()}`} onPress={() => grossRef.current?.focus()} />}
            // Plain fields draw the value in secondary ink; use primary for the amount.
            inputStyle={{ color: t.colors.textPrimary }}
            fullWidth
          />
          {/* Plain fields centre their helper text, so the note is rendered separately. */}
          <FieldNote>
            {perMonth ? `Before tax. Taxed as ${money(input.grossAnnual)} a year.` : 'Before tax and deductions.'}
          </FieldNote>

          {country.code === 'NG' ? (
            <>
              <Hairline />
              <Input
                ref={rentRef}
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
                trailingAction={<EditAction label="Edit annual rent" onPress={() => rentRef.current?.focus()} />}
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
                <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: t.spacing[6] }}>
                  {FILING.map((option) => (
                    <RadioOption
                      key={option.value}
                      label={option.label}
                      selected={input.filingStatus === option.value}
                      onSelect={() => update({ filingStatus: option.value })}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : null}
        </View>
      </Card>

      <Card padding="lg" surface="elevated">
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
          {/* Meter max is the country's top marginal rate. */}
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

      {/* Overline uppercases text ("401(K)"), so the scheme is named in the body copy. */}
      <SectionLabel>{country.code === 'NG' ? 'Contributions' : country.code === 'US' ? 'Retirement' : 'Pension'}</SectionLabel>
      <Card padding="md" surface="elevated">
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
                  style={input[key] > 0 ? undefined : chipEdge}
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
                  style={Math.abs(input.pensionRate - rate) < 1e-9 ? undefined : chipEdge}
                  onPress={() => update({ pensionRate: rate })}
                >
                  {rate === 0 ? 'None' : percent(rate, 0)}
                </Chip>
              ))}
        </View>
      </Card>

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
        <Card padding="md" surface="elevated">
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

/** Divider between plain fields. */
function Hairline() {
  const t = useTokens();
  return <View style={{ height: 1, backgroundColor: t.colors.borderPrimary }} />;
}

/** Pencil button on an amount field; focuses it so it's clear the figure is editable. */
function EditAction({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTokens();
  return (
    <InputAction accessibilityLabel={label} onPress={onPress}>
      <OutlinePencilSimple color={t.colors.interactivePrimary} width={20} height={20} />
    </InputAction>
  );
}

/** A radio with its label; the whole row is the tap target. */
function RadioOption({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  const t = useTokens();
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2], minHeight: t.sizing.touchTarget.minimum }}
    >
      <Radio selected={selected} onSelect={onSelect} accessibilityElementsHidden importantForAccessibility="no" />
      <Text tone="primary">{label}</Text>
    </Pressable>
  );
}
