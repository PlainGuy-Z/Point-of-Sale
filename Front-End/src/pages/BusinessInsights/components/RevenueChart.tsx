//src/pages/BusinessInsights/components/RevenueChart.tsx

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { ForecastResponse, SummaryResponse } from '../../../services/aiApi';

interface Props {
  forecast: ForecastResponse | null;
  summary: SummaryResponse | null;
  isLoading: boolean;
}

function fmtRp(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}jt`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}rb`;
  return String(v);
}

function ChartTooltip({ active, payload, isDark }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const confColor: Record<string,string> = { high: '#22c55e', medium: '#f59e0b', low: '#ef4444' };
  const confLabel: Record<string,string> = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };
  return (
    <div style={{ background: isDark?'#1c1917':'#fff', border:`1px solid ${isDark?'#292524':'#e7e5e4'}`, borderRadius:12, padding:'12px 16px', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', minWidth:180 }}>
      <div style={{ fontWeight:700, marginBottom:8, color:isDark?'#fafaf9':'#1c1917', fontSize:13 }}>{d.day_name} — {d.date}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <span style={{ width:8, height:8, borderRadius:4, background:'#f59e0b' }} />
        <span style={{ fontSize:12, color:isDark?'#a8a29e':'#78716c' }}>Revenue:</span>
        <span style={{ fontSize:12, fontWeight:600, fontFamily:'monospace', color:isDark?'#fafaf9':'#1c1917' }}>Rp {fmtRp(d.predicted_revenue)}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <span style={{ width:8, height:8, borderRadius:4, background:'#0d9488' }} />
        <span style={{ fontSize:12, color:isDark?'#a8a29e':'#78716c' }}>Transaksi:</span>
        <span style={{ fontSize:12, fontWeight:600, fontFamily:'monospace', color:isDark?'#fafaf9':'#1c1917' }}>{d.predicted_transactions}</span>
      </div>
      <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:999, background:`${confColor[d.confidence]||confColor.medium}20`, color:confColor[d.confidence]||confColor.medium }}>{confLabel[d.confidence]||'Sedang'}</span>
    </div>
  );
}

function ConfDot(props: any) {
  const { cx, cy, payload, stroke } = props;
  if (!cx || !cy) return null;
  if (payload?.confidence === 'low') return <circle cx={cx} cy={cy} r={4} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray="3 3" />;
  if (payload?.confidence === 'medium') return <circle cx={cx} cy={cy} r={5} fill="none" stroke={stroke} strokeWidth={2} />;
  return <circle cx={cx} cy={cy} r={5} fill={stroke} />;
}

export default function RevenueChart({ forecast, isLoading }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (isLoading) return (
    <div style={{ borderRadius:16, border:`1px solid ${isDark?'#292524':'#e7e5e4'}`, background:isDark?'#1c1917':'#fff', padding:24, marginBottom:20 }}>
      <div style={{ width:180, height:16, borderRadius:8, background:isDark?'#292524':'#e7e5e4', marginBottom:12, animation:'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ width:'100%', height:260, borderRadius:12, background:isDark?'#292524':'#f5f5f4', animation:'pulse 1.5s ease-in-out infinite' }} />
    </div>
  );

  if (!forecast?.length) return (
    <div style={{ borderRadius:16, border:`1px solid ${isDark?'#292524':'#e7e5e4'}`, background:isDark?'#1c1917':'#fff', padding:40, textAlign:'center', marginBottom:20, color:isDark?'#78716c':'#a8a29e' }}>
      Belum ada data forecast tersedia.
    </div>
  );

  const weekends = forecast.map((f,i) => { const l=f.day_name.toLowerCase(); return (l.startsWith('sab')||l.startsWith('min')||l==='saturday'||l==='sunday')?i:-1; }).filter(i=>i>=0);

  return (
    <div style={{ borderRadius:16, border:`1px solid ${isDark?'#292524':'#e7e5e4'}`, background:isDark?'#1c1917':'#fff', padding:24, marginBottom:20, transition:'box-shadow 0.2s' }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 0 1px #0d948840, 0 4px 12px rgba(13,148,136,0.08)`;}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';}}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <TrendingUp size={18} color="#0d9488" />
            <h3 style={{ fontSize:16, fontWeight:700, color:isDark?'#fafaf9':'#1c1917', margin:0 }}>Prediksi 7 Hari ke Depan</h3>
          </div>
          <p style={{ fontSize:12, color:isDark?'#78716c':'#a8a29e', marginTop:4 }}>Berdasarkan pola historis toko</p>
        </div>
        <div style={{ display:'flex', gap:16, fontSize:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:12, height:3, borderRadius:2, background:'#f59e0b' }} /><span style={{ color:isDark?'#a8a29e':'#78716c' }}>Revenue</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:12, height:3, borderRadius:2, background:'#0d9488' }} /><span style={{ color:isDark?'#a8a29e':'#78716c' }}>Transaksi</span></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={forecast} margin={{ top:5, right:10, left:0, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark?'#292524':'#f5f5f4'} vertical={false} />
          {weekends.map(idx=><ReferenceLine key={idx} x={forecast[idx].day_name} stroke={isDark?'#292524':'#fef3c7'} strokeWidth={40} strokeOpacity={0.4} />)}
          <XAxis dataKey="day_name" tick={{ fontSize:12, fill:isDark?'#78716c':'#a8a29e' }} axisLine={{ stroke:isDark?'#292524':'#e7e5e4' }} tickLine={false} />
          <YAxis yAxisId="revenue" tickFormatter={fmtRp} tick={{ fontSize:11, fill:isDark?'#78716c':'#a8a29e' }} axisLine={false} tickLine={false} width={56} />
          <YAxis yAxisId="txn" orientation="right" tick={{ fontSize:11, fill:isDark?'#78716c':'#a8a29e' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<ChartTooltip isDark={isDark} />} />
          <Line yAxisId="revenue" type="monotone" dataKey="predicted_revenue" stroke="#f59e0b" strokeWidth={2.5} dot={<ConfDot stroke="#f59e0b" />} activeDot={{ r:6, fill:'#f59e0b', stroke:'#fff', strokeWidth:2 }} />
          <Line yAxisId="txn" type="monotone" dataKey="predicted_transactions" stroke="#0d9488" strokeWidth={2} strokeDasharray="4 4" dot={<ConfDot stroke="#0d9488" />} activeDot={{ r:6, fill:'#0d9488', stroke:'#fff', strokeWidth:2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
