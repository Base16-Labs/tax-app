/** Fallback blur for Arlo's glass surfaces where native Liquid Glass is unavailable. */
import { BlurView } from 'expo-blur';
import { useTokens } from '../../lib/arloui/theme-provider';

export function HostBlur() {
  const t = useTokens();
  return <BlurView intensity={40} tint={t.name === 'dark' ? 'dark' : 'light'} style={{ flex: 1 }} />;
}
