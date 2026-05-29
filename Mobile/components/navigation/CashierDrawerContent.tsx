import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNavigation } from '../../data/navigation';
import { getIconComponent } from '../../utils/iconUtils';
import { LogOut, Sun, Moon, Coffee, ChevronLeft } from 'lucide-react-native';

interface NavItemProps {
  id: string;
  label: string;
  icon: string;
  route: string;
  isActive: boolean;
  isDark: boolean;
  onPress: (route: string) => void;
}

const NavItem = ({
  id,
  label,
  icon,
  route,
  isActive,
  isDark,
  onPress,
}: NavItemProps) => {
  const IconComponent = getIconComponent(icon);

  return (
    <TouchableOpacity
      onPress={() => onPress(route)}
      activeOpacity={0.7}
      style={[
        styles.navItem,
        isActive && (isDark ? styles.navItemActiveDark : styles.navItemActiveLight),
      ]}
    >
      {isActive && <View style={isDark ? styles.activeIndicatorDark : styles.activeIndicatorLight} />}
      {IconComponent && (
        <IconComponent
          size={18}
          color={isActive ? (isDark ? '#14b8a6' : '#0d9488') : isDark ? '#888' : '#999'}
          strokeWidth={2}
        />
      )}
      <Text
        style={[
          styles.navLabel,
          isActive && (isDark ? styles.navLabelActiveDark : styles.navLabelActiveLight),
          isDark ? styles.navLabelDark : styles.navLabelLight,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const SectionLabel = ({ label, isDark }: { label: string | null; isDark: boolean }) => {
  if (!label) return <View style={{ height: 8 }} />;
  return (
    <View style={styles.sectionLabelContainer}>
      <Text
        style={[
          styles.sectionLabelText,
          isDark ? styles.sectionLabelTextDark : styles.sectionLabelTextLight,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

export default function CashierDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useApp();
  const insets = useSafeAreaInsets();
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Get navigation structure based on user role
  const navigation = useMemo(() => {
    return getNavigation(user?.role);
  }, [user?.role]);

  const handleNav = (route: string) => {
    router.push(`/(cashier)/${route}` as any);
    props.navigation?.closeDrawer?.();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const backgroundColor = isDark ? '#111111' : '#ffffff';
  const borderColor = isDark ? '#2e2e2e' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor },
      ]}
    >
      {/* STORE HEADER */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={[styles.logoBox, isDark ? styles.logoBoxDark : styles.logoBoxLight, { overflow: 'hidden' }]}>
          {settings?.logo_url ? (
            <Image
              source={{ uri: settings.logo_url.startsWith('http') ? settings.logo_url : `${process.env.EXPO_PUBLIC_API_URL}${settings.logo_url}` }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Coffee size={18} color={isDark ? '#ffffff' : '#0f172a'} strokeWidth={2} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.shopName, { color: textColor }]}>
            {user?.shop?.name || 'SmartPOS'}
          </Text>
          <Text style={isDark ? styles.posSystemTextDark : styles.posSystemTextLight}>
            SmartPOS
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => props.navigation?.closeDrawer?.()}
          style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]}
        >
          <ChevronLeft
            size={16}
            color={isDark ? '#888' : '#999'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {navigation.sections.map((section, idx) => (
          <View key={section.id}>
            <SectionLabel label={section.label} isDark={isDark} />
            {section.items.map((item) => {
              const isActive = pathname.includes(item.route);
              return (
                <NavItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  route={item.route}
                  isActive={isActive}
                  isDark={isDark}
                  onPress={handleNav}
                />
              );
            })}
            {idx < navigation.sections.length - 1 && (
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* USER AREA */}
      <View
        style={[
          styles.userArea,
          {
            paddingBottom: insets.bottom + 12,
            borderTopColor: borderColor,
            backgroundColor,
          },
        ]}
      >
        <View style={styles.userInfoRow}>
          <View style={[styles.avatar, isDark ? styles.avatarDark : styles.avatarLight]}>
            <Text style={[styles.avatarText, { color: isDark ? '#111111' : '#ffffff' }]}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: textColor }]}>
              {user?.name || 'Cashier'}
            </Text>
            <Text style={[styles.roleTag, { color: isDark ? '#f59e0b' : '#ea580c' }]}>
              {user?.role?.toUpperCase() || 'CASHIER'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeToggle, isDark ? styles.themeToggleDark : styles.themeToggleLight]}
          >
            {isDark ? (
              <Moon size={14} color="#f59e0b" strokeWidth={2} />
            ) : (
              <Sun size={14} color="#ea580c" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={[
            styles.logoutBtn,
            isDark ? styles.logoutBtnDark : styles.logoutBtnLight,
          ]}
        >
          <LogOut
            size={14}
            color={isDark ? '#ef4444' : '#dc2626'}
            strokeWidth={2}
          />
          <Text style={[styles.logoutText, isDark ? styles.logoutTextDark : styles.logoutTextLight]}>
            Keluar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBoxDark: {
    backgroundColor: '#4B3621',
  },
  logoBoxLight: {
    backgroundColor: '#f5f5f5',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  posSystemTextDark: {
    color: '#888',
    fontSize: 11,
    marginTop: 1,
  },
  posSystemTextLight: {
    color: '#999',
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2e2e2e',
  },
  closeBtnLight: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e2e8f0',
  },
  sectionLabelContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionLabelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionLabelTextDark: {
    color: '#444',
  },
  sectionLabelTextLight: {
    color: '#d4d4d4',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 12,
    position: 'relative',
  },
  navItemActiveDark: {
    backgroundColor: 'rgba(13,148,136,0.12)',
  },
  navItemActiveLight: {
    backgroundColor: 'rgba(13,148,136,0.08)',
  },
  activeIndicatorDark: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#0d9488',
  },
  activeIndicatorLight: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#0d9488',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  navLabelDark: {
    color: '#aaa',
  },
  navLabelLight: {
    color: '#555',
  },
  navLabelActiveDark: {
    color: '#5eead4',
    fontWeight: '700',
  },
  navLabelActiveLight: {
    color: '#0d9488',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  userArea: {
    borderTopWidth: 1,
    padding: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDark: {
    backgroundColor: '#0d9488',
  },
  avatarLight: {
    backgroundColor: '#14b8a6',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeToggle: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2e2e2e',
  },
  themeToggleLight: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e2e8f0',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutBtnDark: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutBtnLight: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderColor: 'rgba(220,38,38,0.2)',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutTextDark: {
    color: '#ef4444',
  },
  logoutTextLight: {
    color: '#dc2626',
  },
});
