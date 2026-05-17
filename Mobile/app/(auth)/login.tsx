import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coffee, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email dan password harus diisi');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'owner') {
        router.replace('/(owner)/dashboard');
      } else {
        router.replace('/(cashier)/pos');
      }
    } catch (err: any) {
      setError(err?.message || 'Login gagal. Periksa email dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'height' : 'padding'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
              shadowColor: c.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
            }}>
              <Coffee size={28} color={c.textInverse} strokeWidth={2} />
            </View>
            <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>SmartPOS</Text>
            <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 4 }}>Kelola bisnis F&B Anda</Text>
          </View>

          {/* Form Card */}
          <View style={{
            backgroundColor: c.bgCard, borderRadius: 24, padding: 24,
            borderWidth: 1, borderColor: c.border,
          }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginBottom: 4 }}>Masuk ke Akun</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: 24 }}>Masukkan kredensial Anda untuk melanjutkan</Text>

            {/* Error */}
            {error ? (
              <View style={{
                backgroundColor: c.errorBg, borderWidth: 1,
                borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca',
                borderRadius: 12, padding: 12, marginBottom: 16,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <AlertCircle size={16} color={c.error} strokeWidth={2} />
                <Text style={{ color: c.error, fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: c.bgInput, borderWidth: 1,
                borderColor: focusedField === 'email' ? c.accent : c.border,
                borderRadius: 16, paddingHorizontal: 14,
              }}>
                <Mail size={18} color={focusedField === 'email' ? c.accent : c.textMuted} strokeWidth={2} />
                <TextInput
                  value={email} onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                  placeholder="nama@email.com" placeholderTextColor={c.textMuted}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  style={{ flex: 1, color: c.text, fontSize: 15, paddingVertical: 14, paddingLeft: 10 }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: c.bgInput, borderWidth: 1,
                borderColor: focusedField === 'password' ? c.accent : c.border,
                borderRadius: 16, paddingHorizontal: 14,
              }}>
                <Lock size={18} color={focusedField === 'password' ? c.accent : c.textMuted} strokeWidth={2} />
                <TextInput
                  value={password} onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                  placeholder="••••••••" placeholderTextColor={c.textMuted}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, color: c.text, fontSize: 15, paddingVertical: 14, paddingLeft: 10 }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  {showPassword
                    ? <EyeOff size={18} color={c.textMuted} strokeWidth={2} />
                    : <Eye size={18} color={c.textMuted} strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}
              style={{
                backgroundColor: isLoading ? (isDark ? '#b47708' : '#0d7377') : c.accent,
                borderRadius: 16, paddingVertical: 16,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: c.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
              }}>
              {isLoading
                ? <ActivityIndicator color={c.textInverse} size="small" />
                : <Text style={{ color: c.textInverse, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>MASUK</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            SmartPOS v1.0.0 • Point of Sale System
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
