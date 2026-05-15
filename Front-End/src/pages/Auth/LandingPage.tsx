import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Coffee, ShoppingCart, BarChart3, Users, Shield, Zap,
  ArrowRight, CheckCircle2, Smartphone, Moon, Sun,
  TrendingUp, Package, Clock, ChevronRight, Star,
  Receipt, RefreshCw, Layers, Search, Trash2, Plus,
  Filter, Trophy, Flame, PlusCircle
} from 'lucide-react';

// ─── Scroll animation hook ────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { icon: ShoppingCart, title: 'Kasir Super Cepat', desc: 'Proses transaksi dalam hitungan detik. Interface intuitif yang bisa langsung dipakai kasir baru tanpa training panjang.' },
  { icon: BarChart3, title: 'Laporan Real-time', desc: 'Pantau penjualan, profit, dan tren dari mana saja. Data yang jelas untuk keputusan bisnis yang tepat.' },
  { icon: Users, title: 'Multi-Kasir & Outlet', desc: 'Satu dashboard untuk semua outlet. Kelola tim dengan hak akses terpisah — owner tetap in control.' },
  { icon: Clock, title: 'Manajemen Shift', desc: 'Buka tutup shift otomatis dengan rekap kas. Pantau performa setiap kasir per sesi kerja.' },
  { icon: Package, title: 'Stok Terintegrasi', desc: 'Alert stok minimum, waste log, dan histori perubahan. Tidak ada lagi kejutan kehabisan bahan.' },
  { icon: Shield, title: 'Keamanan Data', desc: 'Enkripsi end-to-end, isolasi data per toko, dan backup otomatis. Bisnis Anda terlindungi sepenuhnya.' },
];

const benefits = [
  'Gratis untuk memulai — tanpa kartu kredit',
  'Setup toko dalam 30 detik',
  'Multi-kasir dengan role berbeda',
  'Laporan penjualan & keuntungan harian',
  'Manajemen shift & rekap kas otomatis',
  'Dark mode & light mode',
];

