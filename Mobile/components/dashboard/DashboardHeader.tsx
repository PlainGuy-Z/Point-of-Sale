import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { Wifi, WifiOff, Users, RefreshCw, Menu } from 'lucide-react-native';
import { useLayout } from '../../hooks/useLayout';
import { useSync } from '../../contexts/SyncContext';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { aiApi } from '../../services/aiApi';

interface DashboardHeaderProps {
  onMenuPress?: () => void;
  showMenu?: boolean;
  branchSelector?: React.ReactNode;
}

export default function DashboardHeader({ onMenuPress, showMenu, branchSelector }: DashboardHeaderProps) {
  const { mode } = useLayout();
  const { isOnline, pendingCount, isSyncing } = useSync();
  const { user } = useAuth();
  const { activeShift } = useShift();
  const isLandscapeTablet = mode === 'tablet-landscape';
  
  const [activeShiftsCount, setActiveShiftsCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (user?.role === 'owner') {
      aiApi.fetchSummary().then(data => {
        setActiveShiftsCount(data.active_shifts_count);
      }).catch(err => {
        console.error('Failed to fetch active shifts:', err);
      });
    }
  }, [user?.role]);

  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  
  const userName = user?.name ? user.name.split(' ')[0] : 'Azlan';

  return (
    <View style={[styles.container, { marginTop: isLandscapeTablet ? 16 : 8 }]}>
      {/* Background Graphic */}
      <View style={styles.backgroundContainer}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="blob1" cx="20%" cy="10%" r="60%" fx="20%" fy="10%">
              <Stop offset="0%" stopColor="#E8FFF8" stopOpacity="1" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="blob2" cx="80%" cy="50%" r="50%" fx="80%" fy="50%">
              <Stop offset="0%" stopColor="#d1fae5" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="#ffffff" />
          <Circle cx="0%" cy="0%" r="250" fill="url(#blob1)" />
          <Circle cx="100%" cy="50%" r="300" fill="url(#blob2)" />
        </Svg>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Optional Menu & Branch Selector Top Row */}
        {(showMenu || branchSelector) && (
          <View style={styles.controlsRow}>
            {showMenu ? (
              <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
                <Menu size={16} color="#0F9D8A" />
              </TouchableOpacity>
            ) : <View />}
            {branchSelector}
          </View>
        )}

        <View style={styles.topSection}>
          <View style={styles.textSection}>
            <View style={styles.greetingRow}>
              <Text style={styles.waveIcon}>👋</Text>
              <Text style={styles.greetingText}>Selamat Pagi, {userName}</Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.titleBold}>SmartPOS</Text>
            </View>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          <View style={styles.illustrationSection}>
            <HeaderIllustration />
          </View>
        </View>

        {/* Cards Row */}
        <View style={styles.cardsRow}>
          <InfoCard 
            isLandscape={isLandscapeTablet}
            icon={isOnline ? <Wifi size={16} color="#0F9D8A" /> : <WifiOff size={16} color="#f59e0b" />}
            title={isOnline ? "Online" : "Offline"}
            subtitle={isOnline ? "Semua sistem normal" : "Tunggu koneksi"}
          />
          {user?.role === 'owner' ? (
            <InfoCard 
              isLandscape={isLandscapeTablet}
              icon={<Users size={16} color="#0F9D8A" />}
              title={`${activeShiftsCount ?? '-'} Kasir Aktif`}
              subtitle="Sedang shift"
            />
          ) : (
            <InfoCard 
              isLandscape={isLandscapeTablet}
              icon={<Users size={16} color="#0F9D8A" />}
              title={activeShift?.status === 'open' ? "Shift Aktif" : "Shift Tutup"}
              subtitle={activeShift?.status === 'open' ? `Kasir: ${activeShift.cashier_name.split(' ')[0]}` : "Buka shift"}
            />
          )}
          <InfoCard 
            isLandscape={isLandscapeTablet}
            icon={<RefreshCw size={16} color="#0F9D8A" />}
            title="Sinkronisasi"
            subtitle={isSyncing ? "Sedang sinkron" : pendingCount > 0 ? `${pendingCount} tertunda` : "Tersinkron"}
          />
        </View>
      </View>
    </View>
  );
}


