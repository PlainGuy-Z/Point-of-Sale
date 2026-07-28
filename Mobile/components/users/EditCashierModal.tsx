import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  StyleSheet,
} from 'react-native';
import { X, Pencil, Building2, Check } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { appApi } from '../../services/appApi';
import { useBranch } from '../../contexts/BranchContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CashierUserRow } from './UsersManagementScreen';

interface EditCashierModalProps {
  cashier: CashierUserRow;
  onClose: () => void;
  onSaved: (user: CashierUserRow) => void;
}

export default function EditCashierModal({ cashier, onClose, onSaved }: EditCashierModalProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { branches } = useBranch();

  const activeBranches = branches.filter((b) => b.is_active);

  const [name, setName] = useState(cashier.name);
  const [email, setEmail] = useState(cashier.email);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    cashier.branch_id || activeBranches.find((b) => b.is_default)?.id || activeBranches[0]?.id || ''
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    const trimName = name.trim();
    const trimEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (trimName.length < 3) {
      setError('Nama lengkap minimal 3 karakter.');
      return;
    }
    if (!emailRegex.test(trimEmail)) {
      setError('Format email tidak valid.');
      return;
    }

    // Check if nothing changed
    if (trimName === cashier.name && trimEmail === cashier.email && selectedBranchId === cashier.branch_id) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const user = await appApi.put<CashierUserRow>(
        `/users/${encodeURIComponent(cashier.id)}`,
        { name: trimName, email: trimEmail, branch_id: selectedBranchId || undefined }
      );
      onSaved(user);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menyimpan perubahan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: c.bgInput,
    borderWidth: 1,
    borderColor: c.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.text,
    fontSize: 14,
  } as const;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={() => !loading && onClose()}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
      }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !loading && onClose()} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={{ width: '100%' }}
        >
          <View style={{
            backgroundColor: c.bgCard,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderTopColor: c.border,
            width: '100%',
            maxHeight: '88%',
            paddingBottom: Math.max(insets.bottom, 12),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 10,
          }}>
              {/* Handle bar */}
              <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.borderLight }} />
              </View>

              {/* Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: c.borderLight,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pencil size={18} color={c.accent} strokeWidth={2.5} />
                  <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Edit Kasir</Text>
                </View>
                <TouchableOpacity
                  onPress={() => !loading && onClose()}
                  style={{ padding: 6, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}
                >
                  <X size={18} color={c.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <ScrollView
                contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: Math.max(insets.bottom + 24, 40) }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
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

                <View>
                  <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                    Nama Lengkap
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Nama kasir"
                    placeholderTextColor={c.textMuted}
                    autoCapitalize="words"
                    style={inputStyle}
                  />
                </View>

                <View>
                  <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                    Email
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nama@email.com"
                    placeholderTextColor={c.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={inputStyle}
                  />
                </View>

                {/* Branch Selection */}
                {activeBranches.length > 0 && (
                  <View>
                    <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                      Cabang Tugas <Text style={{ color: '#ef4444' }}>*</Text>
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {activeBranches.map((b) => {
                        const isSel = selectedBranchId === b.id;
                        return (
                          <TouchableOpacity
                            key={b.id}
                            onPress={() => setSelectedBranchId(b.id)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 10,
                              backgroundColor: isSel ? c.accentBg : (isDark ? '#252525' : '#f8fafc'),
                              borderWidth: 1,
                              borderColor: isSel ? c.accent : c.borderLight,
                            }}
                          >
                            <Building2 size={14} color={isSel ? c.accent : c.textSecondary} />
                            <Text style={{ fontSize: 13, fontWeight: isSel ? '800' : '600', color: isSel ? c.accent : c.text }}>
                              {b.name}
                            </Text>
                            {isSel && <Check size={14} color={c.accent} strokeWidth={2.5} />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '500' }}>
                  ℹ️ Password tidak dapat diubah di sini. Gunakan Reset Password jika diperlukan.
                </Text>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
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
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: loading ? c.textMuted : c.accent,
                      alignItems: 'center',
                      shadowColor: c.accent,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: loading ? 0 : 0.3,
                      shadowRadius: 8,
                      elevation: loading ? 0 : 4,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Simpan</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
    </Modal>
  );
}
