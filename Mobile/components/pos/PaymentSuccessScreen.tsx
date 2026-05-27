import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { CheckCircle, Printer } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import type { Transaction } from '../../types';

interface PaymentSuccessScreenProps {
  transaction?: Transaction;
  onClose?: () => void;
  onPrint?: () => void;
}

export default function PaymentSuccessScreen({ transaction, onClose, onPrint }: PaymentSuccessScreenProps) {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  // Fallback to global if used as a standalone page via router
  const tx: Transaction | undefined = transaction || (global as any).__lastTransaction;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.replace('/(cashier)/pos' as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: c.successBg, alignItems: 'center', justifyContent: 'center',
        marginBottom: 24
      }}>
        <CheckCircle size={48} color={c.success} />
      </View>

      <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginBottom: 8 }}>
        Pembayaran Berhasil!
      </Text>

      {tx && (
        <>
          <Text style={{ color: c.accent, fontSize: 28, fontWeight: '900', marginBottom: 4 }}>
            {formatRupiah(tx.total)}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: 8 }}>
            #{tx.id?.slice(-8).toUpperCase()}
          </Text>
        </>
      )}

      <View style={{ width: '100%', marginTop: 32, gap: 12 }}>
        <TouchableOpacity
          onPress={handleClose}
          style={{
            backgroundColor: c.accent, borderRadius: 14,
            paddingVertical: 16, alignItems: 'center'
          }}
        >
          <Text style={{ color: c.textInverse, fontWeight: '900', fontSize: 15 }}>
            Kembali ke Kasir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPrint}
          style={{
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8
          }}
        >
          <Printer size={16} color={c.text} />
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>
            Cetak Ulang
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
