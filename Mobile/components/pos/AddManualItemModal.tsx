import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CartItemWithInput } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: CartItemWithInput) => void;
}

const quickPrices = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000];

export default function AddManualItemModal({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [quantity, setQuantity] = useState(1);

  const price = parseInt(priceStr || '0', 10);

  const handleAdd = () => {
    if (!name.trim() || price <= 0) return;
    onAdd({
      productId: `manual-${Date.now()}`,
      name: name.trim(),
      quantity,
      price,
    });
    setName(''); setPriceStr(''); setQuantity(1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Item Manual</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color="#888" /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>NAMA ITEM</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Nama item" placeholderTextColor="#555" autoFocus style={{ backgroundColor: '#222', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, color: '#fff', padding: 12, fontSize: 14, marginBottom: 16 }} />

            <Text style={{ color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>HARGA</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 }}>
              <Text style={{ color: '#888', fontSize: 14, fontWeight: '600' }}>Rp</Text>
              <TextInput value={priceStr} onChangeText={setPriceStr} keyboardType="number-pad" placeholder="0" placeholderTextColor="#555" style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', padding: 12 }} />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {quickPrices.map(qp => (
                <TouchableOpacity key={qp} onPress={() => setPriceStr(String(qp))} style={{ backgroundColor: price === qp ? '#f59e0b' : '#222', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={{ color: price === qp ? '#000' : '#888', fontSize: 12, fontWeight: '700' }}>{qp >= 1000 ? `${qp / 1000}rb` : qp}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>JUMLAH</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' }}><Feather name="minus" size={18} color="#fff" /></TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', minWidth: 30, textAlign: 'center' }}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' }}><Feather name="plus" size={18} color="#fff" /></TouchableOpacity>
            </View>

            {price > 0 && (
              <Text style={{ color: '#f59e0b', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 16 }}>
                Total: Rp {(price * quantity).toLocaleString('id-ID')}
              </Text>
            )}

            <TouchableOpacity onPress={handleAdd} disabled={!name.trim() || price <= 0} style={{ backgroundColor: !name.trim() || price <= 0 ? '#333' : '#f59e0b', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: !name.trim() || price <= 0 ? '#666' : '#000', fontWeight: '900', fontSize: 15 }}>+ Ke Keranjang</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
