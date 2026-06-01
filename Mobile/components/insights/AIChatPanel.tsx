import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Send, Bot } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { aiApi } from '../../services/aiApi';

export default function AIChatPanel({ contextSnapshot }: { contextSnapshot: any }) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: 'Halo! Saya AI Advisor SmartPOS. Ada yang bisa saya bantu terkait laporan Anda?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Create history map
      const history = messages.map(m => ({
        role: m.role,
        content: m.text
      }));
      
      const res = await aiApi.chat(userMsg, history, contextSnapshot);
      setMessages(prev => [...prev, { role: 'model', text: res.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'Maaf, saya sedang mengalami gangguan jaringan. Coba lagi nanti.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {messages.map((m, idx) => (
          <View key={idx} style={{
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            marginBottom: 12,
            alignItems: 'flex-end'
          }}>
            {m.role === 'model' && (
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.accent + '20', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <Bot size={16} color={c.accent} />
              </View>
            )}
            <View style={{
              maxWidth: '75%',
              padding: 12,
              borderRadius: 16,
              backgroundColor: m.role === 'user' ? c.accent : (isDark ? '#2A2A2A' : '#F0F0F0'),
              borderBottomRightRadius: m.role === 'user' ? 4 : 16,
              borderBottomLeftRadius: m.role === 'model' ? 4 : 16,
            }}>
              <Text style={{ color: m.role === 'user' ? 'white' : c.text, fontSize: 14, lineHeight: 20 }}>
                {m.text}
              </Text>
            </View>
          </View>
        ))}
        {isLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <ActivityIndicator size="small" color={c.accent} />
            <Text style={{ color: c.textMuted, fontSize: 12, marginLeft: 8 }}>AI sedang mengetik...</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: c.borderLight, backgroundColor: c.bg }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Tanya soal performa produk..."
          placeholderTextColor={c.textMuted}
          style={{
            flex: 1,
            height: 40,
            backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
            borderRadius: 20,
            paddingHorizontal: 16,
            color: c.text,
            fontSize: 14
          }}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: input.trim() && !isLoading ? c.accent : c.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8
          }}
        >
          <Send size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
