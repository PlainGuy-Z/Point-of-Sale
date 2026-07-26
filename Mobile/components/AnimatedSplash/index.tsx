import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const logoOpacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
    scale.value = withSequence(
      withTiming(1.04, { duration: 800 }),
      withTiming(1, { duration: 300 })
    );

    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Animated.Image
        source={require('../../assets/SmartPos.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999, // penting untuk Android agar menutupi konten
  },
  logo: {
    width: 240,
    height: 240,
  },
});