import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { useApp } from '../../contexts/AppContext';

interface SidebarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory?: (cat: string) => void;
}

export default function SidebarModal({ visible, onClose, onSelectCategory }: SidebarModalProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { categories } = useApp();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-start' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: c.bgCard, padding: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '900' }}>Menu</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ color: c.accent }}>Tutup</Text></TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity onPress={() => { onSelectCategory?.('Semua'); onClose(); }} style={{ padding: 8 }}>
              <Text style={{ color: c.textSecondary }}>Semua</Text>
            </TouchableOpacity>
            {(categories || []).map(cat => (
              <TouchableOpacity key={cat} onPress={() => { onSelectCategory?.(cat); onClose(); }} style={{ padding: 8 }}>
                <Text style={{ color: c.textSecondary }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
