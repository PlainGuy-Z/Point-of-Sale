import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { authApi } from '../../services/authApi';
import { Coffee, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSuccess, navigate]);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { color: isDark ? '#44403c' : '#e2e8f0', label: '' };
    if (pass.length < 8) return { color: isDark ? '#44403c' : '#e2e8f0', label: '' };
    
    let score = 0;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (pass.length < 12 || score < 3) return { color: '#ef4444', label: 'Lemah' };
    return { color: '#22c55e', label: 'Kuat' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token!, password);
      setIsSuccess(true);
    } catch (err: any) {
      if (err?.code === 'TOKEN_EXPIRED') {
        setError('Link reset sudah kedaluwarsa. Silakan minta link baru.');
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mereset password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

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
        {isSuccess ? (
          // ── SUCCESS STATE ──
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: isDark ? 'rgba(34, 197, 94, 0.1)' : '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <CheckCircle style={{ width: 48, height: 48, color: '#22c55e' }} />
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: isDark ? '#fafaf9' : '#0F172A',
                marginBottom: 12,
              }}
            >
              Password Berhasil Diubah!
            </h2>
            <p style={{ color: isDark ? '#a8a29e' : '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Kamu sekarang bisa login dengan password baru.
            </p>
            <p style={{ color: isDark ? '#78716c' : '#94A3B8', fontSize: 13, marginBottom: 32 }}>
              Mengalihkan ke halaman login dalam {countdown}...
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 14,
                border: 'none',
                background: isDark ? '#22c55e' : '#16a34a',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: isDark ? '0 4px 14px rgba(34,197,94,0.25)' : '0 4px 14px rgba(22,163,74,0.25)',
              }}
            >
              Login Sekarang
            </button>
          </div>
        ) : (
          // ── FORM STATE ──
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                    : 'linear-gradient(135deg, #0D9488, #0f766e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  margin: '0 auto 16px',
                  boxShadow: isDark
                    ? '0 8px 24px rgba(245, 158, 11, 0.2)'
                    : '0 8px 24px rgba(13, 148, 136, 0.2)',
                }}
              >
                <Coffee style={{ width: 28, height: 28, color: '#ffffff' }} />
              </div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: isDark ? '#fafaf9' : '#0F172A',
                  marginBottom: 8,
                }}
              >
                Buat Password Baru
              </h1>
              <p style={{ color: isDark ? '#a8a29e' : '#475569', fontSize: 14, lineHeight: 1.5 }}>
                Masukkan password baru untuk akun SmartPOS kamu.
              </p>
            </div>

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
                <span>
                  {error}
                  {error.includes('kedaluwarsa') && (
                    <span style={{ display: 'block', marginTop: 4 }}>
                      <a href="/forgot-password" style={{ color: '#b91c1c', textDecoration: 'underline' }}>
                        Ke halaman Lupa Password
                      </a>
                    </span>
                  )}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                  Password Baru
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
                    placeholder="Minimal 8 karakter"
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
                      e.target.style.borderColor = isDark ? '#F59E0B' : '#0D9488';
                      e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(13,148,136,0.1)';
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
                {/* Strength Indicator */}
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      height: 4,
                      flex: 1,
                      backgroundColor: strength.color,
                      borderRadius: 2,
                      transition: 'background-color 0.3s'
                    }}
                  />
                  {strength.label && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: strength.color }}>
                      {strength.label}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: isDark ? '#d6d3d1' : '#475569',
                    marginBottom: 6,
                  }}
                >
                  Konfirmasi Password
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
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Ulangi password baru"
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
                      e.target.style.borderColor = isDark ? '#F59E0B' : '#0D9488';
                      e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(13,148,136,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDark ? '#292524' : '#E2E8F0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
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
                    {showConfirm ? (
                      <EyeOff style={{ width: 18, height: 18 }} />
                    ) : (
                      <Eye style={{ width: 18, height: 18 }} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || password.length < 8 || password !== confirmPassword}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: 14,
                  border: 'none',
                  background: (isLoading || password.length < 8 || password !== confirmPassword)
                    ? (isDark ? '#44403c' : '#d6d3d1')
                    : (isDark ? '#F59E0B' : '#0D9488'),
                  color: isDark ? '#1c1917' : '#ffffff',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: (isLoading || password.length < 8 || password !== confirmPassword) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: (isLoading || password.length < 8 || password !== confirmPassword) ? 'none' : (isDark ? '0 4px 14px rgba(245,158,11,0.25)' : '0 4px 14px rgba(13,148,136,0.25)'),
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 style={{ width: 20, height: 20, animation: 'spin 0.8s linear infinite' }} />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Password Baru'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
