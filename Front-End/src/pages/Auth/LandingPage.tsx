import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Coffee, ShoppingCart, BarChart3, Users, Shield, Zap,
  ArrowRight, CheckCircle2, Smartphone, Moon, Sun,
  TrendingUp, Package, Clock, ChevronRight, Star,
  Receipt, RefreshCw, Layers
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

// ─── App Mockup ───────────────────────────────────────────────────────────────
function AppMockup({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#1c1917' : '#ffffff';
  const surface = isDark ? '#0c0a09' : '#f9fafb';
  const border = isDark ? '#292524' : '#e5e7eb';
  const text = isDark ? '#f5f5f4' : '#111827';
  const muted = isDark ? '#a8a29e' : '#6b7280';
  const cardBg = isDark ? '#292524' : '#f3f4f6';
  const teal = '#008080';
  const brown = '#4B3621';

  const products = [
    { name: 'Americano', price: 'Rp 25.000', color: teal },
    { name: 'Caffe Latte', price: 'Rp 32.000', color: brown },
    { name: 'Muffin Coklat', price: 'Rp 18.000', color: '#92400e' },
    { name: 'Green Tea', price: 'Rp 28.000', color: '#065f46' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 460 }}>
      {/* Floating badge — Revenue */}
      <div style={{
        position: 'absolute', top: -24, right: -12, zIndex: 10,
        background: isDark ? '#1c1917' : '#ffffff',
        border: `1px solid ${border}`,
        borderRadius: 14, padding: '12px 16px',
        boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 16px 48px rgba(0,0,0,0.08)',
        minWidth: 172,
        animation: 'floatA 5s ease-in-out infinite',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: muted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pendapatan Hari Ini</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: text }}>Rp 2.450.000</div>
        <div style={{ fontSize: 12, color: '#22c55e', marginTop: 3, fontWeight: 600 }}>+14% vs kemarin</div>
      </div>

      {/* Floating badge — Shift */}
      <div style={{
        position: 'absolute', bottom: 44, left: -20, zIndex: 10,
        background: isDark ? '#1c1917' : '#ffffff',
        border: `1px solid ${border}`,
        borderRadius: 14, padding: '10px 14px',
        boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 16px 48px rgba(0,0,0,0.08)',
        animation: 'floatB 6s ease-in-out infinite',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>Shift Aktif</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: text }}>Budi Santoso</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>12 transaksi · 3j 24m</div>
      </div>

      {/* Main window */}
      <div style={{
        background: bg, border: `1px solid ${border}`,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: isDark
          ? '0 40px 80px rgba(0,0,0,0.6)'
          : '0 40px 80px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.03)',
      }}>
        {/* Titlebar */}
        <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ef4444','#f59e0b','#22c55e'].map(col => (
              <div key={col} style={{ width: 9, height: 9, borderRadius: '50%', background: col, opacity: 0.6 }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: brown, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={12} color="#fff" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: text }}>smartpos.cafe</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: muted, background: cardBg, padding: '2px 8px', borderRadius: 20 }}>POS</div>
        </div>

        {/* Category pills */}
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${border}`, display: 'flex', gap: 6 }}>
          {['Semua', 'Coffee', 'Tea', 'Pastry'].map((cat, i) => (
            <div key={cat} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: i === 0 ? teal : cardBg,
              color: i === 0 ? '#fff' : muted,
              flexShrink: 0,
            }}>{cat}</div>
          ))}
        </div>

        {/* Product grid */}
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {products.map(p => (
            <div key={p.name} style={{
              background: cardBg, borderRadius: 12, padding: 12,
              border: `1px solid ${border}`,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: p.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 7 }}>
                <Coffee size={14} color={p.color} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 3 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: teal, fontWeight: 700 }}>{p.price}</div>
            </div>
          ))}
        </div>

        {/* Pay bar */}
        <div style={{ margin: '0 12px 12px', borderRadius: 12, background: teal, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Pesanan</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Rp 57.000</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.18)', borderRadius: 9, padding: '7px 12px' }}>
            <Zap size={13} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Bayar</span>
          </div>
        </div>
      </div>
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
          ? (isDark ? 'rgba(0,128,128,0.45)' : 'rgba(0,128,128,0.3)')
          : (isDark ? '#292524' : '#e5e7eb')}`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms, border-color 0.2s, box-shadow 0.2s`,
        boxShadow: hovered ? (isDark ? '0 8px 32px rgba(0,128,128,0.1)' : '0 8px 32px rgba(0,128,128,0.07)') : 'none',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 18,
        background: isDark ? 'rgba(0,128,128,0.12)' : 'rgba(0,128,128,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color="#008080" />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: isDark ? '#f5f5f4' : '#111827', letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: isDark ? '#a8a29e' : '#6b7280', margin: 0 }}>{desc}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { status, user } = useAuth();
  const isDark = theme === 'dark';
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresSection = useInView();
  const benefitsSection = useInView();
  const testimonialsSection = useInView();
  const ctaSection = useInView();

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (status === 'authenticated' && user) {
    return <Navigate to={user.role === 'owner' ? '/dashboard' : '/pos'} replace />;
  }

  const c = {
    bg: isDark ? '#0c0a09' : '#fafaf8',
    surface: isDark ? '#1c1917' : '#ffffff',
    border: isDark ? '#292524' : '#e5e7eb',
    text: isDark ? '#f5f5f4' : '#111827',
    muted: isDark ? '#a8a29e' : '#6b7280',
    subtle: isDark ? '#57534e' : '#9ca3af',
    teal: '#008080',
    brown: '#4B3621',
    brownTint: isDark ? 'rgba(75,54,33,0.28)' : 'rgba(75,54,33,0.06)',
  };

  return (
    <div style={{
      minHeight: '100vh', background: c.bg, color: c.text, overflowX: 'hidden',
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    }}>

      {/* ── CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
        *{box-sizing:border-box;}
        ::selection{background:rgba(0,128,128,0.18);}
        .nav-cta:hover{opacity:0.86;transform:translateY(-1px);}
        .hero-cta:hover{opacity:0.88;transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,128,128,0.3)!important;}
        .sec-cta:hover{background:${isDark ? '#1c1917' : '#f3f4f6'}!important;}
        .footer-link:hover{color:${c.text}!important;}
      `}</style>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(20px) saturate(1.6)',
        background: isDark ? 'rgba(12,10,9,0.92)' : 'rgba(250,250,248,0.92)',
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 33, height: 33, borderRadius: 10, background: c.brown, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
              smartpos<span style={{ color: c.teal }}>.</span><span style={{ color: c.muted, fontWeight: 400 }}>cafe</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleTheme} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${c.border}`, background: 'transparent', cursor: 'pointer', color: c.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link to="/login" style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid ${c.border}`, color: c.text, fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}>
              Masuk
            </Link>
            <Link to="/register" className="nav-cta" style={{ padding: '8px 18px', borderRadius: 9, background: c.teal, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,128,128,0.22)' }}>
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section style={{ position: 'relative', padding: '80px 28px 96px', overflow: 'hidden' }}>
        {/* Subtle ambient */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: isDark
          ? 'radial-gradient(ellipse 70% 55% at 72% 38%, rgba(0,128,128,0.045) 0%, transparent 60%), radial-gradient(ellipse 45% 35% at 15% 82%, rgba(75,54,33,0.055) 0%, transparent 60%)'
          : 'radial-gradient(ellipse 70% 55% at 72% 38%, rgba(0,128,128,0.05) 0%, transparent 60%), radial-gradient(ellipse 45% 35% at 15% 82%, rgba(75,54,33,0.04) 0%, transparent 60%)',
        }} />

        <div ref={heroRef} style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 72, alignItems: 'center' }}>

          {/* LEFT */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 13px', borderRadius: 20, marginBottom: 28, background: c.brownTint, border: `1px solid ${isDark ? 'rgba(75,54,33,0.38)' : 'rgba(75,54,33,0.14)'}` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.teal }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: c.brown, letterSpacing: '0.02em' }}>Platform POS untuk F&B Indonesia</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(36px, 4.5vw, 54px)', fontWeight: 400,
              lineHeight: 1.12, marginBottom: 22,
              letterSpacing: '-0.025em', color: c.text,
            }}>
              Kelola Kedai Kopi<br />
              <em style={{ color: c.teal, fontStyle: 'italic' }}>Tanpa Pusing.</em><br />
              Antrean Lancar,<br />
              Laporan Otomatis.
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.72, color: c.muted, marginBottom: 38, maxWidth: 460, fontWeight: 400 }}>
              Dari kasir hingga laporan harian — satu platform untuk semua kebutuhan operasional kedai kopi Anda. Didesain untuk pemilik usaha F&B Indonesia.
            </p>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 44 }}>
              <Link to="/register" className="hero-cta" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 26px', borderRadius: 11,
                background: c.teal, color: '#fff', fontSize: 14, fontWeight: 600,
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,128,128,0.28)',
                transition: 'all 0.2s',
              }}>
                Mulai Gratis Sekarang <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="sec-cta" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '14px 26px', borderRadius: 11,
                border: `1px solid ${c.border}`, color: c.text,
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.2s', background: 'transparent',
              }}>
                Sudah punya akun <ChevronRight size={15} />
              </Link>
            </div>

            {/* Trust row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                <span style={{ fontSize: 13, fontWeight: 600, color: c.text, marginLeft: 5 }}>4.9/5</span>
              </div>
              <div style={{ width: 1, height: 14, background: c.border }} />
              <span style={{ fontSize: 13, color: c.muted }}>Tanpa kartu kredit</span>
              <div style={{ width: 1, height: 14, background: c.border }} />
              <span style={{ fontSize: 13, color: c.muted }}>Setup 30 detik</span>
            </div>
          </div>

          {/* RIGHT — Mockup */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.9s ease 0.15s, transform 0.9s ease 0.15s',
          }}>
            <AppMockup isDark={isDark} />
          </div>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <div style={{ borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, background: c.surface }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 28px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {stats.map((s, i) => (
            <div key={s.value} style={{ textAlign: 'center', borderRight: i < 3 ? `1px solid ${c.border}` : 'none', padding: '0 24px' }}>
              <div style={{ fontSize: 25, fontWeight: 800, color: c.teal, letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: c.muted, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ FEATURES ═══════════ */}
      <section ref={featuresSection.ref} style={{ padding: '88px 28px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{
          marginBottom: 56,
          opacity: featuresSection.inView ? 1 : 0,
          transform: featuresSection.inView ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s ease',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Fitur Platform</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3.2vw, 40px)', fontWeight: 400, margin: 0, letterSpacing: '-0.022em', maxWidth: 440, lineHeight: 1.2 }}>
              Semua yang Anda Butuhkan,<br />dalam Satu Tempat
            </h2>
            <p style={{ fontSize: 14, color: c.muted, maxWidth: 320, margin: 0, lineHeight: 1.65 }}>
              Fitur enterprise-grade tanpa kerumitan. Didesain agar siapapun bisa langsung produktif dari hari pertama.
            </p>
          </div>
          <div style={{ marginTop: 36, height: 1, background: c.border }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} isDark={isDark} delay={i * 70} />
          ))}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section style={{ padding: '88px 28px', background: c.surface, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Cara Kerja</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 400, letterSpacing: '-0.022em', margin: '0 auto 12px', lineHeight: 1.2 }}>
              Mulai dalam 3 Langkah
            </h2>
            <p style={{ fontSize: 14, color: c.muted, margin: 0 }}>Dari daftar hingga transaksi pertama — kurang dari 5 menit.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0 }}>
            {[
              { step: '01', icon: Receipt, title: 'Daftarkan Toko', desc: 'Isi nama toko, buat akun owner. Selesai dalam 30 detik.' },
              { step: '02', icon: Layers, title: 'Setup Produk', desc: 'Tambahkan menu, harga, kategori, dan stok awal.' },
              { step: '03', icon: RefreshCw, title: 'Langsung Jual', desc: 'Buka POS, mulai transaksi. Laporan otomatis tersedia.' },
            ].map((item, i) => (
              <div key={item.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 32px', borderRight: i < 2 ? `1px solid ${c.border}` : 'none' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: isDark ? 'rgba(0,128,128,0.12)' : 'rgba(0,128,128,0.08)', border: `2px solid ${isDark ? 'rgba(0,128,128,0.28)' : 'rgba(0,128,128,0.18)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <item.icon size={22} color={c.teal} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.teal, marginBottom: 8, letterSpacing: '0.08em' }}>LANGKAH {item.step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.01em' }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: c.muted, lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section ref={testimonialsSection.ref} style={{ padding: '88px 28px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, opacity: testimonialsSection.inView ? 1 : 0, transform: testimonialsSection.inView ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.6s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Cerita Pelanggan</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400, letterSpacing: '-0.022em', margin: 0, lineHeight: 1.2 }}>
            Dipercaya oleh Ratusan Pemilik Kedai
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {testimonials.map((t, i) => (
            <div key={t.name} style={{
              padding: '28px 26px', borderRadius: 16,
              background: c.surface, border: `1px solid ${c.border}`,
              opacity: testimonialsSection.inView ? 1 : 0,
              transform: testimonialsSection.inView ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s ease ${i * 100}ms`,
            }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                {[...Array(5)].map((_, si) => <Star key={si} size={12} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.72, color: c.muted, margin: '0 0 24px', fontStyle: 'italic' }}>
                "{t.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{t.initials}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ BENEFITS ═══════════ */}
      <section ref={benefitsSection.ref} style={{ padding: '88px 28px', background: c.surface, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div style={{ opacity: benefitsSection.inView ? 1 : 0, transform: benefitsSection.inView ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.6s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Kenapa SmartPOS</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 400, letterSpacing: '-0.022em', margin: '0 0 18px', lineHeight: 1.2 }}>
              Dirancang Khusus<br />untuk F&B Indonesia
            </h2>
            <p style={{ fontSize: 14, color: c.muted, lineHeight: 1.72, margin: '0 0 28px' }}>
              Bukan sekedar POS generik. SmartPOS dibangun dari pengalaman nyata pemilik kedai kopi lokal, dengan fitur yang benar-benar dibutuhkan.
            </p>
            <Link to="/register" className="hero-cta" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '12px 22px', borderRadius: 10,
              background: c.teal, color: '#fff', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,128,128,0.25)',
              transition: 'all 0.2s',
            }}>
              Coba Sekarang <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right — checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {benefits.map((b, i) => (
              <div key={b} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 12,
                background: c.bg, border: `1px solid ${c.border}`,
                opacity: benefitsSection.inView ? 1 : 0,
                transform: benefitsSection.inView ? 'translateX(0)' : 'translateX(20px)',
                transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms`,
              }}>
                <CheckCircle2 size={16} color={c.teal} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BOTTOM ═══════════ */}
      <section ref={ctaSection.ref} style={{ padding: '88px 28px 100px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 600, margin: '0 auto', padding: '56px 44px',
          borderRadius: 24, background: c.surface, border: `1px solid ${c.border}`,
          opacity: ctaSection.inView ? 1 : 0,
          transform: ctaSection.inView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div style={{ width: 50, height: 50, borderRadius: 15, background: c.brown, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
            <Coffee size={24} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(22px, 2.8vw, 32px)', fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.25 }}>
            Siap Membawa Kedai Anda ke Level Berikutnya?
          </h2>
          <p style={{ fontSize: 14, color: c.muted, margin: '0 0 32px', lineHeight: 1.72 }}>
            Bergabung dengan ratusan pemilik kedai yang sudah mengelola bisnis lebih efisien setiap harinya.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="hero-cta" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 11,
              background: c.teal, color: '#fff', fontSize: 14, fontWeight: 600,
              textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,128,128,0.28)',
              transition: 'all 0.2s',
            }}>
              Daftar Gratis <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="sec-cta" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '14px 28px', borderRadius: 11,
              border: `1px solid ${c.border}`, color: c.text,
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
              background: 'transparent', transition: 'all 0.2s',
            }}>
              Masuk ke Akun
            </Link>
          </div>
          <p style={{ fontSize: 12, color: c.subtle, margin: '22px 0 0' }}>
            Gratis selamanya untuk satu toko. Tanpa kartu kredit.
          </p>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: '24px 28px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: c.brown, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>
              smartpos<span style={{ color: c.teal }}>.</span><span style={{ color: c.muted, fontWeight: 400 }}>cafe</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: c.muted, margin: 0 }}>
            © {new Date().getFullYear()} SmartPOS. Dibuat untuk pelaku usaha Indonesia.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privasi', 'Syarat', 'Bantuan'].map(l => (
              <span key={l} className="footer-link" style={{ fontSize: 12, color: c.muted, cursor: 'pointer', transition: 'color 0.15s' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}