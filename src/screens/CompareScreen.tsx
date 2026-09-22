/**
 * What the 2026 reform actually changed.
 *
 * The headline is your own saving, but the interesting thing is the shape: the
 * new law is cheaper for most earners and dearer at the top, and the crossover
 * is a real number you can scrub to. One `Chart` per regime, sharing a scrub
 * position through `activeAt` so both readouts describe the same income.
 */
import { useCallback, useMemo, useState } from 'react';
import { Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { Chart, type ChartPoint } from '../../components/ui/chart';
import { Screen, Row, Divider, SectionLabel } from '../components/Screen';
import { useTax } from '../state';
import { calculateNTA2025, calculatePITA, sweep } from '../tax/calculate';
import { naira, nairaShort, percent } from '../tax/format';

/** Top of the swept range. Past this the curves are parallel and say nothing new. */
const SWEEP_TO = 40_000_000;
const SWEEP_STEPS = 60;

export function CompareScreen({
  onScroll,
}: {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  const t = useTokens();
  const { input, comparison } = useTax();
  const { current, previous, annualSaving, monthlySaving } = comparison;

  // Scrub position as an income, not an index — both charts resolve it against
  // their own `at` values, so the two readouts can never describe different
  // incomes even though they are separate chart instances.
  const [scrubAt, setScrubAt] = useState<ChartPoint['at']>(undefined);

  /**
   * Keeps the last scrubbed income instead of clearing on finger-up.
   *
   * The chart reports `null` on release, and honouring that would snap both
   * readouts back to the end of the range the instant you lift — on touch the
   * comparison below would flash up and vanish before it could be read. Holding
   * the position is also what keeps the two charts agreeing about *when*.
   */
  const handleScrub = useCallback((_: number | null, point: ChartPoint | null) => {
    if (point) setScrubAt(point.at);
  }, []);

  const points = useMemo(
    () => sweep(input, { from: 0, to: SWEEP_TO, steps: SWEEP_STEPS }),
    [input],
  );

  const ntaSeries: ChartPoint[] = points.map((p) => ({ value: p.current, at: p.gross }));
  const pitaSeries: ChartPoint[] = points.map((p) => ({ value: p.previous, at: p.gross }));

  /**
   * Where the two curves swap places, found by bisection rather than read off
   * the sweep — the sweep is 60 points across 40m, which would put the answer
   * out by up to ₦666k.
   */
  const crossover = useMemo(() => {
    const at = (gross: number) => {
      const probe = { ...input, grossAnnual: gross };
      return calculatePITA(probe).annualTax - calculateNTA2025(probe).annualTax;
    };
    let lo = 1_000_000;
    let hi = 200_000_000;
    if (at(lo) <= 0 || at(hi) >= 0) return null; // no crossing in range
    for (let i = 0; i < 60; i += 1) {
      const mid = (lo + hi) / 2;
      if (at(mid) > 0) lo = mid;
      else hi = mid;
    }
    return lo;
  }, [input]);

  const betterOff = annualSaving > 0;
  const scrubbedGross = typeof scrubAt === 'number' ? scrubAt : null;
  const scrubbed = scrubbedGross == null ? null : {
    gross: scrubbedGross,
    nta: calculateNTA2025({ ...input, grossAnnual: scrubbedGross }).annualTax,
    pita: calculatePITA({ ...input, grossAnnual: scrubbedGross }).annualTax,
  };

  return (
    <Screen
      title="Old law vs new"
      subtitle="The Nigeria Tax Act 2025 against the Personal Income Tax Act it replaced."
      onScroll={onScroll}
    >
      {/* ------------------------------------------------------ headline --- */}
      <Card padding="lg" surface="elevated" elevation="sm">
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.overline,
            textTransform: 'uppercase',
          }}
        >
          {betterOff ? 'You save' : annualSaving < 0 ? 'You pay more' : 'No change'}
        </Text>
        <Text
          style={{
            color: betterOff
              ? t.colors.chartPositive
              : annualSaving < 0
                ? t.colors.chartNegative
                : t.colors.textPrimary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.displayLargeEmphasized,
            fontVariant: ['tabular-nums'],
            marginTop: t.spacing[1],
          }}
        >
          {/* The sign is carried by the label above and this explicit +/−, never
              by colour alone — the two chart tones sit near the deuteranopia floor. */}
          {annualSaving === 0
            ? naira(0)
            : `${betterOff ? '+' : '−'}${naira(Math.abs(annualSaving))}`}
        </Text>
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodyMedium,
            marginTop: t.spacing[1],
          }}
        >
          a year · {naira(Math.abs(monthlySaving))} a month on {naira(current.grossAnnual)} gross
        </Text>
      </Card>

      {/* --------------------------------------------------------- plots --- */}
      <SectionLabel>Tax owed across the income range</SectionLabel>
      <Card padding="lg">
        <Text
          style={{
            color: t.colors.textPrimary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.headingSmallEmphasized,
          }}
        >
          Nigeria Tax Act 2025
        </Text>
        <Chart
          data={ntaSeries}
          tone="negative"
          format={(v) => nairaShort(v)}
          formatAt={(at) => (typeof at === 'number' ? `${nairaShort(at)} gross` : '')}
          activeAt={scrubAt}
          onScrub={handleScrub}
        >
          <Chart.Value />
          <Chart.Plot height={150} />
        </Chart>

        <View style={{ height: t.spacing[6] }} />

        <Text
          style={{
            color: t.colors.textPrimary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.headingSmallEmphasized,
          }}
        >
          Personal Income Tax Act (old)
        </Text>
        <Chart
          data={pitaSeries}
          tone="neutral"
          format={(v) => nairaShort(v)}
          formatAt={(at) => (typeof at === 'number' ? `${nairaShort(at)} gross` : '')}
          activeAt={scrubAt}
          onScrub={handleScrub}
        >
          <Chart.Value />
          <Chart.Plot height={150} />
        </Chart>

        <Text
          style={{
            color: t.colors.textTertiary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodySmall,
            marginTop: t.spacing[3],
          }}
        >
          Drag across either chart — both readouts follow the same income. Swept from ₦0 to{' '}
          {nairaShort(SWEEP_TO)} with your own rent and contributions held fixed.
        </Text>
      </Card>

      {scrubbed ? (
        <Card padding="md" surface="default">
          <Row label="At this income" value={naira(scrubbed.gross)} />
          <Divider />
          <Row label="New law (NTA 2025)" value={naira(scrubbed.nta)} />
          <Row label="Old law (PITA)" value={naira(scrubbed.pita)} tone="muted" />
          <Divider />
          <Row
            label={scrubbed.pita >= scrubbed.nta ? 'Saving' : 'Extra'}
            value={naira(Math.abs(scrubbed.pita - scrubbed.nta))}
            tone={scrubbed.pita >= scrubbed.nta ? 'positive' : 'negative'}
          />
        </Card>
      ) : null}

      {/* ----------------------------------------------------- crossover --- */}
      {crossover ? (
        <Card padding="md">
          <Text
            style={{
              color: t.colors.textPrimary,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.headingSmallEmphasized,
            }}
          >
            The reform is not a cut for everyone
          </Text>
          <Text
            style={{
              color: t.colors.textSecondary,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.bodyMedium,
              marginTop: t.spacing[2],
            }}
          >
            Below about {nairaShort(crossover)} a year you pay less than you would have. Above it
            you pay more — the top rate rose from 24% to 25%, and the consolidated relief allowance
            that softened the old bands is gone.
          </Text>
        </Card>
      ) : null}

      {/* ----------------------------------------------------- side by side --- */}
      <SectionLabel>Your figures, both ways</SectionLabel>
      <Card padding="md">
        <Row label="Chargeable income — new" value={naira(current.chargeableIncome)} />
        <Row label="Chargeable income — old" value={naira(previous.chargeableIncome)} tone="muted" />
        <Divider />
        <Row label="Tax — new" value={naira(current.annualTax)} />
        <Row label="Tax — old" value={naira(previous.annualTax)} tone="muted" />
        <Divider />
        <Row label="Effective rate — new" value={percent(current.effectiveRate)} />
        <Row label="Effective rate — old" value={percent(previous.effectiveRate)} tone="muted" />
        {previous.minimumTaxApplied ? (
          <>
            <Divider />
            <Row
              label="Old law floor"
              value="1% of gross"
              tone="muted"
              hint="PITA charged a minimum tax when the bands came out lower."
            />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}
