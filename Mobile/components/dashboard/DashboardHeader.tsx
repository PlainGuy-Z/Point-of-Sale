import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLayout } from '../../hooks/useLayout';

export default function DashboardHeader() {
  const { mode } = useLayout();
  const isLandscapeTablet = mode === 'tablet-landscape';

  const date = new Date(2026, 4, 19); // 19 Mei 2026

  const formatDateShort = (d: Date) => {
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatDateLong = (d: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }}>
          <Feather name="menu" size={20} color="#ffffff" />
        </TouchableOpacity>
        <View>
          <Text style={{ color: '#ffffff', fontSize: isLandscapeTablet ? 24 : 20, fontWeight: '900' }}>Dashboard Bisnis</Text>
          <Text style={{ color: '#888888', fontSize: isLandscapeTablet ? 14 : 12, marginTop: 4 }}>
            {isLandscapeTablet ? formatDateLong(date) : formatDateShort(date)}
          </Text>
        </View>
      </View>

      <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 12 }}>⚡</Text>
        <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '800' }}>
          {isLandscapeTablet ? 'Real-time' : 'Live'}
        </Text>
      </View>
    </View>
  );
}
