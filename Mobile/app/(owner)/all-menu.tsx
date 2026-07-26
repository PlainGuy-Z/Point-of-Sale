import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Receipt, ClipboardList, UserCheck, BrainCircuit, Layers, Users, Trash2, HelpCircle,
  X, LayoutDashboard, BarChart2, ShoppingCart, Package, Settings, Trophy
} from 'lucide-react-native';
import { useColors } from '../../hooks/useColors';
import { useStableOrientation } from '../../hooks/useStableOrientation';

interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  color: string;
}

const MENU_CATEGORIES: { title: string; items: MenuItem[] }[] = [
  {
    title: 'AKSI CEPAT',
    items: [
      { id: 'dashboard', label: 'Dashboard', route: '/(owner)/dashboard', icon: LayoutDashboard, color: '#10b981' },
      { id: 'pos', label: 'Kasir (POS)', route: '/(owner)/pos', icon: ShoppingCart, color: '#0d9488' },
      { id: 'sales-report', label: 'Laporan', route: '/(owner)/sales-report', icon: BarChart2, color: '#eab308' },
      { id: 'transactions', label: 'Riwayat', route: '/(owner)/transactions', icon: Receipt, color: '#06b6d4' },
    ],
  },
  {
    title: 'PRODUK & STOK',
    items: [
      { id: 'products', label: 'Produk', route: '/(owner)/products', icon: Package, color: '#0284c7' },
      { id: 'inventory', label: 'Inventory', route: '/(owner)/inventory', icon: Layers, color: '#3b82f6' },
      { id: 'waste-log', label: 'Waste Log', route: '/(owner)/waste-log', icon: Trash2, color: '#ef4444' },
    ],
  },
  {
    title: 'PELANGGAN',
    items: [
      { id: 'members', label: 'Members', route: '/(owner)/members', icon: Users, color: '#10b981' },
      { id: 'loyalty', label: 'Loyalty', route: '/(owner)/loyalty', icon: Trophy, color: '#f59e0b' },
    ],
  },
  {
    title: 'TIM & AKSES',
    items: [
      { id: 'users', label: 'Kelola Kasir', route: '/(owner)/users', icon: UserCheck, color: '#ec4899' },
    ],
  },
  {
    title: 'ANALITIK & LAINNYA',
    items: [
      { id: 'insights', label: 'Insights', route: '/(owner)/insights', icon: BrainCircuit, color: '#8b5cf6' },
      { id: 'shifts', label: 'Laporan Shift', route: '/(owner)/shifts', icon: ClipboardList, color: '#6366f1' },
      { id: 'settings', label: 'Pengaturan', route: '/(owner)/settings', icon: Settings, color: '#64748b' },
      { id: 'help', label: 'Help Center', route: '/(owner)/help', icon: HelpCircle, color: '#4f46e5' },
    ],
  },
];

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AllMenuScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useColors();
  const { isLandscape } = useStableOrientation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: c.borderLight,
          backgroundColor: c.bg,
        }}
      >
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>Semua Menu</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.borderLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color={c.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Main Content List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: !isLandscape ? 100 + insets.bottom : insets.bottom + 24,
          gap: 24,
        }}
      >
        {MENU_CATEGORIES.map((section) => (
          <View key={section.title} style={{ gap: 12 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: c.textSecondary,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {section.title}
            </Text>

            {/* 4 Column Grid */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const badgeBg = hexToRgba(item.color, isDark ? 0.18 : 0.1);

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.7}
                    style={{
                      width: '22.8%',
                      backgroundColor: c.bgCard,
                      borderRadius: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: c.borderLight,
                      shadowColor: '#000',
                      shadowOpacity: isDark ? 0.2 : 0.04,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {/* Squircle Badge */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 16,
                        backgroundColor: badgeBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <IconComponent size={22} color={item.color} strokeWidth={2} />
                    </View>
                    {/* Label */}
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: c.text,
                        textAlign: 'center',
                        lineHeight: 13,
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
