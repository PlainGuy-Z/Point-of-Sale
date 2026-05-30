import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { TrendingUp, AlertTriangle, Package, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { SummaryResponse } from '../../services/aiApi';
import { formatRupiahShort } from '../../utils/currency';

interface StatCardsProps {
  summary: SummaryResponse | null;
}

export default function StatCards({ summary }: StatCardsProps) {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  
  // Responsive: 2 cols if small, maybe 3-4 cols if tablet
  const isTablet = width > 768;
  const colWidth = isTablet ? '31%' : '48%';

  if (!summary) return null;

  const renderCard = (title: string, value: string, icon: any, color: string, trendPercent?: number, desc?: string) => (
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
      
      {trendPercent !== undefined && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
          {trendPercent > 0 ? (
            <ArrowUpRight size={14} color={c.success} />
          ) : trendPercent < 0 ? (
            <ArrowDownRight size={14} color={c.error} />
          ) : null}
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: trendPercent > 0 ? c.success : (trendPercent < 0 ? c.error : c.textMuted)
          }}>
            {trendPercent > 0 ? '+' : ''}{trendPercent.toFixed(1)}%
          </Text>
          {desc && (
            <Text style={{ fontSize: 11, color: c.textMuted, marginLeft: 2 }}>{desc}</Text>
          )}
        </View>
      )}
      
      {desc && trendPercent === undefined && (
        <Text style={{ fontSize: 12, color: color, marginTop: 10, fontWeight: '600' }}>
          {desc}
        </Text>
      )}
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {renderCard(
        'Omzet Hari Ini',
        formatRupiahShort(summary.today_revenue),
        DollarSign,
        c.accent,
        summary.day_over_day_change_percent,
        'vs kemarin'
      )}
      {renderCard(
        'Omzet Minggu Ini',
        formatRupiahShort(summary.this_week_revenue),
        TrendingUp,
        c.accent,
        summary.week_over_week_change_percent,
        'vs minggu lalu'
      )}
      {renderCard(
        'Stok Rendah',
        summary.low_stock_count.toString(),
        AlertTriangle,
        summary.low_stock_count > 0 ? c.error : c.success,
        undefined,
        summary.low_stock_count > 0 ? 'Butuh restok' : 'Aman'
      )}
      {renderCard(
        'Terlaris Hari Ini',
        summary.top_products_today || '-',
        Package,
        c.warning,
        undefined,
        'Produk andalan'
      )}
    </View>
  );
}
