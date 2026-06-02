import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { X, AlertTriangle, KeyRound, Copy, Check, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { appApi } from '../../services/appApi';
import type { CashierUserRow } from './UsersManagementScreen';

interface ResetPasswordModalProps {
  cashier: CashierUserRow;
  onClose: () => void;
}

export default function ResetPasswordModal({ cashier, onClose }: ResetPasswordModalProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [phase, setPhase] = useState<'confirm' | 'result'>('confirm');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const runReset = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await appApi.post<{ temporary_password: string }>(
        `/users/${encodeURIComponent(cashier.id)}/reset-password`
      );
      setTemporaryPassword(res.temporary_password);
      setPhase('result');
    } catch (err: any) {
      const msg = err?.message || 'Gagal reset password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    try {
      await Clipboard.setStringAsync(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyalin ke clipboard.');
    }
  };

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <View style={{
          backgroundColor: c.bgCard,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: c.border,
          width: '100%',
          maxWidth: 400,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        }}>
          {phase === 'confirm' ? (
            <>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: c.borderLight,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ShieldAlert size={18} color="#f59e0b" strokeWidth={2.5} />
                  <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Reset Password</Text>
                </View>
                <TouchableOpacity
                  onPress={() => !loading && onClose()}
                  style={{ padding: 6, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}
                >
                  <X size={18} color={c.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={{ padding: 20, gap: 16 }}>
                {error && (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca',
                    borderRadius: 12,
                    padding: 12,
                  }}>
                    <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>{error}</Text>
                  </View>
                )}

                {/* Warning */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a',
                  borderRadius: 14,
                  padding: 14,
                }}>
                  <AlertTriangle size={18} color="#f59e0b" strokeWidth={2.5} style={{ marginTop: 1 }} />
                  <Text style={{ color: isDark ? '#fbbf24' : '#92400e', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 20 }}>
                    Tindakan ini akan mengganti password{' '}
                    <Text style={{ fontWeight: '900', textDecorationLine: 'underline' }}>{cashier.name}</Text>
                    {' '}dengan password sementara yang baru.
                  </Text>
                </View>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => !loading && onClose()}
                    disabled={loading}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: c.border,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '700' }}>Batal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={runReset}
                    disabled={loading}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: loading ? c.textMuted : '#ef4444',
                      alignItems: 'center',
                      shadowColor: '#ef4444',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: loading ? 0 : 0.3,
                      shadowRadius: 8,
                      elevation: loading ? 0 : 4,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Header - Result */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: c.borderLight,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <KeyRound size={18} color="#10b981" strokeWidth={2.5} />
                  <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Password Direset</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={{ padding: 6, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}
                >
                  <X size={18} color={c.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Body - Result */}
              <View style={{ padding: 20, gap: 16 }}>
                <View>
                  <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
                    Password Sementara
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: c.bgInput,
                    borderWidth: 1,
                    borderColor: c.borderLight,
                    borderRadius: 14,
                    padding: 14,
                    gap: 10,
                  }}>
                    <Text style={{
                      flex: 1,
                      color: c.accent,
                      fontSize: 22,
                      fontWeight: '900',
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      letterSpacing: 1.5,
                    }}>
                      {temporaryPassword}
                    </Text>
                    <TouchableOpacity
                      onPress={copyPassword}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: copied
                          ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5')
                          : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
                        borderWidth: 1,
                        borderColor: copied
                          ? (isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0')
                          : c.borderLight,
                      }}
                    >
                      {copied ? (
                        <Check size={14} color="#10b981" strokeWidth={2.5} />
                      ) : (
                        <Copy size={14} color={c.textSecondary} strokeWidth={2.5} />
                      )}
                      <Text style={{
                        color: copied ? '#10b981' : c.textSecondary,
                        fontSize: 11,
                        fontWeight: '700',
                      }}>
                        {copied ? 'Tersalin!' : 'Salin'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '500', lineHeight: 18 }}>
                  ℹ️ Berikan password ini kepada kasir. Password ini hanya ditampilkan sekali.
                </Text>

                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: c.accent,
                    alignItems: 'center',
                    shadowColor: c.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Selesai</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
