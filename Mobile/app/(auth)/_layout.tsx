import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

export default function AuthLayout() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? '#111111' : '#ffffff' } }} />
  );
}

