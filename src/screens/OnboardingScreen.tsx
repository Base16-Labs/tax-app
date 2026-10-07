/**
 * First run, in two short steps.
 *
 * 1. Intro: one illustration, one line and one button, so the country
 *    question that follows has a reason.
 * 2. Where are you paid? The country decides the tax rules and the currency
 *    together, so it is the only thing the app needs before it can show a real
 *    number. The phone's region is preselected when it is one of the three; the
 *    income starts at a typical salary for the country and is edited on Calculate.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '../../lib/arloui/theme-provider';
import { Button } from '../../components/ui/button';
import { CountryList } from '../components/CountryList';
import { IntroIllustration } from '../components/IntroIllustration';
import { Text } from '../components/Text';
import { useSetup } from '../state';
import { COUNTRIES } from '../tax/countries';
import type { CountryCode } from '../tax/types';

/** The phone's region, if it is one we support. */
function regionGuess(): CountryCode | null {
  try {
    const region = Intl.DateTimeFormat().resolvedOptions().locale.split('-').pop()?.toUpperCase();
    return region && region in COUNTRIES ? (region as CountryCode) : null;
  } catch {
    return null;
  }
}

export function OnboardingScreen() {
  const [step, setStep] = useState<'intro' | 'country'>('intro');
  return step === 'intro' ? (
    <IntroStep onStart={() => setStep('country')} />
  ) : (
    <CountryStep onBack={() => setStep('intro')} />
  );
}

/** The frame both steps share: content at the top, one action pinned to the bottom. */
function Step({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.colors.bg,
        paddingTop: insets.top + t.spacing[10],
        paddingBottom: insets.bottom + t.spacing[4],
        paddingHorizontal: t.spacing[4],
      }}
    >
      {children}
      <View style={{ flex: 1 }} />
      {footer}
    </View>
  );
}

function IntroStep({ onStart }: { onStart: () => void }) {
  const t = useTokens();
  return (
    <Step
      footer={
        <Button variant="primary" size="lg" fullWidth onPress={onStart}>
          Get started
        </Button>
      }
    >
      {/* One picture, one line, one button: the pattern the best finance
          welcome screens share (Finimize, Wise, Lloyds on Mobbin). */}
      <View style={{ alignItems: 'center', marginTop: t.spacing[8] }}>
        <IntroIllustration />
      </View>
      <View style={{ alignItems: 'center', gap: t.spacing[3], marginTop: t.spacing[10] }}>
        <Text variant="title" style={{ textAlign: 'center' }}>
          Know what you{'\n'}take home
        </Text>
        <Text style={{ textAlign: 'center' }}>
          Your pay after tax in the UK, the US and Nigeria, worked out with each country's own rules.
        </Text>
      </View>
    </Step>
  );
}

function CountryStep({ onBack }: { onBack: () => void }) {
  const t = useTokens();
  const { setCountry } = useSetup();
  const [choice, setChoice] = useState<CountryCode | null>(regionGuess);

  return (
    <Step
      footer={
        <View style={{ gap: t.spacing[2] }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!choice}
            onPress={() => choice && setCountry(choice)}
            accessibilityHint="Opens the calculator for the chosen country"
          >
            {choice ? `Continue in ${COUNTRIES[choice].currency.code}` : 'Choose a country'}
          </Button>
          <Button variant="ghost" size="lg" fullWidth onPress={onBack}>
            Back
          </Button>
        </View>
      }
    >
      <View style={{ gap: t.spacing[2] }}>
        <Text variant="title">Where are you paid?</Text>
        <Text>We work out your pay after tax with your country's rules, in your country's currency.</Text>
      </View>

      <View style={{ marginTop: t.spacing[8], gap: t.spacing[3] }}>
        <CountryList value={choice} onChange={setChoice} />
        <Text variant="caption">You can switch country any time from Calculate.</Text>
      </View>
    </Step>
  );
}
