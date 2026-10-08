/** App text: named variants and tones on Arlo's type scale. */
import type { ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';

type Tokens = ReturnType<typeof useTokens>;

export type TextVariant =
  | 'display' // the one hero figure on a screen
  | 'title' // a screen's name
  | 'heading' // a card's heading
  | 'body'
  | 'caption' // a footnote under a chart or a field
  | 'overline'; // a section label

export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'positive' | 'negative' | 'link';

const VARIANT: Record<TextVariant, (t: Tokens) => TextStyle> = {
  display: (t) => t.typography.displayLargeEmphasized,
  title: (t) => t.typography.displaySmallEmphasized,
  heading: (t) => t.typography.headingSmallEmphasized,
  body: (t) => t.typography.bodyMedium,
  caption: (t) => t.typography.bodySmall,
  overline: (t) => ({ ...t.typography.overline, textTransform: 'uppercase' }),
};

const TONE: Record<TextTone, (t: Tokens) => string> = {
  primary: (t) => t.colors.textPrimary,
  secondary: (t) => t.colors.textSecondary,
  tertiary: (t) => t.colors.textTertiary,
  // Chart series tones, so figures in copy match the charts.
  positive: (t) => t.colors.chartPositive,
  negative: (t) => t.colors.chartNegative,
  link: (t) => t.colors.interactivePrimary,
};

/** Each role's natural tone, so most call sites only name the variant. */
const DEFAULT_TONE: Record<TextVariant, TextTone> = {
  display: 'primary',
  title: 'primary',
  heading: 'primary',
  body: 'secondary',
  caption: 'tertiary',
  overline: 'tertiary',
};

export function Text({
  variant = 'body',
  tone,
  onPress,
  style,
  children,
}: {
  variant?: TextVariant;
  tone?: TextTone;
  onPress?: () => void;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  const t = useTokens();
  return (
    <RNText
      onPress={onPress}
      accessibilityRole={onPress ? 'link' : variant === 'title' ? 'header' : undefined}
      style={[
        {
          color: TONE[tone ?? DEFAULT_TONE[variant]](t),
          fontFamily: t.fontFamilies.sans,
          ...VARIANT[variant](t),
        },
        tone === 'link' ? { fontWeight: t.fontWeights.semibold } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
