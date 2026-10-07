/**
 * The three countries' real flags, as PNG images rather than emoji, so they
 * look the same on every platform.
 *
 * The images live in assets/flags at 1x, 2x and 3x (React Native picks the one
 * that matches the screen), rendered from the SVG drawings in
 * assets/flags/source. Each is framed at 3:2: the Union Jack cropped from the
 * centre, the Stars and Stripes from the right so all fifty stars stay.
 */
import { Image, type ImageSourcePropType } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';
import type { CountryCode } from '../tax/types';

const FLAGS: Record<CountryCode, ImageSourcePropType> = {
  GB: require('../../assets/flags/gb.png'),
  US: require('../../assets/flags/us.png'),
  NG: require('../../assets/flags/ng.png'),
};

export function Flag({ code, width = 32 }: { code: CountryCode; width?: number }) {
  const t = useTokens();
  return (
    <Image
      source={FLAGS[code]}
      accessibilityIgnoresInvertColors
      style={{
        width,
        height: (width * 2) / 3,
        borderRadius: Math.max(2, width / 8),
        // A hairline edge keeps the white in Nigeria's flag visible on light surfaces.
        borderWidth: 1,
        borderColor: t.colors.border,
      }}
    />
  );
}
