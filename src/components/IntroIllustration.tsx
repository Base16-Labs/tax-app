/**
 * The intro illustration: the app icon at the centre, orbited by a coin for
 * each currency the app speaks. It says "your money, in three countries"
 * without a word of copy.
 *
 * Drawn in SVG from theme tokens, so it re-themes with the app; the logo itself
 * is the exported brand PNG, so it is pixel-identical to the home-screen icon.
 */
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Logo } from './Logo';

const SIZE = 300;
const C = SIZE / 2;

/** A coin: a tinted face, a thin rim, the currency symbol. */
function Coin({
  x,
  y,
  r,
  symbol,
  from,
  to,
  ink,
  font,
}: {
  x: number;
  y: number;
  r: number;
  symbol: string;
  from: string;
  to: string;
  ink: string;
  font: string;
}) {
  const id = `coin-${symbol.charCodeAt(0)}`;
  return (
    <G>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      {/* A soft drop so the coin floats above the rings. */}
      <Circle cx={x} cy={y + 4} r={r} fill="#000000" opacity={0.12} />
      <Circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
      <Circle cx={x} cy={y} r={r - 4} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.5} />
      <SvgText
        x={x}
        y={y + r * 0.36}
        fill={ink}
        fontSize={r}
        fontWeight="700"
        fontFamily={font}
        textAnchor="middle"
      >
        {symbol}
      </SvgText>
    </G>
  );
}

/** A four-point sparkle. */
function Sparkle({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return (
    <Path
      d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`}
      fill={color}
    />
  );
}

export function IntroIllustration() {
  const t = useTokens();
  const dark = t.name === 'dark';
  const ring = t.colors.interactivePrimary;
  const font = t.fontFamilies.sans;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        {/* A brand-blue glow behind the icon, then two orbits. */}
        <Circle cx={C} cy={C} r={92} fill={ring} opacity={dark ? 0.16 : 0.08} />
        <Circle cx={C} cy={C} r={92} fill="none" stroke={ring} strokeOpacity={0.35} strokeWidth={1.5} />
        <Circle
          cx={C}
          cy={C}
          r={136}
          fill="none"
          stroke={ring}
          strokeOpacity={0.25}
          strokeWidth={1.5}
          strokeDasharray="4 8"
          strokeLinecap="round"
        />

        <Sparkle x={58} y={70} s={7} color={ring} />
        <Sparkle x={250} y={238} s={5} color={ring} />
        <Sparkle x={262} y={96} s={4} color={t.colors.textTertiary} />

        {/* One coin per currency, sitting on the outer orbit. */}
        <Coin x={C + 96} y={C - 96} r={30} symbol="£" from="#4F8DFF" to="#155DFC" ink="#FFFFFF" font={font} />
        <Coin x={C - 120} y={C + 52} r={27} symbol="$" from="#34D399" to="#059669" ink="#FFFFFF" font={font} />
        <Coin x={C + 54} y={C + 124} r={24} symbol="₦" from="#FBBF24" to="#D97706" ink="#FFFFFF" font={font} />
      </Svg>
      <Logo size={112} />
    </View>
  );
}
