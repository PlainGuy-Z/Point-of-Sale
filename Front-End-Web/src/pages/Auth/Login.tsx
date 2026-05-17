import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Coffee, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import icon from '../../assets/icon.png';

export default function Login() {
  const { login, status, user } = useAuth();
  const { effectiveTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = effectiveTheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && user) {
      navigate(user.role === 'owner' ? '/dashboard' : '/pos', { replace: true });
    }
  }, [status, user, navigate]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0c0a09' : '#F8FAFC' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      // AuthContext will update status → useEffect will redirect
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: isDark
          ? '#111111'
          : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        transition: 'background 0.3s',
        position: 'relative',
      }}
    >




      <div
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 24,
          padding: 40,
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          border: `1px solid ${isDark ? '#2e2e2e' : '#E2E8F0'}`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0,0,0,0.5)'
            : '0 10px 40px -10px rgba(0,0,0,0.08)',
        }}
      >
  {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Link 
          to="/login" 
          style={{ 
            display: 'inline-flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            textDecoration: 'none', 
            color: 'inherit' 
          }}
        >
          {/* Icon Container */}
          <div
            style={{
              width: 64,  // Ukuran kotak fix
              height: 64, // Ukuran kotak fix
              borderRadius: 18, // Sudut melengkung ala Apple/Modern UI
              background: isDark 
                ? 'linear-gradient(135deg, #80570b 0%, #804a0c 100%)' 
                : 'linear-gradient(135deg, #269b92 0%, #0f3e39 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              // Shadow berlapis: Drop shadow untuk efek melayang + Inner shadow putih untuk efek premium
              boxShadow: isDark 
                ? '0 12px 32px -8px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)' 
                : '0 12px 32px -8px rgba(13, 148, 136, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Animasi lebih smooth
            }}
            onMouseEnter={(e) => {
              // Saat di-hover, logo naik sedikit dan bayangannya membesar
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
              e.currentTarget.style.boxShadow = isDark 
                ? '0 16px 40px -8px rgba(245, 158, 11, 0.6), inset 0 2px 4px rgba(255,255,255,0.3)'
                : '0 16px 40px -8px rgba(13, 148, 136, 0.6), inset 0 2px 4px rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              // Balik ke ukuran dan posisi semula
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = isDark 
                ? '0 12px 32px -8px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)' 
                : '0 12px 32px -8px rgba(13, 148, 136, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)';
            }}
          >
            <img src={icon} alt="SmartPOS Logo" style={{ width: 32, height: 32, color: '#ffffff', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }} />
          </div>
          
          {/* Text Title */}
          <h1
            style={{
              fontSize: 32, // Sedikit dibesarkan biar seimbang sama ikon
              fontWeight: 800,
              color: isDark ? '#ffffff' : '#0F172A',
              marginBottom: 8,
              letterSpacing: '-0.03em', // Jarak antar huruf dirapatkan sedikit biar modern
            }}
          >
            Smart<span style={{ color: isDark ? '#F59E0B' : '#0D9488', fontWeight: 900 }}>POS</span>
          </h1>
        </Link>
        
        {/* Subtitle */}
        <p style={{ 
          color: isDark ? '#a8a29e' : '#475569', 
          fontSize: 15, 
          fontWeight: 500,
          letterSpacing: '-0.01em'
        }}>
          Masuk ke dashboard toko Anda
        </p>
      </div>
      
        {/* Error */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 12,
              marginBottom: 20,
              backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
              border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}`,
              color: '#b91c1c',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: isDark ? '#d6d3d1' : '#475569',
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 18,
                  height: 18,
                  color: isDark ? '#78716c' : '#94A3B8',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@toko.com"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  borderRadius: 12,
                  border: `1px solid ${isDark ? '#2e2e2e' : '#E2E8F0'}`,
                  backgroundColor: isDark ? '#222222' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0F172A',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = isDark ? '#F59E0B' : '#0D9488';
                  e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(13,148,136,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark ? '#292524' : '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <div className="flex items-center justify-between mb-1.5">
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: isDark ? '#d6d3d1' : '#475569',
                }}
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Lupa password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 18,
                  height: 18,
                  color: isDark ? '#78716c' : '#94A3B8',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 44px',
                  borderRadius: 12,
                  border: `1px solid ${isDark ? '#2e2e2e' : '#E2E8F0'}`,
                  backgroundColor: isDark ? '#222222' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0F172A',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0D9488';
                  e.target.style.boxShadow = '0 0 0 4px rgba(13,148,136,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark ? '#292524' : '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: isDark ? '#78716c' : '#94A3B8',
                }}
              >
                {showPassword ? (
                  <EyeOff style={{ width: 18, height: 18 }} />
                ) : (
                  <Eye style={{ width: 18, height: 18 }} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 14,
              border: 'none',
              background: isLoading
                ? (isDark ? '#44403c' : '#d6d3d1')
                : (isDark ? '#F59E0B' : '#0D9488'),
              color: isDark ? '#1c1917' : '#ffffff',
              fontSize: 15,
              fontWeight: 800,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              boxShadow: isLoading ? 'none' : (isDark ? '0 4px 14px rgba(245,158,11,0.25)' : '0 4px 14px rgba(13,148,136,0.25)'),
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            {isLoading ? (
              <>
                <Loader2 style={{ width: 20, height: 20, animation: 'spin 0.8s linear infinite' }} />
                Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        {/* Register Link */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 14,
            color: isDark ? '#a8a29e' : '#475569',
            fontWeight: 500
          }}
        >
          Belum punya akun?{' '}
          <Link
            to="/register"
            style={{
              color: '#0D9488',
              fontWeight: 700,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Daftar toko baru
          </Link>
        </p>
      </div>
    </div>
  );
}
