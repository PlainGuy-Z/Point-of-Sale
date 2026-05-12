import React, { useState, useEffect, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Grid3x3, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { appApi } from '../../../services/appApi';
import type { AppDataState, Product, Transaction } from '../../../types';

interface ProductDot {
  name: string;
  salesQty: number;
  margin: number;
  revenue: number;
  quadrant: 'star' | 'problem' | 'cashcow' | 'dog';
}

const QUAD_COLORS: Record<string, string> = { star:'#22c55e', problem:'#f59e0b', cashcow:'#3b82f6', dog:'#ef4444' };
const QUAD_LABELS: Record<string, string> = { star:'⭐ Star', problem:'❓ Problem Child', cashcow:'💰 Cash Cow', dog:'💀 Dog' };

function calcMatrix(products: Product[], transactions: Transaction[]): { dots: ProductDot[]; medSales: number; medMargin: number } {
  // Aggregate sales per product in last 30 days
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 86400000);
  const salesMap = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.date < cutoff) continue;
    for (const item of tx.items) {
      salesMap.set(item.productId, (salesMap.get(item.productId) || 0) + item.quantity);
    }
  }

  // Build data for products that have sales
  const items: { product: Product; salesQty: number; margin: number; revenue: number }[] = [];
  for (const p of products) {
    const qty = salesMap.get(p.id) || 0;
    const cost = p.cost || 0;
    const margin = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
    const revenue = qty * p.price;
    items.push({ product: p, salesQty: qty, margin, revenue });
  }

  // Top 20 by revenue
  items.sort((a, b) => b.revenue - a.revenue);
  const top = items.slice(0, 20);
  if (top.length === 0) return { dots: [], medSales: 0, medMargin: 0 };

  const salesArr = top.map(i => i.salesQty).sort((a, b) => a - b);
  const marginArr = top.map(i => i.margin).sort((a, b) => a - b);
  const medSales = salesArr[Math.floor(salesArr.length / 2)];
  const medMargin = marginArr[Math.floor(marginArr.length / 2)];

  const dots: ProductDot[] = top.map(i => {
    let quadrant: ProductDot['quadrant'] = 'dog';
    if (i.margin >= medMargin && i.salesQty >= medSales) quadrant = 'star';
    else if (i.margin >= medMargin && i.salesQty < medSales) quadrant = 'problem';
    else if (i.margin < medMargin && i.salesQty >= medSales) quadrant = 'cashcow';
    return { name: i.product.name, salesQty: i.salesQty, margin: Math.round(i.margin * 10) / 10, revenue: i.revenue, quadrant };
  });

  return { dots, medSales, medMargin };
}

function MatrixTooltip({ active, payload, isDark }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ProductDot | undefined;
  if (!d) return null;
  return (
    <div style={{ background: isDark ? '#1c1917' : '#fff', border: `1px solid ${isDark ? '#292524' : '#e7e5e4'}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: isDark ? '#fafaf9' : '#1c1917', marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: isDark ? '#a8a29e' : '#78716c' }}>Margin: {d.margin}%</div>
      <div style={{ color: isDark ? '#a8a29e' : '#78716c' }}>Terjual: {d.salesQty}</div>
      <div style={{ marginTop: 4, fontWeight: 600, color: QUAD_COLORS[d.quadrant] }}>{QUAD_LABELS[d.quadrant]}</div>
    </div>
  );
}

export default function MenuMatrix() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [appState, setAppState] = useState<AppDataState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const state = await appApi.getAppState();
        setAppState(state);
      } catch { setError(true); }
      finally { setLoading(false); }
    })();
  }, []);

  const { dots, medSales, medMargin } = useMemo(() => {
    if (!appState) return { dots: [], medSales: 0, medMargin: 0 };
    return calcMatrix(appState.products, appState.transactions);
  }, [appState]);

  const bg = isDark ? '#1c1917' : '#fff';
  const border = isDark ? '#292524' : '#e7e5e4';

  if (loading) return (
    <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: bg, padding: 24, marginTop: 20 }}>
      <div style={{ width: '100%', height: 280, borderRadius: 12, background: isDark ? '#292524' : '#f5f5f4', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  );

  if (error) return (
    <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: bg, padding: 24, marginTop: 20, textAlign: 'center', color: isDark ? '#78716c' : '#a8a29e' }}>
      <AlertCircle size={20} style={{ margin: '0 auto 8px' }} /> Gagal memuat data menu.
    </div>
  );

  if (dots.length === 0) return (
    <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: bg, padding: 24, marginTop: 20, textAlign: 'center', color: isDark ? '#78716c' : '#a8a29e', fontSize: 13 }}>
      Belum ada data transaksi untuk analisis menu.
    </div>
  );

  return (
    <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: bg, padding: 24, marginTop: 20, transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1px #3b82f640'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Grid3x3 size={16} color="#3b82f6" />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#fafaf9' : '#1c1917', margin: 0 }}>Menu BCG Matrix</h3>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {Object.entries(QUAD_LABELS).map(([k, v]) => (
            <span key={k} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: `${QUAD_COLORS[k]}15`, color: QUAD_COLORS[k], fontWeight: 600 }}>{v}</span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#292524' : '#f5f5f4'} />
          <XAxis dataKey="salesQty" name="Terjual" type="number" tick={{ fontSize: 11, fill: isDark ? '#78716c' : '#a8a29e' }} axisLine={false} tickLine={false} label={{ value: 'Sales Volume', position: 'bottom', fontSize: 11, fill: isDark ? '#78716c' : '#a8a29e' }} />
          <YAxis dataKey="margin" name="Margin" unit="%" type="number" tick={{ fontSize: 11, fill: isDark ? '#78716c' : '#a8a29e' }} axisLine={false} tickLine={false} label={{ value: 'Profit Margin %', angle: -90, position: 'insideLeft', fontSize: 11, fill: isDark ? '#78716c' : '#a8a29e' }} />
          <ReferenceLine x={medSales} stroke={isDark ? '#44403c' : '#d6d3d1'} strokeDasharray="4 4" />
          <ReferenceLine y={medMargin} stroke={isDark ? '#44403c' : '#d6d3d1'} strokeDasharray="4 4" />
          <Tooltip content={<MatrixTooltip isDark={isDark} />} />
          <Scatter data={dots}>
            {dots.map((d, i) => (
              <Cell key={i} fill={QUAD_COLORS[d.quadrant]} r={Math.max(6, Math.min(16, d.salesQty / 2))} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
