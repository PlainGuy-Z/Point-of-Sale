import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrainCircuit, RefreshCw, BarChart2, Bot, PieChart, Info, AlertCircle } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { useBusinessInsights, BIPresetKey } from '../../hooks/useBusinessInsights';

import StatCards from './StatCards';
import RevenueChart from './RevenueChart';
import WastePanel from './WastePanel';
import ShiftPanel from './ShiftPanel';
import MenuMatrix from './MenuMatrix';
import AIChatPanel from './AIChatPanel';

export default function BusinessInsightsScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const isTablet = windowWidth >= 768;
  const isSmallLandscape = isLandscape && windowHeight < 400;

  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [activeTab, setActiveTab] = useState<'Metrik' | 'AI Chat' | 'Charts'>('Metrik');
  
  const {
    preset,
    setPreset,
    data,
    isLoading,
    error,
    refetch,
    generateManualAi
  } = useBusinessInsights();

  // Helper map for presets
  const PRESETS: { key: BIPresetKey; label: string }[] = [
    { key: 'this_week', label: 'Minggu Ini' },
    { key: '7days', label: '7 Hari' },
    { key: 'custom', label: 'Custom' },
  ];

  const renderTabButton = (title: 'Metrik' | 'AI Chat' | 'Charts', Icon: any) => {
    const isActive = activeTab === title;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(title)}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 12,
          borderBottomWidth: 3,
          borderBottomColor: isActive ? c.accent : 'transparent',
          backgroundColor: isActive ? c.bgCard : 'transparent'
        }}
      >
        <Icon size={16} color={isActive ? c.accent : c.textMuted} />
        <Text style={{
          color: isActive ? c.accent : c.textMuted,
          fontSize: 13,
          fontWeight: isActive ? '800' : '600'
        }}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{ marginTop: 12, color: c.textMuted, fontSize: 13 }}>Menganalisis insight bisnis...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <AlertCircle size={48} color={c.error} style={{ marginBottom: 16 }} />
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
            Gagal Memuat Insight
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              backgroundColor: c.accent,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!data || data.summary.transactionCount === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Info size={48} color={c.textMuted} style={{ marginBottom: 16 }} />
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
            Tidak Ada Data
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center' }}>
            Tidak ada transaksi pada periode ini untuk dianalisis.
          </Text>
        </View>
      );
    }

    if (activeTab === 'Metrik') {
      return (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: isSmallLandscape ? 20 : 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
        >
          {/* AI Recommendation Alert */}
          {data.recommendations === "Analisis AI dilewati." ? (
            <View style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight, padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' }}>
              <Bot size={24} color={c.textMuted} style={{ marginBottom: 8 }} />
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Insight AI Belum Digenerate</Text>
              <Text style={{ color: c.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
                Pilih untuk melihat analisis cerdas dan rekomendasi strategis khusus untuk rentang waktu ini.
              </Text>
              <TouchableOpacity
                onPress={generateManualAi}
                disabled={isLoading}
                style={{
                  backgroundColor: c.accent,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>
                  {isLoading ? "Sedang Memuat..." : "Generate AI Insight"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : data.recommendations ? (
            <View style={{ backgroundColor: c.accent + '20', borderWidth: 1, borderColor: c.accent + '50', padding: 16, borderRadius: 12, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Bot size={18} color={c.accent} />
                <Text style={{ color: c.accent, fontWeight: '800', fontSize: 14 }}>Rekomendasi AI</Text>
              </View>
              <Text style={{ color: c.text, fontSize: 13, lineHeight: 20 }}>
                {data.recommendations}
              </Text>
              
              {data.recommendations === "Gagal memuat rekomendasi AI. Harap coba lagi nanti." && (
                <TouchableOpacity onPress={generateManualAi} style={{ marginTop: 12 }}>
                  <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>Coba Ulang AI</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <StatCards summary={data.summary} stockAlerts={data.stockAlerts} topProduct={data.topProducts[0]} />
          
          <RevenueChart trendData={data.trendData} />
          
          <WastePanel
            wasteInsights={data.wasteInsights}
          />
        </ScrollView>
      );
    }

    if (activeTab === 'AI Chat') {
      return (
        <View style={{ flex: 1, padding: 16, paddingBottom: isSmallLandscape ? 10 : 30 }}>
          <AIChatPanel contextSnapshot={data.summary} />
        </View>
      );
    }

    if (activeTab === 'Charts') {
      return (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: isSmallLandscape ? 20 : 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
        >
          <MenuMatrix categoryPerformance={data.categoryPerformance} />
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={{
        paddingLeft: isLandscape ? 16 : 60,
        paddingRight: 16,
        paddingTop: isSmallLandscape ? 6 : 12,
        paddingBottom: isSmallLandscape ? 6 : 12,
        backgroundColor: c.bg,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <BrainCircuit size={22} color={c.accent} strokeWidth={2} />
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>
                Business <Text style={{ color: c.accent }}>Intelligence</Text>
              </Text>
            </View>
            {!isSmallLandscape && (
              <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
                Analytics, forecast, dan AI advisor dari Server
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => refetch()}
            disabled={isLoading}
            style={{
              padding: 8,
              backgroundColor: c.bgCard,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: c.border,
              opacity: isLoading ? 0.5 : 1
            }}
          >
            <RefreshCw size={18} color={c.text} />
          </TouchableOpacity>
        </View>

        {/* Date Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {PRESETS.map((p) => {
            const isActive = preset === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPreset(p.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: isActive ? c.accent : c.bgCard,
                  borderWidth: 1,
                  borderColor: isActive ? c.accent : c.border
                }}
              >
                <Text style={{
                  color: isActive ? 'white' : c.textSecondary,
                  fontSize: 12,
                  fontWeight: isActive ? '700' : '500'
                }}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.borderLight }}>
        {renderTabButton('Metrik', BarChart2)}
        {renderTabButton('AI Chat', Bot)}
        {renderTabButton('Charts', PieChart)}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}
