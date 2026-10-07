/**
 * The appearance the user picked: dark, light, or follow the system.
 *
 * Arlo's ThemeProvider takes the choice but only reports the theme it resolved
 * to, so "system" on a dark phone reads back as "dark". The Guide's segmented
 * control has to show what was *picked*, so the pick is remembered here, above
 * the screens, where a tab switch cannot reset it.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useTheme } from '../lib/arloui/theme-provider';
import { load, save } from './storage';

export type AppearanceChoice = 'dark' | 'light' | 'system';

type Ctx = { appearance: AppearanceChoice; setAppearance: (choice: AppearanceChoice) => void };

const AppearanceContext = createContext<Ctx | null>(null);

/** The saved choice, for Arlo's ThemeProvider `defaultName` and this provider's `initial`. */
export const savedAppearance = (): AppearanceChoice => load<AppearanceChoice>('appearance', 'dark');

/** Must sit inside Arlo's ThemeProvider, with `initial` matching its `defaultName`. */
export function AppearanceProvider({
  initial,
  children,
}: {
  initial: AppearanceChoice;
  children: ReactNode;
}) {
  const { setName } = useTheme();
  const [appearance, setChoice] = useState(initial);

  const setAppearance = useCallback(
    (choice: AppearanceChoice) => {
      setChoice(choice);
      setName(choice);
      save('appearance', choice);
    },
    [setName],
  );

  const value = useMemo(() => ({ appearance, setAppearance }), [appearance, setAppearance]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance() must be used inside <AppearanceProvider>');
  return ctx;
}
