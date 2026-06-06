import React, { useState, useMemo, useCallback } from 'react';
import { Stack, usePathname } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';
import OwnerSidebar, {
  SIDEBAR_EXPANDED_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
} from '../../components/navigation/OwnerDrawerContent';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { SidebarContext, SidebarContextValue } from '../../contexts/SidebarContext';
import { useStableOrientation } from '../../hooks/useStableOrientation';

export default function OwnerLayout() {
  const insets = useSafeAreaInsets();
  const [sidebarVisible, setSidebarVisible] = useState(false);       // portrait overlay
  const [sidebarExpanded, setSidebarExpanded] = useState(false);      // landscape inline
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { isLandscape } = useStableOrientation();
  const pathname = usePathname();
  const isDashboardOrPos = pathname.includes('dashboard') || pathname.includes('pos');

  const currentSidebarWidth = isLandscape
    ? (sidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH)
    : 0;

  const openSidebar = useCallback(() => {
    if (isLandscape) {
      setSidebarExpanded(true);
    } else {
      setSidebarVisible(true);
    }
  }, [isLandscape]);

  const closeSidebar = useCallback(() => {
    if (isLandscape) {
      setSidebarExpanded(false);
    } else {
      setSidebarVisible(false);
    }
  }, [isLandscape]);

  const toggleSidebar = useCallback(() => {
    if (isLandscape) {
      setSidebarExpanded(prev => !prev);
    } else {
      setSidebarVisible(prev => !prev);
    }
  }, [isLandscape]);

  const contextValue: SidebarContextValue = useMemo(() => ({
    openSidebar,
    closeSidebar,
    toggleSidebar,
    isSidebarExpanded: sidebarExpanded,
    isLandscape,
    sidebarWidth: currentSidebarWidth,
    isSidebarOpen: isLandscape ? true : sidebarVisible,
  }), [openSidebar, closeSidebar, toggleSidebar, sidebarExpanded, isLandscape, currentSidebarWidth, sidebarVisible]);

  // Memoize screen options to prevent Stack re-renders that cause flicker
  const screenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'none' as const,
    contentStyle: { backgroundColor: isDark ? '#111111' : '#ffffff' },
  }), [isDark]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ flex: 1, flexDirection: isLandscape ? 'row' : 'column', backgroundColor: c.bg }}>
          {/* Landscape: inline persistent sidebar */}
          {isLandscape && (
            <OwnerSidebar
              visible={true}
              onClose={closeSidebar}
              inline={true}
              collapsed={!sidebarExpanded}
              onToggleCollapse={toggleSidebar}
            />
          )}

          {/* Main content area */}
          <View style={{ flex: 1, backgroundColor: c.bg, position: 'relative' }}>
            <Stack screenOptions={screenOptions}>
              <Stack.Screen name="dashboard" />
              <Stack.Screen name="pos" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="shop-settings" />
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

            {/* Global Floating Sidebar Toggle Button in Portrait */}
            {!isLandscape && !sidebarVisible && !isDashboardOrPos && (
              <TouchableOpacity
                onPress={openSidebar}
                activeOpacity={0.7}
                style={{
                  position: 'absolute',
                  top: insets.top + 8,
                  left: 12,
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: c.bgCard,
                  borderWidth: 1,
                  borderColor: c.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  elevation: 4,
                  zIndex: 9999,
                }}
              >
                <Menu size={20} color={c.text} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Portrait: overlay sidebar */}
          {!isLandscape && (
            <OwnerSidebar visible={sidebarVisible} onClose={closeSidebar} />
          )}
        </View>
        {isLandscape && insets.bottom > 0 && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: insets.bottom,
            backgroundColor: c.bgCard,
            borderTopWidth: 1,
            borderTopColor: c.border,
          }} />
        )}
      </View>
    </SidebarContext.Provider>
  );
}
