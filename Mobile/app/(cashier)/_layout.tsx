import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { ShoppingCart, Clock, List, Settings } from 'lucide-react-native';

export default function CashierLayout() {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: c.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarActiveTintColor: c.tabActive,
        tabBarInactiveTintColor: c.tabInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="pos/index"
        options={{
          title: 'Kasir',
          tabBarIcon: ({ color }) => <ShoppingCart size={20} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="shift/index"
        options={{
          title: 'Shift',
          tabBarIcon: ({ color }) => <Clock size={20} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color }) => <List size={20} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Pengaturan',
          tabBarIcon: ({ color }) => <Settings size={20} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
