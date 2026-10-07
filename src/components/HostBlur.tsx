/**
 * The blur Arlo's glass surfaces sample through when the system material is not
 * available. On iOS 26 the tab bar and the segmented control use the real
 * Liquid Glass and ignore this; everywhere else it is what makes them glass.
 *
 * One definition, so the tab bar and every segmented control blur the same way.
 */
import { BlurView } from 'expo-blur';
import { useTokens } from '../../lib/arloui/theme-provider';

export function HostBlur() {
  const t = useTokens();
  return <BlurView intensity={40} tint={t.name === 'dark' ? 'dark' : 'light'} style={{ flex: 1 }} />;
}
