import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

/**
 * Loads the family the Arlo UI tokens name in `fontFamilies.sans`.
 *
 * Every weight registers under the one family name so that
 * `fontFamily: 'Manrope'` + `fontWeight: '600'` resolves — components never
 * spell a weight into the family string.
 *
 * ```tsx
 * const [fontsLoaded] = useArloFonts();
 * if (!fontsLoaded) return null; // or <SplashScreen />
 * ```
 *
 * Swapping typeface is a one-line change: point these at another family and
 * update `fontFamilies.sans` in your tokens to match.
 */
export function useArloFonts() {
  return useFonts({
    Manrope: Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });
}
