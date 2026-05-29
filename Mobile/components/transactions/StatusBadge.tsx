import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { HistoryTransactionStatus } from '../../types/historyTransaction';
import { getColors } from '../../utils/theme';

interface StatusBadgeProps {
  status: HistoryTransactionStatus;
  isDark: boolean;
  size?: 'sm' | 'md';
}

function getStatusConfig(status: HistoryTransactionStatus, isDark: boolean) {
  switch (status) {
    case 'completed':
      return {
        label: 'Selesai',
        bg: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(5,150,105,0.12)',
        text: isDark ? '#6ee7b7' : '#065f46',
      };
    case 'pending_void':
      return {
        label: 'Pending Void',
        bg: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(217,119,6,0.12)',
        text: isDark ? '#fcd34d' : '#92400e',
      };
    case 'voided':
      return {
        label: 'Dibatalkan',
        bg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(220,38,38,0.12)',
        text: isDark ? '#fca5a5' : '#991b1b',
      };
    default:
      return { label: status, bg: 'transparent', text: '#888' };
  }
}

export default function StatusBadge({ status, isDark, size = 'sm' }: StatusBadgeProps) {
  const cfg = getStatusConfig(status, isDark);
  const isMd = size === 'md';

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, isMd && styles.badgeMd]}>
      <Text
        style={[
          styles.text,
          { color: cfg.text },
          isMd && styles.textMd,
        ]}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  textMd: {
    fontSize: 11,
  },
});
