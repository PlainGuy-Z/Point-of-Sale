import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { useApp } from '../../contexts/AppContext';
import { ChevronRight, Folder, Check } from 'lucide-react-native';

interface SidebarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory?: (cat: string) => void;
  selectedCategory?: string;
}

export default function SidebarModal({ visible, onClose, onSelectCategory, selectedCategory }: SidebarModalProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { categories } = useApp();

  const allCategories = ['Semua', ...(categories || [])];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={{
          backgroundColor: c.bgCard,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: 32,
          maxHeight: '60%',
          borderWidth: 1,
          borderColor: c.borderLight,
        }}>
          {/* Bottom Sheet Handle Bar */}
          <View style={{
            alignSelf: 'center',
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: c.border,
            marginBottom: 20,
          }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>
              Pilih Kategori
            </Text>
            <TouchableOpacity 
              onPress={onClose}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: c.borderLight,
              }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '700' }}>Tutup</Text>
            </TouchableOpacity>
          </View>

          {/* Vertical Categories List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {allCategories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    onSelectCategory?.(cat);
                    onClose();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: isSelected ? c.accentBg : c.bgCard,
                    borderWidth: 1.5,
                    borderColor: isSelected ? c.accent : c.borderLight,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isSelected ? c.accent : (isDark ? '#222' : '#f3f4f6'),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Folder size={16} color={isSelected ? c.textInverse : c.textSecondary} />
                    </View>
                    <Text style={{
                      color: isSelected ? c.accent : c.text,
                      fontSize: 15,
                      fontWeight: '700',
                    }}>
                      {cat}
                    </Text>
                  </View>

                  {isSelected ? (
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: c.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Check size={12} color={c.textInverse} strokeWidth={3} />
                    </View>
                  ) : (
                    <ChevronRight size={16} color={c.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
