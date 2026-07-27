import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Pressable, Modal, useWindowDimensions, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNavigation } from '../../data/navigation';
import { appApi } from '../../services/appApi';
import { useApp } from '../../contexts/AppContext';
import * as LucideIcons from 'lucide-react-native';
import {
  Coffee, ChevronLeft, ChevronRight, LogOut, Sun, Moon,
  ChevronDown, Settings
} from 'lucide-react-native';

/* ─── Constants ─────────────────────────────────────────────────────── */

export const SIDEBAR_EXPANDED_WIDTH = 155;
export const SIDEBAR_COLLAPSED_WIDTH = 50;

// Helper to resolve icon components dynamically and safely
const getIconComponent = (key: string) => {
  const routeToIconName: Record<string, string> = {
    dashboard: 'LayoutDashboard',
    pos: 'ShoppingCart',
    'sales-report': 'BarChart2',
    'waste-log': 'Trash2',
    products: 'Package',
    inventory: 'Layers',
    members: 'Users',
    loyalty: 'Trophy',
    insights: 'BrainCircuit',
    transactions: 'Receipt',
    shifts: 'ClipboardList',
    users: 'UserCheck',
    settings: 'Settings',
    help: 'HelpCircle',
    more: 'MoreHorizontal',
  };

  const iconName = routeToIconName[key] || key;
  const Icon = (LucideIcons as any)[iconName];
  if (Icon) return Icon;
  if (iconName === 'BarChart3') return LucideIcons.BarChart2;
  return Settings;
};

/* ─── Props ──────────────────────────────────────────────────────────── */

