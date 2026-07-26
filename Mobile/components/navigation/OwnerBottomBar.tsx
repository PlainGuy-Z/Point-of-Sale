import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, BarChart2, ShoppingCart, Package, Settings } from 'lucide-react-native';
import { useColors } from '../../hooks/useColors';
import { useStableOrientation } from '../../hooks/useStableOrientation';
import type { ThemeColors } from '../../utils/theme';

interface TabItemProps {
  label: string;
  route: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  isActive: boolean;
  isFab?: boolean;
  colors: ThemeColors;
  isDark: boolean;
  onPress: (route: string) => void;
}

const TabItem = React.memo(function TabItem({
  label,
  route,
  icon: IconComponent,
  isActive,
  isFab,
  colors: c,
  onPress,
}: TabItemProps) {
  if (isFab) {
    return (
      <TouchableOpacity
        onPress={() => onPress(route)}
        activeOpacity={0.85}
        style={{
          top: -4,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: c.accent,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 5,
            elevation: 8,
            borderWidth: 2.5,
            borderColor: c.bgCard,
          }}
        >
          <IconComponent size={20} color={c.textInverse} strokeWidth={2.5} />
        </View>
        <Text
          style={{
            fontSize: 9,
            fontWeight: '800',
            color: isActive ? c.accent : c.textSecondary,
            marginTop: 1,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(route)}
      activeOpacity={0.7}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
      }}
    >
      <IconComponent
        size={20}
        color={isActive ? c.accent : c.tabInactive}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <Text
        numberOfLines={1}
        style={{
          fontSize: 9.5,
          fontWeight: isActive ? '800' : '500',
          color: isActive ? c.accent : c.tabInactive,
          marginTop: 3,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

export default function OwnerBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isLandscape } = useStableOrientation();
  const { colors: c, isDark } = useColors();

  // Only render on mobile portrait mode
  if (isLandscape) {
    return null;
  }

  const handleNavigate = useCallback(
    (route: string) => {
      const targetRoute = `/(owner)/${route}`;
      if (!pathname.includes(route)) {
        router.push(targetRoute as any);
      }
    },
    [pathname, router]
  );

  const tabs = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: 'dashboard' },
      { id: 'sales-report', label: 'Laporan', icon: BarChart2, route: 'sales-report' },
      { id: 'pos', label: 'POS', icon: ShoppingCart, route: 'pos', isFab: true },
      { id: 'products', label: 'Produk', icon: Package, route: 'products' },
      { id: 'settings', label: 'Pengaturan', icon: Settings, route: 'settings' },
    ],
    []
  );

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: c.bgCard,
        borderTopWidth: 1,
        borderTopColor: c.borderLight,
        paddingBottom: Math.max(insets.bottom, 4),
        paddingTop: 3,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        zIndex: 999,
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.route);
        return (
          <TabItem
            key={tab.id}
            label={tab.label}
            route={tab.route}
            icon={tab.icon}
            isActive={isActive}
            isFab={tab.isFab}
            colors={c}
            isDark={isDark}
            onPress={handleNavigate}
          />
        );
      })}
    </View>
  );
}
