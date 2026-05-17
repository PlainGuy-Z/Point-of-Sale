import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

interface PlaceholderScreenProps {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}

export default function PlaceholderScreen({ title, icon, description }: PlaceholderScreenProps) {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>{title}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 20,
          backgroundColor: c.accentBg,
          alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <Feather name={icon} size={32} color={c.accent} />
        </View>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>{title}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}
