import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

// This screen is never shown - the tab press is intercepted to show a modal
export default function MorePlaceholder() {
  const { effectiveTheme } = useTheme();
  const c = getColors(effectiveTheme === 'dark');
  return <View style={{ flex: 1, backgroundColor: c.bg }} />;
}
