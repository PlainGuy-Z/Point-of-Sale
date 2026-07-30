import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import SkeletonBase from './SkeletonBase';
import type { DimensionValue } from 'react-native';

export interface SkeletonTextProps {
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonText = React.memo(({ width = '100%', height = 16, style }: SkeletonTextProps) => {
  return <SkeletonBase width={width} height={height} borderRadius={4} style={style} />;
});

SkeletonText.displayName = 'SkeletonText';
