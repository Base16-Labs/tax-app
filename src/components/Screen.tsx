/**
 * The scroll container every tab shares.
 *
 * It exists so the tab bar's scroll reaction is wired in exactly once: each
 * screen gets the shell's `onScroll`, and the bottom padding clears the
 * floating bar so the last card is never parked underneath it.
 */
import type { ReactNode } from 'react';
import {
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '../../lib/arloui/theme-provider';

/** Bar height (56) + its lift off the edge + breathing room under the last card. */
const TAB_BAR_CLEARANCE = 132;

export function Screen({
  title,
  subtitle,
  children,
  onScroll,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  const t = useTokens();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      onScroll={onScroll}
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
        <Text
          style={{
            color: t.colors.textPrimary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.displaySmallEmphasized,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: t.colors.textSecondary,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.bodyMedium,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </ScrollView>
  );
}

/** A labelled section heading, so the long screens stay scannable. */
export function SectionLabel({ children }: { children: ReactNode }) {
  const t = useTokens();
  return (
    <Text
      style={{
        color: t.colors.textTertiary,
        fontFamily: t.fontFamilies.sans,
        ...t.typography.overline,
        textTransform: 'uppercase',
        marginTop: t.spacing[2],
      }}
    >
      {children}
    </Text>
  );
}

/** One `label — value` row, the unit the deduction and summary lists are built from. */
export function Row({
  label,
  value,
  tone = 'default',
  hint,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative' | 'muted';
  hint?: string;
}) {
  const t = useTokens();
  const valueColor =
    tone === 'positive'
      ? t.colors.chartPositive
      : tone === 'negative'
        ? t.colors.chartNegative
        : tone === 'muted'
          ? t.colors.textSecondary
          : t.colors.textPrimary;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: t.spacing[4],
        paddingVertical: t.spacing[2],
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            color: t.colors.textSecondary,
            fontFamily: t.fontFamilies.sans,
            ...t.typography.bodyMedium,
          }}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            style={{
              color: t.colors.textTertiary,
              fontFamily: t.fontFamilies.sans,
              ...t.typography.bodySmall,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          color: valueColor,
          fontFamily: t.fontFamilies.sans,
          ...t.typography.bodyMedium,
          fontWeight: t.fontWeights.semibold,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/** A hairline between rows. Kept here so every list divides the same way. */
export function Divider() {
  const t = useTokens();
  return <View style={{ height: 1, backgroundColor: t.colors.border }} />;
}
