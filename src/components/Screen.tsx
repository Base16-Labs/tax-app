/** Shared scroll container for tab screens, wired to the tab bar's scroll handler, plus layout helpers. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ScrollView,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '../../lib/arloui/theme-provider';
import { OutlineCaretLeft } from '@arloui/icons';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ChartEntranceGate } from '../../components/ui/chart';
import { List } from '../../components/ui/list';
import { SwipeBack } from './SwipeBack';
import { Text } from './Text';

/** Bar height (56) + its lift off the edge + breathing room under the last card. */
const TAB_BAR_CLEARANCE = 132;

/** How much of the screen's bottom edge the floating tab bar covers. */
const TAB_BAR_OVERLAP = 88;

/** Share of a chart that has to be on screen before its entrance plays. */
const IN_VIEW_SHARE = 0.4;

type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
type ScrollListener = () => void;

/** The tab bar's scroll handler, provided once by the app shell. */
const ScreenScroll = createContext<ScrollHandler | undefined>(undefined);
export const ScreenScrollProvider = ScreenScroll.Provider;

/** Lets anything inside a Screen hear its scroll without re-rendering on every frame. */
const ScrollSignal = createContext<(listener: ScrollListener) => () => void>(() => () => {});

export function Screen({
  title,
  subtitle,
  accessory,
  back,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Sits beside the title, e.g. the country switcher. */
  accessory?: ReactNode;
  /** A page opened from another screen: where Back goes, and what it is called. */
  back?: { label: string; onPress: () => void };
  children: ReactNode;
}) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const onScroll = useContext(ScreenScroll);
  const listeners = useRef(new Set<ScrollListener>());

  const subscribe = useCallback((listener: ScrollListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const handleScroll = useCallback<ScrollHandler>(
    (event) => {
      onScroll?.(event);
      listeners.current.forEach((listener) => listener());
    },
    [onScroll],
  );

  const page = (
    <ScrollSignal.Provider value={subscribe}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: t.colors.bg }}
        contentContainerStyle={{
          paddingTop: insets.top + t.spacing[4],
          paddingHorizontal: t.spacing[4],
          paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
          gap: t.spacing[4],
        }}
      >
        <View style={{ gap: t.spacing[1] }}>
          {back ? (
            <View style={{ alignSelf: 'flex-start', marginLeft: -t.spacing[3], marginBottom: t.spacing[1] }}>
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<OutlineCaretLeft color={t.colors.interactivePrimary} width={18} height={18} />}
                labelStyle={{ color: t.colors.interactivePrimary }}
                onPress={back.onPress}
                accessibilityLabel={`Back to ${back.label}`}
              >
                {back.label}
              </Button>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing[3] }}>
            <Text variant="title" style={{ flexShrink: 1 }}>
              {title}
            </Text>
            {accessory}
          </View>
          {subtitle ? <Text>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </ScrollSignal.Provider>
  );

  return back ? <SwipeBack onBack={back.onPress}>{page}</SwipeBack> : page;
}

/** Holds a chart's entrance animation until it scrolls into view above the tab bar. */
export function InView({ children }: { children: ReactNode }) {
  const subscribe = useContext(ScrollSignal);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const ref = useRef<View>(null);
  const [seen, setSeen] = useState(false);

  const check = useCallback(() => {
    ref.current?.measureInWindow((_x, y, _width, height) => {
      if (height <= 0) return;
      const top = insets.top;
      const bottom = windowHeight - insets.bottom - TAB_BAR_OVERLAP;
      const visible = Math.min(y + height, bottom) - Math.max(y, top);
      // A chart taller than the viewport can never be 40% visible by height alone.
      if (visible >= Math.min(height, bottom - top) * IN_VIEW_SHARE) setSeen(true);
    });
  }, [insets.top, insets.bottom, windowHeight]);

  useEffect(() => {
    if (seen) return;
    return subscribe(check);
  }, [seen, subscribe, check]);

  return (
    <View ref={ref} onLayout={seen ? undefined : check}>
      <ChartEntranceGate ready={seen}>{children}</ChartEntranceGate>
    </View>
  );
}

/** Section heading. */
export function SectionLabel({ children }: { children: string }) {
  const t = useTokens();
  return (
    <Text variant="overline" style={{ marginTop: t.spacing[2] }}>
      {children}
    </Text>
  );
}

/** Arlo List inside an unpadded Card. */
export function ListCard({ children }: { children: ReactNode }) {
  return (
    <Card padding="none" surface="elevated">
      <List divider="balanced">{children}</List>
    </Card>
  );
}
