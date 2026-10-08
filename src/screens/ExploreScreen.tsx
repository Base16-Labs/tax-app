/** Explore: the value of a raise, and take-home and tax across a salary range. */
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { Chart, type ChartPoint } from '../../components/ui/chart';
import { List } from '../../components/ui/list';
import { InView, ListCard, Screen, SectionLabel } from '../components/Screen';
import { Text } from '../components/Text';
import { useSalarySweep } from '../insights';
import { useTax } from '../state';
import { percent } from '../tax/format';
import { calculateNTA2025, calculatePITA } from '../tax/ng';
import { marginalRate } from '../tax/progressive';
import type { TaxInput } from '../tax/types';

/**
 * Income where Nigeria's old and new laws cross, found by bisection because the
 * sweep is too coarse. `null` if they don't cross in a plausible range.
 */
function findCrossover(input: TaxInput): number | null {
  const gap = (gross: number) => {
    const probe = { ...input, grossAnnual: gross };
    return calculatePITA(probe).annualTax - calculateNTA2025(probe).annualTax;
  };
  let lo = 1_000_000;
  let hi = 200_000_000;
  if (gap(lo) <= 0 || gap(hi) >= 0) return null;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (gap(mid) > 0) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function ExploreScreen({ onBack }: { onBack: () => void }) {
  const t = useTokens();
  const { country, input, marginal, reform, money, moneyShort } = useTax();
  const step = country.raiseStep;
  const keep = step * (1 - marginal);

  // The scrub position is a salary, not an index, so both charts stay in sync.
  const [scrubAt, setScrubAt] = useState<ChartPoint['at']>(undefined);
  // Keep the last scrubbed salary after the finger lifts.
  const handleScrub = useCallback((_: number | null, point: ChartPoint | null) => {
    if (point) setScrubAt(point.at);
  }, []);

  const { takeHome, tax } = useSalarySweep();

  // The figures under the charts: the scrubbed salary, or your own until you scrub.
  const at = typeof scrubAt === 'number' ? scrubAt : input.grossAnnual;
  const probe = { ...input, grossAnnual: at };
  const there = country.calculate(probe);
  const thereMarginal = marginalRate(country.calculate, probe, step);

  const insight = country.insight(money);
  const crossover = useMemo(() => (country.code === 'NG' ? findCrossover(input) : null), [country.code, input]);

  return (
    <Screen
      title="Explore more"
      subtitle={`How tax grows with pay in ${country.inProse}.`}
      back={{ label: 'Explore', onPress: onBack }}
    >
      <Card padding="lg" surface="elevated">
        <Text variant="overline" tone="secondary">
          Of a {money(step)} raise you keep
        </Text>
        <Text variant="display" tone="positive" style={{ marginTop: t.spacing[1] }}>
          {money(keep)}
        </Text>
        <Text style={{ marginTop: t.spacing[1] }}>
          {money(step - keep)} of it, {percent(marginal, 0)}, goes in tax at your pay of {money(input.grossAnnual)}.
        </Text>
      </Card>

      <SectionLabel>Across salaries</SectionLabel>
      <Card padding="lg" surface="elevated">
        <View style={{ gap: t.spacing[6] }}>
          <RangeChart title="Take-home" data={takeHome} tone="positive" activeAt={scrubAt} onScrub={handleScrub} />
          <RangeChart title="Tax" data={tax} tone="negative" activeAt={scrubAt} onScrub={handleScrub} />
        </View>
        <Text variant="caption" style={{ marginTop: t.spacing[3] }}>
          Drag across either chart and both follow the same salary. Your own pension and
          {country.code === 'NG' ? ' rent' : ' filing choices'} are held fixed.
        </Text>
      </Card>

      <ListCard>
        <List.Row title={typeof scrubAt === 'number' ? 'At this salary' : 'At your salary'} value={money(at)} />
        <List.Row
          title="Tax"
          value={money(there.totalTax)}
          valueCaption={`${percent(there.effectiveRate)} of pay`}
          valueTone="negative"
        />
        <List.Row
          title="Take-home"
          value={money(there.takeHome)}
          valueCaption={`${money(there.takeHome / 12)} a month`}
          valueTone="positive"
        />
        <List.Row title={`Tax on the next ${money(step)}`} value={percent(thereMarginal, 0)} />
      </ListCard>

      <Card padding="md" surface="elevated">
        <Text variant="heading">{insight.title}</Text>
        <Text style={{ marginTop: t.spacing[2] }}>{insight.body}</Text>
      </Card>

      {reform ? (
        <>
          <SectionLabel>The 2026 reform</SectionLabel>
          <ListCard>
            <List.Row
              title={reform.annualSaving >= 0 ? 'You save' : 'You pay more'}
              subtitle="Against the old law"
              value={money(Math.abs(reform.annualSaving))}
              valueCaption={`${money(Math.abs(reform.monthlySaving))} a month`}
              valueTone={reform.annualSaving >= 0 ? 'positive' : 'negative'}
            />
            <List.Row
              title="Tax"
              value={money(reform.current.annualTax)}
              valueCaption={`old law ${money(reform.previous.annualTax)}`}
            />
            <List.Row
              title="Effective rate"
              value={percent(reform.current.effectiveRate)}
              valueCaption={`old law ${percent(reform.previous.effectiveRate)}`}
            />
          </ListCard>
          {crossover ? (
            <Card padding="md" surface="elevated">
              <Text variant="heading">Not a cut for everyone</Text>
              <Text style={{ marginTop: t.spacing[2] }}>
                Below about {moneyShort(crossover)} a year you pay less than under the old law. Above
                it you pay more, because the top rate rose from 24% to 25% and the consolidated
                relief allowance is gone.
              </Text>
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

/** One measure across the salary range, with a readout that follows the shared scrub. */
function RangeChart({
  title,
  data,
  tone,
  activeAt,
  onScrub,
}: {
  title: string;
  data: ChartPoint[];
  tone: 'positive' | 'negative';
  activeAt: ChartPoint['at'];
  onScrub: (index: number | null, point: ChartPoint | null) => void;
}) {
  const { moneyShort } = useTax();
  return (
    <View>
      <Text variant="heading">{title}</Text>
      <InView>
        <Chart
          data={data}
          tone={tone}
          format={moneyShort}
          formatAt={(at) => (typeof at === 'number' ? `on ${moneyShort(at)} salary` : '')}
          activeAt={activeAt}
          onScrub={onScrub}
        >
          <Chart.Value />
          <Chart.Plot height={140} />
        </Chart>
      </InView>
    </View>
  );
}
