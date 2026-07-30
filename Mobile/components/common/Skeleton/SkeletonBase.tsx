import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import type { DimensionValue } from 'react-native';
import { useColors } from '../../../utils/theme';

export interface SkeletonBaseProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonBase = React.memo(({ width, height, borderRadius = 4, style }: SkeletonBaseProps) => {
  const { colors, isDark } = useColors();
  
  // Use bgHover as base, and a slightly lighter/transparent version for the shimmer highlight
  const baseColor = colors.bgHover;
  const highlightColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)';

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1, // infinite loop
      false // do not reverse
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    // Translate from -100% to +100%
    const translateX = interpolate(progress.value, [0, 1], [-100, 100]);
    return {
      transform: [{ translateX: `${translateX}%` as any }],
    };
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            highlightColor,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
});

SkeletonBase.displayName = 'SkeletonBase';

export default SkeletonBase;
