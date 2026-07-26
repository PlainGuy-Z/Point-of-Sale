import React, { useEffect } from 'react';
import { StyleSheet, Image, Text, View } from 'react-native';
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
      <Animated.View style={[styles.contentContainer, logoStyle]}>
        <Image
          source={require('../../assets/SmartPos.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          <Text style={styles.titleSmart}>Smart</Text>
          <Text style={styles.titlePOS}>POS</Text>
        </Text>
        <Text style={styles.subtitle}>Point of Sale untuk FnB</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b8a7f',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999, // penting untuk Android agar menutupi konten
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  titleSmart: {
    color: '#ffffff',
  },
  titlePOS: {
    color: '#34d399',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    textAlign: 'center',
  },
});