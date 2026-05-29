import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { getColors } from '../utils/theme';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';

export default function NotFoundScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }]}>
            <AlertCircle size={40} color="#ef4444" />
          </View>
          <Text style={[styles.title, { color: c.text }]}>Halaman Tidak Ditemukan</Text>
          <Text style={[styles.message, { color: c.textSecondary }]}>
            Rute atau tautan yang Anda tuju tidak valid atau tidak dapat ditemukan dalam sistem SmartPOS.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={[styles.button, { backgroundColor: c.accent }]}
          >
            <ArrowLeft size={16} color="#fff" />
            <Text style={styles.buttonText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
