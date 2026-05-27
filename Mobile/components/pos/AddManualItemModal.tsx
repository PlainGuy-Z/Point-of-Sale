import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Zap, ShoppingCart } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import type { CartItemWithInput } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: CartItemWithInput) => void;
  onQuickPay?: (item: CartItemWithInput) => void;
}

const quickPrices = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000];
const quickVariantPrices = [3000, 5000, 7000, 10000, 15000, 20000, 25000];

export default function AddManualItemModal({ visible, onClose, onAdd, onQuickPay }: Props) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [name, setName] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [description, setDescription] = useState('');
  const [variantName, setVariantName] = useState('');
  const [variantPriceStr, setVariantPriceStr] = useState('');
  const [quantity, setQuantity] = useState(1);

  const price = parseInt(priceStr || '0', 10);
  const variantPrice = parseInt(variantPriceStr || '0', 10);
  const totalPrice = (price + variantPrice) * quantity;

  const buildItem = (): CartItemWithInput | null => {
    if (!name.trim() || price <= 0) return null;
    const cleanName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
    return {
      productId: `manual-${Date.now()}`,
      name: cleanName,
      quantity,
      price,
      note: cleanName,
      description: description.trim() || undefined,
      variantName: variantName.trim() || undefined,
      variantPrice: variantPrice > 0 ? variantPrice : undefined,
    };
  };

  const resetForm = () => {
    setName(''); setPriceStr(''); setDescription('');
    setVariantName(''); setVariantPriceStr(''); setQuantity(1);
  };

  const handleAdd = () => {
    const item = buildItem();
    if (!item) return;
    onAdd(item);
    resetForm();
  };

  const handleQuickPay = () => {
    const item = buildItem();
    if (!item || !onQuickPay) return;
    onQuickPay(item);
    resetForm();
  };

  const canSubmit = name.trim().length > 0 && price > 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{
          backgroundColor: c.bgCard,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: '85%',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 20, paddingVertical: 16,
            borderBottomWidth: 1, borderBottomColor: c.border,
          }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>Item Manual</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {/* Name */}
            <Text style={{ color: c.accent, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 }}>
              Nama Item *
            </Text>
            <TextInput
              value={name} onChangeText={setName}
              placeholder="Nama item" placeholderTextColor={c.textMuted} autoFocus
              style={{
                backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
                borderRadius: 12, color: c.text, padding: 12, fontSize: 14, marginBottom: 16,
              }}
            />

            {/* Description */}
            <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 }}>
              Deskripsi (opsional)
            </Text>
            <TextInput
              value={description} onChangeText={setDescription}
              placeholder="e.g. Pedas sekali, Tanpa bawang" placeholderTextColor={c.textMuted}
              style={{
                backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
                borderRadius: 12, color: c.text, padding: 12, fontSize: 14, marginBottom: 16,
              }}
            />

            {/* Variant row */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 }}>
                  Variant
                </Text>
                <TextInput
                  value={variantName} onChangeText={setVariantName}
                  placeholder="e.g. Extra Keju" placeholderTextColor={c.textMuted}
                  style={{
                    backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
                    borderRadius: 12, color: c.text, padding: 12, fontSize: 14,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 }}>
                  Harga Variant (Rp)
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
                  borderRadius: 12, paddingHorizontal: 12,
                }}>
                  <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: '600' }}>Rp</Text>
                  <TextInput
                    value={variantPriceStr}
                    onChangeText={v => setVariantPriceStr(v.replace(/\D/g, ''))}
                    keyboardType="number-pad" placeholder="0" placeholderTextColor={c.textMuted}
                    style={{ flex: 1, color: c.text, fontSize: 14, fontWeight: '700', padding: 12 }}
                  />
                </View>
              </View>
            </View>

            {/* Quick variant price buttons */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16, paddingVertical: 2 }}>
              {quickVariantPrices.map(qp => (
                <TouchableOpacity
                  key={qp}
                  onPress={() => setVariantPriceStr(String(qp))}
                  style={{
                    backgroundColor: variantPrice === qp ? c.accent : c.bgInput,
                    borderWidth: variantPrice === qp ? 0 : 1, borderColor: c.border,
                    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
                  }}
                >
                  <Text style={{
                    color: variantPrice === qp ? c.textInverse : c.textSecondary,
                    fontSize: 11, fontWeight: '700',
                  }}>+{qp >= 1000 ? `${qp / 1000}k` : qp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Price */}
            <Text style={{ color: c.accent, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 }}>
              Harga (Rp) *
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
              borderRadius: 12, paddingHorizontal: 12, marginBottom: 12,
            }}>
              <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: '600' }}>Rp</Text>
              <TextInput
                value={priceStr} onChangeText={v => setPriceStr(v.replace(/\D/g, ''))}
                keyboardType="number-pad" placeholder="0" placeholderTextColor={c.textMuted}
                style={{ flex: 1, color: c.text, fontSize: 16, fontWeight: '700', padding: 12 }}
              />
            </View>

            {/* Quick prices */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {quickPrices.map(qp => (
                <TouchableOpacity
                  key={qp}
                  onPress={() => setPriceStr(String(qp))}
                  style={{
                    backgroundColor: price === qp ? c.accent : c.bgInput,
                    borderWidth: price === qp ? 0 : 1, borderColor: c.border,
                    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
                  }}
                >
                  <Text style={{
                    color: price === qp ? c.textInverse : c.textSecondary,
                    fontSize: 12, fontWeight: '700',
                  }}>{qp >= 1000 ? `${qp / 1000}rb` : qp}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantity */}
            <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 }}>
              Jumlah
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: c.bgInput, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>−</Text>
              </TouchableOpacity>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', minWidth: 30, textAlign: 'center' }}>
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: c.bgInput, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Total preview */}
            {price > 0 && (
              <View style={{
                backgroundColor: c.accentBg, borderWidth: 1,
                borderColor: isDark ? 'rgba(245,158,11,0.25)' : 'rgba(13,148,136,0.25)',
                borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16,
              }}>
                <Text style={{ color: c.textSecondary, fontSize: 11 }}>Total ({quantity}×)</Text>
                <Text style={{ color: c.accent, fontSize: 18, fontWeight: '900', marginTop: 2 }}>
                  {formatRupiah(totalPrice)}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            flexDirection: 'row', gap: 10,
            padding: 16, backgroundColor: c.bgCard,
            borderTopWidth: 1, borderTopColor: c.border,
          }}>
            {onQuickPay && (
              <TouchableOpacity
                onPress={handleQuickPay}
                disabled={!canSubmit}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  backgroundColor: canSubmit ? c.accent : (isDark ? '#333' : '#e2e8f0'),
                  borderRadius: 14, paddingVertical: 14,
                }}
              >
                <Zap size={14} color={canSubmit ? c.textInverse : c.textMuted} />
                <Text style={{
                  color: canSubmit ? c.textInverse : c.textMuted,
                  fontWeight: '900', fontSize: 13,
                }}>Quick Pay</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!canSubmit}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                backgroundColor: canSubmit
                  ? (onQuickPay ? 'transparent' : c.accent)
                  : (isDark ? '#333' : '#e2e8f0'),
                borderWidth: onQuickPay ? 1 : 0,
                borderColor: canSubmit ? c.border : 'transparent',
                borderRadius: 14, paddingVertical: 14,
              }}
            >
              <ShoppingCart size={14} color={canSubmit ? (onQuickPay ? c.text : c.textInverse) : c.textMuted} />
              <Text style={{
                color: canSubmit ? (onQuickPay ? c.text : c.textInverse) : c.textMuted,
                fontWeight: '900', fontSize: 13,
              }}>Ke Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
