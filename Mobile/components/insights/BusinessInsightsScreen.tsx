import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrainCircuit, RefreshCw, BarChart2, Bot, PieChart, AlertCircle } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { useBusinessInsights } from '../../hooks/useBusinessInsights';

import StatCards from './StatCards';
import RevenueChart from './RevenueChart';
import WastePanel from './WastePanel';
import ShiftPanel from './ShiftPanel';
import MenuMatrix from './MenuMatrix';
import AIChatPanel from './AIChatPanel';

export default function BusinessInsightsScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const isSmallLandscape = isLandscape && windowHeight < 400;

  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [activeTab, setActiveTab] = useState<'Metrik' | 'AI Chat' | 'Charts'>('Metrik');
  
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useBusinessInsights();

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
    if (isLoading && !data.summary && !data.forecast && !data.waste) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{ marginTop: 12, color: c.textMuted, fontSize: 13 }}>Menganalisis insight bisnis...</Text>
        </View>
      );
    }

    if (error && !data.summary && !data.forecast && !data.waste) {
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

    if (activeTab === 'Metrik') {
      return (
        <ScrollView
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: isSmallLandscape ? 20 : 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
        >
          {data.summary && <StatCards summary={data.summary} />}
          {data.forecast && <RevenueChart forecast={data.forecast} />}
          {data.waste && <WastePanel wasteInsights={data.waste} />}
        </ScrollView>
      );
    }

    if (activeTab === 'AI Chat') {
      return (
        <View style={{ flex: 1, padding: 16, paddingBottom: isSmallLandscape ? 10 : 30 }}>
          <AIChatPanel contextSnapshot={data.summary as any} />
        </View>
      );
    }

    if (activeTab === 'Charts') {
      return (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: isSmallLandscape ? 20 : 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
        >
          {/* MenuMatrix expects categoryPerformance, which we don't have from aiApi right now. 
              We'll leave it empty or render a placeholder for now unless we implement it. */}
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: c.textMuted }}>Chart performance matrix akan tersedia segera.</Text>
          </View>
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={{
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: isSmallLandscape ? 6 : 12,
        paddingBottom: isSmallLandscape ? 6 : 12,
        backgroundColor: c.bg,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <BrainCircuit size={22} color={c.accent} strokeWidth={2} />
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>
                Business <Text style={{ color: c.accent }}>Intelligence</Text>
              </Text>
            </View>
            {!isSmallLandscape && (
              <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
                Command center AI
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
