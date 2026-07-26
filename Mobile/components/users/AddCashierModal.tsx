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
} from 'react-native';
import { X, Eye, EyeOff, UserPlus, Building2, Check } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { appApi } from '../../services/appApi';
import { useBranch } from '../../contexts/BranchContext';
import type { CashierUserRow } from './UsersManagementScreen';

interface AddCashierModalProps {
  onClose: () => void;
  onCreated: (user: CashierUserRow) => void;
}

export default function AddCashierModal({ onClose, onCreated }: AddCashierModalProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { branches } = useBranch();

  const activeBranches = branches.filter((b) => b.is_active);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    activeBranches.find((b) => b.is_default)?.id || activeBranches[0]?.id || ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    if (!selectedBranchId && activeBranches.length > 0) {
      setError('Pilih cabang tempat kasir bertugas.');
      return;
    }

    setLoading(true);
    try {
      const user = await appApi.post<CashierUserRow>('/users', {
        name: trimName,
        email: trimEmail,
        password,
        role: 'cashier',
        branch_id: selectedBranchId || undefined,
      });
      onCreated(user);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Gagal membuat akun kasir.';
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
    <Modal visible animationType="slide" transparent statusBarTranslucent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <View style={{
              backgroundColor: c.bgCard,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: c.border,
              maxHeight: '92%',
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
                  <UserPlus size={18} color={c.accent} strokeWidth={2.5} />
                  <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Tambah Kasir Baru</Text>
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
                contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 32 }}
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

                <View>
                  <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                    Password
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', ...inputStyle, paddingRight: 6 }}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Minimal 8 karakter"
                      placeholderTextColor={c.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={{ flex: 1, color: c.text, fontSize: 14, padding: 0 }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
                      {showPassword ? <EyeOff size={18} color={c.textMuted} /> : <Eye size={18} color={c.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                    Konfirmasi Password
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', ...inputStyle, paddingRight: 6 }}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Ulangi password"
                      placeholderTextColor={c.textMuted}
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      style={{ flex: 1, color: c.text, fontSize: 14, padding: 0 }}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={{ padding: 6 }}>
                      {showConfirm ? <EyeOff size={18} color={c.textMuted} /> : <Eye size={18} color={c.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '500' }}>
                  ℹ️ Role otomatis diset sebagai Kasir.
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
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Buat Akun</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
