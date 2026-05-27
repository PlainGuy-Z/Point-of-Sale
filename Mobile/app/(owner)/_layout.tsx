import React, { useState, useMemo, useCallback } from 'react';
import { Stack } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import OwnerSidebar, {
  SIDEBAR_EXPANDED_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
} from '../../components/navigation/OwnerDrawerContent';
import { createContext, useContext } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

// Sidebar context — consumed by sub-screens (e.g. dashboard hamburger button)
interface SidebarContextValue {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  /** Whether the sidebar is expanded (landscape inline mode) */
  isSidebarExpanded: boolean;
  /** Whether the device is currently in landscape orientation */
  isLandscape: boolean;
  /** Current sidebar width (0 in portrait when closed, collapsed/expanded in landscape) */
  sidebarWidth: number;
  /** Whether the sidebar is open/expanded */
  isSidebarOpen: boolean;
}

const SidebarContext = createContext<SidebarContextValue>({
  openSidebar: () => {},
  closeSidebar: () => {},
  toggleSidebar: () => {},
  isSidebarExpanded: false,
  isLandscape: false,
  sidebarWidth: 0,
  isSidebarOpen: false,
});

export const useSidebar = () => useContext(SidebarContext);

export default function OwnerLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);       // portrait overlay
  const [sidebarExpanded, setSidebarExpanded] = useState(false);      // landscape inline
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

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
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <Stack screenOptions={screenOptions}>
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
        </View>

        {/* Portrait: overlay sidebar */}
        {!isLandscape && (
          <OwnerSidebar visible={sidebarVisible} onClose={closeSidebar} />
        )}
      </View>
    </SidebarContext.Provider>
  );
}
