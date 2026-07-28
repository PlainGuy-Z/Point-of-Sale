import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function LogoutModal({ visible, onClose, onConfirm }: LogoutModalProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: c.bgCard,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: c.borderLight,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 12,
            zIndex: 10,
          }}
        >
          {/* Top Red Badge */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(254, 226, 226, 0.8)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <LogOut size={26} color={c.error} strokeWidth={2.2} />
          </View>

          {/* Title */}
          <Text
            style={{
              color: c.text,
              fontSize: 18,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 8,
              letterSpacing: -0.3,
            }}
          >
            Keluar dari Akun?
          </Text>

          {/* Description */}
          <Text
            style={{
              color: c.textSecondary,
              fontSize: 13,
              lineHeight: 19,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Apakah Anda yakin ingin keluar dari aplikasi SmartPOS? Anda perlu melakukan login kembali untuk mengakses sistem.
          </Text>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: c.bgInput,
                borderWidth: 1,
                borderColor: c.borderLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>
                Batal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: c.error,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <LogOut size={16} color="#ffffff" strokeWidth={2.2} />
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                    Keluar
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
