import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import SkeletonBase from './SkeletonBase';

export interface SkeletonCircleProps {
  size: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCircle = React.memo(({ size, style }: SkeletonCircleProps) => {
  return <SkeletonBase width={size} height={size} borderRadius={size / 2} style={style} />;
});

SkeletonCircle.displayName = 'SkeletonCircle';
