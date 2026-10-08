/** Explore hub: cards previewing Breakdown and the salary explorer, plus a link to the rules. */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { OutlineCaretRight } from '@arloui/icons';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { Chart } from '../../components/ui/chart';
import { List } from '../../components/ui/list';
import { InView, ListCard, Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { usePaySlices, useSalarySweep } from '../insights';
import { useTax } from '../state';
import { percent } from '../tax/format';

export type ExplorePage = 'breakdown' | 'more' | 'rules';

export function ExploreHubScreen({ onOpen }: { onOpen: (page: ExplorePage) => void }) {
  const t = useTokens();
  const { country, payslip, marginal, money, moneyShort } = useTax();
  const slices = usePaySlices();
  const { takeHome } = useSalarySweep();
  const keep = country.raiseStep * (1 - marginal);
  const share = payslip.grossAnnual > 0 ? payslip.takeHome / payslip.grossAnnual : 0;

  return (
    <Screen title="Explore" subtitle={`Your ${money(payslip.grossAnnual)} a year, looked at two ways.`}>
      <HubCard
        title="Breakdown"
        body={`You keep ${percent(share, 0)} of your pay. See where the rest goes, band by band.`}
        onPress={() => onOpen('breakdown')}
        preview={
          slices.length > 0 ? (
            <InView>
              <Chart.Donut data={slices} size={88} format={moneyShort} accessibilityLabel="Where your pay goes">
                {null}
              </Chart.Donut>
            </InView>
          ) : null
        }
      />

      <HubCard
        title="Explore more"
        body={`Of a ${money(country.raiseStep)} raise you keep ${money(keep)}. See how tax grows with pay.`}
        onPress={() => onOpen('more')}
        preview={
          <InView>
            <Chart.Sparkline data={takeHome} tone="positive" width={120} height={56} format={moneyShort} />
          </InView>
        }
      />

      <View style={{ marginTop: t.spacing[2] }}>
        <ListCard>
          <List.Row
            title="How it's worked out"
            subtitle={`The ${country.name} tax rules, step by step`}
            trailing={<OutlineCaretRight color={t.colors.textTertiary} width={18} height={18} />}
            onPress={() => onOpen('rules')}
          />
        </ListCard>
      </View>
    </Screen>
  );
}

/** One tappable card: a heading and a line on the left, a live preview on the right. */
function HubCard({
  title,
  body,
  preview,
  onPress,
}: {
  title: string;
  body: string;
  preview: ReactNode;
  onPress: () => void;
}) {
  const t = useTokens();
  return (
    <Card padding="lg" surface="elevated" onPress={onPress} accessibilityLabel={`${title}. ${body}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[4] }}>
        <View style={{ flex: 1, gap: t.spacing[2] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[1] }}>
            <Text variant="heading">{title}</Text>
            <OutlineCaretRight color={t.colors.textTertiary} width={18} height={18} />
          </View>
          <Text>{body}</Text>
        </View>
        {preview}
      </View>
    </Card>
  );
}
