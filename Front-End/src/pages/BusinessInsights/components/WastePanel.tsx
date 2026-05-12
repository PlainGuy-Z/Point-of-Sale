import React, { useState } from 'react';
import { Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { WasteResponse } from '../../../services/aiApi';
import { aiApi } from '../../../services/aiApi';

interface Props { waste: WasteResponse | null; isLoading: boolean; }

function fmtRp(v: number): string {
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(1)}jt`;
  if (v >= 1e3) return `Rp ${(v / 1e3).toFixed(0)}rb`;
  return `Rp ${v}`;
}

export default function WastePanel({ waste: initialWaste, isLoading: parentLoading }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [waste, setWaste] = useState(initialWaste);
  const [period, setPeriod] = useState<7|14|30>(30);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => { setWaste(initialWaste); }, [initialWaste]);

  const handlePeriod = async (p: 7|14|30) => {
    setPeriod(p);
    setLoading(true);
    try { setWaste(await aiApi.fetchWasteAnalysis(p)); } catch { /* keep old */ }
    finally { setLoading(false); }
  };

  const isLoading = parentLoading || loading;
  const bg = isDark ? '#1c1917' : '#fff';
  const border = isDark ? '#292524' : '#e7e5e4';

  if (isLoading) return (
    <div style={{ borderRadius:16, border:`1px solid ${border}`, background:bg, padding:20 }}>
      {[1,2,3].map(i=><div key={i} style={{ height:16, borderRadius:8, background:isDark?'#292524':'#e7e5e4', marginBottom:12, animation:'pulse 1.5s ease-in-out infinite' }} />)}
    </div>
  );

  return (
    <div style={{ borderRadius:16, border:`1px solid ${border}`, background:bg, padding:20, transition:'box-shadow 0.2s' }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 0 1px #ef444440`;}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';}}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <Trash2 size={16} color="#ef4444" />
            <h3 style={{ fontSize:14, fontWeight:700, color:isDark?'#fafaf9':'#1c1917', margin:0 }}>Analisis Waste</h3>
          </div>
          {waste && (
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, fontWeight:600, padding:'2px 8px', borderRadius:999, background:'rgba(239,68,68,0.12)', color:'#ef4444' }}>
                {fmtRp(waste.total_waste_cost)}
              </span>
              {waste.trend_percentage !== 0 && (
                <span style={{ fontSize:11, display:'flex', alignItems:'center', gap:3, color: waste.trend_percentage > 0 ? '#ef4444' : '#22c55e' }}>
                  {waste.trend_percentage > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                  {Math.abs(waste.trend_percentage).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
        {/* Period tabs */}
        <div style={{ display:'flex', gap:4 }}>
          {([7,14,30] as const).map(p=>(
            <button key={p} onClick={()=>handlePeriod(p)} style={{
              fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:999, border:'none', cursor:'pointer',
              background: period===p ? '#0d9488' : (isDark?'#292524':'#f5f5f4'),
              color: period===p ? '#fff' : (isDark?'#a8a29e':'#78716c'),
            }}>{p}H</button>
          ))}
        </div>
      </div>

      {/* Products */}
      {!waste || waste.top_waste_products.length === 0 ? (
        <div style={{ textAlign:'center', padding:'20px 0', fontSize:13, color:isDark?'#78716c':'#a8a29e' }}>
          Tidak ada waste dalam periode ini 🎉
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {waste.top_waste_products.slice(0,5).map(p => {
            const ratio = Math.min(p.waste_ratio, 1);
            const barColor = p.waste_ratio > 0.3 ? '#ef4444' : p.waste_ratio > 0.1 ? '#f59e0b' : '#22c55e';
            return (
              <div key={p.product_id}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:isDark?'#d6d3d1':'#44403c' }}>{p.name}</span>
                  <span style={{ fontSize:11, fontFamily:'monospace', color:isDark?'#a8a29e':'#78716c' }}>{fmtRp(p.waste_cost)}</span>
                </div>
                <div style={{ height:6, borderRadius:999, background:`${barColor}20`, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:999, background:barColor, width:`${ratio*100}%`, transition:'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
