import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Animated, Pressable, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoutModal from '../common/LogoutModal';
import {
  Coffee, ShoppingCart, Clock, List, Settings, LogOut, Sun, Moon, ChevronLeft, ChevronRight
} from 'lucide-react-native';

interface CashierSidebarProps {
  visible?: boolean;
  onClose?: () => void;
  inline?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  style?: any;
}

export default function CashierSidebar({
  visible = false,
  onClose,
  inline = true,
  collapsed = false,
  onToggleCollapse,
  style,
}: CashierSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useApp();
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const sidebarWidth = inline ? (collapsed ? 60 : 200) : 280;

  // Animation values for overlay mode
  const slideAnim = useRef(new Animated.Value(inline ? (collapsed ? -60 : -200) : -280)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!inline) {
      if (visible) {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -280,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [visible, inline]);

  const menuItems = [
    // CASHIER MENU ITEMS: Only role-appropriate screens
    // Dashboard is intentionally excluded (no hr: null)
    // Order matches bottom bar: POS, Shift, History, Settings
    { id: 'pos', label: 'Kasir', icon: ShoppingCart, route: '/(cashier)/pos' },
    { id: 'shift', label: 'Shift', icon: Clock, route: '/(cashier)/shift' },
    { id: 'history', label: 'Riwayat', icon: List, route: '/(cashier)/history' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, route: '/(cashier)/settings' },
  ];

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleNav = (route: string) => {
    router.push(route as any);
    if (!inline) {
      onClose?.();
    }
  };

  const handleOpenLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const renderContent = (isCollapsed: boolean) => {
    return (
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              paddingHorizontal: isCollapsed ? 0 : 16,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
              minHeight: 40,
            }}
          >
            {isCollapsed ? (
              /* Collapsed Header */
              <View style={{ alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isDark ? '#4B3621' : '#f0fdfa',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {settings?.logo_url ? (
                    <Image
                      source={{ uri: settings.logo_url.startsWith('http') ? settings.logo_url : `${process.env.EXPO_PUBLIC_API_URL}${settings.logo_url}` }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Coffee size={18} color={isDark ? '#f59e0b' : '#0d9488'} strokeWidth={2} />
                  )}
                </View>
                {inline && onToggleCollapse && (
                  <TouchableOpacity
                    onPress={onToggleCollapse}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: c.bgInput,
                      borderWidth: 1,
                      borderColor: c.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronRight size={14} color={c.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* Expanded Header */
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isDark ? '#4B3621' : '#f0fdfa',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {settings?.logo_url ? (
                    <Image
                      source={{ uri: settings.logo_url.startsWith('http') ? settings.logo_url : `${process.env.EXPO_PUBLIC_API_URL}${settings.logo_url}` }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Coffee size={18} color={isDark ? '#f59e0b' : '#0d9488'} strokeWidth={2} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: c.text, fontSize: 14, fontWeight: '800', letterSpacing: -0.3 }}
                    numberOfLines={1}
                  >
                    {user?.shop?.name || 'SmartPOS'}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: 10 }}>SmartPOS</Text>
                </View>
                {!inline && onClose ? (
                  <TouchableOpacity
                    onPress={onClose}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: c.bgInput,
                      borderWidth: 1,
                      borderColor: c.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={14} color={c.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                ) : inline && onToggleCollapse ? (
                  <TouchableOpacity
                    onPress={onToggleCollapse}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: c.bgInput,
                      borderWidth: 1,
                      borderColor: c.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={14} color={c.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>

          {/* Navigation Items */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 16, gap: 4 }}
            showsVerticalScrollIndicator={true}
          >
            {menuItems.map((item) => {
              const isActive = pathname.includes(item.id);
              const Icon = item.icon;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleNav(item.route)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    paddingHorizontal: isCollapsed ? 0 : 12,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: isActive ? c.accentBg : 'transparent',
                    gap: isCollapsed ? 0 : 12,
                    borderLeftWidth: isActive ? 3 : 0,
                    borderLeftColor: c.accent,
                  }}
                >
                  <Icon
                    size={18}
                    color={isActive ? c.accent : c.textSecondary}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {!isCollapsed && (
                    <Text
                      style={{
                        color: isActive ? c.text : c.textSecondary,
                        fontSize: 13,
                        fontWeight: isActive ? '700' : '500',
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Footer / User Area */}
        <View
          style={{
            padding: 8,
            borderTopWidth: 1,
            borderTopColor: c.border,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          {isCollapsed ? (
            <View style={{ alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: c.bgInput,
                  borderWidth: 1,
                  borderColor: c.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDark ? (
                  <Moon size={14} color="#f59e0b" strokeWidth={2} />
                ) : (
                  <Sun size={14} color="#ea580c" strokeWidth={2} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenLogout}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: c.errorBg,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut size={14} color={c.error} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10, paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 12 }}>
              {/* Dark Mode Toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: c.bgInput,
                }}
              >
                <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {isDark ? 'Mode Gelap' : 'Mode Terang'}
                </Text>
                <TouchableOpacity
                  onPress={toggleTheme}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    backgroundColor: c.bgCard,
                    borderWidth: 1,
                    borderColor: c.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDark ? (
                    <Moon size={12} color="#f59e0b" strokeWidth={2} />
                  ) : (
                    <Sun size={12} color="#ea580c" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Logout Button */}
              <TouchableOpacity
                onPress={handleOpenLogout}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: c.errorBg,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.2)',
                }}
              >
                <LogOut size={14} color={c.error} strokeWidth={2} />
                <Text style={{ color: c.error, fontSize: 12, fontWeight: '600' }}>Keluar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (inline) {
    return (
      <View
        style={[
          {
            width: sidebarWidth,
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderRightWidth: 1,
            borderRightColor: c.border,
            paddingTop: insets.top > 0 ? insets.top + 12 : 20,
            height: '100%',
          },
          style,
        ]}
      >
        {renderContent(collapsed)}
        <LogoutModal
          visible={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleConfirmLogout}
        />
      </View>
    );
  }

  // Overlay Mode (Portrait Drawer)
  const isAnimatedOut = slideAnim.interpolate({
    inputRange: [-280, 0],
    outputRange: [1, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View
        style={[
          { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 },
          { opacity: opacityAnim }
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sidebar Panel */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 280,
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderRightWidth: 1,
          borderRightColor: c.border,
          transform: [{ translateX: slideAnim }],
          paddingTop: insets.top > 0 ? insets.top + 12 : 20,
          zIndex: 1000,
        }}
      >
        {renderContent(false)}
      </Animated.View>

      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </View>
  );
}
