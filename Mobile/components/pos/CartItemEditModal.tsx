import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import type { CartItemWithInput } from '../../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CartItemEditModalProps {
  visible: boolean;
  item: CartItemWithInput;
  onSave: (updatedItem: CartItemWithInput) => void;
  onRemove: () => void;
  onClose: () => void;
  inline?: boolean;
}

const quickVariantPrices = [3000, 5000, 7000, 10000, 15000, 20000, 25000];

export default function CartItemEditModal({
  visible,
  item,
  onSave,
  onRemove,
  onClose,
  inline = false,
}: CartItemEditModalProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const insets = useSafeAreaInsets();

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

  const formContent = (
    <View style={{
      backgroundColor: c.bgCard,
      flex: 1,
      borderTopLeftRadius: inline ? 0 : 24,
      borderTopRightRadius: inline ? 0 : 24,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: inline ? 12 : 20, paddingVertical: inline ? 10 : 16,
        borderBottomWidth: 1, borderBottomColor: c.border,
      }}>
        <TouchableOpacity onPress={onClose}>
          <ArrowLeft size={inline ? 18 : 20} color={c.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: inline ? 14 : 16, fontWeight: '800' }}>Edit Item</Text>
          <Text style={{ color: c.textSecondary, fontSize: inline ? 10 : 12 }}>{item.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: inline ? 12 : 20, paddingBottom: (inline ? 60 : 100) + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Quantity */}
        <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
          Quantity
        </Text>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: inline ? 10 : 16, marginBottom: inline ? 12 : 24,
          backgroundColor: c.bgInput, padding: 4, borderRadius: inline ? 10 : 14, alignSelf: 'flex-start',
        }}>
          <TouchableOpacity
            onPress={() => setQuantity(q => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            style={{
              width: inline ? 30 : 40, height: inline ? 30 : 40, borderRadius: inline ? 6 : 10,
              backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
              opacity: quantity <= 1 ? 0.4 : 1,
            }}
          >
            <Minus size={inline ? 14 : 16} color={c.text} />
          </TouchableOpacity>
          <Text style={{ color: c.text, fontSize: inline ? 16 : 18, fontWeight: '800', minWidth: inline ? 20 : 30, textAlign: 'center' }}>
            {quantity}
          </Text>
          <TouchableOpacity
            onPress={() => setQuantity(q => q + 1)}
            style={{
              width: inline ? 30 : 40, height: inline ? 30 : 40, borderRadius: inline ? 6 : 10,
              backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Plus size={inline ? 14 : 16} color={c.text} />
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
            borderRadius: inline ? 10 : 14, color: c.text, padding: inline ? 8 : 14, fontSize: inline ? 12 : 14,
            marginBottom: inline ? 12 : 24, minHeight: inline ? 50 : 70, textAlignVertical: 'top',
          }}
        />

        {/* Variant Name + Price */}
        <View style={{ flexDirection: 'row', gap: inline ? 6 : 12, marginBottom: inline ? 8 : 12 }}>
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
                borderRadius: inline ? 8 : 12, color: c.text, padding: inline ? 8 : 12, fontSize: inline ? 12 : 14,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
              Harga Variant (Rp)
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
              borderRadius: inline ? 8 : 12, paddingHorizontal: inline ? 8 : 12,
            }}>
              <Text style={{ color: c.textMuted, fontSize: inline ? 12 : 14, fontWeight: '600' }}>Rp</Text>
              <TextInput
                value={variantPriceStr}
                onChangeText={v => setVariantPriceStr(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={c.textMuted}
                style={{ flex: 1, color: c.text, fontSize: inline ? 12 : 14, fontWeight: '700', padding: inline ? 8 : 12 }}
              />
            </View>
          </View>
        </View>

        {/* Quick variant price buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: inline ? 4 : 8, marginBottom: inline ? 12 : 24, paddingVertical: 4 }}>
          {quickVariantPrices.map(p => {
            const isSelected = variantPrice === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setVariantPriceStr(String(p))}
                style={{
                  backgroundColor: isSelected ? c.accent : c.bgInput,
                  borderWidth: isSelected ? 0 : 1, borderColor: c.border,
                  borderRadius: inline ? 8 : 10, paddingHorizontal: inline ? 10 : 14, paddingVertical: inline ? 5 : 8,
                }}
              >
                <Text style={{
                  color: isSelected ? c.textInverse : c.textSecondary,
                  fontSize: inline ? 10 : 11, fontWeight: '700',
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
          borderRadius: inline ? 10 : 16, padding: inline ? 10 : 16,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: c.textSecondary, fontSize: inline ? 10 : 12 }}>Unit Price:</Text>
            <Text style={{ color: c.text, fontSize: inline ? 10 : 12, fontWeight: '700' }}>{formatRupiah(unitPrice)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text, fontSize: inline ? 12 : 14, fontWeight: '800' }}>Subtotal:</Text>
            <Text style={{ color: c.accent, fontSize: inline ? 14 : 18, fontWeight: '900' }}>{formatRupiah(subtotalValue)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', gap: inline ? 6 : 10,
        paddingHorizontal: inline ? 10 : 16,
        paddingTop: inline ? 10 : 16,
        paddingBottom: inline 
          ? Math.max(insets.bottom, 10) 
          : (insets.bottom > 0 ? insets.bottom + 12 : 16),
        backgroundColor: c.bgCard,
        borderTopWidth: 1, borderTopColor: c.border,
      }}>
        <TouchableOpacity
          onPress={onRemove}
          style={{
            width: inline ? 40 : 52, height: inline ? 40 : 52, borderRadius: inline ? 10 : 16,
            borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca',
            backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Trash2 size={inline ? 18 : 20} color={c.error} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          style={{
            flex: 1, height: inline ? 40 : 52, borderRadius: inline ? 10 : 16,
            backgroundColor: c.accent,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: c.textInverse, fontSize: inline ? 12 : 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Simpan
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (inline) {
    if (!visible) return null;
    return (
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: c.bgCard,
        zIndex: 1000,
      }}>
        <View style={{
          backgroundColor: c.bgCard,
          flex: 1,
          overflow: 'hidden',
        }}>
          {formContent}
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={{
          backgroundColor: c.bgCard,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderTopWidth: 1, borderTopColor: c.border,
          maxHeight: '85%',
          width: '100%',
          flex: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 10,
        }}>
          {formContent}
        </View>
      </View>
    </Modal>
  );
}
