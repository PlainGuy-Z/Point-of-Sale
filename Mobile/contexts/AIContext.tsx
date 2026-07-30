import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { aiApi, ChatMessage } from '../services/aiApi';

interface AIContextProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  lastContextSnapshot: {
    today_revenue: number;
    this_week_revenue: number;
    total_transactions: number;
  } | null;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  setPresetPrompt: (text: string) => void;
}

const AIContext = createContext<AIContextProps | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastContextSnapshot, setLastContextSnapshot] = useState<AIContextProps['lastContextSnapshot']>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Create history without the new message since we pass it separately
      const historyForApi = messages.filter(m => m.content.trim() !== '');

      const res = await aiApi.chat(text, historyForApi, lastContextSnapshot || undefined);
      
      const modelMessage: ChatMessage = { role: 'model', content: res.reply };
      setMessages((prev) => [...prev, modelMessage]);
      if (res.context_snapshot) {
        setLastContextSnapshot(res.context_snapshot);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      if (err?.status === 429) {
        setError('Batas penggunaan AI tercapai (maks 20/jam). Silakan coba lagi nanti.');
      } else {
        setError('Maaf, saya sedang mengalami kendala. Silakan coba lagi.');
      }
      // Remove the user message if it failed completely
      setMessages((prev) => prev.filter((m) => m !== newMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setLastContextSnapshot(null);
  };

  const setPresetPrompt = (text: string) => {
    sendMessage(text);
  };

  const contextValue = useMemo(() => ({ messages, isLoading, error, lastContextSnapshot, sendMessage, clearChat, setPresetPrompt }), [messages, isLoading, error, lastContextSnapshot, sendMessage, clearChat, setPresetPrompt]);

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
