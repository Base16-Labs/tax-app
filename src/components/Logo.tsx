/**
 * The Take Home logo: a house with an arrow pointing in, white on Arlo's brand
 * blue. The PNGs in assets/brand are exported from assets/brand/source/icon.svg.
 */
import { Image, View } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/brand/logo.png')}
      accessibilityLabel="Take Home"
      style={{ width: size, height: size }}
    />
  );
}

/**
 * The same picture as the native splash screen (the logo at 120pt, centred on
 * the app's background), so the hand-over from the system splash to the app is
 * invisible while the fonts finish loading.
 */
export function BrandSplash() {
  const t = useTokens();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.bg }}>
      <Logo size={120} />
    </View>
  );
}
