/**
 * Switching country from anywhere: Arlo's Sheet with the country list in it.
 *
 * The Sheet covers the whole screen, so it is rendered once at the app shell,
 * outside every scroll view, and screens open it through `useCountrySheet()`.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Sheet } from '../../components/ui/sheet';
import { useSetup } from '../state';
import { CountryList } from './CountryList';
import { Text } from './Text';

const CountrySheetContext = createContext<{ open: () => void }>({ open: () => {} });

export function CountrySheetProvider({ children }: { children: ReactNode }) {
  const t = useTokens();
  const { country, setCountry } = useSetup();
  const [visible, setVisible] = useState(false);
  const value = useMemo(() => ({ open: () => setVisible(true) }), []);

  return (
    <CountrySheetContext.Provider value={value}>
      {children}
      <Sheet visible={visible} onClose={() => setVisible(false)} height="auto">
        <Sheet.Header title="Where are you paid?" />
        <Sheet.Body>
          <View style={{ gap: t.spacing[3] }}>
            <CountryList
              value={country?.code ?? null}
              onChange={(code) => {
                setCountry(code);
                setVisible(false);
              }}
            />
            <Text variant="caption">
              Each country keeps its own figures, so switching back picks up where you left off.
            </Text>
          </View>
        </Sheet.Body>
      </Sheet>
    </CountrySheetContext.Provider>
  );
}

export const useCountrySheet = () => useContext(CountrySheetContext);
