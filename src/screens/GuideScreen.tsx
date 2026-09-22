/**
 * The rules, in the order the calculator applies them, plus where they come from.
 *
 * A tax calculator that will not show its working is just a number generator.
 */
import { Linking, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useTokens, useTheme } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { Chip } from '../../components/ui/chip';
import { Screen, Row, Divider, SectionLabel } from '../components/Screen';
import { NTA_2025_BANDS, PITA_BANDS } from '../tax/bands';
import { naira, nairaShort } from '../tax/format';

export function GuideScreen({
  onScroll,
}: {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  const t = useTokens();
  const { name, setName } = useTheme();

  return (
    <Screen
      title="The rules"
      subtitle="What this calculator does, step by step."
      onScroll={onScroll}
    >
      <SectionLabel>Nigeria Tax Act 2025 — bands</SectionLabel>
      <Card padding="md">
        <BandTable bands={NTA_2025_BANDS} />
        <Divider />
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodyMedium,
            paddingTop: t.spacing[3],
          }}
        >
          The first ₦800,000 of chargeable income is taxed at 0%. That is how the Act exempts
          minimum-wage earners — a zero-rated band, not a cliff, so crossing ₦800,001 costs you 15
          kobo, not 15% of everything.
        </Text>
      </Card>

      <SectionLabel>Reliefs and deductions</SectionLabel>
      <Card padding="md">
        <Row
          label="Rent relief"
          value="20%, max ₦500,000"
          hint="Tenants only. Homeowners get no housing relief under the new law."
        />
        <Divider />
        <Row label="Pension" value="8% of gross" hint="Employee share, Pension Reform Act 2014." />
        <Row label="NHF" value="2.5% of gross" hint="National Housing Fund." />
        <Row label="NHIS" value="5% of gross" hint="Health insurance, where you contribute." />
        <Row label="Life assurance" value="Premium paid" hint="Annual premium is deductible." />
        <Divider />
        <Row
          label="Consolidated relief"
          value="Abolished"
          tone="muted"
          hint="The old CRA was replaced by the zero-rated band and rent relief."
        />
      </Card>

      <SectionLabel>The old law, for comparison</SectionLabel>
      <Card padding="md">
        <BandTable bands={PITA_BANDS} />
        <Divider />
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodyMedium,
            paddingTop: t.spacing[3],
          }}
        >
          Under PITA the Consolidated Relief Allowance was the higher of ₦200,000 or 1% of gross
          income, plus 20% of gross income. A 1% minimum tax applied when the bands charged less.
        </Text>
      </Card>

      <SectionLabel>Order of operations</SectionLabel>
      <Card padding="md">
        {[
          'Start from gross annual income.',
          'Subtract pension, NHF, NHIS and life assurance.',
          'Subtract rent relief — 20% of rent paid, capped at ₦500,000.',
          'What remains is chargeable income.',
          'Fill the bands from the bottom: 0%, then 15%, 18%, 21%, 23%, 25%.',
        ].map((step, i) => (
          <View
            key={step}
            style={{ flexDirection: 'row', gap: t.spacing[3], paddingVertical: t.spacing[2] }}
          >
            <Text
              style={{
                color: t.colors.textTertiary,
                fontFamily: t.fontFamilies.sans,
                ...t.typography.bodyMedium,
                fontVariant: ['tabular-nums'],
                width: 18,
              }}
            >
              {i + 1}
            </Text>
            <Text
              style={{
                flex: 1,
                color: t.colors.textSecondary,
                fontFamily: t.fontFamilies.sans,
                ...t.typography.bodyMedium,
              }}
            >
              {step}
            </Text>
          </View>
        ))}
      </Card>

      <SectionLabel>Appearance</SectionLabel>
      <Card padding="md">
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodyMedium,
            marginBottom: t.spacing[3],
          }}
        >
          Every colour in this app comes from Arlo UI tokens, so the charts and the tab bar re-theme
          together.
        </Text>
        <View style={{ flexDirection: 'row', gap: t.spacing[2] }}>
          <Chip type="filter" selected={name === 'dark'} onPress={() => setName('dark')}>
            Dark
          </Chip>
          <Chip type="filter" selected={name === 'light'} onPress={() => setName('light')}>
            Light
          </Chip>
          <Chip type="filter" onPress={() => setName('system')}>
            System
          </Chip>
        </View>
      </Card>

      <SectionLabel>About</SectionLabel>
      <Card padding="md">
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodyMedium,
          }}
        >
          An estimate, not tax advice. It models PAYE on employment income for a resident
          individual and leaves out capital gains, business income, and anything your employer
          treats unusually. Check with a tax professional before acting on it.
        </Text>
        <View style={{ height: t.spacing[3] }} />
        <Text
          style={{
            color: t.colors.textTertiary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodySmall,
          }}
        >
          Built with Arlo UI — the Chart and Tab Bar components are installed straight from the
          public registry.
        </Text>
        <View style={{ height: t.spacing[2] }} />
        <Text
          onPress={() => Linking.openURL('https://arloui.com')}
          style={{
            color: t.colors.interactivePrimary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodyMedium,
            fontWeight: t.fontWeights.semibold,
          }}
        >
          arloui.com
        </Text>
      </Card>
    </Screen>
  );
}

/** Renders a band table as `rate — range` rows, with the running ceilings. */
function BandTable({ bands }: { bands: readonly { width: number; rate: number }[] }) {
  let floor = 0;
  return (
    <>
      {bands.map((band) => {
        const from = floor;
        floor += band.width;
        const to = floor;
        const range =
          to === Infinity
            ? `above ${nairaShort(from)}`
            : from === 0
              ? `first ${nairaShort(to)}`
              : `${nairaShort(from)} – ${nairaShort(to)}`;
        return (
          <Row
            key={`${band.rate}-${from}`}
            label={`${Math.round(band.rate * 100)}%`}
            value={range}
            tone={band.rate === 0 ? 'positive' : 'default'}
          />
        );
      })}
    </>
  );
}
