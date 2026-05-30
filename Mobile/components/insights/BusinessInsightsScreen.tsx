import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrainCircuit, RefreshCw, BarChart2, Bot, PieChart } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { aiApi, SummaryResponse, ForecastResponse, WasteResponse } from '../../services/aiApi';
import { api } from '../../services/api';

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
  
  // Data State
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [waste, setWaste] = useState<WasteResponse | null>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [wasteDays, setWasteDays] = useState<7 | 14 | 30>(30);

  // Loading & Error State
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWasteLoading, setIsWasteLoading] = useState(false);
  
  const [summaryError, setSummaryError] = useState(false);
  const [forecastError, setForecastError] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setInitialLoading(true);

    setSummaryError(false);
    setForecastError(false);

    try {
      const [sumRes, foreRes, shiftRes] = await Promise.allSettled([
        aiApi.fetchSummary(),
        aiApi.fetchForecast(),
        api.get<any>('/shifts?limit=5').catch(() => null) // graceful failure for shifts
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      else setSummaryError(true);

      if (foreRes.status === 'fulfilled') setForecast(foreRes.value);
      else setForecastError(true);

      if (shiftRes.status === 'fulfilled' && shiftRes.value?.data) {
        setShifts(Array.isArray(shiftRes.value.data) ? shiftRes.value.data : []);
      }
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else setInitialLoading(false);
    }
  }, []);

  const fetchWaste = useCallback(async (days: 7 | 14 | 30) => {
    setIsWasteLoading(true);
    try {
      const w = await aiApi.fetchWasteAnalysis(days);
      setWaste(w);
    } catch {
      setWaste(null);
    } finally {
      setIsWasteLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchWaste(wasteDays);
  }, [wasteDays, fetchWaste]);

  // UI rendering
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
    if (initialLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{ marginTop: 12, color: c.textMuted, fontSize: 13 }}>Menganalisis data bisnis...</Text>
        </View>
      );
    }

    if (activeTab === 'Metrik') {
      return (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: isSmallLandscape ? 20 : 100 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchAll(true)} />}
        >
          {summaryError && (
            <View style={{ backgroundColor: c.errorBg, padding: 12, borderRadius: 12, marginBottom: 16 }}>
              <Text style={{ color: c.error, fontSize: 12 }}>Gagal memuat ringkasan. Tarik ke bawah untuk memuat ulang.</Text>
            </View>
          )}
          
          <StatCards summary={summary} />
          
          {!forecastError ? (
            <RevenueChart forecast={forecast} />
          ) : (
            <View style={{ backgroundColor: c.bgCard, padding: 20, borderRadius: 16, marginBottom: 16, alignItems: 'center' }}>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Gagal memuat prediksi revenue.</Text>
            </View>
          )}

          <WastePanel
            waste={waste}
            selectedDays={wasteDays}
            onDaysChange={setWasteDays}
            isLoading={isWasteLoading}
          />
          
          <ShiftPanel
            shifts={shifts}
            activeCount={summary?.active_shifts_count || 0}
          />
        </ScrollView>
      );
    }

    if (activeTab === 'AI Chat') {
      return (
        <View style={{ flex: 1, padding: 16, paddingBottom: isSmallLandscape ? 10 : 30 }}>
          <AIChatPanel />
        </View>
      );
    }

    if (activeTab === 'Charts') {
      return (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: isSmallLandscape ? 20 : 100 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchAll(true)} />}
        >
          <MenuMatrix />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: c.bg,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight
      }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BrainCircuit size={22} color={c.accent} strokeWidth={2} />
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>
              Business <Text style={{ color: c.accent }}>Intelligence</Text>
            </Text>
          </View>
          {!isSmallLandscape && (
            <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
              Analytics, forecast, dan AI advisor
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => fetchAll(true)}
          disabled={isRefreshing || initialLoading}
          style={{
            padding: 8,
            backgroundColor: c.bgCard,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: c.border,
            opacity: isRefreshing || initialLoading ? 0.5 : 1
          }}
        >
          <RefreshCw size={18} color={c.text} />
        </TouchableOpacity>
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
