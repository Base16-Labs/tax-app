/**
 * The three countries as a single-choice list: Arlo's List on a Card, with a
 * Radio on each row. Onboarding, the country sheet and Settings all use it, so
 * the choice looks and behaves the same wherever it is made.
 */
import { Card } from '../../components/ui/card';
import { List } from '../../components/ui/list';
import { Radio } from '../../components/ui/radio';
import { COUNTRIES, COUNTRY_ORDER } from '../tax/countries';
import type { CountryCode } from '../tax/types';
import { Flag } from './Flag';

export function CountryList({
  value,
  onChange,
}: {
  value: CountryCode | null;
  onChange: (code: CountryCode) => void;
}) {
  return (
    <Card padding="none">
      <List divider="inset">
        {COUNTRY_ORDER.map((code) => {
          const country = COUNTRIES[code];
          const selected = value === code;
          return (
            <List.Row
              key={code}
              leading={<Flag code={code} />}
              title={country.name}
              subtitle={`${country.currency.name} · ${country.currency.code}`}
              trailing={<Radio selected={selected} onSelect={() => onChange(code)} />}
              onPress={() => onChange(code)}
              accessibilityLabel={`${country.name}, ${country.currency.name}${selected ? ', selected' : ''}`}
            />
          );
        })}
      </List>
    </Card>
  );
}
