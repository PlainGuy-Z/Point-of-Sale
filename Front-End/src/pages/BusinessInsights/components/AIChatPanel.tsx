//src/pages/BusinessInsights/components/AIChatPanel.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Bot, User, Send, Trash2, X, Sparkles } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAI } from '../../../contexts/AIContext';

function fmtRp(v: number): string {
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(1)}jt`;
  if (v >= 1e3) return `Rp ${(v / 1e3).toFixed(0)}rb`;
  return `Rp ${v}`;
}

const SUGGESTED = [
  'Produk mana yang paling untung?',
  'Kenapa omzet turun minggu ini?',
  'Apa yang harus saya fokus hari ini?',
  'Produk mana yang harus dihapus dari menu?',
];

const FOLLOWUP = [
  'Jelaskan lebih detail',
  'Bagaimana cara meningkatkannya?',
  'Bandingkan dengan minggu lalu',
];

export default function AIChatPanel() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { messages, isLoading, error, sendMessage, clearChat } = useAI();
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 72) + 'px';
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl border overflow-hidden shadow-sm transition-all ${
      isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#E2E8F0]'
    }`}>
      {/* Header */}
      <div className={`px-5 py-2 md:py-4 flex justify-between items-center shrink-0 ${
        isDark ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-900 shadow-md' : 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isDark ? 'bg-stone-800 border border-stone-700' : 'bg-white/20 border border-white/30 backdrop-blur-md'
          }`}>
            <Bot size={20} className={isDark ? 'text-stone-900' : 'text-white'} />
          </div>
          <div>
            <div className="text-sm font-bold">AI Business Advisor</div>
            <div className={`text-[10px] flex items-center gap-1.5 ${isDark ? 'text-stone-500' : 'text-white/70'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-stone-900' : 'bg-emerald-400'} animate-pulse`} />
              Online · Real-time
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={clearChat} 
            className={`p-2 rounded-lg transition-all ${isDark ? 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
            title="Hapus semua chat"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 md:py-6 flex flex-col gap-3 md:gap-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-stone-800 border border-stone-700' : 'bg-teal-50 border border-teal-200'
            }`}>
              <Sparkles size={24} className={isDark ? 'text-amber-500' : 'text-teal-700'} />
            </div>
            <div className="text-center">
              <div className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Halo! Saya Advisor Bisnis Anda.</div>
              <div className={`text-xs font-semibold max-w-[240px] leading-relaxed ${isDark ? 'text-stone-500' : 'text-[#64748B]'}`}>
                Tanyakan tentang omzet, stok rendah, atau strategi produk terlaris hari ini.
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
              {SUGGESTED.map(q=>(
                <button key={q} onClick={()=>sendMessage(q)} className={`
                  text-left text-xs font-bold px-4 py-3 rounded-xl border transition-all duration-200
                  ${isDark 
                    ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700 hover:border-stone-600' 
                    : 'bg-white border-[#CBD5E1] text-[#475569] hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 hover:shadow-sm'
                  }
                `}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role==='user'?'flex-row-reverse':''}`}>
                  {/* Avatar */}
                  <div className={`
                    w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-md
                    ${msg.role==='user' 
                      ? 'bg-amber-100 border border-amber-200 text-amber-600' 
                      : (isDark ? 'bg-stone-800 border border-stone-700' : 'bg-gradient-to-br from-teal-500 to-teal-700 text-white')
                    }
                  `}>
                    {msg.role==='user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div>
                    {/* Bubble */}
                    <div className={`
                      px-4 py-2 landscape:py-1.5 rounded-2xl text-sm leading-relaxed transition-all break-words whitespace-pre-wrap
                      ${msg.role==='user' 
                        ? (isDark ? 'bg-amber-900/20 border border-amber-900/30 text-amber-200' : 'bg-teal-600 text-white rounded-tr-none shadow-sm')
                        : (isDark ? 'bg-stone-800 border border-stone-700 text-stone-200' : 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-tl-none font-semibold')
                      }
                    `}>{msg.content}</div>
                    {/* Context snapshot */}
                    {msg.role==='ai' && msg.contextSnapshot && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-stone-800 text-stone-500' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
                          Revenue: {fmtRp(msg.contextSnapshot.today_revenue ?? 0)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-stone-800 text-stone-500' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
                          Trx: {msg.contextSnapshot.total_transactions ?? 0}
                        </span>
                      </div>
                    )}
                    {/* Timestamp */}
                    <div className={`text-[9px] mt-1 ${msg.role==='user'?'text-right':''} ${isDark ? 'text-stone-600' : 'text-[#64748B]'}`}>
                      {msg.timestamp.toLocaleTimeString('id-ID',{ hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${isDark ? 'bg-stone-800 text-stone-600' : 'bg-teal-100 text-teal-600'}`}>
                  <Bot size={14} />
                </div>
                <div className={`px-4 py-3 rounded-2xl flex items-center gap-1.5 ${isDark ? 'bg-stone-800 border border-stone-700' : 'bg-[#F8FAFC] border border-[#E2E8F0]'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" />
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="flex justify-center my-2">
                <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl text-[11px] font-bold shadow-sm max-w-[85%] text-center">
                  ⚠️ {error}
                </div>
              </div>
            )}

            {/* Quick follow-up chips */}
            {messages.length > 0 && !isLoading && (
              <div className="flex gap-2 flex-wrap pt-2">
                {FOLLOWUP.map(q=>(
                  <button key={q} onClick={()=>sendMessage(q)} className={`
                    text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all
                    ${isDark 
                      ? 'bg-stone-800 border-stone-700 text-stone-400 hover:text-white hover:border-stone-500' 
                      : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-teal-500 hover:text-teal-800 hover:bg-teal-50 shadow-sm'
                    }
                  `}>{q}</button>
                ))}
              </div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className={`p-3 landscape:p-2 shrink-0 border-t ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#F1F5F9]'}`}>
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextarea}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            placeholder="Tanya AI advisor..."
            className={`
              flex-1 resize-none text-sm px-4 py-2.5 rounded-xl outline-none transition-all no-scrollbar max-h-24 leading-relaxed
              ${isDark 
                ? 'bg-stone-800 border border-stone-700 text-white placeholder:text-stone-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500' 
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-teal-400 focus:bg-white'
              }
              ${isLoading ? 'opacity-50' : ''}
            `}
          />

          <button 
            onClick={handleSend} 
            disabled={!input.trim()||isLoading}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-md active:scale-95
              ${!input.trim()||isLoading
                ? (isDark ? 'bg-stone-800 text-stone-600 border border-stone-700' : 'bg-[#E2E8F0] text-[#94A3B8]')
                : (isDark ? 'bg-amber-500 hover:bg-amber-600 text-stone-900' : 'bg-teal-600 hover:bg-teal-700 text-white')
              }
            `}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
