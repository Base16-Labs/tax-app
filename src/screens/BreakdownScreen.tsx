/**
 * Where the money actually goes, and which rate did the damage.
 *
 * Two charts answering two different questions. The donut is part-to-whole —
 * gross split into take-home, tax, and contributions. The bar chart is
 * categorical — how much tax each band charged, which is the thing a single
 * "you owe X" figure can never tell you.
 */
import { Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { Chart, type BarDatum, type DonutSlice } from '../../components/ui/chart';
import { Screen, Row, Divider, SectionLabel } from '../components/Screen';
import { useTax } from '../state';
import { naira, nairaShort, percent } from '../tax/format';

export function BreakdownScreen({
  onScroll,
}: {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  const t = useTokens();
  const { current } = useTax();

  // Contributions are what leaves the payslip — rent relief lowers the tax bill
  // but is not money deducted from pay, so it is not a slice of the gross.
  const contributions = current.deductions
    .filter((d) => d.label !== 'Rent relief')
    .reduce((sum, d) => sum + d.amount, 0);

  const slices: DonutSlice[] = [
    { label: 'Take-home', value: current.annualTakeHome, color: t.colors.chartPositive },
    { label: 'Income tax', value: current.annualTax, color: t.colors.chartNegative },
    { label: 'Contributions', value: contributions, color: t.colors.chartSeries3 },
  ].filter((s) => s.value > 0);

  // Only the bands that actually charged something. A row of zero-height bars
  // for the bands above your income is noise, not information.
  const chargingBands = current.bands.filter((b) => b.tax > 0);
  const bars: BarDatum[] = chargingBands.map((b) => ({
    label: b.label,
    value: b.tax,
  }));

  const zeroBand = current.bands[0];

  return (
    <Screen
      title="Breakdown"
      subtitle={`On ${naira(current.grossAnnual)} gross a year.`}
      onScroll={onScroll}
    >
      {/* --------------------------------------------------------- donut --- */}
      <SectionLabel>Where your gross goes</SectionLabel>
      <Card padding="lg">
        {slices.length > 0 ? (
          <View style={{ alignItems: 'center' }}>
            <Chart.Donut
              data={slices}
              size={200}
              format={(v) => nairaShort(v)}
              accessibilityLabel={`Gross income of ${naira(current.grossAnnual)} split into take-home, tax and contributions`}
            />
          </View>
        ) : (
          <Text
            style={{
              color: t.colors.textSecondary,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.bodyMedium,
              textAlign: 'center',
              paddingVertical: t.spacing[8],
            }}
          >
            Enter an income on Calculate to see the split.
          </Text>
        )}

        {slices.length > 0 ? (
          <View style={{ marginTop: t.spacing[5] }}>
            {slices.map((s) => (
              <Row
                key={s.label}
                label={s.label}
                value={naira(s.value)}
                hint={
                  current.grossAnnual > 0
                    ? `${percent(s.value / current.grossAnnual)} of gross`
                    : undefined
                }
                tone={s.label === 'Income tax' ? 'negative' : 'default'}
              />
            ))}
          </View>
        ) : null}
      </Card>

      {/* ----------------------------------------------------------- bars --- */}
      <SectionLabel>Tax charged, by band</SectionLabel>
      <Card padding="lg">
        {bars.length > 0 ? (
          <>
            <Chart.Bar
              data={bars}
              height={180}
              tone="series"
              format={(v) => nairaShort(v)}
              accessibilityLabel="Tax charged by each marginal rate band"
            />
            <Text
              style={{
                color: t.colors.textTertiary,
                fontFamily: t.fontFamilies.sans,
                ...t.typography.bodySmall,
                marginTop: t.spacing[3],
              }}
            >
              Each bar is one marginal rate. Your income fills the bands from the bottom up, so the
              top rate only ever applies to the slice above its floor.
            </Text>
          </>
        ) : (
          <Text
            style={{
              color: t.colors.textSecondary,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.bodyMedium,
              paddingVertical: t.spacing[6],
            }}
          >
            No band charged anything — your whole chargeable income sits in the zero-rated first
            ₦800,000.
          </Text>
        )}
      </Card>

      {/* ---------------------------------------------------- band detail --- */}
      <SectionLabel>Band by band</SectionLabel>
      <Card padding="md">
        {zeroBand ? (
          <>
            <Row
              label="0% — first ₦800,000"
              value={naira(0)}
              tone="positive"
              hint={`${naira(zeroBand.taxableInBand)} of your income sits here, tax-free`}
            />
            <Divider />
          </>
        ) : null}
        {current.bands.slice(1).map((band) => {
          const used = band.taxableInBand > 0;
          return (
            <Row
              key={band.label}
              label={`${band.label} band`}
              value={used ? naira(band.tax) : '—'}
              tone={used ? 'default' : 'muted'}
              hint={
                used
                  ? `on ${naira(band.taxableInBand)} of income`
                  : 'your income does not reach this band'
              }
            />
          );
        })}
        <Divider />
        <Row label="Total tax" value={naira(current.annualTax)} tone="negative" />
      </Card>
    </Screen>
  );
}
