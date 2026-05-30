import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Bot, Send, User, Trash2, AlertCircle } from 'lucide-react-native';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

const PRESET_PROMPTS = [
  'Produk mana yang paling untung?',
  'Bagaimana meningkatkan omzet minggu ini?',
  'Apa risiko stok/waste saat ini?',
  'Analisis tren penjualan hari ini'
];

export default function AIChatPanel() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  
  const { messages, isLoading, error, sendMessage, clearChat, setPresetPrompt } = useAI();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText.trim());
    setInputText('');
    Keyboard.dismiss();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.borderLight }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color={c.accent} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>AI Advisor</Text>
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>Asisten bisnis pintar</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={{ padding: 8 }}>
            <Trash2 size={18} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Chat Area */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        {messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <Bot size={48} color={c.borderLight} strokeWidth={1.5} style={{ marginBottom: 16 }} />
            <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 }}>
              Halo! Saya AI Advisor Anda. Tanyakan apa saja seputar performa bisnis, stok, atau strategi penjualan.
            </Text>
            <View style={{ gap: 10, width: '100%' }}>
              {PRESET_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setPresetPrompt(prompt)}
                  disabled={isLoading}
                  style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#f1f5f9',
                    paddingVertical: 12, paddingHorizontal: 16,
                    borderRadius: 12, borderWidth: 1, borderColor: c.borderLight,
                  }}
                >
                  <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>"{prompt}"</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <View key={idx} style={{ flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: isUser ? c.bgCard : c.accentBg,
                    borderWidth: isUser ? 1 : 0, borderColor: c.border,
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isUser ? <User size={14} color={c.textSecondary} /> : <Bot size={14} color={c.accent} />}
                  </View>
                  <View style={{
                    maxWidth: '80%',
                    backgroundColor: isUser ? c.accent : (isDark ? '#222' : '#f8fafc'),
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderRadius: 16,
                    borderTopRightRadius: isUser ? 4 : 16,
                    borderTopLeftRadius: !isUser ? 4 : 16,
                    borderWidth: isUser ? 0 : 1, borderColor: c.borderLight,
                  }}>
                    <Text style={{
                      color: isUser ? '#fff' : c.text,
                      fontSize: 14, lineHeight: 22
                    }}>
                      {msg.content}
                    </Text>
                  </View>
                </View>
              );
            })}
            
            {isLoading && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color={c.accent} />
                </View>
                <View style={{ backgroundColor: isDark ? '#222' : '#f8fafc', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderTopLeftRadius: 4 }}>
                  <ActivityIndicator size="small" color={c.accent} />
                </View>
              </View>
            )}

            {error && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#331111' : '#fef2f2', padding: 12, borderRadius: 12, marginHorizontal: 10 }}>
                <AlertCircle size={16} color={c.error} />
                <Text style={{ color: c.error, fontSize: 12, flex: 1 }}>{error}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: c.borderLight, backgroundColor: c.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === 'ios' ? 12 : 8,
                color: c.text,
                fontSize: 14,
                maxHeight: 100,
              }}
              placeholder="Tanyakan ke AI..."
              placeholderTextColor={c.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              style={{
                width: 44, height: 44,
                borderRadius: 22,
                backgroundColor: !inputText.trim() || isLoading ? (isDark ? '#333' : '#e2e8f0') : c.accent,
                alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={18} color={!inputText.trim() ? c.textMuted : '#fff'} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
