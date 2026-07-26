import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Store,
  Link as LinkIcon,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { authApi } from '../../services/authApi';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [licenseToken, setLicenseToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [tokenMessage, setTokenMessage] = useState('');

  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 50);

  useEffect(() => {
    if (!slugEdited && shopName) {
      setShopSlug(generateSlug(shopName));
    }
  }, [shopName, slugEdited]);

  const handleVerifyToken = async () => {
    if (!licenseToken.trim()) {
      setTokenStatus('invalid');
      setTokenMessage('License Token tidak boleh kosong');
      return;
    }
    setTokenStatus('checking');
    setTokenMessage('');
    try {
      const res = await authApi.verifyToken(licenseToken.trim());
      if (res.valid) {
        setTokenStatus('valid');
        setTokenMessage('Token lisensi valid & tersedia.');
      } else {
        setTokenStatus('invalid');
        setTokenMessage(res.message || 'Token tidak valid');
      }
    } catch (err: any) {
      setTokenStatus('invalid');
      setTokenMessage(err?.message || 'Gagal memverifikasi token');
    }
  };

  const handleRegister = async () => {
    setError('');

    if (!licenseToken.trim()) {
      setError('License Token wajib diisi.');
      return;
    }

    if (tokenStatus !== 'valid') {
      setError('Silakan verifikasi License Token Anda terlebih dahulu.');
      return;
    }

    if (!shopName.trim() || !ownerName.trim() || !email.trim() || !password.trim()) {
      setError('Semua kolom formulir harus diisi.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(shopSlug)) {
      setError('Slug toko hanya boleh berisi huruf kecil, angka, dan strip (-).');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await register({
        shopName: shopName.trim(),
        shopSlug: shopSlug.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        password,
        licenseToken: licenseToken.trim(),
      });

      if (user.role === 'owner') {
        router.replace('/(owner)/dashboard');
      } else {
        router.replace('/(cashier)/pos');
      }
    } catch (err: any) {
      setError(err?.message || 'Registrasi gagal. Periksa data Anda dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 16, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: c.bgCard,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: c.border,
                marginRight: 12,
              }}
            >
              <ArrowLeft size={20} color={c.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>
                Buat Akun Baru
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                Daftarkan toko & akun Owner SmartPOS
              </Text>
            </View>
          </View>

          {/* Header Branding */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Image
              source={require('../../assets/SmartPos2.png')}
              style={{ width: 80, height: 80, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
              SmartPOS
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={{
              backgroundColor: c.bgCard,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            {/* Error Banner */}
            {error ? (
              <View
                style={{
                  backgroundColor: c.errorBg,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} color={c.error} strokeWidth={2} />
                <Text style={{ color: c.error, fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            {/* License Token Input */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                License Token (Wajib)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: c.bgInput,
                    borderWidth: 1,
                    borderColor: focusedField === 'licenseToken' ? c.accent : c.border,
                    borderRadius: 16,
                    paddingHorizontal: 14,
                  }}
                >
                  <KeyRound
                    size={18}
                    color={focusedField === 'licenseToken' ? c.accent : c.textMuted}
                    strokeWidth={2}
                  />
                  <TextInput
                    value={licenseToken}
                    onChangeText={(val) => {
                      setLicenseToken(val);
                      setTokenStatus('idle');
                    }}
                    onFocus={() => setFocusedField('licenseToken')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Masukkan token lisensi"
                    placeholderTextColor={c.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      color: c.text,
                      fontSize: 15,
                      paddingVertical: 14,
                      paddingLeft: 10,
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleVerifyToken}
                  disabled={tokenStatus === 'checking'}
                  style={{
                    backgroundColor: c.accent,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {tokenStatus === 'checking' ? (
                    <ActivityIndicator color={c.textInverse} size="small" />
                  ) : (
                    <Text style={{ color: c.textInverse, fontWeight: '700', fontSize: 13 }}>
                      Cek Token
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Token Status Feedback */}
              {tokenStatus === 'valid' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  <CheckCircle2 size={14} color="#10b981" />
                  <Text style={{ color: '#10b981', fontSize: 12 }}>{tokenMessage}</Text>
                </View>
              )}
              {tokenStatus === 'invalid' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  <AlertCircle size={14} color={c.error} />
                  <Text style={{ color: c.error, fontSize: 12 }}>{tokenMessage}</Text>
                </View>
              )}
            </View>

            {/* Nama Toko */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Nama Toko / Outlet
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.bgInput,
                  borderWidth: 1,
                  borderColor: focusedField === 'shopName' ? c.accent : c.border,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                }}
              >
                <Store
                  size={18}
                  color={focusedField === 'shopName' ? c.accent : c.textMuted}
                  strokeWidth={2}
                />
                <TextInput
                  value={shopName}
                  onChangeText={setShopName}
                  onFocus={() => setFocusedField('shopName')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Kopi Kenangan"
                  placeholderTextColor={c.textMuted}
                  style={{
                    flex: 1,
                    color: c.text,
                    fontSize: 15,
                    paddingVertical: 14,
                    paddingLeft: 10,
                  }}
                />
              </View>
            </View>

            {/* Slug Toko */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Slug Toko (URL)
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.bgInput,
                  borderWidth: 1,
                  borderColor: focusedField === 'shopSlug' ? c.accent : c.border,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                }}
              >
                <LinkIcon
                  size={18}
                  color={focusedField === 'shopSlug' ? c.accent : c.textMuted}
                  strokeWidth={2}
                />
                <TextInput
                  value={shopSlug}
                  onChangeText={(val) => {
                    setShopSlug(val);
                    setSlugEdited(true);
                  }}
                  onFocus={() => setFocusedField('shopSlug')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="kopi-kenangan"
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    color: c.text,
                    fontSize: 15,
                    paddingVertical: 14,
                    paddingLeft: 10,
                  }}
                />
              </View>
            </View>

            {/* Nama Owner */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Nama Pemilik / Owner
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.bgInput,
                  borderWidth: 1,
                  borderColor: focusedField === 'ownerName' ? c.accent : c.border,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                }}
              >
                <User
                  size={18}
                  color={focusedField === 'ownerName' ? c.accent : c.textMuted}
                  strokeWidth={2}
                />
                <TextInput
                  value={ownerName}
                  onChangeText={setOwnerName}
                  onFocus={() => setFocusedField('ownerName')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Nama Lengkap Owner"
                  placeholderTextColor={c.textMuted}
                  style={{
                    flex: 1,
                    color: c.text,
                    fontSize: 15,
                    paddingVertical: 14,
                    paddingLeft: 10,
                  }}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Email
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.bgInput,
                  borderWidth: 1,
                  borderColor: focusedField === 'email' ? c.accent : c.border,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                }}
              >
                <Mail
                  size={18}
                  color={focusedField === 'email' ? c.accent : c.textMuted}
                  strokeWidth={2}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="owner@email.com"
                  placeholderTextColor={c.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    color: c.text,
                    fontSize: 15,
                    paddingVertical: 14,
                    paddingLeft: 10,
                  }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Password
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.bgInput,
                  borderWidth: 1,
                  borderColor: focusedField === 'password' ? c.accent : c.border,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                }}
              >
                <Lock
                  size={18}
                  color={focusedField === 'password' ? c.accent : c.textMuted}
                  strokeWidth={2}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    color: c.text,
                    fontSize: 15,
                    paddingVertical: 14,
                    paddingLeft: 10,
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  {showPassword ? (
                    <EyeOff size={18} color={c.textMuted} strokeWidth={2} />
                  ) : (
                    <Eye size={18} color={c.textMuted} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Konfirmasi Password
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.bgInput,
                  borderWidth: 1,
                  borderColor: focusedField === 'confirmPassword' ? c.accent : c.border,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                }}
              >
                <Lock
                  size={18}
                  color={focusedField === 'confirmPassword' ? c.accent : c.textMuted}
                  strokeWidth={2}
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ulangi password"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  style={{
                    flex: 1,
                    color: c.text,
                    fontSize: 15,
                    paddingVertical: 14,
                    paddingLeft: 10,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={8}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={c.textMuted} strokeWidth={2} />
                  ) : (
                    <Eye size={18} color={c.textMuted} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
              style={{
                backgroundColor: isLoading ? (isDark ? '#b47708' : '#0d7377') : c.accent,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: c.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color={c.textInverse} size="small" />
              ) : (
                <Text
                  style={{
                    color: c.textInverse,
                    fontSize: 16,
                    fontWeight: '900',
                    letterSpacing: 0.5,
                  }}
                >
                  DAFTAR SEKARANG
                </Text>
              )}
            </TouchableOpacity>

            {/* Link to Login */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
              }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 14 }}>
                Sudah punya akun?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
                <Text style={{ color: c.accent, fontSize: 14, fontWeight: '700' }}>
                  Masuk di sini
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