function InfoCard({ icon, title, subtitle, isLandscape }: { icon: React.ReactNode, title: string, subtitle: string, isLandscape?: boolean }) {
  return (
    <View style={[styles.cardContainer, { 
      flexDirection: isLandscape ? 'row' : 'column', 
      padding: isLandscape ? 10 : 8,
      alignItems: isLandscape ? 'center' : 'center',
      justifyContent: isLandscape ? 'flex-start' : 'center',
      minHeight: isLandscape ? 48 : 64,
    }]}>
      <View style={[styles.iconContainer, { 
        marginRight: isLandscape ? 8 : 0, 
        marginBottom: isLandscape ? 0 : 4,
        width: isLandscape ? 28 : 32,
        height: isLandscape ? 28 : 32,
      }]}>
        {icon}
      </View>
      <View style={[styles.cardTextContainer, { alignItems: isLandscape ? 'flex-start' : 'center' }]}>
        <Text style={[styles.cardTitle, { 
          textAlign: isLandscape ? 'left' : 'center', 
          fontSize: isLandscape ? 12 : 11,
        }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.cardSubtitle, { 
          textAlign: isLandscape ? 'left' : 'center', 
          fontSize: isLandscape ? 9 : 9,
        }]} numberOfLines={2}>{subtitle}</Text>
      </View>
    </View>
  );
}

function HeaderIllustration() {
  return (
    <Svg width="120" height="80" viewBox="0 0 180 120">
      <G opacity="0.8">
        {/* Plant */}
        <Path d="M150 55 Q135 40 150 25 Q165 40 150 55" fill="#a7f3d0" />
        <Path d="M150 55 Q165 45 175 45 Q165 60 150 55" fill="#6ee7b7" />
        <Path d="M150 55 Q130 50 130 65 Q145 65 150 55" fill="#34d399" />
        <Rect x="140" y="55" width="20" height="25" rx="3" fill="#fef3c7" />
        
        {/* Printer */}
        <Rect x="110" y="90" width="45" height="30" rx="6" fill="#ecfdf5" stroke="#d1fae5" strokeWidth="2" />
        <Rect x="115" y="100" width="35" height="5" rx="2" fill="#a7f3d0" />
        <Path d="M120 90 L120 60 L145 60 L145 90 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <Path d="M125 68 L140 68 M125 76 L135 76 M125 84 L140 84" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />

        {/* POS Monitor Base */}
        <Path d="M60 105 L95 105 L105 120 L50 120 Z" fill="#a7f3d0" />
        <Rect x="70" y="85" width="15" height="20" fill="#6ee7b7" />
        
        {/* POS Monitor Screen */}
        <Rect x="25" y="15" width="100" height="70" rx="8" fill="#34d399" />
        <Rect x="30" y="20" width="90" height="60" rx="4" fill="#ffffff" />
        <Rect x="35" y="25" width="80" height="15" rx="2" fill="#f8fafc" />
        <Rect x="35" y="45" width="50" height="30" rx="2" fill="#f8fafc" />
        <Rect x="90" y="45" width="25" height="30" rx="2" fill="#f8fafc" />
        
        {/* Coffee Cup */}
        <Path d="M0 80 L10 120 L30 120 L40 80 Z" fill="#fffbeb" stroke="#fef3c7" strokeWidth="2" />
        <Rect x="-2" y="70" width="44" height="12" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <Path d="M10 65 Q20 55 30 65" stroke="#cbd5e1" strokeWidth="2" fill="none" />
        <Path d="M15 60 Q20 50 25 60" stroke="#cbd5e1" strokeWidth="2" fill="none" />
        {/* Leaf on cup */}
        <Path d="M20 100 Q15 95 20 90 Q25 95 20 100" fill="#a7f3d0" />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    minHeight: 180,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0F9D8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 12,
    justifyContent: 'space-between',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 20,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  textSection: {
    flex: 1,
    zIndex: 10,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  waveIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  greetingText: {
    fontSize: 13,
    color: '#0F9D8A',
    fontWeight: '700',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  titleBold: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  titleRegular: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0F9D8A',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  illustrationSection: {
    position: 'absolute',
    right: -30,
    top: -10,
    opacity: 0.85,
    zIndex: 1,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 10,
  },
  cardContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    minHeight: 48,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8FFF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 1,
  },
  cardSubtitle: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '500',
  },
});