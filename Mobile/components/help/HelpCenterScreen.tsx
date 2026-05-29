import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  HelpCircle, MessageCircle, BookOpen, Mail, ExternalLink, Coffee,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

const helpSections = [
  {
    title: 'Mulai Menggunakan',
    items: [
      { label: 'Cara Buka Shift', desc: 'Pelajari cara membuka dan menutup shift kasir' },
      { label: 'Membuat Transaksi', desc: 'Panduan langkah demi langkah membuat penjualan' },
      { label: 'Mengelola Produk', desc: 'Tambah, edit, dan atur kategori produk' },
    ],
  },
  {
    title: 'Fitur Lanjutan',
    items: [
      { label: 'Laporan Penjualan', desc: 'Memahami laporan dan analitik' },
      { label: 'Business Intelligence', desc: 'Insight otomatis untuk meningkatkan bisnis' },
      { label: 'Manajemen Stok', desc: 'Pengaturan stok minimum dan peringatan' },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { label: 'Pengaturan Toko', desc: 'Nama toko, alamat, dan jam operasional' },
      { label: 'Pajak & Biaya', desc: 'Konfigurasi PPN dan service charge' },
      { label: 'Struk & Printer', desc: 'Koneksi printer bluetooth dan format struk' },
    ],
  },
];

export default function HelpCenterScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingLeft: isLandscape ? 16 : 60, paddingRight: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <HelpCircle size={22} color={c.accent} strokeWidth={2} />
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
            Help <Text style={{ color: c.accent }}>Center</Text>
          </Text>
        </View>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
          Panduan dan bantuan menggunakan SmartPOS
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        {/* App info card */}
        <View style={{
          backgroundColor: c.accentBg, borderWidth: 1,
          borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(13,148,136,0.2)',
          borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <View style={{
            width: 48, height: 48, borderRadius: 14, backgroundColor: c.accent,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Coffee size={24} color={c.textInverse} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>SmartPOS</Text>
            <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>
              Versi 1.0.0 • Point of Sale System
            </Text>
          </View>
        </View>

        {/* Help Sections */}
        {helpSections.map(section => (
          <View key={section.title}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
              {section.title}
            </Text>
            {section.items.map((item, idx) => (
              <View key={idx} style={{
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
                borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: c.accentBg,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen size={16} color={c.accent} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{item.label}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Contact */}
        <View style={{
          backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 16, padding: 16,
        }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
            Butuh Bantuan Lain?
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 12, lineHeight: 18 }}>
            Hubungi tim support kami untuk pertanyaan lebih lanjut tentang penggunaan SmartPOS.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <View style={{
              flex: 1, backgroundColor: c.accentBg, borderRadius: 12,
              padding: 12, alignItems: 'center', gap: 4,
            }}>
              <Mail size={16} color={c.accent} strokeWidth={2} />
              <Text style={{ color: c.accent, fontSize: 11, fontWeight: '600' }}>Email</Text>
            </View>
            <View style={{
              flex: 1, backgroundColor: c.accentBg, borderRadius: 12,
              padding: 12, alignItems: 'center', gap: 4,
            }}>
              <MessageCircle size={16} color={c.accent} strokeWidth={2} />
              <Text style={{ color: c.accent, fontSize: 11, fontWeight: '600' }}>WhatsApp</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
