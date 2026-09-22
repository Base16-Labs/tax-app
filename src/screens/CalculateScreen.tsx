/**
 * What you earn, what you keep.
 *
 * The hero figure is monthly take-home, because that is the number people
 * actually recognise. The annual figures sit under it rather than above.
 */
import { useState } from 'react';
import { Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Chip } from '../../components/ui/chip';
import { Chart } from '../../components/ui/chart';
import { Screen, Row, Divider, SectionLabel } from '../components/Screen';
import { useTax } from '../state';
import { groupDigits, naira, parseAmount, percent } from '../tax/format';
import { PENSION_RATE, NHF_RATE, NHIS_RATE } from '../tax/bands';

export function CalculateScreen({
  onScroll,
}: {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  const t = useTokens();
  const { input, update, current, comparison } = useTax();

  // The inputs are held as text so typing "1,2" doesn't get reformatted
  // mid-keystroke into something the user didn't type.
  const [grossText, setGrossText] = useState(() => groupDigits(String(input.grossAnnual)));
  const [rentText, setRentText] = useState(() => groupDigits(String(input.annualRent)));

  const exempt = current.grossAnnual > 0 && current.annualTax === 0;

  return (
    <Screen
      title="What you keep"
      subtitle="Nigeria Tax Act 2025 — the rules in force since January 2026."
      onScroll={onScroll}
    >
      {/* ---------------------------------------------------------- hero --- */}
      <Card padding="lg" surface="elevated" elevation="sm">
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.overline,
            textTransform: 'uppercase',
          }}
        >
          Monthly take-home
        </Text>
        <Text
          style={{
            color: t.colors.textPrimary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.displayLargeEmphasized,
            fontVariant: ['tabular-nums'],
            marginTop: t.spacing[1],
          }}
        >
          {naira(current.monthlyTakeHome)}
        </Text>
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodyMedium,
            marginTop: t.spacing[1],
          }}
        >
          {naira(current.annualTakeHome)} a year, after {naira(current.annualTax)} tax
        </Text>

        <View style={{ marginTop: t.spacing[5] }}>
          {/* One value against a target: tax as a share of gross. The bands cap
              at 25%, so that is the meter's top — not 100%, which would make
              every real effective rate look like a sliver. */}
          <Chart.Meter
            value={current.effectiveRate}
            max={0.25}
            shape="bar"
            tone={exempt ? 'positive' : 'brand'}
            accessibilityLabel={`Effective tax rate ${percent(current.effectiveRate)}`}
          >
            {/* The readout is a part, not a prop — and it takes an already
                formatted string, so the meter never has to know about naira. */}
            <Chart.Meter.Value value={percent(current.effectiveRate)} />
          </Chart.Meter>
          <Text
            style={{
              color: t.colors.textTertiary,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.bodySmall,
              marginTop: t.spacing[2],
            }}
          >
            Effective rate against the 25% ceiling · {percent(current.marginalRate, 0)} on your next
            naira
          </Text>
        </View>
      </Card>

      {exempt ? (
        <Card padding="md" surface="default">
          <Text
            style={{
              color: t.colors.chartPositive,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.headingSmallEmphasized,
            }}
          >
            You owe no income tax
          </Text>
          <Text
            style={{
              color: t.colors.textSecondary,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.bodyMedium,
              marginTop: t.spacing[1],
            }}
          >
            After reliefs your chargeable income is {naira(current.chargeableIncome)}, which sits
            inside the zero-rated first ₦800,000.
          </Text>
        </Card>
      ) : null}

      {/* -------------------------------------------------------- inputs --- */}
      <SectionLabel>Your income</SectionLabel>
      <Card padding="md">
        <Input
          label="Gross annual income"
          value={grossText}
          onChangeText={(text) => {
            setGrossText(groupDigits(text));
            update({ grossAnnual: parseAmount(text) });
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="0"
          leadingIcon={<NairaMark />}
          helperText="Total pay before any deduction."
          fullWidth
        />
        <View style={{ height: t.spacing[4] }} />
        <Input
          label="Annual rent paid"
          value={rentText}
          onChangeText={(text) => {
            setRentText(groupDigits(text));
            update({ annualRent: parseAmount(text) });
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="0"
          leadingIcon={<NairaMark />}
          helperText="Tenants only — relief is 20% of rent, capped at ₦500,000."
          fullWidth
        />
      </Card>

      {/* --------------------------------------------------- contributions --- */}
      <SectionLabel>Contributions</SectionLabel>
      <Card padding="md">
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodyMedium,
            marginBottom: t.spacing[3],
          }}
        >
          Statutory contributions come off before tax is worked out. Tap to include.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing[2] }}>
          <Chip
            type="filter"
            selected={input.pensionRate > 0}
            onPress={() => update({ pensionRate: input.pensionRate > 0 ? 0 : PENSION_RATE })}
          >
            Pension 8%
          </Chip>
          <Chip
            type="filter"
            selected={input.nhfRate > 0}
            onPress={() => update({ nhfRate: input.nhfRate > 0 ? 0 : NHF_RATE })}
          >
            NHF 2.5%
          </Chip>
          <Chip
            type="filter"
            selected={input.nhisRate > 0}
            onPress={() => update({ nhisRate: input.nhisRate > 0 ? 0 : NHIS_RATE })}
          >
            NHIS 5%
          </Chip>
        </View>
      </Card>

      {/* ------------------------------------------------------ the maths --- */}
      <SectionLabel>How it was worked out</SectionLabel>
      <Card padding="md">
        <Row label="Gross annual income" value={naira(current.grossAnnual)} />
        <Divider />
        {current.deductions.map((d) => (
          <Row key={d.label} label={d.label} value={`− ${naira(d.amount)}`} tone="muted" />
        ))}
        <Divider />
        <Row label="Chargeable income" value={naira(current.chargeableIncome)} />
        <Row
          label="Tax due"
          value={naira(current.annualTax)}
          tone={current.annualTax > 0 ? 'negative' : 'positive'}
          hint={`${naira(current.monthlyTax)} a month`}
        />
        <Divider />
        <Row
          label="Take-home"
          value={naira(current.annualTakeHome)}
          tone="positive"
          hint={`${naira(current.monthlyTakeHome)} a month`}
        />
      </Card>

      {comparison.annualSaving !== 0 ? (
        <Card padding="md" surface="default">
          <Text
            style={{
              color: t.colors.textSecondary,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.bodyMedium,
            }}
          >
            {comparison.annualSaving > 0
              ? `The 2026 reform saves you ${naira(comparison.annualSaving)} a year against the old law.`
              : `The 2026 reform costs you ${naira(-comparison.annualSaving)} a year against the old law.`}{' '}
            See Compare for the full curve.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

/** The ₦ that sits inside the amount inputs. */
function NairaMark() {
  const t = useTokens();
  return (
    <Text
      style={{
        color: t.colors.textTertiary,
        fontFamily: t.fontFamilies.sans,
        ...t.typography.bodyLarge,
      }}
    >
      ₦
    </Text>
  );
}
