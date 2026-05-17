import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, MessageSquare, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (force = false) => {
    if (force || !isScrolledUp) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Check if user has scrolled up more than 100px from the bottom
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setIsScrolledUp(isUp);
  };

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
    setIsScrolledUp(false);
    setTimeout(() => scrollToBottom(true), 50);

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
          today: response.context_snapshot.today_revenue ?? 0,
          week: response.context_snapshot.this_week_revenue ?? 0,
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
    <div className={`flex flex-col h-[600px] relative rounded-3xl border overflow-hidden ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
      
      {/* Header Context Snapshot */}
      <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-stone-800' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Bot className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-teal-600'}`} />
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
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 horizontal-scrollbar-thin"
      >
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-stone-800' : 'bg-teal-50'}`}>
              <MessageSquare className={`w-8 h-8 ${isDark ? 'text-amber-400' : 'text-teal-600'}`} />
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
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700'
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
                    ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-100 text-teal-600')
                    : (isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-500')
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm overflow-x-auto ${
                  msg.role === 'user'
                    ? (isDark ? 'bg-amber-500/10 text-amber-50 border border-amber-500/20' : 'bg-teal-50 text-teal-900 border border-teal-100')
                    : (isDark ? 'bg-stone-800 text-stone-200' : 'bg-gray-50 text-gray-800 border border-gray-100')
                } ${msg.role === 'user' ? 'whitespace-pre-wrap' : 'prose prose-sm max-w-none ' + (isDark ? 'prose-invert' : '')}`}>
                  {msg.role === 'model' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code(props) {
                          const { children, className, node, ...rest } = props;
                          const { ref, ...sanitizedRest } = rest as any;
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter
                              {...sanitizedRest}
                              PreTag="div"
                              children={String(children).replace(/\n$/, '')}
                              language={match[1]}
                              style={isDark ? vscDarkPlus : prism}
                              className="rounded-md !my-2 !text-xs"
                            />
                          ) : (
                            <code {...rest} className={`${className || ''} bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono`}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
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

      {/* Scroll to Bottom Button */}
      {isScrolledUp && (
        <button
          onClick={() => scrollToBottom(true)}
          className={`absolute bottom-24 right-6 p-3 rounded-full shadow-lg transition-all transform hover:scale-105 z-10 flex items-center justify-center ${
            isDark 
              ? 'bg-stone-800 text-amber-400 border border-stone-700 hover:bg-stone-700' 
              : 'bg-white text-teal-600 border border-gray-200 hover:bg-gray-50'
          }`}
          title="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Input Area */}
      <div className={`p-4 border-t relative z-20 ${isDark ? 'border-stone-800 bg-stone-900/80' : 'border-gray-100 bg-white'}`}>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Tanya asisten AI..."
            className={`w-full pl-4 pr-12 py-3 rounded-xl border focus:outline-none transition-shadow ${
              isDark 
                ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500 focus:ring-2 focus:ring-amber-500/50' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500/50'
            } disabled:opacity-50`}
          />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
              !inputValue.trim() || isLoading
                ? isDark ? 'text-stone-600' : 'text-gray-300'
                : isDark ? 'text-amber-400 hover:bg-stone-700' : 'text-teal-600 hover:bg-teal-50'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}