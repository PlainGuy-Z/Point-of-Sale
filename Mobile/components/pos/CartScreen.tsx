import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { CartItemWithInput } from '../../types';
import { formatRupiah } from '../../utils/currency';
import AddManualItemModal from './AddManualItemModal';

export default function CartScreen() {
  const router = useRouter();
  const cart: CartItemWithInput[] = (global as any).__posCart || [];
  const setCart = (global as any).__posSetCart || (() => {});
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [applyTax, setApplyTax] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);

  const subtotal = useMemo(() => cart.reduce((s: number, i: CartItemWithInput) => s + i.price * i.quantity, 0), [cart]);
  const taxAmount = applyTax ? Math.round(subtotal * 0.11) : 0;
  const total = subtotal + taxAmount;

  const updateQty = (pid: string, delta: number) => {
    setCart((prev: CartItemWithInput[]) => {
      const item = prev.find((i: CartItemWithInput) => i.productId === pid);
      if (!item) return prev;
      if (item.quantity + delta <= 0) return prev.filter((i: CartItemWithInput) => i.productId !== pid);
      return prev.map((i: CartItemWithInput) => i.productId === pid ? { ...i, quantity: i.quantity + delta } : i);
    });
  };

  const goToPayment = () => {
    (global as any).__checkoutData = { cart, orderType, tableNumber, customerName, orderNote, applyTax, subtotal, taxAmount, total };
    router.push('/(cashier)/pos/payment' as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="arrow-left" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Keranjang</Text>
        </TouchableOpacity>
        {cart.length > 0 && (
          <TouchableOpacity onPress={() => setCart([])}>
            <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>Kosongkan</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Order Type */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {(['dine-in', 'take-away'] as const).map(type => (
            <TouchableOpacity key={type} onPress={() => setOrderType(type)} style={{
              flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
              backgroundColor: orderType === type ? '#f59e0b' : '#1a1a1a',
              borderWidth: orderType === type ? 0 : 1, borderColor: '#2a2a2a',
            }}>
              <Text style={{ color: orderType === type ? '#000' : '#888', fontWeight: '700', fontSize: 13 }}>
                {type === 'dine-in' ? '🍽 Dine In' : '📦 Take Away'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {orderType === 'dine-in' && (
          <TextInput value={tableNumber} onChangeText={setTableNumber} placeholder="Nomor Meja" placeholderTextColor="#555" keyboardType="number-pad" style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, color: '#fff', padding: 12, fontSize: 14, marginBottom: 12 }} />
        )}
        <TextInput value={customerName} onChangeText={setCustomerName} placeholder="Nama customer (opsional)" placeholderTextColor="#555" style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, color: '#fff', padding: 12, fontSize: 14, marginBottom: 16 }} />

        {/* Items */}
        {cart.map((item: CartItemWithInput) => (
          <View key={item.productId} style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: item.isPromo ? 'rgba(239,68,68,0.3)' : '#2a2a2a', borderRadius: 16, padding: 14, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{item.name}</Text>
                <Text style={{ color: '#888', fontSize: 12 }}>{formatRupiah(item.price)} /pcs</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10, overflow: 'hidden', marginBottom: 4 }}>
                  <TouchableOpacity onPress={() => updateQty(item.productId, -1)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}><Feather name="minus" size={14} color="#f59e0b" /></TouchableOpacity>
                  <Text style={{ color: '#fff', fontWeight: '700', minWidth: 24, textAlign: 'center' }}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQty(item.productId, 1)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}><Feather name="plus" size={14} color="#f59e0b" /></TouchableOpacity>
                </View>
                <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 14 }}>{formatRupiah(item.price * item.quantity)}</Text>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity onPress={() => setShowManualModal(true)} style={{ borderWidth: 1, borderColor: '#2a2a2a', borderStyle: 'dashed', borderRadius: 16, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <Feather name="edit-3" size={16} color="#888" />
          <Text style={{ color: '#888', fontSize: 13, fontWeight: '600' }}>Tambah Item Manual</Text>
        </TouchableOpacity>

        <TextInput value={orderNote} onChangeText={setOrderNote} placeholder="Catatan pesanan..." placeholderTextColor="#555" multiline style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, color: '#fff', padding: 12, fontSize: 14, marginBottom: 16, textAlignVertical: 'top', minHeight: 60 }} />

        {/* Summary */}
        <View style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#888', fontSize: 14 }}>Subtotal</Text>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{formatRupiah(subtotal)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#888', fontSize: 14 }}>PPN 11%</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>{formatRupiah(taxAmount)}</Text>
              <Switch value={applyTax} onValueChange={setApplyTax} trackColor={{ false: '#333', true: 'rgba(245,158,11,0.3)' }} thumbColor={applyTax ? '#f59e0b' : '#666'} />
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: '#2a2a2a', marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Total</Text>
            <Text style={{ color: '#f59e0b', fontSize: 18, fontWeight: '900' }}>{formatRupiah(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {cart.length > 0 && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2a2a2a' }}>
          <TouchableOpacity onPress={goToPayment} style={{ backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 15 }}>Checkout →</Text>
          </TouchableOpacity>
        </View>
      )}
      <AddManualItemModal visible={showManualModal} onClose={() => setShowManualModal(false)} onAdd={(item: CartItemWithInput) => { setCart((p: CartItemWithInput[]) => [...p, item]); setShowManualModal(false); }} />
    </SafeAreaView>
  );
}
