import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { authApi } from '../../services/authApi';
import { Coffee, Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import icon from '../../assets/icon.png';

export default function ForgotPassword() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
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
        {isSubmitted ? (
          // ── SUCCESS STATE ──
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <CheckCircle style={{ width: 48, height: 48, color: '#f59e0b' }} />
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: isDark ? '#fafaf9' : '#0F172A',
                marginBottom: 12,
              }}
            >
              Email Terkirim!
            </h2>
            <p style={{ color: isDark ? '#a8a29e' : '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Jika email <strong>{email}</strong> terdaftar di SmartPOS, kamu akan menerima link reset password dalam beberapa menit.
            </p>
            <div
              style={{
                background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
                border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.2)' : '#fde68a'}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 32,
                color: isDark ? '#fcd34d' : '#b45309',
                fontSize: 13,
                textAlign: 'left',
                lineHeight: 1.5,
              }}
            >
              Link berlaku selama 1 jam. Cek folder spam jika tidak menemukan email di inbox.
            </div>
            <Link
              to="/login"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 24px',
                borderRadius: 14,
                background: isDark ? '#F59E0B' : '#0D9488',
                color: isDark ? '#1c1917' : '#ffffff',
                fontSize: 15,
                fontWeight: 800,
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: isDark ? '0 4px 14px rgba(245,158,11,0.25)' : '0 4px 14px rgba(13,148,136,0.25)',
              }}
            >
              Kembali ke Login
            </Link>
            <p style={{ marginTop: 24, fontSize: 13, color: isDark ? '#78716c' : '#94A3B8' }}>
              Tidak menerima email?{' '}
              <button
                onClick={() => setIsSubmitted(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#f59e0b',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Coba lagi
              </button>
            </p>
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
                <img src={icon} alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              </div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: isDark ? '#fafaf9' : '#0F172A',
                  marginBottom: 8,
                }}
              >
                Lupa Password?
              </h1>
              <p style={{ color: isDark ? '#a8a29e' : '#475569', fontSize: 14, lineHeight: 1.5 }}>
                Masukkan email yang terdaftar. Kami akan kirimkan link untuk reset password.
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
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                  Email Terdaftar
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
                  marginBottom: 24,
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 style={{ width: 20, height: 20, animation: 'spin 0.8s linear infinite' }} />
                    Memproses...
                  </>
                ) : (
                  'Kirim Link Reset'
                )}
              </button>

              <Link
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  color: isDark ? '#a8a29e' : '#64748b',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#fafaf9' : '#0F172A'}
                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#a8a29e' : '#64748b'}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} /> Kembali ke Login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
