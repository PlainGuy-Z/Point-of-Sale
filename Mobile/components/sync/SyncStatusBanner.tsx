/**
 * SyncStatusBanner — Displays sync status below POS header
 * 
 * States:
 *   🟢 Online (hidden when no pending)
 *   🟡 Offline — X transaksi menunggu sync
 *   🔄 Menyinkronkan X transaksi...
 *   ⚠️ X transaksi perlu review owner
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Check } from 'lucide-react-native';
import { useSync } from '../../contexts/SyncContext';
import { useColors } from '../../utils/theme';

export default function SyncStatusBanner() {
  const { isOnline, isSyncing, pendingCount, needsReviewCount, triggerSync } = useSync();
  const { colors: c, isDark } = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while syncing
  useEffect(() => {
    if (isSyncing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSyncing, pulseAnim]);

  // Don't show banner when online with no pending items and no review needed
  if (isOnline && pendingCount === 0 && needsReviewCount === 0 && !isSyncing) {
    return null;
  }

  // Determine banner state
  let bgColor: string;
  let textColor: string;
  let IconComponent: typeof Cloud;
  let message: string;
  let showTapAction = false;

  if (isSyncing) {
    bgColor = isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)';
    textColor = isDark ? '#93C5FD' : '#2563EB';
    IconComponent = RefreshCw;
    message = `Menyinkronkan ${pendingCount} transaksi...`;
  } else if (!isOnline && pendingCount > 0) {
    bgColor = isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)';
    textColor = isDark ? '#FCD34D' : '#D97706';
    IconComponent = CloudOff;
    message = `Offline — ${pendingCount} transaksi menunggu sync`;
  } else if (!isOnline) {
    bgColor = isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)';
    textColor = isDark ? '#FCD34D' : '#D97706';
    IconComponent = CloudOff;
    message = 'Offline — transaksi disimpan lokal';
  } else if (needsReviewCount > 0) {
    bgColor = isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)';
    textColor = isDark ? '#FCA5A5' : '#DC2626';
    IconComponent = AlertTriangle;
    message = `${needsReviewCount} transaksi perlu review owner`;
  } else if (pendingCount > 0) {
    bgColor = isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.06)';
    textColor = isDark ? '#FCD34D' : '#D97706';
    IconComponent = Cloud;
    message = `${pendingCount} transaksi menunggu sync`;
    showTapAction = true;
  } else {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={showTapAction || (isOnline && pendingCount > 0) ? 0.7 : 1}
      onPress={isOnline && pendingCount > 0 && !isSyncing ? () => triggerSync() : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginBottom: 6,
        backgroundColor: bgColor,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: `${textColor}22`,
      }}
    >
      <Animated.View style={{ opacity: isSyncing ? pulseAnim : 1 }}>
        <IconComponent size={13} color={textColor} strokeWidth={2.5} />
      </Animated.View>

      <Text style={{
        color: textColor,
        fontSize: 11,
        fontWeight: '700',
        flex: 1,
      }}>
        {message}
      </Text>

      {showTapAction && isOnline && (
        <Text style={{ color: textColor, fontSize: 10, fontWeight: '600', opacity: 0.7 }}>
          Ketuk untuk sync
        </Text>
      )}
    </TouchableOpacity>
  );
}
