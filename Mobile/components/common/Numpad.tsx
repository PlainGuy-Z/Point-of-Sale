import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Delete } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', 'del'],
];

export default function Numpad({ value, onChange, maxLength = 12 }: NumpadProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else {
      if (value.length >= maxLength) return;
      // Prevent leading zeros (allow '00' after non-zero digit)
      if (value === '0' && key === '0') return;
      if (value === '' && key === '00') {
        onChange('0');
        return;
      }
      onChange(value + key);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      {keys.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => handlePress(key)}
              activeOpacity={0.6}
              style={{
                flex: 1,
                aspectRatio: 1.8,
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {key === 'del' ? (
                <Delete size={22} color={c.textSecondary} strokeWidth={2} />
              ) : (
                <Text style={{ color: c.text, fontSize: 22, fontWeight: '600' }}>{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}
