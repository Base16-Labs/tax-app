/**
 * The rules, in the order the calculator applies them. Opened from Explore.
 *
 * A tax calculator that will not show its working is just a number generator,
 * so every figure the engine uses for the chosen country is listed here.
 */
import { View } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Card } from '../../components/ui/card';
import { List } from '../../components/ui/list';
import { ListCard, Screen, SectionLabel } from '../components/Screen';
import { Text } from '../components/Text';
import { useTax } from '../state';

export function RulesScreen({ onBack }: { onBack: () => void }) {
  const t = useTokens();
  const { country, input, money } = useTax();

  const bands = country.bandsFor(input);
  const range = (from: number, to: number) =>
    to === Infinity ? `above ${money(from)}` : from === 0 ? `first ${money(to)}` : `${money(from)} to ${money(to)}`;

  return (
    <Screen
      title="How it's worked out"
      subtitle={`${country.name}, ${country.taxYear}.`}
      back={{ label: 'Explore', onPress: onBack }}
    >
      <Text variant="caption">{country.scope}</Text>

      <SectionLabel>Income tax bands</SectionLabel>
      <Card padding="none">
        <List divider="balanced" density="compact">
          {bands.map((band) => (
            <List.Row
              key={band.from}
              title={`${Math.round(band.rate * 100)}%`}
              value={range(band.from, band.to)}
              valueTone={band.rate === 0 ? 'positive' : 'default'}
            />
          ))}
        </List>
        <Text variant="caption" style={{ padding: t.spacing[4], paddingTop: t.spacing[2] }}>
          {country.code === 'US'
            ? 'Of taxable income, after the standard deduction.'
            : country.code === 'GB'
              ? 'Of pay after pension. The tax-free allowance shrinks above £100,000.'
              : 'Of chargeable income, after contributions and rent relief.'}
        </Text>
      </Card>

      <SectionLabel>Allowances and deductions</SectionLabel>
      <ListCard>
        {country.reliefRows(input).map((row) => (
          <List.Row key={row.title} title={row.title} subtitle={row.subtitle} value={row.value} />
        ))}
      </ListCard>

      <SectionLabel>Order of operations</SectionLabel>
      <Card padding="md">
        {country.steps(input).map((step, i) => (
          <View key={step} style={{ flexDirection: 'row', gap: t.spacing[3], paddingVertical: t.spacing[2] }}>
            <Text tone="tertiary" style={{ width: 18, fontVariant: ['tabular-nums'] }}>
              {i + 1}
            </Text>
            <Text style={{ flex: 1 }}>{step}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