const stats = [
  { value: '2.4rb+', label: 'Transaksi diproses' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<0.3s', label: 'Rata-rata respons' },
  { value: 'SOC 2', label: 'Level keamanan' },
];

const testimonials = [
  {
    name: 'Rizky Pratama',
    role: 'Owner, Kopi Kenangan Selatan',
    quote: 'Dalam 2 minggu pakai SmartPOS, omzet kami naik 18% karena antrian lebih cepat dan tidak ada lagi salah hitung.',
    initials: 'RP',
    color: '#008080',
  },
  {
    name: 'Dewi Anggraeni',
    role: 'Manajer, Brew Story Bandung',
    quote: 'Laporan hariannya sangat detail. Saya bisa tahu menu mana yang paling untung tanpa harus rekap manual lagi.',
    initials: 'DA',
    color: '#4B3621',
  },
  {
    name: 'Andi Kurniawan',
    role: 'Founder, Kedai Tiga Biji',
    quote: 'Dulu pakai aplikasi lain yang ribet. SmartPOS jauh lebih simpel dan tim kasir saya langsung bisa pakai sendiri.',
    initials: 'AK',
    color: '#6B7280',
  },
];

// ─── POS Mockup — mirrors the actual app UI from screenshots ─────────────────
function POSMockup({ isDark }: { isDark: boolean }) {
  // Exact color tokens matching the real app
  const bg      = isDark ? '#111111' : '#F8FAFC';
  const panel   = isDark ? '#1a1a1a' : '#ffffff';
  const card    = isDark ? '#222222' : '#F1F5F9';
  const border  = isDark ? '#2e2e2e' : '#E2E8F0';
  const text    = isDark ? '#ffffff' : '#0F172A';
  const muted   = isDark ? '#888888' : '#475569';
  const teal_acc = '#0D9488';
  const amber   = '#f59e0b';
  const orange  = '#ea580c';
  const red     = '#ef4444';
  const green   = '#22c55e';

  const menuItems = [
    { name: 'Nasi...', cat: 'FOOD', price: '20000', orig: '35000', disc: '-43%', sold: '18 terjual', stock: '∞', badge: 'Natal', rank: '#2', isPromo: true, color: '#c2410c' },
    { name: 'Thai Tea', cat: 'TEA',  price: '14000', orig: null,    disc: null,   sold: '21 terjual', stock: '68', badge: null, rank: '#1', isPromo: false, color: '#d97706' },
    { name: 'Kebab',   cat: 'FOOD',  price: '60000', orig: null,    disc: null,   sold: '13 terjual', stock: '∞', badge: null, rank: '#3', isPromo: false, color: '#7c3aed' },
    { name: 'Cappuccino', cat: 'COFFEE', price: '20000', orig: null, disc: null, sold: '9 terjual', stock: '0', badge: null, rank: null, isPromo: false, soldOut: true, color: '#374151' },
  ];

  const cartItems = [
    { name: 'Nasi Goreng', price: '20000', orig: '35000', qty: 1, isPromo: true, badge: 'NATAL' },
    { name: 'Thai Tea',    price: '14000', orig: null,    qty: 1, isPromo: false, badge: null },
    { name: 'Caffe Latte', price: '30000', orig: null,    qty: 1, isPromo: false, badge: null },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 820, margin: '0 auto' }}>

      {/* ── Main window frame ── */}
      <div className="flex flex-col sm:flex-row rounded-2xl overflow-hidden" style={{
        border: `1px solid ${border}`,
        boxShadow: isDark
          ? '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
        background: bg,
        animation: 'subtleFloat 6s ease-in-out infinite',
      }}>

        {/* ── LEFT: Menu Explorer ── */}
        <div className="flex-1 p-4 sm:p-[18px_16px] min-w-0 border-b sm:border-b-0 sm:border-r" style={{ borderColor: border }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: text, margin: 0, letterSpacing: '-0.01em' }}>
              Menu <span style={{ color: teal_acc }}>Explorer</span>
            </h2>
            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: panel, border: `1.5px solid ${border}`, borderRadius: 20, padding: '5px 12px', flex: 1, maxWidth: 160, marginLeft: 12 }}>
              <Search size={11} color={muted} />
              <span style={{ fontSize: 10, color: muted }}>Cari menu...</span>
            </div>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['All', 'Coffee', 'Food', 'Non-Coffee', 'Tea'].map((cat, i) => (
              <div key={cat} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700,
                background: i === 0 ? `linear-gradient(135deg, ${amber}, ${orange})` : panel,
                color: i === 0 ? '#fff' : muted,
                border: `1px solid ${i === 0 ? 'transparent' : border}`,
                flexShrink: 0,
              }}>{cat}</div>
            ))}
          </div>

          {/* Trending bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: isDark ? 'rgba(13,148,136,0.1)' : '#F0FDFA', border: `1px solid ${isDark ? 'rgba(13,148,136,0.25)' : '#99F6E4'}`, borderRadius: 10, padding: '3px 10px' }}>
              <TrendingUp size={9} color={teal_acc} />
              <span style={{ fontSize: 9, fontWeight: 700, color: teal_acc }}>Trending: 3 Hari</span>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '2px 7px' }}>
                <Flame size={8} color={red} />
                <span style={{ fontSize: 8, fontWeight: 700, color: red }}>1 PROMO</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '2px 7px' }}>
                <Trophy size={8} color={amber} />
                <span style={{ fontSize: 8, fontWeight: 700, color: amber }}>3 BEST</span>
              </div>
            </div>
          </div>

          {/* Product grid — 2x2 */}
          <div className="grid grid-cols-2 gap-2">
            {menuItems.map((item) => (
              <div key={item.name} style={{
                background: panel, borderRadius: 12,
                border: `1px solid ${border}`,
                overflow: 'hidden', position: 'relative',
                opacity: item.soldOut ? 0.6 : 1,
              }}>
                {/* Product image placeholder */}
                <div style={{
                  height: 68, background: isDark ? `linear-gradient(135deg, ${item.color}30, ${item.color}18)` : '#F8FAFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <Coffee size={22} color={item.color} />
                  {/* Badges */}
                  {item.badge && (
                    <div style={{ position: 'absolute', top: 5, left: 5, background: '#dc2626', color: '#fff', fontSize: 7, fontWeight: 800, padding: '2px 5px', borderRadius: 5 }}>{item.badge}</div>
                  )}
                  {item.rank && (
                    <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', alignItems: 'center', gap: 2, background: isDark ? '#333' : '#FFFFFF', border: `1px solid ${border}`, borderRadius: 8, padding: '2px 5px' }}>
                      <Trophy size={7} color={amber} />
                      <span style={{ fontSize: 7, fontWeight: 800, color: amber }}>{item.rank}</span>
                    </div>
                  )}
                  {item.soldOut && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.7)', padding: '2px 7px', borderRadius: 8 }}>SOLD OUT</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '7px 8px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: text, marginBottom: 1 }}>{item.name}</div>
                  <div style={{ fontSize: 8, color: muted, marginBottom: 4, fontWeight: 600 }}>{item.cat}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: item.isPromo ? red : teal_acc }}>{item.price}</div>
                  {item.orig && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 8, color: muted, textDecoration: 'line-through' }}>{item.orig}</span>
                      <span style={{ fontSize: 7, fontWeight: 800, color: red, background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)', padding: '1px 4px', borderRadius: 4 }}>{item.disc}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 8, color: muted }}>{item.sold}</span>
                    <span style={{ fontSize: 8, color: item.stock === '0' ? red : green, fontWeight: 700 }}>Stok: {item.stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Shopping Cart ── */}
        <div className="w-full sm:w-[220px] flex flex-col shrink-0" style={{ background: isDark ? '#161616' : '#FFFFFF' }}>

          {/* Cart header */}
          <div style={{ padding: '16px 14px 10px', borderBottom: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: `linear-gradient(135deg, ${teal_acc}, #0f766e)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={13} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: text, letterSpacing: '0.02em' }}>SHOPPING CART</div>
                <div style={{ fontSize: 9, color: muted }}>3 Items Selected</div>
              </div>
              <Trash2 size={12} color={muted} style={{ marginLeft: 'auto' }} />
            </div>
          </div>

          {/* Add manual item button */}
          <div style={{ margin: '8px 10px', padding: '6px 10px', border: `1px dashed ${border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <PlusCircle size={10} color={muted} />
            <span style={{ fontSize: 9, color: muted, fontWeight: 600 }}>Tambah Item Manual</span>
          </div>

          {/* Cart items */}
          <div style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'hidden' }}>
            {cartItems.map((item) => (
              <div key={item.name} style={{
                background: item.isPromo ? (isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)') : card,
                border: `1px solid ${item.isPromo ? (isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)') : border}`,
                borderRadius: 10, padding: '8px 9px',
              }}>
                {item.badge && (
                  <div style={{ fontSize: 7, fontWeight: 800, color: red, background: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', display: 'inline-block', padding: '1px 5px', borderRadius: 4, marginBottom: 3 }}>{item.badge}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: text, marginBottom: 2 }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {item.orig && <span style={{ fontSize: 8, color: muted, textDecoration: 'line-through' }}>{item.orig}</span>}
                      <span style={{ fontSize: 10, fontWeight: 900, color: item.isPromo ? red : teal_acc }}>{item.price}</span>
                    </div>
                  </div>
                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: isDark ? '#333' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: text, lineHeight: 1 }}>−</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: text, minWidth: 12, textAlign: 'center' }}>{item.qty}</span>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: isDark ? '#333' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: text, lineHeight: 1 }}>+</span>
                    </div>
                  </div>
                  {/* Price + delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: item.isPromo ? red : teal_acc, minWidth: 36, textAlign: 'right' }}>{item.price}</span>
                    <Trash2 size={10} color={muted} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary + actions */}
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${border}`, background: isDark ? '#161616' : '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: muted }}>Subtotal</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: text }}>64000</span>
            </div>
            {/* Tax toggle row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, background: isDark ? 'rgba(13,148,136,0.08)' : '#F0FDFA', border: `1px solid ${isDark ? 'rgba(13,148,136,0.2)' : '#99F6E4'}`, borderRadius: 8, padding: '5px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Toggle switch */}
                <div style={{ width: 28, height: 15, borderRadius: 8, background: teal_acc, display: 'flex', alignItems: 'center', padding: '0 2px', justifyContent: 'flex-end' }}>
                  <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fff' }} />
                </div>
                <span style={{ fontSize: 9, color: muted }}>Pajak (11%)</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: text }}>7040</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingTop: 4, borderTop: `1px solid ${border}` }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: text }}>TOTAL</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: amber }}>71040</span>
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, background: `linear-gradient(135deg, ${amber}, ${orange})`, borderRadius: 10, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Zap size={11} color="#fff" />
                <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: '0.03em' }}>QUICK PAY</span>
              </div>
              <div style={{ flex: 1, border: `1.5px solid ${border}`, borderRadius: 10, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Receipt size={10} color={text} />
                <span style={{ fontSize: 10, fontWeight: 700, color: text }}>CHECKOUT</span>
                <ChevronRight size={9} color={muted} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating revenue badge ── */}
      <div style={{
        position: 'absolute', top: -20, right: -16, zIndex: 10,
        background: isDark ? '#1e1e1e' : '#ffffff',
        border: `1px solid ${border}`,
        borderRadius: 14, padding: '11px 15px',
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.1)',
        animation: 'floatA 5s ease-in-out infinite',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: green }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pendapatan Hari Ini</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: text, letterSpacing: '-0.02em' }}>Rp 2.450.000</div>
        <div style={{ fontSize: 11, color: green, marginTop: 2, fontWeight: 700 }}>↑ 14% vs kemarin</div>
      </div>

      {/* ── Floating shift badge ── */}
      <div style={{
        position: 'absolute', bottom: 30, left: -20, zIndex: 10,
        background: isDark ? '#1e1e1e' : '#ffffff',
        border: `1px solid ${border}`,
        borderRadius: 14, padding: '9px 13px',
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.1)',
        animation: 'floatB 6s ease-in-out infinite',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: green }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: green }}>Shift Aktif</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: text }}>Budi Santoso</div>
        <div style={{ fontSize: 10, color: muted, marginTop: 1 }}>12 transaksi · 3j 24m</div>
      </div>
    </div>
  );
}

// ─── Product Table Mockup — mirrors screenshot 2 ─────────────────────────────
function ProductTableMockup({ isDark }: { isDark: boolean }) {
  const bg     = isDark ? '#111111' : '#F8FAFC';
  const panel  = isDark ? '#1a1a1a' : '#ffffff';
  const card   = isDark ? '#222222' : '#F1F5F9';
  const border = isDark ? '#2e2e2e' : '#E2E8F0';
  const text   = isDark ? '#ffffff' : '#0F172A';
  const muted  = isDark ? '#888888' : '#475569';
  const teal_acc = '#0D9488';
  const amber  = '#f59e0b';
  const orange = '#ea580c';
  const red    = '#ef4444';
  const green  = '#22c55e';

  const rows = [
    { name: 'Nasi Goreng', cat: 'Food', price: '20000', orig: '35000', cost: '10000', disc: '43%', stock: '∞', stockLabel: 'unlimited', sales: '18', margin: '71.4%', status: 'Available', statusColor: green, badges: [{ label: 'Natal', bg: '#dc2626' }, { label: '⚖ #2 Best Seller', bg: '#92400e' }] },
    { name: 'Thai Tea',    cat: 'Tea',  price: '14000', orig: null,    cost: '2000',  disc: null,  stock: '68', stockLabel: '68 pcs\nMin: 12', sales: '21', margin: '85.7%', status: 'In Stock', statusColor: green, badges: [{ label: '⚖ #1 Best Seller', bg: '#92400e' }] },
    { name: 'Kebab',       cat: 'Food', price: '60000', orig: null,    cost: '12000', disc: null,  stock: '∞', stockLabel: 'unlimited', sales: '13', margin: '80.0%', status: 'Available', statusColor: green, badges: [{ label: '⚖ #3 Best Seller', bg: '#92400e' }] },
    { name: 'Americano',   cat: 'Coffee', price: '25000', orig: null,  cost: '10000', disc: null,  stock: '36', stockLabel: '36 pcs\nMin: 5', sales: '0',  margin: '60.0%', status: 'In Stock', statusColor: green, badges: [] },
  ];

  return (
    <div className="rounded-2xl overflow-x-auto" style={{
      border: `1px solid ${border}`,
      background: bg,
      boxShadow: isDark
        ? '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
        : '0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      animation: 'subtleFloat 6s ease-in-out infinite',
    }}>
      {/* Toolbar */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: panel }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `linear-gradient(135deg, ${teal_acc}, #0f766e)`, borderRadius: 20, padding: '6px 14px' }}>
          <Plus size={12} color="#fff" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>New Product</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: card, border: `1px solid ${border}`, borderRadius: 20, padding: '6px 12px', maxWidth: 300 }}>
          <Search size={11} color={muted} />
          <span style={{ fontSize: 10, color: muted }}>Search products by name or category...</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: muted, fontWeight: 600 }}>Sales Period:</span>
          {['Today', '3 Days', '7 Days', '30 Days'].map((p, i) => (
            <div key={p} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: i === 1 ? `linear-gradient(135deg, ${teal_acc}, #0f766e)` : card, color: i === 1 ? '#fff' : muted, border: `1px solid ${i === 1 ? 'transparent' : border}` }}>{p}</div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ padding: '10px 18px', borderBottom: `1px solid ${border}`, display: 'flex', gap: 8, background: panel }}>
        {[
          { label: '⊞ All Categories', bg: card, color: muted, border: border },
          { label: '16 Products', bg: card, color: muted, border: border },
          { label: '% 1 Promo Active', bg: red, color: '#fff', border: 'transparent' },
          { label: '⚖ 3 Best Sellers', bg: amber, color: '#fff', border: 'transparent' },
        ].map(p => (
          <div key={p.label} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: p.bg, color: p.color, border: `1px solid ${p.border}`, flexShrink: 0 }}>{p.label}</div>
        ))}
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 0.9fr 1.1fr 0.7fr 1fr 0.9fr 1fr 0.8fr', gap: 0, padding: '10px 18px', borderBottom: `1px solid ${border}`, background: bg }}>
        {['PRODUCT', 'CATEGORY', 'PRICE', 'DISC', 'STOCK', 'SALES (3 DAYS)', 'STATUS', 'ACTIONS'].map(h => (
          <div key={h} style={{ fontSize: 9, fontWeight: 800, color: muted, letterSpacing: '0.06em' }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {rows.map((row, ri) => (
        <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '2.5fr 0.9fr 1.1fr 0.7fr 1fr 0.9fr 1fr 0.8fr', gap: 0, padding: '12px 18px', borderBottom: ri < rows.length - 1 ? `1px solid ${border}` : 'none', alignItems: 'center', background: ri % 2 === 0 ? bg : (isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)') }}>
          {/* Product */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: isDark ? '#2a2a2a' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Coffee size={16} color={muted} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: text, marginBottom: 3 }}>{row.name}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {row.badges.map(b => (
                  <span key={b.label} style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: b.bg, padding: '1px 6px', borderRadius: 5 }}>{b.label}</span>
                ))}
              </div>
              <div style={{ fontSize: 8, color: muted, marginTop: 2 }}>Margin: {row.margin}</div>
            </div>
          </div>
          {/* Category */}
          <div><span style={{ fontSize: 9, fontWeight: 700, color: muted, background: card, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 10 }}>{row.cat}</span></div>
          {/* Price */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: row.orig ? red : text }}>{row.price}</div>
            {row.orig && <div style={{ fontSize: 8, color: muted, textDecoration: 'line-through' }}>{row.orig}</div>}
            <div style={{ fontSize: 8, color: muted }}>Cost: {row.cost}</div>
          </div>
          {/* Disc */}
          <div>{row.disc ? <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: red, padding: '2px 6px', borderRadius: 6 }}>{row.disc}%</span> : <span style={{ color: muted, fontSize: 11 }}>-</span>}</div>
          {/* Stock */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: row.stock === '∞' ? text : green }}>{row.stock}</div>
            <div style={{ fontSize: 8, color: muted, whiteSpace: 'pre-line' }}>{row.stockLabel}</div>
          </div>
          {/* Sales */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: row.sales === '0' ? muted : green }}>{row.sales}</div>
            <div style={{ fontSize: 8, color: muted }}>last 3 days</div>
          </div>
          {/* Status */}
          <div><span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: row.statusColor, padding: '3px 8px', borderRadius: 10 }}>{row.status}</span></div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10 }}>✏️</span>
            </div>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={11} color={red} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, isDark, delay }: {
  icon: React.ElementType; title: string; desc: string; isDark: boolean; delay: number;
}) {
  const { ref, inView } = useInView();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '28px 26px', borderRadius: 16,
        background: isDark ? '#1c1917' : '#ffffff',
        border: `1px solid ${hovered
          ? (isDark ? 'rgba(13,148,136,0.45)' : '#99F6E4')
          : (isDark ? '#292524' : '#E2E8F0')}`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms, border-color 0.2s, box-shadow 0.2s`,
        boxShadow: hovered ? (isDark ? '0 8px 32px rgba(13,148,136,0.1)' : '0 8px 32px rgba(13,148,136,0.07)') : 'none',
        cursor: 'default',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 18, background: isDark ? 'rgba(245,158,11,0.12)' : '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={isDark ? '#F59E0B' : '#0D9488'} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: isDark ? '#f5f5f4' : '#0F172A', letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: isDark ? '#a8a29e' : '#475569', margin: 0 }}>{desc}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const { effectiveTheme, toggleTheme } = useTheme();
  const { status, user } = useAuth();
  const isDark = effectiveTheme === 'dark';
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresSection = useInView();
  const benefitsSection = useInView();
  const testimonialsSection = useInView();
  const ctaSection = useInView();
  // Toggle between POS view and Product table view in feature showcase
  const [showcaseTab, setShowcaseTab] = useState<'pos' | 'products'>('pos');

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Only redirect if we are SURE the user is authenticated and we have their data
  if (status === 'authenticated' && user) {
    return <Navigate to={user.role === 'owner' ? '/dashboard' : '/pos'} replace />;
  }

  // If we are still checking auth, show a minimal loading state or nothing to avoid flicker
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: isDark ? '#0c0a09' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #0D9488', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const c = {
    bg:      isDark ? '#0c0a09' : '#F8FAFC',
    surface: isDark ? '#1c1917' : '#FFFFFF',
    border:  isDark ? '#292524' : '#E2E8F0',
    text:    isDark ? '#f5f5f4' : '#0F172A',
    muted:   isDark ? '#a8a29e' : '#475569',
    subtle:  isDark ? '#57534e' : '#94A3B8',
    teal:    '#0D9488',
    brown:   '#4B3621',
    brownTint: isDark ? 'rgba(75,54,33,0.28)' : 'rgba(75,54,33,0.06)',
    amber:   '#f59e0b',
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, overflowX: 'hidden', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
        @keyframes subtleFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        *{box-sizing:border-box;}
        ::selection{background:rgba(13,148,136,0.18);}
        .nav-cta:hover{opacity:0.86;transform:translateY(-1px);}
        .hero-cta:hover{opacity:0.88;transform:translateY(-2px);box-shadow:0 12px 32px rgba(13,148,136,0.3)!important;}
        .sec-cta:hover{background:${isDark ? '#1c1917' : '#f3f4f6'}!important;}
        .footer-link:hover{color:${c.text}!important;}
        .tab-btn:hover{opacity:0.8;}
      `}</style>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px) saturate(1.6)', background: isDark ? 'rgba(12,10,9,0.92)' : 'rgba(248,250,252,0.92)', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 33, height: 33, borderRadius: 10, background: c.brown, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: c.text }}>
              smartpos<span style={{ color: isDark ? c.amber : c.teal }}>.</span><span style={{ color: c.muted, fontWeight: 400 }}>cafe</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleTheme} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${c.border}`, background: 'transparent', cursor: 'pointer', color: c.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link to="/login" style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid ${c.border}`, color: c.text, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}>Masuk</Link>
            <Link to="/register" className="nav-cta" style={{ padding: '8px 18px', borderRadius: 9, background: isDark ? c.amber : c.teal, color: isDark ? '#000' : '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s', boxShadow: isDark ? '0 2px 8px rgba(245,158,11,0.22)' : '0 2px 8px rgba(13,148,136,0.22)' }}>Daftar Gratis</Link>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section style={{ position: 'relative', padding: '72px 28px 80px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: isDark
          ? 'radial-gradient(ellipse 70% 55% at 72% 38%, rgba(13,148,136,0.045) 0%, transparent 60%), radial-gradient(ellipse 45% 35% at 15% 82%, rgba(75,54,33,0.055) 0%, transparent 60%)'
          : 'radial-gradient(ellipse 70% 55% at 72% 38%, rgba(13,148,136,0.05) 0%, transparent 60%), radial-gradient(ellipse 45% 35% at 15% 82%, rgba(75,54,33,0.04) 0%, transparent 60%)',
        }} />

        <div ref={heroRef} className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(340px,480px)_1fr] gap-12 lg:gap-16 items-center text-center lg:text-left">

          {/* LEFT — Copy */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 13px', borderRadius: 20, marginBottom: 28, background: c.brownTint, border: `1px solid ${isDark ? 'rgba(75,54,33,0.38)' : 'rgba(75,54,33,0.14)'}` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.teal }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: c.brown, letterSpacing: '0.02em' }}>Platform POS untuk F&B Indonesia</span>
            </div>

            <h1 className="font-serif text-[clamp(36px,4vw,52px)] font-normal leading-[1.12] mb-6 tracking-tight text-center lg:text-left" style={{ color: c.text }}>
              Kelola Kedai Kopi<br />
              <em style={{ color: c.teal, fontStyle: 'italic' }}>Tanpa Pusing.</em><br />
              Antrean Lancar,<br />
              Laporan Otomatis.
            </h1>

            <p className="text-base leading-[1.72] mb-10 max-w-[420px] font-medium mx-auto lg:mx-0 text-center lg:text-left" style={{ color: c.muted }}>
              Dari kasir hingga laporan harian — satu platform untuk semua kebutuhan operasional kedai kopi Anda.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-10">
              <Link to="/register" className="hero-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px', borderRadius: 11, background: c.teal, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(13,148,136,0.28)', transition: 'all 0.2s' }}>
                Mulai Gratis Sekarang <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="sec-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 11, border: `1px solid ${c.border}`, color: c.text, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', background: 'transparent' }}>
                Sudah punya akun <ChevronRight size={15} />
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                <span style={{ fontSize: 13, fontWeight: 700, color: c.text, marginLeft: 5 }}>4.9/5</span>
              </div>
              <div style={{ width: 1, height: 14, background: c.border }} />
              <span style={{ fontSize: 13, color: c.muted, fontWeight: 500 }}>Tanpa kartu kredit</span>
              <div style={{ width: 1, height: 14, background: c.border }} />
              <span style={{ fontSize: 13, color: c.muted, fontWeight: 500 }}>Setup 30 detik</span>
            </div>
          </div>

          {/* RIGHT — Real app mockup */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.9s ease 0.15s, transform 0.9s ease 0.15s', overflow: 'visible' }}>
            <POSMockup isDark={isDark} />
          </div>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <div style={{ borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, background: c.surface }}>
        <div className="max-w-[1200px] mx-auto px-7 py-7 grid grid-cols-2 lg:grid-cols-4 gap-y-8 lg:gap-y-0">
          {stats.map((s, i) => (
            <div key={s.value} className={`text-center px-2 lg:px-6 ${i === 1 || i === 3 ? 'border-r-0' : 'border-r lg:border-r'} ${i === 3 ? 'lg:border-r-0' : ''}`} style={{ borderColor: c.border }}>
              <div style={{ fontSize: 25, fontWeight: 900, color: c.teal, letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: c.muted, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ FEATURE SHOWCASE ═══════════ */}
      <section style={{ padding: '88px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Lihat Langsung</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3.2vw, 40px)', fontWeight: 400, margin: '0 0 14px', letterSpacing: '-0.022em', lineHeight: 1.2, color: c.text }}>
            Tampilan Aplikasi yang Sesungguhnya
          </h2>
          <p style={{ fontSize: 14, color: c.muted, maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.65, fontWeight: 500 }}>
            Bukan mockup generik. Ini adalah tampilan asli SmartPOS yang digunakan setiap hari oleh ratusan kasir di seluruh Indonesia.
          </p>
          {/* Tab toggle */}
          <div style={{ display: 'inline-flex', gap: 0, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 4 }}>
            {[
              { id: 'pos', label: '⚡ Point of Sale' },
              { id: 'products', label: '📦 Manajemen Produk' },
            ].map(tab => (
              <button
                key={tab.id}
                className="tab-btn"
                onClick={() => setShowcaseTab(tab.id as 'pos' | 'products')}
                style={{
                  padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
                  background: showcaseTab === tab.id ? c.teal : 'transparent',
                  color: showcaseTab === tab.id ? '#fff' : c.muted,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mockup container */}
        <div style={{ position: 'relative', padding: '0 24px 24px' }}>
          <div style={{ transition: 'opacity 0.3s ease', opacity: 1 }}>
            {showcaseTab === 'pos'
              ? <POSMockup isDark={isDark} />
              : <ProductTableMockup isDark={isDark} />
            }
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section ref={featuresSection.ref} style={{ padding: '88px 28px', background: c.surface, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 56, opacity: featuresSection.inView ? 1 : 0, transform: featuresSection.inView ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.6s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Fitur Platform</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3.2vw, 40px)', fontWeight: 400, margin: 0, letterSpacing: '-0.022em', maxWidth: 440, lineHeight: 1.2, color: c.text }}>
                Semua yang Anda Butuhkan,<br />dalam Satu Tempat
              </h2>
              <p style={{ fontSize: 14, color: c.muted, maxWidth: 320, margin: 0, lineHeight: 1.65, fontWeight: 500 }}>
                Fitur enterprise-grade tanpa kerumitan. Didesain agar siapapun bisa langsung produktif dari hari pertama.
              </p>
            </div>
            <div style={{ marginTop: 36, height: 1, background: c.border }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {features.map((f, i) => <FeatureCard key={f.title} {...f} isDark={isDark} delay={i * 70} />)}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section style={{ padding: '88px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Cara Kerja</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 400, letterSpacing: '-0.022em', margin: '0 auto 12px', lineHeight: 1.2, color: c.text }}>Mulai dalam 3 Langkah</h2>
          <p style={{ fontSize: 14, color: c.muted, margin: 0, fontWeight: 500 }}>Dari daftar hingga transaksi pertama — kurang dari 5 menit.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {[
            { step: '01', icon: Receipt,    title: 'Daftarkan Toko', desc: 'Isi nama toko, buat akun owner. Selesai dalam 30 detik.' },
            { step: '02', icon: Layers,     title: 'Setup Produk',   desc: 'Tambahkan menu, harga, kategori, dan stok awal.' },
            { step: '03', icon: RefreshCw,  title: 'Langsung Jual',  desc: 'Buka POS, mulai transaksi. Laporan otomatis tersedia.' },
          ].map((item, i) => (
            <div key={item.step} className="flex flex-col items-center text-center py-8 md:py-0 md:px-8 border-b md:border-b-0 md:border-r last:border-b-0 last:border-r-0" style={{ borderColor: c.border }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: isDark ? 'rgba(13,148,136,0.12)' : '#F0FDFA', border: `2px solid ${isDark ? 'rgba(13,148,136,0.28)' : '#99F6E4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <item.icon size={22} color={c.teal} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: c.teal, marginBottom: 8, letterSpacing: '0.08em' }}>LANGKAH {item.step}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.01em', color: c.text }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: c.muted, lineHeight: 1.65, margin: 0, fontWeight: 500 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section ref={testimonialsSection.ref} style={{ padding: '88px 28px', background: c.surface, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56, opacity: testimonialsSection.inView ? 1 : 0, transform: testimonialsSection.inView ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.6s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Cerita Pelanggan</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400, letterSpacing: '-0.022em', margin: 0, lineHeight: 1.2, color: c.text }}>
              Dipercaya oleh Ratusan Pemilik Kedai
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {testimonials.map((t, i) => (
              <div key={t.name} style={{ padding: '28px 26px', borderRadius: 16, background: c.bg, border: `1px solid ${c.border}`, opacity: testimonialsSection.inView ? 1 : 0, transform: testimonialsSection.inView ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s ease ${i * 100}ms` }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                  {[...Array(5)].map((_, si) => <Star key={si} size={12} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.72, color: c.muted, margin: '0 0 24px', fontStyle: 'italic', fontWeight: 500 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{t.initials}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: c.muted, marginTop: 2, fontWeight: 500 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BENEFITS ═══════════ */}
      <section ref={benefitsSection.ref} style={{ padding: '88px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div style={{ opacity: benefitsSection.inView ? 1 : 0, transform: benefitsSection.inView ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.6s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Kenapa SmartPOS</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 400, letterSpacing: '-0.022em', margin: '0 0 18px', lineHeight: 1.2, color: c.text }}>
              Dirancang Khusus<br />untuk F&B Indonesia
            </h2>
            <p style={{ fontSize: 14, color: c.muted, lineHeight: 1.72, margin: '0 0 28px', fontWeight: 500 }}>
              Bukan sekedar POS generik. SmartPOS dibangun dari pengalaman nyata pemilik kedai kopi lokal, dengan fitur yang benar-benar dibutuhkan.
            </p>
            <Link to="/register" className="hero-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 10, background: c.teal, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(13,148,136,0.25)', transition: 'all 0.2s' }}>
              Coba Sekarang <ArrowRight size={15} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {benefits.map((b, i) => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: c.surface, border: `1px solid ${c.border}`, opacity: benefitsSection.inView ? 1 : 0, transform: benefitsSection.inView ? 'translateX(0)' : 'translateX(20px)', transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms` }}>
                <CheckCircle2 size={16} color={c.teal} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section ref={ctaSection.ref} style={{ padding: '0 28px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '56px 44px', borderRadius: 24, background: c.surface, border: `1px solid ${c.border}`, opacity: ctaSection.inView ? 1 : 0, transform: ctaSection.inView ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <div style={{ width: 50, height: 50, borderRadius: 15, background: c.brown, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
            <Coffee size={24} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(22px, 2.8vw, 32px)', fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.25, color: c.text }}>
            Siap Membawa Kedai Anda<br />ke Level Berikutnya?
          </h2>
          <p style={{ fontSize: 14, color: c.muted, margin: '0 0 32px', lineHeight: 1.72, fontWeight: 500 }}>
            Bergabung dengan ratusan pemilik kedai yang sudah mengelola bisnis lebih efisien setiap harinya.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="hero-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 11, background: c.teal, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(13,148,136,0.28)', transition: 'all 0.2s' }}>
              Daftar Gratis <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="sec-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 28px', borderRadius: 11, border: `1px solid ${c.border}`, color: c.text, fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'transparent', transition: 'all 0.2s' }}>
              Masuk ke Akun
            </Link>
          </div>
          <p style={{ fontSize: 12, color: c.subtle, margin: '22px 0 0', fontWeight: 500 }}>Gratis selamanya untuk satu toko. Tanpa kartu kredit.</p>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: '24px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: c.brown, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', color: c.text }}>
              smartpos<span style={{ color: c.teal }}>.</span><span style={{ color: c.muted, fontWeight: 400 }}>cafe</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: c.muted, margin: 0, fontWeight: 500 }}>© {new Date().getFullYear()} SmartPOS. Dibuat untuk pelaku usaha Indonesia.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privasi', 'Syarat', 'Bantuan'].map(l => (
              <span key={l} className="footer-link" style={{ fontSize: 12, color: c.muted, cursor: 'pointer', transition: 'color 0.15s', fontWeight: 500 }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}