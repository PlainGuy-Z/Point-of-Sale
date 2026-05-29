import React, { useState, useMemo, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { ShoppingCart, Clock, List, Settings } from 'lucide-react-native';
import CashierSidebar from '../../components/navigation/CashierSidebar';
import { SidebarContext } from '../../contexts/SidebarContext';

export default function CashierLayout() {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  
  const [sidebarVisible, setSidebarVisible] = useState(false);       // portrait overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);    // landscape inline

  const openSidebar = useCallback(() => {
    if (isLandscape) {
      setSidebarCollapsed(false);
    } else {
      setSidebarVisible(true);
    }
  }, [isLandscape]);

  const closeSidebar = useCallback(() => {
    if (isLandscape) {
      setSidebarCollapsed(true);
    } else {
      setSidebarVisible(false);
    }
  }, [isLandscape]);

  const toggleSidebar = useCallback(() => {
    if (isLandscape) {
      setSidebarCollapsed(prev => !prev);
    } else {
      setSidebarVisible(prev => !prev);
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
    isSidebarOpen: isLandscape ? true : sidebarVisible,
  }), [openSidebar, closeSidebar, toggleSidebar, sidebarCollapsed, isLandscape, sidebarWidth, sidebarVisible]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ flex: 1, flexDirection: isLandscape ? 'row' : 'column', backgroundColor: c.bg }}>
          {isLandscape && (
            <CashierSidebar
              visible={true}
              onClose={closeSidebar}
              inline={true}
              collapsed={sidebarCollapsed}
              onToggleCollapse={toggleSidebar}
            />
          )}
          <View style={{ flex: 1 }}>
            <Tabs
              initialRouteName="pos"
              screenOptions={{
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  borderTopWidth: 1,
                  borderTopColor: c.border,
                  height: 60 + insets.bottom,
                  paddingBottom: insets.bottom + 6,
                  paddingTop: 8,
                  display: isLandscape ? 'none' : 'flex',
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
                name="dashboard"
                options={{
                  href: null,
                }}
              />
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

        {/* Portrait: overlay sidebar */}
        {!isLandscape && (
          <CashierSidebar
            visible={sidebarVisible}
            onClose={closeSidebar}
            inline={false}
          />
        )}
      </View>
    </SidebarContext.Provider>
  );
}
