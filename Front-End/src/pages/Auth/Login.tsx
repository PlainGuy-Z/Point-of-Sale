import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Coffee, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login, status, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [status, user, navigate]);

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
          ? 'linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #0c0a09 100%)'
          : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        transition: 'background 0.3s',
        position: 'relative',
      }}
    >
      {/* Back to Home Button */}
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: isDark ? '#a8a29e' : '#475569',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
          padding: '8px 16px',
          borderRadius: 9999,
          backgroundColor: isDark ? 'rgba(28, 25, 23, 0.5)' : '#FFFFFF',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${isDark ? '#292524' : '#E2E8F0'}`,
          boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = isDark ? '#fafaf9' : '#0D9488';
          e.currentTarget.style.borderColor = isDark ? '#292524' : '#99F6E4';
          e.currentTarget.style.transform = 'translateX(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isDark ? '#a8a29e' : '#475569';
          e.currentTarget.style.borderColor = isDark ? '#292524' : '#E2E8F0';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} />
        Kembali ke Beranda
      </Link>

      <div
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 24,
          padding: 40,
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          border: `1px solid ${isDark ? '#292524' : '#E2E8F0'}`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0,0,0,0.5)'
            : '0 10px 40px -10px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-block', textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #0D9488, #0f766e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(13, 148, 136, 0.2)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Coffee style={{ width: 32, height: 32, color: '#ffffff' }} />
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: isDark ? '#fafaf9' : '#0F172A',
                marginBottom: 4,
                letterSpacing: '-0.02em'
              }}
            >
              Coffee<span style={{ color: '#0D9488' }}>Pos</span>
            </h1>
          </Link>
          <p style={{ color: isDark ? '#a8a29e' : '#475569', fontSize: 14, fontWeight: 500 }}>
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
                  border: `1px solid ${isDark ? '#292524' : '#E2E8F0'}`,
                  backgroundColor: isDark ? '#0c0a09' : '#ffffff',
                  color: isDark ? '#fafaf9' : '#0F172A',
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
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: isDark ? '#d6d3d1' : '#475569',
                marginBottom: 6,
              }}
            >
              Password
            </label>
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
                  border: `1px solid ${isDark ? '#292524' : '#E2E8F0'}`,
                  backgroundColor: isDark ? '#0c0a09' : '#ffffff',
                  color: isDark ? '#fafaf9' : '#0F172A',
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
              borderRadius: 12,
              border: 'none',
              background: isLoading
                ? (isDark ? '#44403c' : '#d6d3d1')
                : '#0D9488',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              boxShadow: isLoading ? 'none' : '0 4px 14px rgba(13,148,136,0.25)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.background = '#0f766e';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.background = '#0D9488';
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
