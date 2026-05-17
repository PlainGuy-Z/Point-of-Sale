import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Index() {
  const { status, user } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#111111' : '#ffffff' }}>
        <ActivityIndicator size="large" color={isDark ? '#f59e0b' : '#ea580c'} />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === 'owner') {
    return <Redirect href="/(owner)/dashboard" />;
  }

  return <Redirect href="/(cashier)/pos" />;
}