interface OwnerSidebarProps {
  visible: boolean;
  onClose: () => void;
  /** If true, render as inline persistent sidebar (landscape) instead of overlay */
  inline?: boolean;
  /** If true, sidebar is collapsed (icons only) */
  collapsed?: boolean;
  /** Toggle collapsed/expanded in inline mode */
  onToggleCollapse?: () => void;
  style?: any;
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function OwnerSidebar({
  visible,
  onClose,
  inline = false,
  collapsed = false,
  onToggleCollapse,
  style,
}: OwnerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useApp();
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const insets = useSafeAreaInsets();

  const sidebarWidth = inline
    ? (collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH)
    : 280;

  // Animation refs for overlay mode
  const slideAnim = useRef(new Animated.Value(inline ? -SIDEBAR_EXPANDED_WIDTH : -280)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Dynamic Navigation data
  const navigation = getNavigation(user?.role || 'owner');

  // Flyout popover state for collapsed landscape sidebar
  const [selectedPopoverSection, setSelectedPopoverSection] = useState<any | null>(null);
  const sectionLayouts = useRef<Record<string, { y: number; height: number }>>({});
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Bottom Sheet state for portrait mode
  const [selectedBottomSheetSection, setSelectedBottomSheetSection] = useState<any | null>(null);

  // Detect phone vs tablet
  const shortSide = Math.min(windowWidth, windowHeight);
  const isPhone = shortSide < 600;
  const isPhoneLandscape = isPhone && inline;

  // ── Responsive sizing for phone landscape ──
  const sz = {
    // Logo header
    logoSize: isPhoneLandscape ? (collapsed ? 26 : 28) : (collapsed ? 36 : 36),
    logoIconSize: isPhoneLandscape ? (collapsed ? 13 : 14) : 18,
    logoRadius: isPhoneLandscape ? 7 : 10,
    headerPadV: isPhoneLandscape ? 6 : 12,
    headerPadH: isPhoneLandscape ? (collapsed ? 0 : 8) : (collapsed ? 0 : 12),
    headerMinH: isPhoneLandscape ? 38 : 56,
    shopNameSize: isPhoneLandscape ? 11 : 14,
    posLabelSize: isPhoneLandscape ? 8 : 10,
    // Toggle button
    toggleSize: isPhoneLandscape ? 20 : 26,
    toggleRadius: isPhoneLandscape ? 5 : 7,
    toggleIconSize: isPhoneLandscape ? 10 : 13,
    toggleMarginTop: isPhoneLandscape ? 3 : 6,
    // Nav items expanded
    navFontSize: isPhoneLandscape ? 10 : 12,
    navIconSize: isPhoneLandscape ? 13 : 16,
    navPadV: isPhoneLandscape ? 6 : 10,
    navPadH: isPhoneLandscape ? 8 : 12,
    navMarginH: isPhoneLandscape ? 4 : 8,
    navGap: isPhoneLandscape ? 6 : 10,
    navBorderRadius: isPhoneLandscape ? 7 : 10,
    // Nav items collapsed
    navCollapsedIconSize: isPhoneLandscape ? 14 : 18,
    navCollapsedBtnSize: isPhoneLandscape ? 30 : 40,
    navCollapsedBtnRadius: isPhoneLandscape ? 7 : 10,
    navCollapsedMarginV: isPhoneLandscape ? 1 : 4,
    // Sub items expanded
    subFontSize: isPhoneLandscape ? 9.5 : 11.5,
    subIconSize: isPhoneLandscape ? 11 : 14,
    subPadV: isPhoneLandscape ? 5 : 9,
    subPadH: isPhoneLandscape ? 8 : 12,
    subGap: isPhoneLandscape ? 6 : 8,
    subBorderRadius: isPhoneLandscape ? 6 : 8,
    subMarginLeft: isPhoneLandscape ? 14 : 20,
    // Section header
    sectionFontSize: isPhoneLandscape ? 9.5 : 12,
    sectionIconSize: isPhoneLandscape ? 13 : 16,
    sectionPadV: isPhoneLandscape ? 6 : 10,
    sectionPadH: isPhoneLandscape ? 8 : 12,
    sectionGap: isPhoneLandscape ? 6 : 10,
    sectionMarginV: isPhoneLandscape ? 2 : 4,
    // Chevron
    chevronSize: isPhoneLandscape ? 11 : 14,
    // Badge
    badgeFontSize: isPhoneLandscape ? 7 : 9,
    badgeMinW: isPhoneLandscape ? 12 : 16,
    badgeH: isPhoneLandscape ? 12 : 16,
    // Bottom zone
    avatarSize: isPhoneLandscape ? (collapsed ? 22 : 26) : (collapsed ? 32 : 32),
    avatarRadius: isPhoneLandscape ? (collapsed ? 11 : 13) : 16,
    avatarFontSize: isPhoneLandscape ? (collapsed ? 9 : 10) : 12,
    bottomPad: isPhoneLandscape ? (collapsed ? 4 : 6) : (collapsed ? 8 : 12),
    bottomGap: isPhoneLandscape ? 4 : 10,
    themeBtnSize: isPhoneLandscape ? 22 : 28,
    themeBtnRadius: isPhoneLandscape ? 5 : 7,
    themeIconSize: isPhoneLandscape ? 10 : 12,
    userNameSize: isPhoneLandscape ? 10 : 12,
    userRoleSize: isPhoneLandscape ? 7 : 9,
    // Logout
    logoutIconSize: isPhoneLandscape ? 10 : 12,
    logoutFontSize: isPhoneLandscape ? 10 : 12,
    logoutPadV: isPhoneLandscape ? 5 : 8,
    logoutPadH: isPhoneLandscape ? 6 : 10,
    logoutBtnSize: isPhoneLandscape ? 22 : 28,
    logoutBtnRadius: isPhoneLandscape ? 5 : 7,
    logoutMarginH: isPhoneLandscape ? 4 : 8,
  };

  // Poll void requests badge (owner only)
  const [pendingVoidBadge, setPendingVoidBadge] = useState(0);

  useEffect(() => {
    if (user?.role !== 'owner') return undefined;

    let cancelled = false;
    const poll = async () => {
      try {
        const r = await appApi.get<{ total: number }>('/transactions/void-requests');
        if (!cancelled) setPendingVoidBadge(typeof r.total === 'number' ? r.total : 0);
      } catch {
        if (!cancelled) setPendingVoidBadge(0);
      }
    };
    void poll();
    const iv = window.setInterval(poll, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [user?.role]);

  // Badge mapping helper
  const getBadge = (route: string): number | undefined => {
    if (route === 'transactions' && user?.role === 'owner') {
      return pendingVoidBadge || undefined;
    }
    return undefined;
  };

  useEffect(() => {
    if (inline) return; // No animation for inline mode
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: inline ? -SIDEBAR_EXPANDED_WIDTH : -280, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, inline]);

  const handleNav = (route: string) => {
    router.push(`/(owner)/${route}` as any);
    if (!inline) onClose();
  };

  /* ─── Shared Navigation Builder ────────────────────────────────────── */

  const renderNavigationList = (isCollapsedLocal: boolean) => {
    return navigation.sections.map((section, idx) => {
      // Main section (Dashboard) has no accordion sub-menu popover
      if (section.id === 'main' || section.label === null) {
        return (
          <View key={section.id} style={{ marginBottom: 8, alignItems: isCollapsedLocal ? 'center' : 'stretch' }}>
            {!isCollapsedLocal && section.label && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginHorizontal: sz.navMarginH,
                  paddingHorizontal: 12,
                  paddingBottom: 10,
                }}
              >
                <Text style={{
                  color: isDark ? '#64748b' : '#94a3b8',
                  fontSize: sz.sectionFontSize * 0.9,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  flex: 1,
                }} numberOfLines={1}>
                  {section.label}
                </Text>
              </View>
            )}
            {section.items.map((item) => {
              const isActive = pathname.includes(item.route);
              const IconComp = getIconComponent(item.route);
              const badge = getBadge(item.route);
              return (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => handleNav(item.route)}
                  style={isCollapsedLocal ? {
                    width: sz.navCollapsedBtnSize,
                    height: sz.navCollapsedBtnSize,
                    borderRadius: sz.navCollapsedBtnRadius,
                    backgroundColor: isActive ? c.accentBg : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  } : {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: sz.navPadH,
                    paddingVertical: sz.navPadV,
                    borderRadius: isActive ? 999 : sz.navBorderRadius,
                    gap: sz.navGap,
                    position: 'relative',
                    backgroundColor: isActive ? (isDark ? 'rgba(20,184,166,0.15)' : 'rgba(13,148,136,0.08)') : 'transparent',
                    borderLeftWidth: isActive ? 4 : 0,
                    borderLeftColor: isActive ? c.accent : 'transparent',
                    marginLeft: isActive ? sz.navMarginH : (sz.navMarginH + 4),
                    marginRight: sz.navMarginH,
                  }}
                >
                  <IconComp
                    size={isCollapsedLocal ? sz.navCollapsedIconSize : sz.navIconSize}
                    color={isActive ? (isDark ? '#5eead4' : '#0f766e') : c.textSecondary}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {!isCollapsedLocal && (
                    <Text style={{
                      color: isActive ? (isDark ? '#5eead4' : '#0f766e') : c.textSecondary,
                      fontSize: sz.navFontSize, fontWeight: isActive ? '700' : '600', flex: 1,
                    }} numberOfLines={1}>
                      {item.label}
                    </Text>
                  )}
                  {!isCollapsedLocal && isActive && badge === undefined && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent, marginRight: 4 }} />
                  )}
                  {!isCollapsedLocal && badge !== undefined && badge > 0 && (
                    <View style={{
                      backgroundColor: '#ef4444',
                      borderRadius: 10,
                      minWidth: sz.badgeMinW,
                      height: sz.badgeH,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                      marginRight: 4,
                    }}>
                      <Text style={{ color: '#fff', fontSize: sz.badgeFontSize, fontWeight: '800' }}>
                        {badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }

      // Sections with child sub-items
      const totalSectionBadge = section.items.reduce(
        (sum, item) => sum + (getBadge(item.route) ?? 0),
        0
      );
      const SectionIcon = getIconComponent(section.collapsedIcon || 'Settings');

      if (isCollapsedLocal) {
        // Collapsed mode: Parent icon button. Clicking opens flyout popover in landscape.
        const isAnyActive = section.items.some((item) => pathname.includes(item.route));

        return (
          <View
            key={section.id}
            style={{ alignItems: 'center', marginVertical: sz.navCollapsedMarginV }}
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              sectionLayouts.current[section.id] = { y, height };
            }}
          >
            <TouchableOpacity
              onPress={() => {
                if (selectedPopoverSection?.id === section.id) {
                  setSelectedPopoverSection(null);
                } else {
                  setSelectedPopoverSection(section);
                  setSelectedBottomSheetSection(null);
                }
              }}
              style={{
                width: sz.navCollapsedBtnSize,
                height: sz.navCollapsedBtnSize,
                borderRadius: sz.navCollapsedBtnRadius,
                backgroundColor: isAnyActive ? c.accentBg : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <SectionIcon
                size={sz.navCollapsedIconSize}
                color={isAnyActive ? c.accent : c.textSecondary}
                strokeWidth={2}
              />
              {/* Badge indicator on collapsed icon */}
              {totalSectionBadge > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  backgroundColor: '#ef4444',
                  borderRadius: 6,
                  minWidth: 12,
                  height: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}>
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>
                    {totalSectionBadge > 9 ? '!' : totalSectionBadge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      }

      // Expanded mode: Static parent header + child list
      return (
        <View key={section.id} style={{ 
          marginBottom: sz.sectionMarginV * 2,
          borderTopWidth: idx > 0 ? 1 : 0,
          borderTopColor: c.borderLight,
          paddingTop: idx > 0 ? 16 : 0,
          marginTop: idx > 0 ? 8 : 0,
        }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: sz.navMarginH,
              paddingHorizontal: 12,
              paddingBottom: 10,
            }}
          >
            <Text style={{
              color: isDark ? '#64748b' : '#94a3b8',
              fontSize: sz.sectionFontSize * 0.9,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              flex: 1,
            }} numberOfLines={1}>
              {section.label}
            </Text>

            {/* Total section badge */}
            {totalSectionBadge > 0 && (
              <View style={{
                backgroundColor: '#ef4444',
                borderRadius: 8,
                paddingHorizontal: 5,
                paddingVertical: 1,
              }}>
                <Text style={{ color: '#fff', fontSize: sz.badgeFontSize, fontWeight: '800' }}>
                  {totalSectionBadge}
                </Text>
              </View>
            )}
          </View>

          {/* Sub-items (always visible) */}
          <View style={{ gap: isPhoneLandscape ? 2 : 4 }}>
            {section.items.map((item) => {
              const isActive = pathname.includes(item.route);
              const SubIconComp = getIconComponent(item.route);
              const badge = getBadge(item.route);
              return (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => handleNav(item.route)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: sz.subPadH,
                    paddingVertical: sz.subPadV,
                    borderRadius: isActive ? 999 : sz.subBorderRadius,
                    gap: sz.subGap,
                    position: 'relative',
                    backgroundColor: isActive ? (isDark ? 'rgba(20,184,166,0.15)' : 'rgba(13,148,136,0.08)') : 'transparent',
                    borderLeftWidth: isActive ? 4 : 0,
                    borderLeftColor: isActive ? c.accent : 'transparent',
                    marginLeft: isActive ? sz.navMarginH : (sz.navMarginH + 4),
                    marginRight: sz.navMarginH,
                  }}
                >
                  <SubIconComp
                    size={sz.subIconSize + 2}
                    color={isActive ? (isDark ? '#5eead4' : '#0f766e') : c.textSecondary}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <Text style={{
                    color: isActive ? (isDark ? '#5eead4' : '#0f766e') : c.textSecondary,
                    fontSize: sz.subFontSize + 1,
                    fontWeight: isActive ? '700' : '600',
                    flex: 1,
                  }} numberOfLines={1}>
                    {item.label}
                  </Text>

                  {isActive && badge === undefined && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent, marginRight: 4 }} />
                  )}

                  {badge !== undefined && badge > 0 && (
                    <View style={{
                      backgroundColor: '#ef4444',
                      borderRadius: 8,
                      minWidth: sz.badgeMinW,
                      height: sz.badgeH,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                      marginRight: 4,
                    }}>
                      <Text style={{ color: '#fff', fontSize: sz.badgeFontSize, fontWeight: '800' }}>
                        {badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    });
  };

  /* ─── Logout Button (shared across modes) ─────────────────────────── */

  const renderLogoutButton = (isCollapsedLocal: boolean) => {
    if (isCollapsedLocal) {
      return (
        <View style={{ alignItems: 'center', marginTop: isPhoneLandscape ? 4 : 8, marginBottom: isPhoneLandscape ? 2 : 4 }}>
          <TouchableOpacity
            onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
            style={{
              width: sz.logoutBtnSize,
              height: sz.logoutBtnSize,
              borderRadius: sz.logoutBtnRadius,
              backgroundColor: c.errorBg,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={sz.logoutIconSize} color={c.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginHorizontal: sz.logoutMarginH,
          paddingHorizontal: sz.logoutPadH,
          paddingVertical: sz.logoutPadV,
          borderRadius: sz.navBorderRadius,
          backgroundColor: c.errorBg,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.2)',
          marginTop: isPhoneLandscape ? 4 : 8,
          marginBottom: isPhoneLandscape ? 2 : 4,
        }}
      >
        <LogOut size={sz.logoutIconSize} color={c.error} strokeWidth={2} />
        <Text style={{ color: c.error, fontSize: sz.logoutFontSize, fontWeight: '600' }}>Keluar</Text>
      </TouchableOpacity>
    );
  };

  const getPopoverPosition = () => {
    if (!selectedPopoverSection) return { top: 0, maxHeight: 0, width: 0 };
    const layout = sectionLayouts.current[selectedPopoverSection.id];
    const top = layout ? Math.min(Math.max(layout.y, 12), windowHeight - 260) : 12;
    const availableWidth = Math.max(180, windowWidth - sidebarWidth - 16);
    return { top, maxHeight: Math.min(windowHeight - top - 16, 320), width: Math.min(260, availableWidth) };
  };

  const renderFlyoutPopover = () => {
    if (!inline || !collapsed || !selectedPopoverSection) return null;
    const { top, maxHeight, width } = getPopoverPosition();
    const SectionIcon = getIconComponent(selectedPopoverSection.collapsedIcon || 'Settings');

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedPopoverSection(null)} />
        <View style={{
          position: 'absolute',
          left: sidebarWidth + 8,
          top,
          width,
          maxHeight,
          backgroundColor: c.bg,
          borderWidth: 1,
          borderColor: c.borderLight,
          borderRadius: 16,
          padding: 12,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 18,
          elevation: 16,
          zIndex: 1500,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <SectionIcon size={16} color={c.textSecondary} strokeWidth={2} />
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>
              {selectedPopoverSection.label}
            </Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight, paddingRight: 4 }}>
            <View style={{ gap: 6 }}>
              {selectedPopoverSection.items.map((item: any) => {
                const isActive = pathname.includes(item.route);
                const IconComp = getIconComponent(item.route);
                const badge = getBadge(item.route);
                return (
                  <TouchableOpacity
                    key={item.route}
                    onPress={() => {
                      handleNav(item.route);
                      setSelectedPopoverSection(null);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      backgroundColor: isActive ? c.accentBg : c.bgCard,
                      gap: 10,
                    }}
                  >
                    <IconComp size={16} color={isActive ? c.accent : c.textSecondary} strokeWidth={2} />
                    <Text style={{
                      color: isActive ? c.text : c.textSecondary,
                      fontSize: 12,
                      fontWeight: isActive ? '700' : '500',
                      flex: 1,
                    }} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {badge !== undefined && badge > 0 && (
                      <View style={{
                        backgroundColor: '#ef4444',
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 5,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                          {badge > 99 ? '99+' : badge}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  /* ─── Bottom Sheet Modal Component ─────────────────────────────────── */

  const renderBottomSheet = () => {
    return (
      <Modal
        visible={selectedBottomSheetSection !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedBottomSheetSection(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedBottomSheetSection(null)} />
          <View style={{
            backgroundColor: c.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 20,
            maxHeight: '60%',
          }}>
            {/* Grab Handle */}
            <View style={{
              width: 40,
              height: 5,
              borderRadius: 3,
              backgroundColor: isDark ? '#444' : '#e2e8f0',
              alignSelf: 'center',
              marginBottom: 16,
            }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {selectedBottomSheetSection?.label || 'Menu'}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedBottomSheetSection(null)}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  backgroundColor: c.bgCard,
                  borderWidth: 1,
                  borderColor: c.borderLight,
                }}
              >
                <ChevronLeft size={16} color={c.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
              </TouchableOpacity>
            </View>

            {/* Sub-menu items */}
            <ScrollView showsVerticalScrollIndicator={true}>
              <View style={{ gap: 8 }}>
                {selectedBottomSheetSection?.items.map((item: any) => {
                  const isActive = pathname.includes(item.route);
                  const IconComp = getIconComponent(item.route);
                  const badge = getBadge(item.route);
                  return (
                    <TouchableOpacity
                      key={item.route}
                      onPress={() => {
                        handleNav(item.route);
                        setSelectedBottomSheetSection(null);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: isActive ? c.accentBg : c.bgCard,
                        borderWidth: 1,
                        borderColor: isActive ? c.accent : c.borderLight,
                        gap: 12,
                      }}
                    >
                      <IconComp size={18} color={isActive ? c.accent : c.textSecondary} />
                      <Text style={{
                        color: isActive ? (isDark ? '#5eead4' : c.accent) : c.text,
                        fontSize: 14,
                        fontWeight: isActive ? '700' : '500',
                        flex: 1,
                      }}>
                        {item.label}
                      </Text>
                      {badge !== undefined && badge > 0 && (
                        <View style={{
                          backgroundColor: '#ef4444',
                          borderRadius: 10,
                          minWidth: 20,
                          height: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 6,
                        }}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                            {badge > 99 ? '99+' : badge}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  /* ─── INLINE (Landscape persistent) ────────────────────────────────── */

  if (inline) {
    return (
      <>
        <View style={[
          {
            width: sidebarWidth,
            backgroundColor: c.bg,
            borderRightWidth: 1,
            borderRightColor: c.borderLight,
            paddingTop: (Math.max(insets.top - 20, 2) + (insets.top > 0 ? insets.top : 16)) / 2,
          },
          style,
        ]}>
          {/* ═══ TOP ZONE: Logo + Store Name ═══ */}
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: sz.headerPadV,
            paddingHorizontal: sz.headerPadH,
            borderBottomWidth: 1,
            borderBottomColor: c.borderLight,
            minHeight: sz.headerMinH,
          }}>
            {collapsed ? (
              /* Collapsed: logo icon + collapse button below it */
              <View style={{ alignItems: 'center', gap: sz.toggleMarginTop + 4 }}>
                <View style={{
                  width: sz.logoSize, height: sz.logoSize, borderRadius: sz.logoRadius,
                  backgroundColor: isDark ? '#4B3621' : '#f0fdfa',
                  alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {settings?.logo_url ? (
                    <Image
                      source={{ uri: settings.logo_url.startsWith('http') ? settings.logo_url : `${process.env.EXPO_PUBLIC_API_URL}${settings.logo_url}` }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Coffee size={sz.logoIconSize} color={isDark ? '#fff' : '#0f172a'} strokeWidth={2} />
                  )}
                </View>
                <TouchableOpacity
                  onPress={onToggleCollapse}
                  style={{
                    width: sz.toggleSize, height: sz.toggleSize, borderRadius: sz.toggleRadius,
                    backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ChevronRight size={sz.toggleIconSize} color={c.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ) : (
              /* Expanded: logo + name + collapse button on the right */
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: isPhoneLandscape ? 6 : 10, width: '100%' }}>
                <View style={{
                  width: sz.logoSize, height: sz.logoSize, borderRadius: sz.logoRadius,
                  backgroundColor: isDark ? '#4B3621' : '#f0fdfa',
                  alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {settings?.logo_url ? (
                    <Image
                      source={{ uri: settings.logo_url.startsWith('http') ? settings.logo_url : `${process.env.EXPO_PUBLIC_API_URL}${settings.logo_url}` }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Coffee size={sz.logoIconSize} color={isDark ? '#fff' : '#0f172a'} strokeWidth={2} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: sz.shopNameSize, fontWeight: '800', letterSpacing: -0.3 }} numberOfLines={1}>
                    {user?.shop?.name || 'SmartPOS'}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: sz.posLabelSize, marginTop: 1 }}>SmartPOS</Text>
                </View>
                <TouchableOpacity
                  onPress={onToggleCollapse}
                  style={{
                    width: sz.toggleSize, height: sz.toggleSize, borderRadius: sz.toggleRadius,
                    backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ChevronLeft size={sz.toggleIconSize} color={c.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ═══ MIDDLE ZONE: Navigation items + Logout at bottom ═══ */}
          <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
            <View style={{ paddingTop: isPhoneLandscape ? 4 : 16, paddingBottom: isPhoneLandscape ? 2 : 8 }}>
              {renderNavigationList(collapsed)}
            </View>
            {/* Logout button at the bottom of navigation */}
            {renderLogoutButton(collapsed)}
          </ScrollView>

          {/* ═══ BOTTOM ZONE: Dark mode toggle + Owner initials ═══ */}
          <View style={{
            borderTopWidth: 1, borderTopColor: c.borderLight,
            padding: sz.bottomPad,
            paddingBottom: insets.bottom + (isPhoneLandscape ? 2 : 8),
            alignItems: collapsed ? 'center' : 'stretch',
          }}>
            {collapsed ? (
              /* Collapsed: avatar + theme toggle stacked */
              <View style={{ gap: sz.bottomGap, alignItems: 'center' }}>
                <TouchableOpacity onPress={toggleTheme} style={{
                  width: sz.themeBtnSize, height: sz.themeBtnSize, borderRadius: sz.themeBtnRadius,
                  backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDark
                    ? <Moon size={sz.themeIconSize} color={c.accent} strokeWidth={2} />
                    : <Sun size={sz.themeIconSize} color={c.accent} strokeWidth={2} />}
                </TouchableOpacity>
                <View style={{
                  width: sz.avatarSize, height: sz.avatarSize, borderRadius: sz.avatarRadius,
                  backgroundColor: c.accent,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: c.textInverse, fontSize: sz.avatarFontSize, fontWeight: '800' }}>
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>
              </View>
            ) : (
              /* Expanded: full user row + theme toggle */
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: isPhoneLandscape ? 6 : 10 }}>
                <View style={{
                  width: sz.avatarSize, height: sz.avatarSize, borderRadius: sz.avatarRadius,
                  backgroundColor: c.accent,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: c.textInverse, fontSize: sz.avatarFontSize, fontWeight: '800' }}>
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: sz.userNameSize, fontWeight: '700' }} numberOfLines={1}>{user?.name || 'Owner'}</Text>
                  <Text style={{ color: c.accent, fontSize: sz.userRoleSize, fontWeight: '700', textTransform: 'uppercase' }}>OWNER</Text>
                </View>
                <TouchableOpacity onPress={toggleTheme} style={{
                  width: sz.themeBtnSize, height: sz.themeBtnSize, borderRadius: sz.themeBtnRadius,
                  backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDark
                    ? <Moon size={sz.themeIconSize} color={c.accent} strokeWidth={2} />
                    : <Sun size={sz.themeIconSize} color={c.accent} strokeWidth={2} />}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        {renderFlyoutPopover()}
        {renderBottomSheet()}
      </>
    );
  }

  /* ─── OVERLAY (Portrait drawer) ────────────────────────────────────── */

  if (!visible && (slideAnim as any)._value === (inline ? -SIDEBAR_EXPANDED_WIDTH : -280)) return null;

  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
        {/* Backdrop */}
        <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' }, { opacity: opacityAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Sidebar panel */}
        <Animated.View style={{
          flex: 1, position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 280,
          backgroundColor: c.bg,
          borderRightWidth: 1, borderRightColor: c.borderLight,
          transform: [{ translateX: slideAnim }],
          paddingTop: insets.top,
          zIndex: 1000,
        }}>
          {/* ═══ TOP ZONE: Logo + Store Name + Close button ═══ */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', padding: 16,
            borderBottomWidth: 1, borderBottomColor: c.borderLight, gap: 10,
          }}>
            <View style={{
              width: 38, height: 38, borderRadius: 10,
              backgroundColor: isDark ? '#4B3621' : '#f0fdfa',
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {settings?.logo_url ? (
                <Image
                  source={{ uri: settings.logo_url.startsWith('http') ? settings.logo_url : `${process.env.EXPO_PUBLIC_API_URL}${settings.logo_url}` }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Coffee size={18} color={isDark ? '#fff' : '#0f172a'} strokeWidth={2} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>
                {user?.shop?.name || 'SmartPOS'}
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 1 }}>SmartPOS</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{
              width: 32, height: 32, borderRadius: 9,
              backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={16} color={c.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* ═══ MIDDLE ZONE: Navigation + Logout at bottom ═══ */}
          <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
            <View style={{ paddingVertical: 8 }}>
              {renderNavigationList(false)}
            </View>
            {/* Logout button at the bottom of navigation */}
            <TouchableOpacity
              onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                marginHorizontal: 8,
                paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
                backgroundColor: c.errorBg, borderWidth: 1,
                borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.2)',
                marginTop: 8,
                marginBottom: 8,
              }}>
              <LogOut size={14} color={c.error} strokeWidth={2} />
              <Text style={{ color: c.error, fontSize: 13, fontWeight: '600' }}>Keluar</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ═══ BOTTOM ZONE: Owner info + Dark mode toggle ═══ */}
          <View style={{
            borderTopWidth: 1, borderTopColor: c.borderLight, padding: 12,
            paddingBottom: insets.bottom + 12,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: c.accent,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: c.textInverse, fontSize: 14, fontWeight: '800' }}>
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{user?.name || 'Owner'}</Text>
                <Text style={{ color: c.accent, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>OWNER</Text>
              </View>
              <TouchableOpacity onPress={toggleTheme} style={{
                width: 32, height: 32, borderRadius: 9,
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
                alignItems: 'center', justifyContent: 'center',
              }}>
                {isDark
                  ? <Moon size={14} color={c.accent} strokeWidth={2} />
                  : <Sun size={14} color={c.accent} strokeWidth={2} />
                }
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
      {renderBottomSheet()}
    </>
  );
}

