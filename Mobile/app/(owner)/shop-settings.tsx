import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { ArrowLeft, Store, MapPin, Clock, Image as ImageIcon, Upload, Loader2, Phone } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

import { resolveImageUrl } from '../../utils/image';

export default function ShopSettingsScreen() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const insets = useSafeAreaInsets();

  const { settings, updateSettings, isServiceLoading } = useApp();
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    shop_name: user?.shop?.name || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
    open_time: settings?.open_time || '08:00',
    close_time: settings?.close_time || '22:00',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        shop_name: user?.shop?.name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        open_time: settings.open_time || '08:00',
        close_time: settings.close_time || '22:00',
      });
      setIsDirty(false);
    }
  }, [settings, user]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const uploadFile = async (uri: string): Promise<{ url: string }> => {
    const token = await SecureStore.getItemAsync('auth_token');
    let filename = uri.split('/').pop() || 'logo.jpg';
    if (!filename.includes('.')) {
      filename = `${filename}.jpg`;
    }
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    const formData = new FormData();
    // Native FormData in React Native requires an object with uri, name, and type
    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);

    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/app/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Upload gagal dengan status HTTP ${res.status}`);
    }

    return await res.json();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin galeri untuk memilih logo toko.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setIsUploading(true);
      try {
        const { url } = await uploadFile(uri);
        await updateSettings({ logo_url: url });
        await refreshUser();
        Alert.alert('Sukses', 'Logo toko berhasil diperbarui.');
      } catch (err) {
        console.error('Logo upload error:', err);
        Alert.alert('Upload Gagal', err instanceof Error ? err.message : 'Terjadi kesalahan saat mengupload logo.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        shop_name: form.shop_name,
        address: form.address,
        phone: form.phone,
        open_time: form.open_time,
        close_time: form.close_time,
      });

      await refreshUser();

      setIsDirty(false);
      Alert.alert('Sukses', 'Profil toko berhasil disimpan.');
    } catch (err) {
      console.error('Save shop profile error:', err);
      Alert.alert('Gagal Menyimpan', err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const logoUrl = settings?.logo_url || user?.shop?.logo_url;
  const resolvedLogoUrl = logoUrl ? resolveImageUrl(logoUrl) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
        >
          <ArrowLeft size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }}>Toko & Bisnis</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {/* Logo Section */}
        <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ImageIcon size={18} color={c.accent} />
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>Logo Toko</Text>
          </View>

          <View style={{ flexDirection: isLandscape ? 'row' : 'column', alignItems: 'center', gap: 16 }}>
            <View style={{ position: 'relative' }}>
              <View style={{
                width: 96,
                height: 96,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: c.border,
                backgroundColor: c.bgInput,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {resolvedLogoUrl ? (
                  <Image source={{ uri: resolvedLogoUrl }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Store size={36} color={c.textMuted} />
                )}
              </View>
              {isUploading && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }]}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>

            <View style={{ flex: 1, width: '100%', gap: 8 }}>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                Logo ini akan ditampilkan di sidebar menu explorer dan struk cetak belanjaan.
              </Text>
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isUploading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: c.accent,
                  borderRadius: 12,
                  paddingVertical: 10,
                  opacity: isUploading ? 0.6 : 1,
                }}
              >
                <Upload size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Pilih Logo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Identity Section */}
        <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Store size={18} color={c.accent} />
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>Identitas Toko</Text>
          </View>

          <View style={{ gap: 12 }}>
            <View>
              <Text style={[styles.label, { color: c.textSecondary }]}>Nama Toko</Text>
              <TextInput
                value={form.shop_name}
                onChangeText={val => handleChange('shop_name', val)}
                style={[styles.input, { backgroundColor: c.bgInput, borderColor: c.border, color: c.text }]}
                placeholder="Nama Usaha / Toko Anda"
                placeholderTextColor={c.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Contact & Location Section */}
        <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MapPin size={18} color={c.accent} />
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>Kontak & Lokasi</Text>
          </View>

          <View style={{ gap: 12 }}>
            <View>
              <Text style={[styles.label, { color: c.textSecondary }]}>Alamat Lengkap</Text>
              <TextInput
                value={form.address}
                onChangeText={val => handleChange('address', val)}
                multiline
                numberOfLines={3}
                style={[styles.input, {
                  backgroundColor: c.bgInput,
                  borderColor: c.border,
                  color: c.text,
                  height: 80,
                  textAlignVertical: 'top',
                  paddingVertical: 10,
                }]}
                placeholder="Jalan, Nomor, Kota, Provinsi"
                placeholderTextColor={c.textMuted}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: c.textSecondary }]}>Nomor Telepon</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: c.bgInput,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                paddingHorizontal: 12,
              }}>
                <Phone size={14} color={c.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  value={form.phone}
                  onChangeText={val => handleChange('phone', val)}
                  keyboardType="phone-pad"
                  style={{ flex: 1, color: c.text, fontSize: 13, height: 42, paddingVertical: 0 }}
                  placeholder="0812345678"
                  placeholderTextColor={c.textMuted}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Operating Hours Section */}
        <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={18} color={c.accent} />
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>Jam Operasional</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Jam Buka</Text>
              <TextInput
                value={form.open_time}
                onChangeText={val => handleChange('open_time', val)}
                placeholder="08:00"
                placeholderTextColor={c.textMuted}
                style={[styles.input, { backgroundColor: c.bgInput, borderColor: c.border, color: c.text }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Jam Tutup</Text>
              <TextInput
                value={form.close_time}
                onChangeText={val => handleChange('close_time', val)}
                placeholder="22:00"
                placeholderTextColor={c.textMuted}
                style={[styles.input, { backgroundColor: c.bgInput, borderColor: c.border, color: c.text }]}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Save Banner */}
      {isDirty && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: c.bgCard,
          borderTopWidth: 1,
          borderTopColor: c.border,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        }}>
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>Perubahan belum disimpan</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                if (settings) {
                  setForm({
                    shop_name: user?.shop?.name || '',
                    address: settings.address || '',
                    phone: settings.phone || '',
                    open_time: settings.open_time || '08:00',
                    close_time: settings.close_time || '22:00',
                  });
                  setIsDirty(false);
                }
              }}
              style={{
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700' }}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: c.accent,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    height: 42,
  },
});
