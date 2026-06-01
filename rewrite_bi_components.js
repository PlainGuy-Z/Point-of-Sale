const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'Mobile', 'components', 'insights');

// 1. StatCards
const statCardsContent = `import React from 'react';
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
        topProduct ? \`\${topProduct.qty} terjual\` : 'Produk andalan'
      )}
    </View>
  );
}
`;
fs.writeFileSync(path.join(componentsDir, 'StatCards.tsx'), statCardsContent);

// 2. RevenueChart
const revenueChartContent = `import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

export default function RevenueChart({ trendData }: { trendData: any[] }) {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const isTablet = width > 768;

  if (!trendData || trendData.length === 0) return null;

  // Take up to 7 items for the chart to not overcrowd
  const displayData = trendData.slice(-7);
  
  const labels = displayData.map(d => {
    const parts = d.date.split('-');
    if (parts.length === 3) return \`\${parts[2]}/\${parts[1]}\`;
    return d.date;
  });
  const data = displayData.map(d => d.revenue);

  return (
    <View style={{
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      overflow: 'hidden'
    }}>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 16 }}>
        Tren Pendapatan
      </Text>
      
      <LineChart
        data={{
          labels,
          datasets: [{ data }]
        }}
        width={width - 64}
        height={220}
        yAxisLabel="Rp"
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: c.bgCard,
          backgroundGradientFrom: c.bgCard,
          backgroundGradientTo: c.bgCard,
          decimalPlaces: 0,
          color: (opacity = 1) => isDark ? \`rgba(255, 255, 255, \${opacity})\` : \`rgba(0, 0, 0, \${opacity})\`,
          labelColor: (opacity = 1) => isDark ? \`rgba(255, 255, 255, \${opacity})\` : \`rgba(0, 0, 0, \${opacity})\`,
          style: { borderRadius: 16 },
          propsForDots: { r: "4", strokeWidth: "2", stroke: c.accent }
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 16, marginLeft: -16 }}
      />
    </View>
  );
}
`;
fs.writeFileSync(path.join(componentsDir, 'RevenueChart.tsx'), revenueChartContent);

// 3. WastePanel
const wastePanelContent = `import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';

export default function WastePanel({ wasteInsights }: { wasteInsights: any }) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  if (!wasteInsights) return null;

  return (
    <View style={{
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>
          Analisis Waste (Kerugian)
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.error + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <AlertCircle size={20} color={c.error} />
        </View>
        <View>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>Total Kerugian (HPP)</Text>
          <Text style={{ color: c.error, fontSize: 18, fontWeight: '800' }}>
            {formatRupiahShort(wasteInsights.totalLoss)}
          </Text>
        </View>
      </View>

      <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Top Item Terbuang</Text>
      {wasteInsights.topWaste && wasteInsights.topWaste.length > 0 ? (
        wasteInsights.topWaste.map((item: any, idx: number) => (
          <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx < wasteInsights.topWaste.length - 1 ? 1 : 0, borderBottomColor: c.borderLight }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginLeft: 8 }}>({item.wasteQty}x)</Text>
            </View>
            <Text style={{ color: c.error, fontSize: 14, fontWeight: '700' }}>{formatRupiahShort(item.wasteCost)}</Text>
          </View>
        ))
      ) : (
        <Text style={{ color: c.textMuted, fontSize: 13, fontStyle: 'italic' }}>Tidak ada data waste signifikan</Text>
      )}
    </View>
  );
}
`;
fs.writeFileSync(path.join(componentsDir, 'WastePanel.tsx'), wastePanelContent);

// 4. MenuMatrix
const menuMatrixContent = `import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

export default function MenuMatrix({ categoryPerformance }: { categoryPerformance: any[] }) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  if (!categoryPerformance || categoryPerformance.length === 0) return null;

  return (
    <View style={{
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    }}>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 16 }}>
        Performa Kategori
      </Text>
      
      {categoryPerformance.map((item: any, idx: number) => (
        <View key={idx} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{item.category}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '700' }}>{item.percentage}%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: c.borderLight, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: \`\${item.percentage}%\`, height: '100%', backgroundColor: c.accent, borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}
`;
fs.writeFileSync(path.join(componentsDir, 'MenuMatrix.tsx'), menuMatrixContent);

// 5. AIChatPanel
const aiChatPanelContent = `import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Send, Bot } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { aiApi } from '../../services/aiApi';

export default function AIChatPanel({ contextSnapshot }: { contextSnapshot: any }) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: 'Halo! Saya AI Advisor SmartPOS. Ada yang bisa saya bantu terkait laporan Anda?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Create history map
      const history = messages.map(m => ({
        role: m.role,
        content: m.text
      }));
      
      const res = await aiApi.chat(userMsg, history, contextSnapshot);
      setMessages(prev => [...prev, { role: 'model', text: res.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'Maaf, saya sedang mengalami gangguan jaringan. Coba lagi nanti.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {messages.map((m, idx) => (
          <View key={idx} style={{
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            marginBottom: 12,
            alignItems: 'flex-end'
          }}>
            {m.role === 'model' && (
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.accent + '20', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <Bot size={16} color={c.accent} />
              </View>
            )}
            <View style={{
              maxWidth: '75%',
              padding: 12,
              borderRadius: 16,
              backgroundColor: m.role === 'user' ? c.accent : (isDark ? '#2A2A2A' : '#F0F0F0'),
              borderBottomRightRadius: m.role === 'user' ? 4 : 16,
              borderBottomLeftRadius: m.role === 'model' ? 4 : 16,
            }}>
              <Text style={{ color: m.role === 'user' ? 'white' : c.text, fontSize: 14, lineHeight: 20 }}>
                {m.text}
              </Text>
            </View>
          </View>
        ))}
        {isLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <ActivityIndicator size="small" color={c.accent} />
            <Text style={{ color: c.textMuted, fontSize: 12, marginLeft: 8 }}>AI sedang mengetik...</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: c.borderLight, backgroundColor: c.bg }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Tanya soal performa produk..."
          placeholderTextColor={c.textMuted}
          style={{
            flex: 1,
            height: 40,
            backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
            borderRadius: 20,
            paddingHorizontal: 16,
            color: c.text,
            fontSize: 14
          }}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: input.trim() && !isLoading ? c.accent : c.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8
          }}
        >
          <Send size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
`;
fs.writeFileSync(path.join(componentsDir, 'AIChatPanel.tsx'), aiChatPanelContent);

console.log('All BI child components rewritten successfully.');
