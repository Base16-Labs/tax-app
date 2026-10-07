/**
 * The app's text, on Arlo's type scale.
 *
 * Every string on screen is one of a handful of roles, so the screens name the
 * role and the tone and never spell out a font family, a size, or a colour. That
 * keeps the four screens visually consistent and re-themes them in one place.
 */
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
  display: (t) => ({ ...t.typography.displayLargeEmphasized, fontVariant: ['tabular-nums'] }),
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
  // The chart tones, so a figure in the copy matches the same figure in a chart.
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
