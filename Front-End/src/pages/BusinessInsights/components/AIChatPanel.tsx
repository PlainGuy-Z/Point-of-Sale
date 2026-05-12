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

  const bg = isDark ? '#1c1917' : '#fff';
  const border = isDark ? '#292524' : '#e7e5e4';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', borderRadius:16, border:`1px solid ${border}`, background:bg, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #7c3aed, #0d9488)', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight:700, color:'#fff', fontSize:14 }}>AI Business Advisor</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:3, background:'#22c55e', display:'inline-block' }} />
              Online · Data real-time
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, padding:8, cursor:'pointer', color:'#fff', display:'flex' }}
            title="Hapus semua chat">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="horizontal-scrollbar-thin" style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
        {messages.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg, #7c3aed20, #0d948820)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sparkles size={24} color="#7c3aed" />
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:15, color:isDark?'#fafaf9':'#1c1917', marginBottom:4 }}>Mulai Percakapan</div>
              <div style={{ fontSize:12, color:isDark?'#78716c':'#a8a29e', maxWidth:240 }}>Tanyakan apapun tentang bisnis, stok, atau strategi penjualan.</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%', maxWidth:280 }}>
              {SUGGESTED.map(q=>(
                <button key={q} onClick={()=>sendMessage(q)} style={{
                  fontSize:12, fontWeight:500, padding:'10px 14px', borderRadius:12, border:`1px solid ${isDark?'#292524':'#e7e5e4'}`,
                  background:isDark?'#292524':'#fafaf9', color:isDark?'#d6d3d1':'#44403c', cursor:'pointer', textAlign:'left',
                  transition:'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e=>{e.currentTarget.style.background=isDark?'#44403c':'#f5f5f4';e.currentTarget.style.borderColor=isDark?'#44403c':'#d6d3d1';}}
                onMouseLeave={e=>{e.currentTarget.style.background=isDark?'#292524':'#fafaf9';e.currentTarget.style.borderColor=isDark?'#292524':'#e7e5e4';}}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ display:'flex', gap:8, maxWidth:'85%', flexDirection:msg.role==='user'?'row-reverse':'row' }}>
                  {/* Avatar */}
                  <div style={{
                    width:28, height:28, borderRadius:14, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                    background: msg.role==='user' ? '#f59e0b25' : 'linear-gradient(135deg, #7c3aed, #0d9488)',
                  }}>
                    {msg.role==='user'
                      ? <User size={14} color="#f59e0b" />
                      : <Bot size={14} color="#fff" />}
                  </div>
                  <div>
                    {/* Bubble */}
                    <div style={{
                      padding:'10px 14px', borderRadius:12, fontSize:13, lineHeight:1.5, whiteSpace:'pre-wrap',
                      ...(msg.role==='user' ? {
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        color: isDark?'#fef3c7':'#92400e',
                      } : {
                        background: isDark?'#292524':'#fff',
                        border: `1px solid ${isDark?'#44403c':'#e7e5e4'}`,
                        color: isDark?'#d6d3d1':'#1c1917',
                      }),
                    }}>{msg.content}</div>
                    {/* Context snapshot */}
                    {msg.role==='ai' && msg.contextSnapshot && (
                      <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:999, background:isDark?'#292524':'#f5f5f4', color:isDark?'#78716c':'#a8a29e' }}>
                          Today: {fmtRp(msg.contextSnapshot.today_revenue ?? 0)}
                        </span>
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:999, background:isDark?'#292524':'#f5f5f4', color:isDark?'#78716c':'#a8a29e' }}>
                          Week: {fmtRp(msg.contextSnapshot.this_week_revenue ?? 0)}
                        </span>
                      </div>
                    )}
                    {/* Timestamp */}
                    <div style={{ fontSize:10, color:isDark?'#57534e':'#a8a29e', marginTop:3, textAlign:msg.role==='user'?'right':'left' }}>
                      {msg.timestamp.toLocaleTimeString('id-ID',{ hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:14, background:'linear-gradient(135deg, #7c3aed, #0d9488)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div style={{ padding:'10px 14px', borderRadius:12, background:isDark?'#292524':'#f5f5f4', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:6, height:6, borderRadius:3, background:isDark?'#78716c':'#a8a29e', animation:'bounce 1s ease-in-out infinite' }} />
                  <span style={{ width:6, height:6, borderRadius:3, background:isDark?'#78716c':'#a8a29e', animation:'bounce 1s ease-in-out 0.15s infinite' }} />
                  <span style={{ width:6, height:6, borderRadius:3, background:isDark?'#78716c':'#a8a29e', animation:'bounce 1s ease-in-out 0.3s infinite' }} />
                </div>
              </div>
            )}

            {/* Quick follow-up chips */}
            {messages.length > 0 && !isLoading && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', paddingTop:4 }}>
                {FOLLOWUP.map(q=>(
                  <button key={q} onClick={()=>sendMessage(q)} style={{
                    fontSize:11, padding:'5px 12px', borderRadius:999, border:`1px solid ${isDark?'#292524':'#e7e5e4'}`,
                    background:isDark?'#292524':'#fff', color:isDark?'#a8a29e':'#78716c', cursor:'pointer',
                  }}>{q}</button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:10, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', fontSize:12, color:'#ef4444' }}>
            <span>{error}</span>
            <button onClick={()=>{}} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:4 }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding:12, borderTop:`1px solid transparent`, borderImage:'linear-gradient(135deg, #7c3aed, #0d9488) 1', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextarea}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            placeholder="Tanya AI advisor..."
            className="horizontal-scrollbar-thin"
            style={{
              flex:1, resize:'none', fontSize:13, padding:'10px 14px', borderRadius:12,
              border:`1px solid ${isDark?'#292524':'#e7e5e4'}`,
              background:isDark?'#292524':'#fafaf9',
              color:isDark?'#fafaf9':'#1c1917',
              outline:'none', fontFamily:'inherit', lineHeight:1.5,
              maxHeight:72, opacity:isLoading?0.5:1,
            }}
          />

          <button onClick={handleSend} disabled={!input.trim()||isLoading}
            style={{
              width:40, height:40, borderRadius:10, border:'none', cursor:!input.trim()||isLoading?'default':'pointer',
              background:!input.trim()||isLoading?(isDark?'#292524':'#e7e5e4'):'linear-gradient(135deg, #7c3aed, #0d9488)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              opacity:!input.trim()||isLoading?0.5:1, transition:'opacity 0.15s',
            }}>
            <Send size={16} color={!input.trim()||isLoading?(isDark?'#78716c':'#a8a29e'):'#fff'} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
