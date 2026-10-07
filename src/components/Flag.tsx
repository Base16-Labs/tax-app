/** Country flags as PNGs from assets/flags, cropped to 3:2. */
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
