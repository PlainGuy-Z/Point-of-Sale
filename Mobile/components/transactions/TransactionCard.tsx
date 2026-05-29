import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { HistoryTransaction } from '../../types/historyTransaction';
import StatusBadge from './StatusBadge';
import { getColors, type ThemeColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import { formatTime } from '../../utils/dateFormatter';

interface TransactionCardProps {
  transaction: HistoryTransaction;
  isDark: boolean;
  showCashier?: boolean;
  onDetail: (t: HistoryTransaction) => void;
  buttonLabel?: string;
}

function itemSummary(t: HistoryTransaction, maxItems = 3): string {
  return (
    (t.items || [])
      .slice(0, maxItems)
      .map((it) => `${it.product_name} ×${it.quantity}`)
      .join(', ') || 'Tanpa detail item'
  );
}

function orderTypeLabel(type: HistoryTransaction['order_type']): string {
  return type === 'takeaway' ? 'Take-away' : 'Dine-in';
}

export default function TransactionCard({
  transaction: t,
  isDark,
  showCashier = false,
  onDetail,
  buttonLabel = 'Lihat Detail',
}: TransactionCardProps) {
  const c = getColors(isDark);

  return (
    <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
      {/* Top row: ID + Time left, Status + Order Type right */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={[styles.idText, { color: c.textMuted }]}>
            #{t.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={[styles.timeText, { color: c.text }]}>
            {formatTime(t.created_at)}
          </Text>
        </View>
        <View style={styles.topRight}>
          <StatusBadge status={t.status} isDark={isDark} />
          <View style={[styles.orderBadge, { borderColor: c.border }]}>
            <Text style={[styles.orderBadgeText, { color: c.textSecondary }]}>
              {orderTypeLabel(t.order_type)}
            </Text>
          </View>
        </View>
      </View>

      {/* Customer + Cashier */}
      <View style={styles.metaRow}>
        <Text style={[styles.customerText, { color: c.text }]} numberOfLines={1}>
          {t.customer_name?.trim() || 'Umum'}
        </Text>
        {showCashier && t.cashier_name && (
          <Text style={[styles.cashierText, { color: c.textMuted }]} numberOfLines={1}>
            Kasir: {t.cashier_name}
          </Text>
        )}
      </View>

      {/* Item summary */}
      <Text style={[styles.itemsText, { color: c.textSecondary }]} numberOfLines={2}>
        {itemSummary(t)}
      </Text>

      {/* Bottom row: Payment method + Total + Button */}
      <View style={[styles.bottomRow, { borderTopColor: c.border }]}>
        <Text style={[styles.paymentText, { color: c.accent }]}>
          {String(t.payment_method)}
        </Text>
        <View style={styles.bottomRight}>
          <Text style={[styles.totalText, { color: c.accent }]}>
            {formatRupiah(t.total_amount)}
          </Text>
          <TouchableOpacity
            onPress={() => onDetail(t)}
            style={[styles.detailBtn, { borderColor: c.accent + '80' }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.detailBtnText, { color: c.accent }]}>
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topLeft: {
    flex: 1,
    marginRight: 8,
  },
  idText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '900',
  },
  topRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  orderBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaRow: {
    marginBottom: 4,
  },
  customerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cashierText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  itemsText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '900',
  },
  detailBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
