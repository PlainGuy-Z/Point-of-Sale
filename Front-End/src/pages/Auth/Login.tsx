import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Coffee, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

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
      if (user.role === 'cashier') {
        navigate('/cashier-dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [status, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      // AuthContext will update status → useEffect will redirect
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
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
          : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #f9fafb 100%)',
        transition: 'background 0.3s',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 24,
          padding: 40,
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          border: `1px solid ${isDark ? '#292524' : '#e5e7eb'}`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0,0,0,0.5)'
            : '0 25px 50px -12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Coffee style={{ width: 32, height: 32, color: '#ffffff' }} />
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: isDark ? '#fafaf9' : '#0c0a09',
              marginBottom: 4,
            }}
          >
            Coffee<span style={{ color: '#f59e0b' }}>Pos</span>
          </h1>
          <p style={{ color: isDark ? '#a8a29e' : '#78716c', fontSize: 14 }}>
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
              color: '#ef4444',
              fontSize: 14,
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
                color: isDark ? '#d6d3d1' : '#44403c',
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
                  color: isDark ? '#78716c' : '#a8a29e',
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
                  border: `1px solid ${isDark ? '#292524' : '#d6d3d1'}`,
                  backgroundColor: isDark ? '#0c0a09' : '#fafaf9',
                  color: isDark ? '#fafaf9' : '#0c0a09',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark ? '#292524' : '#d6d3d1';
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
                color: isDark ? '#d6d3d1' : '#44403c',
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
                  color: isDark ? '#78716c' : '#a8a29e',
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
                  border: `1px solid ${isDark ? '#292524' : '#d6d3d1'}`,
                  backgroundColor: isDark ? '#0c0a09' : '#fafaf9',
                  color: isDark ? '#fafaf9' : '#0c0a09',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark ? '#292524' : '#d6d3d1';
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
                  color: isDark ? '#78716c' : '#a8a29e',
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
                : 'linear-gradient(135deg, #f59e0b, #ea580c)',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.2s, transform 0.1s',
              boxShadow: isLoading ? 'none' : '0 4px 14px rgba(245,158,11,0.3)',
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
            color: isDark ? '#a8a29e' : '#78716c',
          }}
        >
          Belum punya akun?{' '}
          <Link
            to="/register"
            style={{
              color: '#f59e0b',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Daftar toko baru
          </Link>
        </p>
      </div>
    </div>
  );
}
