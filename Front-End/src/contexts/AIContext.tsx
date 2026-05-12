import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { aiApi } from '../services/aiApi';
import type { ChatMessage } from '../services/aiApi';
import { ApiError } from '../services/appApi';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  contextSnapshot?: {
    today_revenue: number;
    this_week_revenue: number;
  };
}

interface AIContextType {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

// ─── Serialisation helpers ───────────────────────────────────────────────────

interface StoredMessage extends Omit<AIMessage, 'timestamp'> {
  timestamp: string; // ISO string
}

function serialise(messages: AIMessage[]): string {
  const wire: StoredMessage[] = messages.map((m) => ({
    ...m,
    timestamp: m.timestamp.toISOString(),
  }));
  return JSON.stringify(wire);
}

function deserialise(raw: string): AIMessage[] {
  try {
    const wire: StoredMessage[] = JSON.parse(raw);
    return wire.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const storageKey = `ai_chat_${user?.id ?? 'guest'}`;

  const [messages, setMessages] = useState<AIMessage[]>(() => {
    const stored = sessionStorage.getItem(storageKey);
    return stored ? deserialise(stored) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist to sessionStorage on every messages update
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(storageKey, serialise(messages));
    }
  }, [messages, storageKey]);

  // Reload from sessionStorage when user changes
  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    setMessages(stored ? deserialise(stored) : []);
  }, [storageKey]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setError(null);

      // 1. Create user message
      const userMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      // 2. Save to sessionStorage immediately
      sessionStorage.setItem(storageKey, serialise(updatedMessages));

      // 3. Build API history — last 10 messages, mapped to ChatMessage format
      const historyForApi: ChatMessage[] = updatedMessages
        .slice(-10)
        .map((msg) => ({
          role: msg.role === 'ai' ? 'model' as const : 'user' as const,
          content: msg.content,
        }));

      setIsLoading(true);

      try {
        const response = await aiApi.sendChatMessage(text.trim(), historyForApi);

        // 4. Create AI message from response
        const aiMsg: AIMessage = {
          id: crypto.randomUUID(),
          role: 'ai',
          content: response.reply,
          timestamp: new Date(),
          contextSnapshot: response.context_snapshot
            ? {
                today_revenue: response.context_snapshot.today_revenue,
                this_week_revenue: response.context_snapshot.this_week_revenue,
              }
            : undefined,
        };

        setMessages((prev) => {
          const next = [...prev, aiMsg];
          sessionStorage.setItem(storageKey, serialise(next));
          return next;
        });
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 429) {
          setError('Batas 20 chat/jam tercapai.');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Gagal mengirim pesan.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, storageKey],
  );

  const clearChat = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setMessages([]);
    setError(null);
  }, [storageKey]);

  const value = useMemo<AIContextType>(
    () => ({ messages, isLoading, error, sendMessage, clearChat }),
    [messages, isLoading, error, sendMessage, clearChat],
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export const useAI = (): AIContextType => {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAI must be used within AIProvider');
  return ctx;
};
