/** Take Home logo. The PNGs in assets/brand are exported from assets/brand/source/icon.svg. */
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

/** Matches the native splash screen (logo at 120pt, centred). */
export function BrandSplash() {
  const t = useTokens();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.bg }}>
      <Logo size={120} />
    </View>
  );
}
