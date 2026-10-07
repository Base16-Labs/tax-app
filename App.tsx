/**
 * Take Home: your pay after tax in the UK, the US or Nigeria, built entirely
 * with Arlo UI.
 *
 * First run asks one question, where you are paid, which sets the tax rules and
 * the currency together. After that, three tabs over one shared income: what you
 * keep; Explore, a hub that opens the breakdown, the salary explorer and the
 * rules; and Settings.
 *
 * The tab bar is the floating glass variant with `jelly` selection, and it
 * reacts to scroll. The `useTabBarScroll` hook lives here rather than in each
 * screen so every screen shares one signal.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  OutlineCalculator,
  OutlineChartDonut,
  OutlineGear,
  SolidCalculator,
  SolidChartDonut,
  SolidGear,
} from '@arloui/icons';

import { ThemeProvider, useTokens } from './lib/arloui/theme-provider';
import { useArloFonts } from './lib/arloui/fonts';
import { TabBar, useTabBarScroll, type TabBarIconProps } from './components/ui/tab-bar';
import { AppearanceProvider, savedAppearance } from './src/appearance';
import { CountrySheetProvider } from './src/components/CountrySheet';
import { HostBlur } from './src/components/HostBlur';
import { BrandSplash } from './src/components/Logo';
import { ScreenScrollProvider } from './src/components/Screen';
import { TaxProvider, useSetup } from './src/state';
import { BreakdownScreen } from './src/screens/BreakdownScreen';
import { CalculateScreen } from './src/screens/CalculateScreen';
import { ExploreHubScreen, type ExplorePage } from './src/screens/ExploreHubScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { RulesScreen } from './src/screens/RulesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// Keep the system splash up until the fonts are in, so no screen ever renders
// in the system face first.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

type TabKey = 'calculate' | 'explore' | 'settings';

/**
 * Icon pairs, outline at rest and solid when selected.
 *
 * The weight swap is the whole selected-state signal on a full-width bar and it
 * reinforces the pill on a floating one; colour alone would be the only cue
 * for anyone who cannot separate the two hues.
 */
const TABS: {
  value: TabKey;
  label: string;
  outline: (p: TabBarIconProps) => ReactElement;
  solid: (p: TabBarIconProps) => ReactElement;
}[] = [
  {
    value: 'calculate',
    label: 'Calculate',
    outline: (p) => <OutlineCalculator color={p.color} width={p.size} height={p.size} />,
    solid: (p) => <SolidCalculator color={p.color} width={p.size} height={p.size} />,
  },
  {
    value: 'explore',
    label: 'Explore',
    outline: (p) => <OutlineChartDonut color={p.color} width={p.size} height={p.size} />,
    solid: (p) => <SolidChartDonut color={p.color} width={p.size} height={p.size} />,
  },
  {
    value: 'settings',
    label: 'Settings',
    outline: (p) => <OutlineGear color={p.color} width={p.size} height={p.size} />,
    solid: (p) => <SolidGear color={p.color} width={p.size} height={p.size} />,
  },
];

/** Onboarding until a country is chosen, the tabs after. */
function Root() {
  const t = useTokens();
  const { country } = useSetup();
  return (
    <>
      <StatusBar style={t.name === 'dark' ? 'light' : 'dark'} />
      {country ? (
        <CountrySheetProvider>
          <Shell />
        </CountrySheetProvider>
      ) : (
        <OnboardingScreen />
      )}
    </>
  );
}

function Shell() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('calculate');
  // The page open inside the Explore tab; null is its hub of cards.
  const [explorePage, setExplorePage] = useState<ExplorePage | null>(null);
  const { hidden, onScroll } = useTabBarScroll();
  const backToHub = () => setExplorePage(null);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {/* One screen mounted at a time, so a tab switch replays its chart entrances. */}
      <ScreenScrollProvider value={onScroll}>
        {tab === 'calculate' ? <CalculateScreen /> : null}
        {tab === 'settings' ? <SettingsScreen /> : null}
        {tab === 'explore' && explorePage === null ? <ExploreHubScreen onOpen={setExplorePage} /> : null}
        {tab === 'explore' && explorePage === 'breakdown' ? <BreakdownScreen onBack={backToHub} /> : null}
        {tab === 'explore' && explorePage === 'more' ? <ExploreScreen onBack={backToHub} /> : null}
        {tab === 'explore' && explorePage === 'rules' ? <RulesScreen onBack={backToHub} /> : null}
      </ScreenScrollProvider>

      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <TabBar
          value={tab}
          onValueChange={(next) => {
            // Tapping a tab always lands on its first screen, as iOS tab bars do.
            setExplorePage(null);
            setTab(next as TabKey);
          }}
          width="fit"
          surface="glass"
          selection="jelly"
          scrollBehavior="shrink"
          showLabels
          hidden={hidden}
          bottomInset={Math.max(insets.bottom, 12)}
          blurComponent={<HostBlur />}
        >
          {TABS.map((item) => (
            <TabBar.Item
              key={item.value}
              value={item.value}
              label={item.label}
              icon={(p) => (p.active ? item.solid(p) : item.outline(p))}
            />
          ))}
        </TabBar>
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useArloFonts();
  const [appearance] = useState(savedAppearance);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      <ThemeProvider defaultName={appearance}>
        <AppearanceProvider initial={appearance}>
          <TaxProvider>{fontsLoaded ? <Root /> : <BrandSplash />}</TaxProvider>
        </AppearanceProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
