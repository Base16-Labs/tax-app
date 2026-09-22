/**
 * Naija Tax — a demo app for Arlo UI's Chart and Tab Bar.
 *
 * Four tabs over one shared income: what you owe, where it goes, how the 2026
 * reform changed it, and the rules behind all three.
 *
 * The tab bar is the floating glass variant with `jelly` selection, and it
 * reacts to scroll — the `useTabBarScroll` hook lives here rather than in each
 * screen so all four share one signal.
 */
import { useState, type ReactElement } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  OutlineCalculator,
  OutlineChartDonut,
  OutlineInfo,
  OutlineScales,
  SolidCalculator,
  SolidChartDonut,
  SolidInfo,
  SolidScales,
} from '@arloui/icons';

import { ThemeProvider, useTokens } from './lib/arloui/theme-provider';
import { useArloFonts } from './lib/arloui/fonts';
import { TabBar, useTabBarScroll, type TabBarIconProps } from './components/ui/tab-bar';
import { TaxProvider } from './src/state';
import { CalculateScreen } from './src/screens/CalculateScreen';
import { BreakdownScreen } from './src/screens/BreakdownScreen';
import { CompareScreen } from './src/screens/CompareScreen';
import { GuideScreen } from './src/screens/GuideScreen';

type TabKey = 'calculate' | 'breakdown' | 'compare' | 'guide';

/**
 * Icon pairs, outline at rest and solid when selected.
 *
 * The weight swap is the whole selected-state signal on a full-width bar and it
 * reinforces the pill on a floating one — colour alone would be the only cue
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
    value: 'breakdown',
    label: 'Breakdown',
    outline: (p) => <OutlineChartDonut color={p.color} width={p.size} height={p.size} />,
    solid: (p) => <SolidChartDonut color={p.color} width={p.size} height={p.size} />,
  },
  {
    value: 'compare',
    label: 'Compare',
    outline: (p) => <OutlineScales color={p.color} width={p.size} height={p.size} />,
    solid: (p) => <SolidScales color={p.color} width={p.size} height={p.size} />,
  },
  {
    value: 'guide',
    label: 'Guide',
    outline: (p) => <OutlineInfo color={p.color} width={p.size} height={p.size} />,
    solid: (p) => <SolidInfo color={p.color} width={p.size} height={p.size} />,
  },
];

function Shell() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('calculate');
  const { hidden, onScroll } = useTabBarScroll();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar style={t.name === 'dark' ? 'light' : 'dark'} />

      {tab === 'calculate' ? <CalculateScreen onScroll={onScroll} /> : null}
      {tab === 'breakdown' ? <BreakdownScreen onScroll={onScroll} /> : null}
      {tab === 'compare' ? <CompareScreen onScroll={onScroll} /> : null}
      {tab === 'guide' ? <GuideScreen onScroll={onScroll} /> : null}

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
      >
        <TabBar
          value={tab}
          onValueChange={(next) => setTab(next as TabKey)}
          width="floating"
          surface="glass"
          selection="jelly"
          scrollBehavior="shrink"
          showLabels
          hidden={hidden}
          bottomInset={Math.max(insets.bottom, 12)}
          // The host blur the glass fallback samples through. On iOS 26 the
          // component uses the real system material and ignores this.
          blurComponent={
            <BlurView
              intensity={40}
              tint={t.name === 'dark' ? 'dark' : 'light'}
              style={{ flex: 1 }}
            />
          }
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

  return (
    <SafeAreaProvider>
      <ThemeProvider defaultName="dark">
        <TaxProvider>{fontsLoaded ? <Shell /> : <Splash />}</TaxProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Held until Manrope resolves, so no screen ever renders in the system face first. */
function Splash() {
  const t = useTokens();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.colors.bg,
      }}
    >
      <ActivityIndicator color={t.colors.interactivePrimary} />
    </View>
  );
}
