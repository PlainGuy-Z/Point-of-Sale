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
  { icon: ShoppingCart, title: 'Point of Sale Intuitif', desc: 'Kasir bisa langsung produktif. Interface modern, quick pay, dan custom item tanpa training panjang.' },
  { icon: BarChart3, title: 'Business Insights AI', desc: 'Laporan profit, tren penjualan, dan analisis waste secara real-time. Data jadi keputusan nyata.' },
  { icon: Users, title: 'Multi-Role Access', desc: 'Owner kelola semuanya. Kasir fokus transaksi. Hak akses terpisah, data tetap aman.' },
  { icon: Clock, title: 'Shift Management', desc: 'Buka dan tutup shift dengan rekap kas otomatis. Pantau performa kasir per sesi kerja.' },
  { icon: Package, title: 'Manajemen Stok', desc: 'Track stok real-time, alert minimum, dan waste log terintegrasi dalam satu platform.' },
  { icon: Shield, title: 'Keamanan Enterprise', desc: 'JWT httpOnly cookie, isolasi data per toko, enkripsi password bcrypt. Serius soal keamanan.' },
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

// ─── App Mockup Component ─────────────────────────────────────────────────────
function AppMockup({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#1a1614' : '#ffffff';
  const surface = isDark ? '#0c0a09' : '#f8fafc';
  const border = isDark ? '#292524' : '#e2e8f0';
  const text = isDark ? '#f5f5f4' : '#0f172a';
  const muted = isDark ? '#a8a29e' : '#64748b';
  const cardBg = isDark ? '#292524' : '#f1f5f9';
  const amber = '#f59e0b';
  const green = '#22c55e';
  const red = '#ef4444';

  const products = [
    { name: 'Americano', price: 'Rp25rb', stock: 40, color: '#6366f1' },
    { name: 'Caffe Latte', price: 'Rp32rb', stock: 28, color: '#f59e0b' },
    { name: 'Muffin', price: 'Rp18rb', stock: 12, color: '#ec4899' },
    { name: 'Green Tea', price: 'Rp28rb', stock: 35, color: '#22c55e' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
      {/* Floating card — Revenue */}
      <div
        style={{
          position: 'absolute', top: -32, right: -16, zIndex: 10,
          background: isDark ? '#1a1614' : '#ffffff',
          border: `1px solid ${border}`,
          borderRadius: 16, padding: '12px 18px',
          boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.12)',
          minWidth: 180,
          animation: 'floatCard 4s ease-in-out infinite',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={14} color={green} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hari ini</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: text, lineHeight: 1 }}>Rp 2,45jt</div>
        <div style={{ fontSize: 12, color: green, marginTop: 4, fontWeight: 600 }}>↑ 14% vs kemarin</div>
      </div>

      {/* Floating card — Shift */}
      <div
        style={{
          position: 'absolute', bottom: 40, left: -24, zIndex: 10,
          background: isDark ? '#1a1614' : '#ffffff',
          border: `1px solid ${border}`,
          borderRadius: 16, padding: '10px 14px',
          boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.12)',
          minWidth: 160,
          animation: 'floatCard2 5s ease-in-out infinite',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: green, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: green }}>Shift Aktif</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: text }}>Budi Santoso</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>12 transaksi · 3j 24m</div>
      </div>

      {/* Main App Window */}
      <div
        style={{
          background: bg, border: `1px solid ${border}`,
          borderRadius: 20, overflow: 'hidden',
          boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.5)' : '0 40px 80px rgba(0,0,0,0.15)',
        }}
      >
        {/* Titlebar */}
        <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ef4444','#f59e0b','#22c55e'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: text }}>Kopi Nusantara</span>
          </div>
          <div style={{ fontSize: 11, color: muted, background: cardBg, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>POS</div>
        </div>

        {/* Category pills */}
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, display: 'flex', gap: 8, overflowX: 'hidden' }}>
          {['Semua','Coffee','Tea','Pastry'].map((cat, i) => (
            <div
              key={cat}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : cardBg,
                color: i === 0 ? '#fff' : muted,
                flexShrink: 0,
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        {/* Product grid */}
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {products.map((p) => (
            <div
              key={p.name}
              style={{
                background: cardBg, borderRadius: 14, padding: 12,
                border: `1px solid ${border}`,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Coffee size={16} color={p.color} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: amber, fontWeight: 800 }}>{p.price}</div>
              <div style={{ fontSize: 10, color: muted, marginTop: 4 }}>Stok: {p.stock}</div>
            </div>
          ))}
        </div>

        {/* Cart summary bar */}
        <div
          style={{
            margin: '0 12px 12px', borderRadius: 14,
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Rp 57.000</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px' }}>
            <Zap size={14} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Quick Pay</span>
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
  return (
    <div
      ref={ref}
      style={{
        padding: 28, borderRadius: 20,
        background: isDark ? '#1a1614' : '#ffffff',
        border: `1px solid ${isDark ? '#292524' : '#e2e8f0'}`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div
        style={{
          width: 48, height: 48, borderRadius: 14, marginBottom: 18,
          background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon size={22} color="#f59e0b" />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: isDark ? '#f5f5f4' : '#0f172a' }}>{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: isDark ? '#a8a29e' : '#64748b', margin: 0 }}>{desc}</p>
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
  const ctaSection = useInView();

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (status === 'authenticated' && user) {
    return <Navigate to={user.role === 'owner' ? '/dashboard' : '/pos'} replace />;
  }

  const c = {
    bg: isDark ? '#0c0a09' : '#fafaf9',
    surface: isDark ? '#1a1614' : '#ffffff',
    border: isDark ? '#292524' : '#e2e8f0',
    text: isDark ? '#f5f5f4' : '#0f172a',
    muted: isDark ? '#a8a29e' : '#64748b',
    subtle: isDark ? '#292524' : '#f1f5f9',
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, overflowX: 'hidden' }}>
      {/* CSS Keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes floatCard2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes spinLoader { to{transform:rotate(360deg)} }
        .nav-link:hover { opacity: 0.7; }
        .cta-primary:hover { opacity: 0.88; transform: translateY(-2px); }
        .cta-secondary:hover { background: ${isDark ? '#292524' : '#f1f5f9'} !important; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(20px)',
        background: isDark ? 'rgba(12,10,9,0.88)' : 'rgba(250,250,249,0.88)',
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
              <Coffee size={20} color="#fff" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Coffee<span style={{ color: '#f59e0b' }}>Pos</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={toggleTheme}
              style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.border}`, background: 'transparent', cursor: 'pointer', color: c.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/login" style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${c.border}`, color: c.text, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>
              Masuk
            </Link>
            <Link to="/register" style={{ padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,158,11,0.3)', transition: 'all 0.2s' }}>
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', padding: '72px 24px 80px', overflow: 'hidden' }}>
        {/* Background decorations */}
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(234,88,12,0.05) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(234,88,12,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div ref={heroRef} style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          {/* LEFT — Text & CTA */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, marginBottom: 24, background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)', border: `1px solid ${isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.2)'}`, color: '#f59e0b', fontSize: 12, fontWeight: 700, letterSpacing: '0.02em' }}>
              <Zap size={12} />
              Platform POS Modern untuk F&B Indonesia
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px, 4.5vw, 58px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
              Revolusi Kasir<br />
              <span style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Modern</span> untuk<br />
              Bisnis Kopi Anda
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.7, color: c.muted, marginBottom: 36, maxWidth: 480 }}>
              Dari transaksi kasir hingga laporan bisnis — semua dalam satu platform. Dibangun khusus untuk pemilik usaha kopi dan F&B di Indonesia.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link
                to="/register"
                className="cta-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(245,158,11,0.35)', transition: 'all 0.2s' }}
              >
                Mulai Gratis Sekarang <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="cta-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', borderRadius: 14, border: `2px solid ${c.border}`, color: c.text, fontSize: 15, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', background: 'transparent' }}
              >
                Sudah Punya Akun <ChevronRight size={16} />
              </Link>
            </div>

            {/* Social proof mini */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                <span style={{ fontSize: 13, fontWeight: 600, color: c.text, marginLeft: 4 }}>4.9/5</span>
              </div>
              <span style={{ color: c.muted, fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: c.muted }}>Tanpa kartu kredit</span>
              <span style={{ color: c.muted, fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: c.muted }}>Setup 30 detik</span>
            </div>
          </div>

          {/* RIGHT — App Mockup */}
          <div style={{ display: 'flex', justifyContent: 'center', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'scale(1)' : 'scale(0.92)', transition: 'opacity 1s ease 0.2s, transform 1s ease 0.2s' }}>
            <AppMockup isDark={isDark} />
          </div>
        </div>
      </section>

      {/* ── STATS / TRUST BAR ── */}
      <div style={{ borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, background: isDark ? '#1a1614' : '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 24 }}>
          {stats.map(s => (
            <div key={s.value} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: c.muted, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section ref={featuresSection.ref} style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, opacity: featuresSection.inView ? 1 : 0, transform: featuresSection.inView ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease' }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)', color: '#f59e0b', fontSize: 12, fontWeight: 700, marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Fitur Lengkap
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, marginBottom: 14 }}>
            Semua yang Anda Butuhkan
          </h2>
          <p style={{ fontSize: 16, color: c.muted, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Fitur enterprise-grade tanpa kerumitan. Didesain agar siapapun bisa langsung pakai.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} isDark={isDark} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 24px', background: isDark ? '#1a1614' : '#f8fafc', borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, marginBottom: 12 }}>
              Mulai dalam 3 Langkah
            </h2>
            <p style={{ fontSize: 15, color: c.muted }}>Dari daftar hingga transaksi pertama — kurang dari 5 menit.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, position: 'relative' }}>
            {[
              { step: '01', icon: Receipt, title: 'Daftarkan Toko', desc: 'Isi nama toko, buat akun owner. Selesai dalam 30 detik.' },
              { step: '02', icon: Layers, title: 'Setup Produk', desc: 'Tambahkan menu, harga, kategori, dan stok awal.' },
              { step: '03', icon: RefreshCw, title: 'Langsung Jual', desc: 'Buka POS, mulai transaksi. Laporan otomatis tersedia.' },
            ].map((item, i) => (
              <div key={item.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 8px 24px rgba(245,158,11,0.3)', flexShrink: 0 }}>
                  <item.icon size={26} color="#fff" />
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', marginBottom: 8, letterSpacing: '0.1em' }}>LANGKAH {item.step}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: c.muted, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section ref={benefitsSection.ref} style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48, opacity: benefitsSection.inView ? 1 : 0, transition: 'opacity 0.6s ease', transform: benefitsSection.inView ? 'none' : 'translateY(16px)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, marginBottom: 12 }}>
            Kenapa Memilih CoffeePos?
          </h2>
          <p style={{ fontSize: 15, color: c.muted }}>Didesain khusus untuk pelaku usaha kopi dan F&B di Indonesia.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {benefits.map((b, i) => (
            <div
              key={b}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', borderRadius: 14,
                background: c.surface, border: `1px solid ${c.border}`,
                opacity: benefitsSection.inView ? 1 : 0,
                transform: benefitsSection.inView ? 'translateX(0)' : 'translateX(-16px)',
                transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms`,
              }}
            >
              <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section ref={ctaSection.ref} style={{ padding: '80px 24px 100px', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: 680, margin: '0 auto', padding: '56px 40px', borderRadius: 28,
            background: isDark
              ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(234,88,12,0.05))'
              : 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(234,88,12,0.04))',
            border: `1px solid ${isDark ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.22)'}`,
            opacity: ctaSection.inView ? 1 : 0,
            transform: ctaSection.inView ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(245,158,11,0.35)' }}>
            <Coffee size={28} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, marginBottom: 14 }}>
            Siap Membawa Toko Anda ke Level Berikutnya?
          </h2>
          <p style={{ fontSize: 15, color: c.muted, marginBottom: 32, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
            Bergabung dengan ratusan pemilik usaha yang sudah mengelola bisnis lebih efisien dengan CoffeePos.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              className="cta-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(245,158,11,0.35)', transition: 'all 0.2s' }}
            >
              Daftar Gratis Sekarang <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 14, border: `2px solid ${c.border}`, color: c.text, fontSize: 15, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', background: 'transparent' }}
            >
              Masuk ke Akun
            </Link>
          </div>
          <p style={{ fontSize: 13, color: c.muted, marginTop: 20 }}>Gratis selamanya untuk satu toko. Tanpa kartu kredit.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: '28px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Coffee<span style={{ color: '#f59e0b' }}>Pos</span></span>
          </div>
          <p style={{ fontSize: 12, color: c.muted, margin: 0 }}>
            © {new Date().getFullYear()} CoffeePos. Dibuat dengan ☕ untuk pelaku usaha Indonesia.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privasi', 'Syarat', 'Bantuan'].map(l => (
              <span key={l} style={{ fontSize: 12, color: c.muted, cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}