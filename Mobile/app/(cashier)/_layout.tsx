import React, { useState, useMemo, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { ShoppingCart, Clock, List, Settings } from 'lucide-react-native';
import CashierSidebar from '../../components/navigation/CashierSidebar';
import { SidebarContext } from '../../contexts/SidebarContext';
import { useStableOrientation } from '../../hooks/useStableOrientation';

export default function CashierLayout() {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const { isLandscape } = useStableOrientation();
  const isPortrait = !isLandscape;

  /**
   * CASHIER LAYOUT STRUCTURE
   * ========================
   *
   * PORTRAIT MODE (height >= width):
   * - NO sidebar at all (not even overlay)
   * - Bottom navigation bar shows (4 items: POS, Shift, History, Settings)
   * - Safe area: insets.bottom for Android navigation bar
   *
   * LANDSCAPE MODE (width > height):
   * - Sidebar shown inline (collapsible)
   * - Bottom bar hidden (display: none)
   * - Sidebar can collapse/expand
   *
   * NO DASHBOARD FOR CASHIER:
   * - dashboard.tsx file has been removed entirely
   * - No route, no tab, no menu item for dashboard
   * - Cashier default route: /(cashier)/pos
   */

  // Sidebar state only relevant for landscape mode
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const openSidebar = useCallback(() => {
    if (isLandscape) {
      setSidebarCollapsed(false);
    }
  }, [isLandscape]);

  const closeSidebar = useCallback(() => {
    if (isLandscape) {
      setSidebarCollapsed(true);
    }
  }, [isLandscape]);

  const toggleSidebar = useCallback(() => {
    if (isLandscape) {
      setSidebarCollapsed(prev => !prev);
    }
  }, [isLandscape]);

  const sidebarWidth = isLandscape ? (sidebarCollapsed ? 60 : 200) : 0;

  const contextValue = useMemo(() => ({
    openSidebar,
    closeSidebar,
    toggleSidebar,
    isSidebarExpanded: !sidebarCollapsed,
    isLandscape,
    sidebarWidth,
    isSidebarOpen: isLandscape,
  }), [openSidebar, closeSidebar, toggleSidebar, sidebarCollapsed, isLandscape, sidebarWidth]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ flex: 1, flexDirection: isLandscape ? 'row' : 'column', backgroundColor: c.bg }}>
          {/* LANDSCAPE MODE: INLINE SIDEBAR (Persistent, display toggled via style) */}
          <CashierSidebar
            visible={true}
            onClose={closeSidebar}
            inline={true}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            style={{ display: isLandscape ? 'flex' : 'none' }}
          />
          <View style={{ flex: 1 }}>
            <Tabs
              initialRouteName="pos"
              screenOptions={{
                headerShown: false,
                tabBarStyle: {
                  // BOTTOM NAVIGATION BAR - CASHIER PORTRAIT MODE ONLY
                  // - Matches OwnerBottomBar size, height, padding, elevation, and positioning
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: c.bgCard,
                  borderTopWidth: 1,
                  borderTopColor: c.borderLight,
                  height: 50 + Math.max(insets.bottom, 4),
                  paddingBottom: Math.max(insets.bottom, 4),
                  paddingTop: 3,
                  display: isLandscape ? 'none' : 'flex',
                  elevation: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -3 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  zIndex: 999,
                },
                tabBarActiveTintColor: c.accent,
                tabBarInactiveTintColor: c.tabInactive,
                tabBarLabelStyle: {
                  fontSize: 9.5,
                  fontWeight: '500',
                  marginTop: 3,
                },
                tabBarIconStyle: {
                  marginTop: 0,
                },
              }}
            >
              {/* ============================================== */}
              {/* CASHIER BOTTOM BAR TABS (Portrait mode)        */}
              {/* Landscape: tabs hidden, sidebar used instead    */}
              {/* ============================================== */}
              <Tabs.Screen
                name="pos"
                options={{
                  title: 'Kasir',
                  tabBarIcon: ({ color }) => <ShoppingCart size={20} color={color} strokeWidth={2} />,
                }}
              />
              <Tabs.Screen
                name="shift"
                options={{
                  title: 'Shift',
                  tabBarIcon: ({ color }) => <Clock size={20} color={color} strokeWidth={2} />,
                }}
              />
              <Tabs.Screen
                name="history"
                options={{
                  title: 'Riwayat',
                  tabBarIcon: ({ color }) => <List size={20} color={color} strokeWidth={2} />,
                }}
              />
              <Tabs.Screen
                name="settings"
                options={{
                  title: 'Pengaturan',
                  tabBarIcon: ({ color }) => <Settings size={20} color={color} strokeWidth={2} />,
                }}
              />
            </Tabs>
          </View>
        </View>
        {/* Landscape bottom notch safe area spacer */}
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
        {/* NO PORTRAIT SIDEBAR - Cashier portrait uses only bottom bar */}
      </View>
    </SidebarContext.Provider>
  );
}
