import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import type { CartItemWithInput } from '../../types';

interface CartItemEditModalProps {
  visible: boolean;
  item: CartItemWithInput;
  onSave: (updatedItem: CartItemWithInput) => void;
  onRemove: () => void;
  onClose: () => void;
}

const quickVariantPrices = [3000, 5000, 7000, 10000, 15000, 20000, 25000];

export default function CartItemEditModal({
  visible,
  item,
  onSave,
  onRemove,
  onClose,
}: CartItemEditModalProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [quantity, setQuantity] = useState(item.quantity);
  const [description, setDescription] = useState(
    item.description || (item.note && item.note !== item.name ? item.note : '')
  );
  const [variantName, setVariantName] = useState(item.variantName || '');
  const [variantPriceStr, setVariantPriceStr] = useState(
    item.variantPrice ? String(item.variantPrice) : ''
  );

  const variantPrice = parseInt(variantPriceStr || '0', 10);

  const handleSave = () => {
    onSave({
      ...item,
      quantity: Math.max(1, quantity),
      description: description.trim(),
      variantName: variantName.trim() || undefined,
      variantPrice: variantPrice > 0 ? variantPrice : undefined,
    });
  };

  const unitPrice = item.price + variantPrice;
  const subtotalValue = unitPrice * quantity;

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
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingHorizontal: 20, paddingVertical: 16,
            borderBottomWidth: 1, borderBottomColor: c.border,
          }}>
            <TouchableOpacity onPress={onClose}>
              <ArrowLeft size={20} color={c.textSecondary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Edit Item</Text>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>{item.name}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {/* Quantity */}
            <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
              Quantity
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24,
              backgroundColor: c.bgInput, padding: 4, borderRadius: 14, alignSelf: 'flex-start',
            }}>
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
                  opacity: quantity <= 1 ? 0.4 : 1,
                }}
              >
                <Minus size={16} color={c.text} />
              </TouchableOpacity>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', minWidth: 30, textAlign: 'center' }}>
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(q => q + 1)}
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={16} color={c.text} />
              </TouchableOpacity>
            </View>

            {/* Special Instruction */}
            <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
              Special Instructions (opsional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Pedas sekali, Tanpa bawang"
              placeholderTextColor={c.textMuted}
              multiline
              style={{
                backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
                borderRadius: 14, color: c.text, padding: 14, fontSize: 14,
                marginBottom: 24, minHeight: 70, textAlignVertical: 'top',
              }}
            />

            {/* Variant Name + Price */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
                  Variant Name
                </Text>
                <TextInput
                  value={variantName}
                  onChangeText={setVariantName}
                  placeholder="e.g. Extra Keju"
                  placeholderTextColor={c.textMuted}
                  style={{
                    backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
                    borderRadius: 12, color: c.text, padding: 12, fontSize: 14,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
                  Variant Price (Rp)
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
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={c.textMuted}
                    style={{ flex: 1, color: c.text, fontSize: 14, fontWeight: '700', padding: 12 }}
                  />
                </View>
              </View>
            </View>

            {/* Quick variant price buttons */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 24, paddingVertical: 4 }}>
              {quickVariantPrices.map(p => {
                const isSelected = variantPrice === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setVariantPriceStr(String(p))}
                    style={{
                      backgroundColor: isSelected ? c.accent : c.bgInput,
                      borderWidth: isSelected ? 0 : 1, borderColor: c.border,
                      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
                    }}
                  >
                    <Text style={{
                      color: isSelected ? c.textInverse : c.textSecondary,
                      fontSize: 11, fontWeight: '700',
                    }}>
                      +{p >= 1000 ? `${p / 1000}k` : p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Price preview */}
            <View style={{
              backgroundColor: c.accentBg, borderWidth: 1,
              borderColor: isDark ? 'rgba(245,158,11,0.25)' : 'rgba(13,148,136,0.25)',
              borderRadius: 16, padding: 16,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>Unit Price:</Text>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>{formatRupiah(unitPrice)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>Subtotal:</Text>
                <Text style={{ color: c.accent, fontSize: 18, fontWeight: '900' }}>{formatRupiah(subtotalValue)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            flexDirection: 'row', gap: 10,
            padding: 16, backgroundColor: c.bgCard,
            borderTopWidth: 1, borderTopColor: c.border,
          }}>
            <TouchableOpacity
              onPress={onRemove}
              style={{
                width: 52, height: 52, borderRadius: 16,
                borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca',
                backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Trash2 size={20} color={c.error} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={{
                flex: 1, height: 52, borderRadius: 16,
                backgroundColor: c.accent,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: c.textInverse, fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Simpan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
