/**
 * TransactionSyncBadge — Small badge showing sync status on transaction cards
 * 
 * Badges:
 *   ☁️  synced — tersinkronkan
 *   ⏳  pending — menunggu sync
 *   🔄  syncing — sedang di-sync
 *   ⚠️  needs_review — perlu review
 *   ❌  rejected — ditolak server
 *   📱  offline — dibuat offline (informational)
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Cloud, Clock, RefreshCw, AlertTriangle, XCircle, Smartphone } from 'lucide-react-native';
import { useColors } from '../../utils/theme';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'needs_review' | 'rejected' | 'offline';

interface Props {
  status: SyncStatus;
  compact?: boolean;
}

const STATUS_CONFIG: Record<SyncStatus, {
  label: string;
  icon: typeof Cloud;
  lightBg: string;
  darkBg: string;
  lightText: string;
  darkText: string;
}> = {
  synced: {
    label: 'Tersinkron',
    icon: Cloud,
    lightBg: 'rgba(34,197,94,0.08)',
    darkBg: 'rgba(34,197,94,0.15)',
    lightText: '#16A34A',
    darkText: '#86EFAC',
  },
  pending: {
    label: 'Menunggu Sync',
    icon: Clock,
    lightBg: 'rgba(245,158,11,0.08)',
    darkBg: 'rgba(245,158,11,0.15)',
    lightText: '#D97706',
    darkText: '#FCD34D',
  },
  syncing: {
    label: 'Menyinkronkan...',
    icon: RefreshCw,
    lightBg: 'rgba(59,130,246,0.08)',
    darkBg: 'rgba(59,130,246,0.15)',
    lightText: '#2563EB',
    darkText: '#93C5FD',
  },
  needs_review: {
    label: 'Perlu Review',
    icon: AlertTriangle,
    lightBg: 'rgba(239,68,68,0.08)',
    darkBg: 'rgba(239,68,68,0.15)',
    lightText: '#DC2626',
    darkText: '#FCA5A5',
  },
  rejected: {
    label: 'Ditolak',
    icon: XCircle,
    lightBg: 'rgba(239,68,68,0.08)',
    darkBg: 'rgba(239,68,68,0.15)',
    lightText: '#DC2626',
    darkText: '#FCA5A5',
  },
  offline: {
    label: 'Offline',
    icon: Smartphone,
    lightBg: 'rgba(107,114,128,0.08)',
    darkBg: 'rgba(107,114,128,0.15)',
    lightText: '#6B7280',
    darkText: '#9CA3AF',
  },
};

export default function TransactionSyncBadge({ status, compact = false }: Props) {
  const { isDark } = useColors();
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;
  const bg = isDark ? config.darkBg : config.lightBg;
  const textColor = isDark ? config.darkText : config.lightText;

  if (compact) {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: bg,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 6,
      }}>
        <Icon size={9} color={textColor} strokeWidth={2.5} />
      </View>
    );
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: bg,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    }}>
      <Icon size={10} color={textColor} strokeWidth={2.5} />
      <Text style={{
        color: textColor,
        fontSize: 9,
        fontWeight: '700',
      }}>
        {config.label}
      </Text>
    </View>
  );
}
