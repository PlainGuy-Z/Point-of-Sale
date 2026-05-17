import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../contexts/AppContext';
import { formatRupiah } from '../../utils/currency';
import Numpad from '../common/Numpad';

export default function PaymentScreen() {
  const router = useRouter();
  const { checkout } = useApp();
  const data = (global as any).__checkoutData || {};
  const total: number = data.total || 0;

  const [method, setMethod] = useState<'cash' | 'qris' | 'card'>('cash');
  const [receivedStr, setReceivedStr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const received = parseInt(receivedStr || '0', 10);
  const change = received - total;
  const canPay = method !== 'cash' || received >= total;

  const quickAmounts = [25000, 50000, 100000, 200000];

  const handlePay = async () => {
    setError('');
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const tx = await checkout({
        cart: data.cart || [],
        paymentMethod: method,
        orderType: data.orderType || 'dine-in',
        tableNumber: data.tableNumber,
        customCustomerName: data.customerName,
        orderNote: data.orderNote,
        cashReceived: method === 'cash' ? received : undefined,
        change: method === 'cash' ? Math.max(0, change) : undefined,
        applyTax: data.applyTax,
      });
      (global as any).__lastTransaction = tx;
      (global as any).__posCart = [];
      router.replace('/(cashier)/pos' as any);
    } catch (err: any) {
      setError(err?.message || 'Pembayaran gagal');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={20} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Pembayaran</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Total */}
        <View style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 13 }}>Total Pembayaran</Text>
          <Text style={{ color: '#f59e0b', fontSize: 32, fontWeight: '900', marginTop: 4 }}>{formatRupiah(total)}</Text>
        </View>

        {/* Payment Method */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {([{ key: 'cash', label: '💵 Cash' }, { key: 'qris', label: 'QR QRIS' }, { key: 'card', label: '💳 Kartu' }] as const).map(m => (
            <TouchableOpacity key={m.key} onPress={() => setMethod(m.key as any)} style={{
              flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
              backgroundColor: method === m.key ? '#f59e0b' : '#1a1a1a',
              borderWidth: method === m.key ? 0 : 1, borderColor: '#2a2a2a',
            }}>
              <Text style={{ color: method === m.key ? '#000' : '#888', fontWeight: '700', fontSize: 12 }}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === 'cash' && (
          <>
            <Text style={{ color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>UANG DITERIMA</Text>
            <View style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>{formatRupiah(received)}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
              {quickAmounts.map(amt => (
                <TouchableOpacity key={amt} onPress={() => { setReceivedStr(String(amt)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Rp {(amt / 1000)}rb</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => { setReceivedStr(String(total)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={{ backgroundColor: '#f59e0b', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
                <Text style={{ color: '#000', fontSize: 13, fontWeight: '800' }}>Uang Pas</Text>
              </TouchableOpacity>
            </ScrollView>

            <Numpad value={receivedStr} onChange={setReceivedStr} />

            <View style={{ marginTop: 16, backgroundColor: change >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: change >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: '#888', fontSize: 12 }}>Kembalian</Text>
              <Text style={{ color: change >= 0 ? '#10b981' : '#ef4444', fontSize: 24, fontWeight: '900' }}>{formatRupiah(Math.max(0, change))}</Text>
            </View>
          </>
        )}

        {method === 'qris' && (
          <View style={{ borderWidth: 2, borderColor: '#2a2a2a', borderStyle: 'dashed', borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <Feather name="smartphone" size={48} color="#888" />
            <Text style={{ color: '#888', fontSize: 14, marginTop: 12 }}>QRIS segera tersedia</Text>
          </View>
        )}

        {error ? (
          <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="alert-circle" size={16} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2a2a2a' }}>
        <TouchableOpacity onPress={handlePay} disabled={!canPay || isProcessing} style={{ backgroundColor: canPay && !isProcessing ? '#f59e0b' : '#333', borderRadius: 14, paddingVertical: 18, alignItems: 'center' }}>
          {isProcessing ? <ActivityIndicator color="#000" /> : <Text style={{ color: canPay ? '#000' : '#666', fontWeight: '900', fontSize: 16 }}>PROSES PEMBAYARAN</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
