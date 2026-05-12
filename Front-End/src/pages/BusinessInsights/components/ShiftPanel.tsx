import React, { useState, useEffect } from 'react';
import { Users, Clock } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { appApi } from '../../../services/appApi';
import type { SummaryResponse } from '../../../services/aiApi';

interface Props { summary: SummaryResponse | null; isLoading: boolean; }

interface ShiftRow {
  id: string;
  cashier_name: string;
  total_transactions: number;
  total_sales: number;
  status: 'open' | 'closed';
}

function fmtRp(v: number): string {
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(1)}jt`;
  if (v >= 1e3) return `Rp ${(v / 1e3).toFixed(0)}rb`;
  return `Rp ${v}`;
}

export default function ShiftPanel({ summary, isLoading: parentLoading }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await appApi.get<{ data: any[] }>('/shifts?limit=5');
        const data = (res.data || []).map((s: any) => ({
          id: s.id,
          cashier_name: s.cashier_name || s.user_name || 'Kasir',
          total_transactions: s.total_transactions || 0,
          total_sales: s.total_sales || 0,
          status: s.status || (s.closed_at ? 'closed' : 'open'),
        }));
        setShifts(data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const isLoading = parentLoading || loading;
  const bg = isDark ? '#1c1917' : '#fff';
  const border = isDark ? '#292524' : '#e7e5e4';

  if (isLoading) return (
    <div style={{ borderRadius:16, border:`1px solid ${border}`, background:bg, padding:20 }}>
      {[1,2,3].map(i=><div key={i} style={{ height:16, borderRadius:8, background:isDark?'#292524':'#e7e5e4', marginBottom:12, animation:'pulse 1.5s ease-in-out infinite' }} />)}
    </div>
  );

  const maxTrx = Math.max(...shifts.map(s=>s.total_transactions), 1);

  return (
    <div style={{ borderRadius:16, border:`1px solid ${border}`, background:bg, padding:20, transition:'box-shadow 0.2s' }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 0 0 1px #7c3aed40';}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';}}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Users size={16} color="#7c3aed" />
          <h3 style={{ fontSize:14, fontWeight:700, color:isDark?'#fafaf9':'#1c1917', margin:0 }}>Performa Shift</h3>
        </div>
        {summary && summary.active_shifts_count > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'#22c55e' }}>
            <span style={{ width:8, height:8, borderRadius:4, background:'#22c55e', animation:'pulse 1.5s ease-in-out infinite' }} />
            {summary.active_shifts_count} shift aktif
          </div>
        )}
      </div>

      {/* Shifts list */}
      {shifts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'20px 0', fontSize:13, color:isDark?'#78716c':'#a8a29e' }}>
          <Clock size={20} style={{ margin:'0 auto 8px', opacity:0.5 }} />
          Belum ada data shift
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {shifts.map(s => (
            <div key={s.id}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:isDark?'#d6d3d1':'#44403c' }}>{s.cashier_name}</span>
                  <span style={{
                    fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:999,
                    background: s.status==='open' ? 'rgba(34,197,94,0.15)' : (isDark?'#292524':'#f5f5f4'),
                    color: s.status==='open' ? '#22c55e' : (isDark?'#78716c':'#a8a29e'),
                  }}>{s.status==='open'?'Aktif':'Selesai'}</span>
                </div>
                <span style={{ fontSize:11, fontFamily:'monospace', color:isDark?'#a8a29e':'#78716c' }}>
                  {s.total_transactions} trx · {fmtRp(s.total_sales)}
                </span>
              </div>
              <div style={{ height:6, borderRadius:999, background:isDark?'#292524':'#f5f5f4', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:999, background:'#7c3aed', width:`${(s.total_transactions/maxTrx)*100}%`, transition:'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
