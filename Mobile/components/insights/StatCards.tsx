import React, { useState } from 'react';
import { View, Text, useWindowDimensions, ScrollView } from 'react-native';
import { TrendingUp, TrendingDown, Package, Star, DollarSign, Calendar, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';
import { SummaryResponse } from '../../services/aiApi';

interface StatCardsProps {
  summary: SummaryResponse;
}

export default function StatCards({ summary }: StatCardsProps) {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  
  const [activeIndex, setActiveIndex] = useState(0);

  // Responsive card width
  const isTablet = width > 768;
  const cardWidth = isTablet ? width * 0.4 : width * 0.75;
  const snapInterval = cardWidth + 12; // cardWidth + gap

  if (!summary) return null;

  const lowStockColor = summary.low_stock_count > 0 ? c.error : c.success;

  const cards = [
    {
      label: 'Hari Ini',
      value: formatRupiahShort(summary.today_revenue),
      sub: `vs kemarin: ${summary.day_over_day_change_percent >= 0 ? '+' : ''}${summary.day_over_day_change_percent.toFixed(1)}%`,
      trend: summary.day_over_day_change_percent,
      accent: '#f59e0b',
      icon: DollarSign,
    },
    {
      label: 'Minggu Ini',
      value: formatRupiahShort(summary.this_week_revenue),
      sub: `rata-rata: ${formatRupiahShort(Math.round(summary.this_week_revenue / 7))}`,
      trend: summary.week_over_week_change_percent,
      accent: '#0d9488',
      icon: Calendar,
    },
    {
      label: '7 Hari Terakhir',
      value: formatRupiahShort(summary.last_week_revenue),
      sub: 'TOTAL MINGGU LALU',
      trend: null,
      accent: '#6b7280',
      icon: BarChart3,
    },
    {
      label: 'Stock Rendah',
      value: String(summary.low_stock_count),
      sub: 'PERLU RESTOK',
      trend: null,
      accent: lowStockColor,
      icon: Package,
    },
    {
      label: 'Product Terlaris',
      value: summary.top_products_today.length > 18 
        ? summary.top_products_today.substring(0, 18) + '...' 
        : (summary.top_products_today || '-'),
      sub: 'HARI INI',
      trend: null,
      accent: '#7c3aed',
      icon: Star,
    },
  ];

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / snapInterval);
    setActiveIndex(index);
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 32 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {cards.map((card, idx) => {
          const IconComp = card.icon;
          const isPositive = card.trend !== null && card.trend >= 0;
          const isNeutral = card.trend === 0;

          return (
            <View
              key={idx}
              style={{
                width: cardWidth,
                marginRight: 12,
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: c.borderLight,
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.05,
                shadowRadius: 8,
                elevation: 3,
                overflow: 'hidden'
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: c.textSecondary, letterSpacing: 0.5 }}>
                  {card.label}
                </Text>
                <View style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <IconComp size={16} color={card.accent} />
                </View>
              </View>

              <Text style={{ color: c.text, fontSize: 24, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 }}>
                {card.value}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {card.trend !== null ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isNeutral ? (isDark ? '#3f3f46' : '#f4f4f5') : (isPositive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isNeutral ? 'transparent' : (isPositive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)')
                  }}>
                    {!isNeutral && (isPositive ? <TrendingUp size={12} color="#22c55e" /> : <TrendingDown size={12} color="#ef4444" />)}
                    <Text style={{ 
                      fontSize: 10, 
                      fontWeight: '800', 
                      marginLeft: isNeutral ? 0 : 4,
                      color: isNeutral ? c.textMuted : (isPositive ? '#22c55e' : '#ef4444') 
                    }}>
                      {isNeutral ? '0.0%' : `${Math.abs(card.trend).toFixed(1)}%`}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: c.textMuted }}>
                    {card.sub}
                  </Text>
                )}
              </View>
              
              {/* Highlight bar top */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: card.accent, opacity: isDark ? 0.5 : 0.8 }} />
            </View>
          );
        })}
      </ScrollView>

      {/* Dots Indicator */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 6 }}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={{
              height: 6,
              borderRadius: 3,
              width: i === activeIndex ? 20 : 6,
              backgroundColor: i === activeIndex ? c.accent : c.borderLight,
              opacity: i === activeIndex ? 1 : 0.5
            }}
          />
        ))}
      </View>
    </View>
  );
}
