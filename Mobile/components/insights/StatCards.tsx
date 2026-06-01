import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { TrendingUp, AlertTriangle, Package, DollarSign } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';

interface StatCardsProps {
  summary: any;
  stockAlerts: any;
  topProduct: any;
}

export default function StatCards({ summary, stockAlerts, topProduct }: StatCardsProps) {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  
  const isTablet = width > 768;
  const colWidth = isTablet ? '31%' : '48%';

  if (!summary) return null;

  const renderCard = (title: string, value: string, icon: any, color: string, desc?: string) => (
    <View style={{
      width: colWidth,
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
            {title}
          </Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }}>
            {value}
          </Text>
        </View>
        <View style={{
          width: 32, height: 32, borderRadius: 10,
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          alignItems: 'center', justifyContent: 'center'
        }}>
          {React.createElement(icon, { size: 16, color: color, strokeWidth: 2.5 })}
        </View>
      </View>
      
      {desc && (
        <Text style={{ fontSize: 12, color: color, marginTop: 10, fontWeight: '600' }}>
          {desc}
        </Text>
      )}
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {renderCard(
        'Total Pendapatan',
        formatRupiahShort(summary.revenue),
        DollarSign,
        c.accent,
        summary.transactionCount + ' transaksi'
      )}
      {renderCard(
        'Profit Bersih',
        formatRupiahShort(summary.profit),
        TrendingUp,
        c.accent,
        'Estimasi HPP'
      )}
      {renderCard(
        'Stok Rendah',
        (stockAlerts?.critical || 0).toString(),
        AlertTriangle,
        (stockAlerts?.critical || 0) > 0 ? c.error : c.success,
        (stockAlerts?.critical || 0) > 0 ? 'Butuh restok' : 'Aman'
      )}
      {renderCard(
        'Terlaris',
        topProduct?.name || '-',
        Package,
        c.warning,
        topProduct ? `${topProduct.qty} terjual` : 'Produk andalan'
      )}
    </View>
  );
}
