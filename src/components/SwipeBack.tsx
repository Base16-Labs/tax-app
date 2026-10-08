/** iOS-style back gesture for pages opened inside a tab: drag from the left edge to go back. */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Animated, BackHandler, PanResponder, View, useWindowDimensions } from 'react-native';

/** How far in from the left edge a drag has to start, as on iOS. */
const EDGE = 28;

export function SwipeBack({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  // Android hardware back.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBackRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (e, g) =>
          e.nativeEvent.pageX - g.dx < EDGE && g.dx > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => x.setValue(Math.max(0, g.dx)),
        onPanResponderRelease: (_, g) => {
          if (g.dx > width / 3 || g.vx > 0.5) {
            Animated.timing(x, { toValue: width, duration: 180, useNativeDriver: true }).start(() =>
              onBackRef.current(),
            );
          } else {
            Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [width, x],
  );

  return (
    <View style={{ flex: 1 }} {...responder.panHandlers}>
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX: x }],
          opacity: x.interpolate({ inputRange: [0, width], outputRange: [1, 0.6], extrapolate: 'clamp' }),
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
