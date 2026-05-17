import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import OwnerSidebar from '../../components/navigation/OwnerDrawerContent';
import { createContext, useContext } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

// Create a context to control sidebar from sub-screens
const SidebarContext = createContext({
  openSidebar: () => {},
  closeSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export default function OwnerLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const openSidebar = () => setSidebarVisible(true);
  const closeSidebar = () => setSidebarVisible(false);

  return (
    <SidebarContext.Provider value={{ openSidebar, closeSidebar }}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="pos" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="transactions" />
          <Stack.Screen name="shifts" />
          <Stack.Screen name="sales-report" />
          <Stack.Screen name="products" />
          <Stack.Screen name="inventory" />
          <Stack.Screen name="waste-log" />
          <Stack.Screen name="members" />
          <Stack.Screen name="loyalty" />
          <Stack.Screen name="insights" />
          <Stack.Screen name="users" />
          <Stack.Screen name="help" />
          <Stack.Screen name="more" />
        </Stack>
        
        <OwnerSidebar visible={sidebarVisible} onClose={closeSidebar} />
      </View>
    </SidebarContext.Provider>
  );
}
