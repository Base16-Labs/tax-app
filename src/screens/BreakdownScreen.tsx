/**
 * Where the money actually goes, and which rate did the damage.
 *
 * Two charts answering two different questions. The donut is part-to-whole:
 * gross split into take-home, income tax, payroll taxes and contributions. The
 * bar chart is categorical: how much income tax each band charged, which is the
 * thing a single "you owe X" figure can never tell you.
 */
import { View } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { Chart, type BarDatum } from '../../components/ui/chart';
import { List } from '../../components/ui/list';
import { InView, ListCard, Screen, SectionLabel } from '../components/Screen';
import { Text } from '../components/Text';
import { usePaySlices } from '../insights';
import { useTax } from '../state';
import { percent } from '../tax/format';

export function BreakdownScreen({ onBack }: { onBack: () => void }) {
  const t = useTokens();
  const { country, payslip, money, moneyShort } = useTax();
  const gross = payslip.grossAnnual;

  const slices = usePaySlices();

  // Only the bands that charged something: zero-height bars for the bands above
  // your income are noise, not information.
  const bars: BarDatum[] = payslip.bands
    .filter((band) => band.tax > 0)
    .map((band) => ({ label: band.label, value: band.tax }));

  return (
    <Screen
      title="Breakdown"
      subtitle={`On ${money(gross)} a year, in ${country.inProse}.`}
      back={{ label: 'Explore', onPress: onBack }}
    >
      {/* --------------------------------------------------------- donut --- */}
      <SectionLabel>Where your pay goes</SectionLabel>
      {slices.length > 0 ? (
        <Card padding="none">
          <View style={{ alignItems: 'center', paddingTop: t.spacing[6], paddingBottom: t.spacing[2] }}>
            <InView>
              <Chart.Donut
                data={slices}
                size={200}
                format={moneyShort}
                accessibilityLabel={`${money(gross)} split into take-home, tax and contributions`}
              >
                {/* The rows below are the legend, with exact figures, which a
                    legend under the ring would only repeat in short form. */}
                <Chart.Donut.Value />
              </Chart.Donut>
            </InView>
          </View>
          <List divider="balanced">
            {slices.map((s) => (
              <List.Row
                key={s.label}
                leading={<Swatch color={s.color} />}
                title={s.label}
                subtitle={`${percent(s.value / gross)} of gross`}
                value={money(s.value)}
                valueTone={s.tax ? 'negative' : 'default'}
              />
            ))}
          </List>
        </Card>
      ) : (
        <Card padding="lg">
          <Text style={{ textAlign: 'center' }}>Enter your pay on Calculate to see the split.</Text>
        </Card>
      )}

      {/* ----------------------------------------------------------- bars --- */}
      <SectionLabel>Income tax, by band</SectionLabel>
      <Card padding="lg">
        {bars.length > 0 ? (
          <View style={{ gap: t.spacing[3] }}>
            {/* Below the fold on first open, so held until scrolled to, or the
                bars finish growing before anyone sees them. */}
            <InView>
              <Chart.Bar
                data={bars}
                height={180}
                tone="series"
                format={moneyShort}
                accessibilityLabel="Income tax charged by each band"
              >
                {/* Naming any part replaces the default composition, so the rate
                    labels and the zero rule are named alongside the amounts. */}
                <Chart.Bar.Amounts />
                <Chart.Bar.Categories />
                <Chart.Bar.Baseline />
              </Chart.Bar>
            </InView>
            <Text variant="caption">
              Each bar is one rate. Your income fills the bands from the bottom up, so the top rate
              only ever applies to the slice above its floor.
            </Text>
          </View>
        ) : (
          <Text>No band charged anything: all of your taxable income sits in the tax-free part.</Text>
        )}
      </Card>

      {/* ---------------------------------------------------- band detail --- */}
      <SectionLabel>Band by band</SectionLabel>
      <ListCard>
        {payslip.bands.map((band) => (
          <List.Row
            key={band.from}
            title={`${band.label} band`}
            subtitle={
              band.taxableInBand > 0
                ? `on ${money(band.taxableInBand)} of taxable income`
                : 'your income does not reach it'
            }
            value={money(band.tax)}
          />
        ))}
        <List.Row title="Income tax" value={money(payslip.incomeTax)} valueTone="negative" />
        {payslip.levies.map((line) => (
          <List.Row key={line.label} title={line.label} value={money(line.amount)} valueTone="negative" />
        ))}
      </ListCard>
    </Screen>
  );
}

/** The slice's colour, so each row reads as the donut's legend. */
function Swatch({ color }: { color: string }) {
  const t = useTokens();
  return <View style={{ width: 10, height: 10, borderRadius: t.radii.full, backgroundColor: color }} />;
}
