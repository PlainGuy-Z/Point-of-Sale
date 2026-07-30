import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getColors } from '../../../utils/theme';

export default function PosLayout() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
        animation: 'fade',
      }}
    />
  );
}
