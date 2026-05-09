import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Coffee,
  ShoppingCart,
  BarChart3,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Moon,
  Sun,
} from 'lucide-react';

const features = [
  {
    icon: ShoppingCart,
    title: 'Point of Sale',
    desc: 'Transaksi cepat dengan antarmuka kasir modern dan intuitif.',
  },
  {
    icon: BarChart3,
    title: 'Business Insights',
    desc: 'Laporan penjualan, profit, dan tren bisnis secara real-time.',
  },
  {
    icon: Users,
    title: 'Multi-User',
    desc: 'Kelola owner dan kasir dengan hak akses berbeda.',
  },
  {
    icon: Shield,
    title: 'Aman & Terpercaya',
    desc: 'Autentikasi JWT, data terenkripsi, dan isolasi per toko.',
  },
  {
    icon: Smartphone,
    title: 'Responsif',
    desc: 'Bisa diakses dari desktop, tablet, maupun smartphone.',
  },
  {
    icon: Zap,
    title: 'Performa Tinggi',
    desc: 'Dibangun dengan teknologi modern untuk kecepatan maksimal.',
  },
];

const benefits = [
  'Gratis untuk memulai — tanpa kartu kredit',
  'Setup toko dalam 30 detik',
  'Kelola produk, stok, dan kategori',
  'Lacak penjualan dan keuntungan harian',
  'Manajemen kasir dengan role-based access',
  'Dukungan dark mode & light mode',
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { status, user } = useAuth();
  const isDark = theme === 'dark';

  // If already authenticated, redirect to app
  if (status === 'authenticated' && user) {
    return <Navigate to={user.role === 'owner' ? '/dashboard' : '/pos'} replace />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#0c0a09' : '#fafaf9',
        color: isDark ? '#fafaf9' : '#1c1917',
        transition: 'background-color 0.3s, color 0.3s',
        overflowX: 'hidden',
      }}
    >
      {/* ===== NAVBAR ===== */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          backgroundColor: isDark ? 'rgba(12,10,9,0.85)' : 'rgba(250,250,249,0.85)',
          borderBottom: `1px solid ${isDark ? '#292524' : '#e7e5e4'}`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
              }}
            >
              <Coffee style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800 }}>
              Coffee<span style={{ color: '#f59e0b' }}>Pos</span>
            </span>
          </div>

          {/* Nav Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={toggleTheme}
              style={{
                padding: '8px',
                borderRadius: 10,
                border: `1px solid ${isDark ? '#292524' : '#d6d3d1'}`,
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: isDark ? '#a8a29e' : '#78716c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Toggle theme"
            >
              {isDark ? <Sun style={{ width: 18, height: 18 }} /> : <Moon style={{ width: 18, height: 18 }} />}
            </button>
            <Link
              to="/login"
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: `1px solid ${isDark ? '#292524' : '#d6d3d1'}`,
                backgroundColor: 'transparent',
                color: isDark ? '#fafaf9' : '#1c1917',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              Masuk
            </Link>
            <Link
              to="/register"
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
                transition: 'all 0.2s',
              }}
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section
        style={{
          position: 'relative',
          padding: '80px 24px 60px',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gradient blobs */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 24,
              backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)',
              color: '#f59e0b',
              border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.25)'}`,
            }}
          >
            <Zap style={{ width: 14, height: 14 }} />
            Solusi POS Modern untuk Bisnis Anda
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: 20,
              letterSpacing: '-0.02em',
            }}
          >
            Kelola Toko Kopi Anda{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Lebih Cerdas
            </span>
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: isDark ? '#a8a29e' : '#78716c',
              maxWidth: 560,
              margin: '0 auto 40px',
            }}
          >
            CoffeePos membantu Anda mengelola penjualan, stok, dan keuangan toko dengan mudah.
            Dari kasir hingga laporan bisnis, semuanya dalam satu platform.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 32px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              Mulai Sekarang — Gratis
              <ArrowRight style={{ width: 20, height: 20 }} />
            </Link>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 32px',
                borderRadius: 14,
                border: `2px solid ${isDark ? '#292524' : '#d6d3d1'}`,
                backgroundColor: 'transparent',
                color: isDark ? '#fafaf9' : '#1c1917',
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section
        style={{
          padding: '60px 24px 80px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
            Semua yang Anda Butuhkan
          </h2>
          <p style={{ fontSize: 16, color: isDark ? '#a8a29e' : '#78716c', maxWidth: 480, margin: '0 auto' }}>
            Fitur lengkap untuk menjalankan bisnis kopi Anda dari A sampai Z.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: 28,
                borderRadius: 20,
                backgroundColor: isDark ? '#1c1917' : '#ffffff',
                border: `1px solid ${isDark ? '#292524' : '#e7e5e4'}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <f.icon style={{ width: 24, height: 24, color: '#f59e0b' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: isDark ? '#a8a29e' : '#78716c' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section
        style={{
          padding: '60px 24px 80px',
          backgroundColor: isDark ? '#1c1917' : '#f5f5f4',
          borderTop: `1px solid ${isDark ? '#292524' : '#e7e5e4'}`,
          borderBottom: `1px solid ${isDark ? '#292524' : '#e7e5e4'}`,
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
            Kenapa Memilih CoffeePos?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: isDark ? '#a8a29e' : '#78716c',
              marginBottom: 40,
              maxWidth: 480,
              margin: '0 auto 40px',
            }}
          >
            Didesain khusus untuk pemilik usaha kopi dan F&B di Indonesia.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              textAlign: 'left',
            }}
          >
            {benefits.map((b) => (
              <div
                key={b}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 20px',
                  borderRadius: 14,
                  backgroundColor: isDark ? '#0c0a09' : '#ffffff',
                  border: `1px solid ${isDark ? '#292524' : '#e7e5e4'}`,
                }}
              >
                <CheckCircle2 style={{ width: 20, height: 20, color: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BOTTOM ===== */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: '48px 40px',
            borderRadius: 24,
            background: isDark
              ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(234,88,12,0.06))'
              : 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(234,88,12,0.04))',
            border: `1px solid ${isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.2)'}`,
          }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            Siap Memulai?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: isDark ? '#a8a29e' : '#78716c',
              marginBottom: 28,
              maxWidth: 400,
              margin: '0 auto 28px',
            }}
          >
            Daftarkan toko Anda sekarang dan mulai kelola bisnis lebih efisien.
          </p>
          <Link
            to="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 36px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
            }}
          >
            Daftar Gratis Sekarang
            <ArrowRight style={{ width: 20, height: 20 }} />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          padding: '24px',
          textAlign: 'center',
          borderTop: `1px solid ${isDark ? '#292524' : '#e7e5e4'}`,
          color: isDark ? '#78716c' : '#a8a29e',
          fontSize: 13,
        }}
      >
        © {new Date().getFullYear()} CoffeePos. Dibuat dengan ☕ untuk pelaku usaha Indonesia.
      </footer>
    </div>
  );
}
