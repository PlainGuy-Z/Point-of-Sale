import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import SkeletonBase from './SkeletonBase';
import type { DimensionValue } from 'react-native';

export interface SkeletonCardProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard = React.memo(({ width = '100%', height = 100, borderRadius = 12, style }: SkeletonCardProps) => {
  return <SkeletonBase width={width} height={height} borderRadius={borderRadius} style={style} />;
});

SkeletonCard.displayName = 'SkeletonCard';
