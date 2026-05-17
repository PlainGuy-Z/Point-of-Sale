import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatRupiah } from '../../utils/currency';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const tx = (global as any).__lastTransaction;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Feather name="check-circle" size={48} color="#10b981" />
      </View>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 8 }}>Pembayaran Berhasil!</Text>
      {tx && <Text style={{ color: '#f59e0b', fontSize: 28, fontWeight: '900', marginBottom: 4 }}>{formatRupiah(tx.total)}</Text>}
      {tx && <Text style={{ color: '#888', fontSize: 13 }}>#{tx.id?.slice(-8).toUpperCase()}</Text>}
      <View style={{ width: '100%', marginTop: 32, gap: 12 }}>
        <TouchableOpacity onPress={() => router.replace('/(cashier)/pos' as any)} style={{ backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
          <Text style={{ color: '#000', fontWeight: '900', fontSize: 15 }}>Kembali ke Kasir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>🖨 Cetak Ulang</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
