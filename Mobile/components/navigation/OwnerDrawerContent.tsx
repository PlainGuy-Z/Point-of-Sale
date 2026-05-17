import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Dimensions, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Coffee, ChevronLeft, LogOut, Sun, Moon,
  LayoutDashboard, ShoppingCart, BarChart2, Trash2, Package, Layers,
  Users, Trophy, BrainCircuit, Receipt, ClipboardList, UserCheck,
  Settings, HelpCircle, MoreHorizontal,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.8;

interface OwnerSidebarProps {
  visible: boolean;
  onClose: () => void;
}

const iconMap: Record<string, any> = {
  dashboard: LayoutDashboard, pos: ShoppingCart, 'sales-report': BarChart2,
  'waste-log': Trash2, products: Package, inventory: Layers,
  members: Users, loyalty: Trophy, insights: BrainCircuit,
  transactions: Receipt, shifts: ClipboardList, users: UserCheck,
  settings: Settings, help: HelpCircle, more: MoreHorizontal,
};

export default function OwnerSidebar({ visible, onClose }: OwnerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const insets = useSafeAreaInsets();
  
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible && (slideAnim as any)._value === -SIDEBAR_WIDTH) return null;

  const navSections = [
    { label: null, items: [{ label: 'Dashboard', route: 'dashboard' }] },
    { label: 'HARIAN', items: [
      { label: 'Point of Sale', route: 'pos' },
      { label: 'Laporan Penjualan', route: 'sales-report' },
      { label: 'Waste Log', route: 'waste-log' },
    ]},
    { label: 'PRODUK & STOK', items: [
      { label: 'Manajemen Produk', route: 'products' },
      { label: 'Inventory & Biaya', route: 'inventory' },
    ]},
    { label: 'PELANGGAN', items: [
      { label: 'Members', route: 'members' },
      { label: 'Loyalty & Kunjungan', route: 'loyalty' },
    ]},
    { label: 'LAPORAN & ANALITIK', items: [
      { label: 'Business Intelligence', route: 'insights' },
      { label: 'Riwayat Transaksi', route: 'transactions' },
      { label: 'Laporan Shift', route: 'shifts' },
    ]},
    { label: 'MANAJEMEN', items: [
      { label: 'Manajemen Kasir', route: 'users' },
      { label: 'Settings', route: 'settings' },
      { label: 'Help Center', route: 'help' },
    ]},
  ];

  const handleNav = (route: string) => {
    router.push(`/(owner)/${route}` as any);
    onClose();
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' }, { opacity: opacityAnim }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View style={{
        flex: 1, position: 'absolute', left: 0, top: 0, bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: c.bg,
        borderRightWidth: 1, borderRightColor: c.borderLight,
        transform: [{ translateX: slideAnim }],
        paddingTop: insets.top,
        zIndex: 1000,
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', padding: 16,
          borderBottomWidth: 1, borderBottomColor: c.borderLight, gap: 10,
        }}>
          <View style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: isDark ? '#4B3621' : '#f0fdfa',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Coffee size={18} color={isDark ? '#fff' : '#0f172a'} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>
              {user?.shop?.name || 'SmartPOS'}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 1 }}>POS System</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{
            width: 32, height: 32, borderRadius: 9,
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronLeft size={16} color={c.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {navSections.map((section, idx) => (
            <View key={idx}>
              {section.label && (
                <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 }}>
                  <Text style={{
                    color: c.textMuted, fontSize: 10, fontWeight: '700',
                    letterSpacing: 1.2, textTransform: 'uppercase',
                  }}>{section.label}</Text>
                </View>
              )}
              {section.items.map((item) => {
                const isActive = pathname.includes(item.route);
                const IconComp = iconMap[item.route] || Settings;
                return (
                  <TouchableOpacity key={item.route} onPress={() => handleNav(item.route)}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      marginHorizontal: 8, paddingHorizontal: 12, paddingVertical: 11,
                      borderRadius: 12, gap: 12, position: 'relative',
                      backgroundColor: isActive ? c.accentBg : 'transparent',
                    }}>
                    {isActive && (
                      <View style={{
                        position: 'absolute', left: 0, top: 6, bottom: 6,
                        width: 3, borderRadius: 2, backgroundColor: c.accent,
                      }} />
                    )}
                    <IconComp size={17} color={isActive ? c.accent : c.textSecondary} strokeWidth={2} />
                    <Text style={{
                      color: isActive ? (isDark ? '#5eead4' : c.accent) : c.textSecondary,
                      fontSize: 13, fontWeight: isActive ? '700' : '500', flex: 1,
                    }}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
              {idx < navSections.length - 1 && (
                <View style={{ height: 1, backgroundColor: c.borderLight, marginHorizontal: 16, marginVertical: 4 }} />
              )}
            </View>
          ))}
        </ScrollView>

        {/* User Area */}
        <View style={{
          borderTopWidth: 1, borderTopColor: c.borderLight, padding: 12,
          paddingBottom: insets.bottom + 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
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
          <TouchableOpacity onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
              backgroundColor: c.errorBg, borderWidth: 1,
              borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.2)',
            }}>
            <LogOut size={14} color={c.error} strokeWidth={2} />
            <Text style={{ color: c.error, fontSize: 13, fontWeight: '600' }}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
