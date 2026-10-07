/** Settings: appearance and country pages, plus the app credit. */
import { useState, type ReactElement } from 'react';
import { Linking, View } from 'react-native';
import {
  OutlineArrowCounterClockwise,
  OutlineCaretRight,
  OutlineCheck,
  OutlineCircleHalf,
  OutlineMoon,
  OutlineSun,
} from '@arloui/icons';
import { useTokens } from '../../lib/arloui/theme-provider';
import { List } from '../../components/ui/list';
import { useAppearance, type AppearanceChoice } from '../appearance';
import { CountryList } from '../components/CountryList';
import { Flag } from '../components/Flag';
import { Logo } from '../components/Logo';
import { ListCard, Screen, SectionLabel } from '../components/Screen';
import { Text } from '../components/Text';
import { useSetup, useTax } from '../state';

type IconProps = { color: string; width: number; height: number };

const APPEARANCES: {
  value: AppearanceChoice;
  title: string;
  /** How the main Settings list names it. */
  short: string;
  subtitle: string;
  icon: (p: IconProps) => ReactElement;
}[] = [
  {
    value: 'system',
    title: 'Device settings',
    short: 'System',
    subtitle: "Match your phone's light or dark mode",
    icon: (p) => <OutlineCircleHalf {...p} />,
  },
  { value: 'light', title: 'Light', short: 'Light', subtitle: 'Always use light mode', icon: (p) => <OutlineSun {...p} /> },
  { value: 'dark', title: 'Dark', short: 'Dark', subtitle: 'Always use dark mode', icon: (p) => <OutlineMoon {...p} /> },
];

type Page = 'appearance' | 'country' | null;

export function SettingsScreen() {
  const [page, setPage] = useState<Page>(null);
  const back = { label: 'Settings', onPress: () => setPage(null) };
  if (page === 'appearance') return <AppearancePage back={back} />;
  if (page === 'country') return <CountryPage back={back} />;
  return <SettingsHome onOpen={setPage} />;
}

function SettingsHome({ onOpen }: { onOpen: (page: Page) => void }) {
  const t = useTokens();
  const { country } = useTax();
  const { setCountry } = useSetup();
  const { appearance } = useAppearance();
  const current = APPEARANCES.find((a) => a.value === appearance)!;
  const icon = { color: t.colors.textSecondary, width: 22, height: 22 };

  return (
    <Screen title="Settings">
      <SectionLabel>Preferences</SectionLabel>
      <ListCard>
        <List.Row
          leading={current.icon(icon)}
          title="Appearance"
          value={current.short}
          valueTone="muted"
          trailing={<Chevron />}
          onPress={() => onOpen('appearance')}
        />
        <List.Row
          leading={<Flag code={country.code} width={22} />}
          title="Country"
          value={country.name}
          valueTone="muted"
          trailing={<Chevron />}
          onPress={() => onOpen('country')}
        />
      </ListCard>

      <ListCard>
        <List.Row
          leading={<OutlineArrowCounterClockwise {...icon} />}
          title="Start over"
          subtitle="Back to the welcome screen"
          onPress={() => setCountry(null)}
        />
      </ListCard>

      <View style={{ alignItems: 'center', gap: t.spacing[2], marginTop: t.spacing[6] }}>
        <Logo size={44} />
        <Text variant="caption" style={{ textAlign: 'center' }}>
          Take Home 1.0{'\n'}Built by{' '}
          <Text variant="caption" tone="link" onPress={() => Linking.openURL('https://base16.studio')}>
            Base16 Labs
          </Text>{' '}
          with{' '}
          <Text variant="caption" tone="link" onPress={() => Linking.openURL('https://arloui.com')}>
            Arlo UI
          </Text>
        </Text>
        <Text variant="caption" style={{ textAlign: 'center', marginTop: t.spacing[2] }}>
          An estimate, not tax advice.
        </Text>
      </View>
    </Screen>
  );
}

function AppearancePage({ back }: { back: { label: string; onPress: () => void } }) {
  const t = useTokens();
  const { appearance, setAppearance } = useAppearance();
  const icon = { color: t.colors.textSecondary, width: 22, height: 22 };

  return (
    <Screen title="Appearance" back={back}>
      <ListCard>
        {APPEARANCES.map((option) => {
          const selected = option.value === appearance;
          return (
            <List.Row
              key={option.value}
              leading={option.icon(icon)}
              title={option.title}
              subtitle={option.subtitle}
              trailing={
                selected ? <OutlineCheck color={t.colors.interactivePrimary} width={20} height={20} /> : null
              }
              onPress={() => setAppearance(option.value)}
              accessibilityLabel={`${option.title}${selected ? ', selected' : ''}`}
            />
          );
        })}
      </ListCard>
    </Screen>
  );
}

function CountryPage({ back }: { back: { label: string; onPress: () => void } }) {
  const { country } = useTax();
  const { setCountry } = useSetup();
  return (
    <Screen title="Country" subtitle="Sets the tax rules and the currency." back={back}>
      <CountryList value={country.code} onChange={setCountry} />
      <Text variant="caption">Each country keeps its own figures, so switching back picks up where you left off.</Text>
    </Screen>
  );
}

function Chevron() {
  const t = useTokens();
  return <OutlineCaretRight color={t.colors.textTertiary} width={16} height={16} />;
}
