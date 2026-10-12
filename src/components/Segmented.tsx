/** Segmented control for use on cards: a grey well with a raised neutral pill, as in iOS. */
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import { haptic } from "../../lib/arloui/haptics";
import { useTokens } from "../../lib/arloui/theme-provider";

const PAD = 4;
const HEIGHT = 44;
// Lifts the white pill off the grey well, close to the iOS segmented thumb.
const PILL_SHADOW: ViewStyle = {
  shadowColor: '#000000',
  shadowOpacity: 0.12,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
};

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  accessibilityLabel: string;
}) {
  const t = useTokens();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const x = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(x, {
      toValue: index,
      stiffness: 260,
      damping: 26,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [index, x]);

  const slot = width > 0 ? (width - PAD * 2) / options.length : 0;
  const dark = t.name === "dark";
  // Light: white pill on a grey well. Dark: a raised grey pill on a near-black well.
  const well = dark ? t.colors.surfaceInput : t.colors.surfaceInputActive;
  const pill = dark ? t.colors.borderPrimary : t.colors.surfaceElevated;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{
        height: HEIGHT + PAD * 2,
        borderRadius: t.radii.full,
        backgroundColor: well,
        flexDirection: "row",
        padding: PAD,
      }}
    >
      {slot > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: PAD,
              left: PAD,
              width: slot,
              height: HEIGHT,
              borderRadius: t.radii.full,
              backgroundColor: pill,
              transform: [{ translateX: Animated.multiply(x, slot) }],
            },
            dark ? null : PILL_SHADOW,
          ]}
        />
      ) : null}

      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active) return;
              haptic("light");
              onChange(option.value);
            }}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: active ? t.colors.textPrimary : t.colors.textSecondary,
                fontFamily: t.fontFamilies.sans,
                ...t.typography.labelLarge,
                fontWeight: active
                  ? t.fontWeights.semibold
                  : t.fontWeights.medium,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
