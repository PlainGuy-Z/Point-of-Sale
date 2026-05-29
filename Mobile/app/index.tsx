import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Index() {
  const { status, user } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const rootNavigationState = useRootNavigationState();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If auth is still checking OR the navigation state has not fully initialized OR component hasn't mounted,
  // keep rendering the loader to prevent early redirects that trigger "Page Not Found" or navigator mounting errors.
  if (!isMounted || status === 'loading' || !rootNavigationState?.key) {
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

  // CASHIER ROUTING:
  // Cashier always redirects to POS screen (never to dashboard)
  // Dashboard route file has been removed from /(cashier)/ — no dashboard exists for cashier
  return <Redirect href="/(cashier)/pos" />;
}
