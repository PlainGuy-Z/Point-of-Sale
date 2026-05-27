import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Smartphone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { usePOSCart } from '../../contexts/POSCartContext';
import { formatRupiah } from '../../utils/currency';
import Numpad from '../common/Numpad';

interface PaymentScreenProps {
  /** Called when user taps back */
  onClose?: () => void;
  /** Called after successful payment */
  onSuccess?: (transaction: any) => void;
}

export default function PaymentScreen({ onClose, onSuccess }: PaymentScreenProps) {
  const { checkout: appCheckout } = useApp();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const {
    cart, total, subtotal, taxAmount,
    checkout: checkoutData, resetCheckout,
  } = usePOSCart();

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
      const completedTx = await appCheckout({
        cart: cart.map(i => ({
          ...i,
          variantName: i.variantName,
          variantPrice: i.variantPrice,
          description: i.description,
          ...(i.productId.startsWith('manual-') ? { price: i.price } : {}),
        })),
        paymentMethod: method,
        orderType: checkoutData.orderType,
        tableNumber: checkoutData.tableNumber || undefined,
        customCustomerName: checkoutData.customerName || undefined,
        orderNote: checkoutData.orderNote || undefined,
        cashReceived: method === 'cash' ? received : undefined,
        change: method === 'cash' ? Math.max(0, change) : undefined,
        applyTax: checkoutData.applyTax,
      });

      // Success — reset everything
      resetCheckout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.(completedTx);
    } catch (err: any) {
      setError(err?.message || 'Pembayaran gagal');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        <TouchableOpacity onPress={onClose}>
          <ArrowLeft size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>Pembayaran</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Total */}
        <View style={{
          backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center',
        }}>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>Total Pembayaran</Text>
          <Text style={{ color: c.accent, fontSize: 32, fontWeight: '900', marginTop: 4 }}>
            {formatRupiah(total)}
          </Text>
          {/* Mini breakdown */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            <Text style={{ color: c.textMuted, fontSize: 10 }}>
              Subtotal: {formatRupiah(subtotal)}
            </Text>
            {taxAmount > 0 && (
              <Text style={{ color: c.textMuted, fontSize: 10 }}>
                PPN: {formatRupiah(taxAmount)}
              </Text>
            )}
          </View>
        </View>

        {/* Payment Method */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {([
            { key: 'cash' as const, label: '💵 Cash' },
            { key: 'qris' as const, label: 'QR QRIS' },
            { key: 'card' as const, label: '💳 Kartu' },
          ]).map(m => (
            <TouchableOpacity
              key={m.key}
              onPress={() => setMethod(m.key)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                backgroundColor: method === m.key ? c.accent : c.bgCard,
                borderWidth: method === m.key ? 0 : 1, borderColor: c.border,
              }}
            >
              <Text style={{
                color: method === m.key ? c.textInverse : c.textSecondary,
                fontWeight: '700', fontSize: 12,
              }}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cash */}
        {method === 'cash' && (
          <>
            <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
              UANG DITERIMA
            </Text>
            <View style={{
              backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
              borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center',
            }}>
              <Text style={{ color: c.text, fontSize: 28, fontWeight: '900' }}>
                {formatRupiah(received)}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginBottom: 16 }}
            >
              {quickAmounts.map(amt => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => {
                    setReceivedStr(String(amt));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
                    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>
                    Rp {amt / 1000}rb
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => {
                  setReceivedStr(String(total));
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  backgroundColor: c.accent,
                  borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
                }}
              >
                <Text style={{ color: c.textInverse, fontSize: 13, fontWeight: '800' }}>
                  Uang Pas
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <Numpad value={receivedStr} onChange={setReceivedStr} />

            <View style={{
              marginTop: 16,
              backgroundColor: change >= 0 ? c.successBg : c.errorBg,
              borderWidth: 1,
              borderColor: change >= 0 ? (isDark ? 'rgba(16,185,129,0.3)' : 'rgba(5,150,105,0.3)') : (isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.3)'),
              borderRadius: 12, padding: 12, alignItems: 'center',
            }}>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Kembalian</Text>
              <Text style={{
                color: change >= 0 ? c.success : c.error,
                fontSize: 24, fontWeight: '900',
              }}>
                {formatRupiah(Math.max(0, change))}
              </Text>
            </View>
          </>
        )}

        {/* QRIS */}
        {method === 'qris' && (
          <View style={{
            borderWidth: 2, borderColor: c.border, borderStyle: 'dashed',
            borderRadius: 16, padding: 40, alignItems: 'center',
          }}>
            <Smartphone size={48} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 12 }}>
              QRIS segera tersedia
            </Text>
          </View>
        )}

        {/* Card */}
        {method === 'card' && (
          <View style={{
            borderWidth: 2, borderColor: c.border, borderStyle: 'dashed',
            borderRadius: 16, padding: 40, alignItems: 'center',
          }}>
            <Text style={{ color: c.textMuted, fontSize: 14 }}>
              Pembayaran kartu segera tersedia
            </Text>
          </View>
        )}

        {/* Error */}
        {error ? (
          <View style={{
            backgroundColor: c.errorBg, borderWidth: 1,
            borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.3)',
            borderRadius: 12, padding: 12, marginTop: 16,
            flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <Text style={{ color: c.error, fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Pay button */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 16, backgroundColor: c.bg,
        borderTopWidth: 1, borderTopColor: c.border,
      }}>
        <TouchableOpacity
          onPress={handlePay}
          disabled={!canPay || isProcessing}
          style={{
            backgroundColor: canPay && !isProcessing ? c.accent : (isDark ? '#333' : '#e2e8f0'),
            borderRadius: 14, paddingVertical: 18, alignItems: 'center',
          }}
        >
          {isProcessing ? (
            <ActivityIndicator color={c.textInverse} />
          ) : (
            <Text style={{
              color: canPay ? c.textInverse : c.textMuted,
              fontWeight: '900', fontSize: 16,
            }}>
              PROSES PEMBAYARAN
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
