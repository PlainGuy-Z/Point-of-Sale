import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, MessageSquare } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { aiApi, type ChatMessage } from '../../services/aiApi';
import { ApiError } from '../../services/appApi';

export default function AIAssistant() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextSnapshot, setContextSnapshot] = useState<{ today: number; week: number } | null>(null);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessage: ChatMessage = { role: 'user', content: text };
    
    // Drop oldest if we exceed 10 messages (including the new user one and future model one)
    let updatedHistory = [...history, newMessage];
    if (updatedHistory.length > 10) {
      updatedHistory = updatedHistory.slice(updatedHistory.length - 10);
    }

    setHistory(updatedHistory);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiApi.sendChatMessage(text, history);
      
      const modelMessage: ChatMessage = { role: 'model', content: response.reply };
      setHistory((prev) => {
        let newHist = [...prev, modelMessage];
        if (newHist.length > 10) newHist = newHist.slice(newHist.length - 10);
        return newHist;
      });

      if (response.context_snapshot) {
        setContextSnapshot({
          today: response.context_snapshot.today_revenue,
          week: response.context_snapshot.this_week_revenue,
        });
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Batas chat hari ini tercapai. Coba lagi besok.');
      } else {
        setError(err.message || 'Gagal mengirim pesan.');
      }
      // Remove the user message if it failed so they can retry
      setHistory((prev) => prev.filter((msg) => msg !== newMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend(inputValue);
    }
  };

  const suggestedQuestions = [
    'Kenapa omzet minggu ini turun?',
    'Produk mana yang paling untung?',
    'Apa yang harus saya fokus besok?',
  ];

  return (
    <div className={`flex flex-col h-[600px] rounded-3xl border overflow-hidden ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
      
      {/* Header Context Snapshot */}
      <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-stone-800' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Bot className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Smart Assistant</h2>
        </div>
        {contextSnapshot && (
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className={`px-2 py-1 rounded-full ${isDark ? 'bg-stone-800 text-stone-300' : 'bg-gray-100 text-gray-600'}`}>
              Today: {format(contextSnapshot.today)}
            </div>
            <div className={`px-2 py-1 rounded-full ${isDark ? 'bg-stone-800 text-stone-300' : 'bg-gray-100 text-gray-600'}`}>
              Week: {format(contextSnapshot.week)}
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-stone-800' : 'bg-amber-50'}`}>
              <MessageSquare className={`w-8 h-8 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
            </div>
            <div className="text-center">
              <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mulai Percakapan</h3>
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Tanyakan seputar data bisnis, stok, atau prediksi jualan Anda.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                    isDark 
                      ? 'border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white' 
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          history.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${
                  msg.role === 'user' 
                    ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600')
                    : (isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-500')
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? (isDark ? 'bg-amber-500/10 text-amber-50 border border-amber-500/20' : 'bg-amber-50 text-amber-900 border border-amber-100')
                    : (isDark ? 'bg-stone-800 text-stone-200' : 'bg-gray-50 text-gray-800 border border-gray-100')
                } whitespace-pre-wrap`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-500'}`}>
                <Bot className="w-4 h-4" />
              </div>
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-stone-800' : 'bg-gray-50 border border-gray-100'} flex items-center gap-1`}>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center my-4">
            <div className="flex flex-col items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="flex items-center gap-1 font-semibold hover:text-red-700"
              >
                <RefreshCw className="w-3 h-3" /> Dismiss
              </button>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t ${isDark ? 'border-stone-800 bg-stone-900/80' : 'border-gray-100 bg-white'}`}>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Tanya asisten AI..."
            className={`w-full pl-4 pr-12 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-shadow ${
              isDark 
                ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            } disabled:opacity-50`}
          />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
              !inputValue.trim() || isLoading
                ? isDark ? 'text-stone-600' : 'text-gray-300'
                : isDark ? 'text-amber-400 hover:bg-stone-700' : 'text-amber-600 hover:bg-amber-50'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}