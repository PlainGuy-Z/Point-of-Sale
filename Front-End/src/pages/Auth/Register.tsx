import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authApi } from '../../services/authApi';
import { Coffee, Store, Link as LinkIcon, User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function Register() {
  const { register, status, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [licenseToken, setLicenseToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [tokenMessage, setTokenMessage] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkToken = async () => {
    if (!licenseToken.trim()) return;
    setTokenStatus('checking');
    try {
      const res = await authApi.verifyToken(licenseToken);
      if (res.valid) {
        setTokenStatus('valid');
        setTokenMessage('Token valid dan tersedia.');
      } else {
        setTokenStatus('invalid');
        setTokenMessage(res.message);
      }
    } catch (err: any) {
      setTokenStatus('invalid');
      setTokenMessage(err.message || 'Token tidak valid.');
    }
  };

  const generateSlug = (name: string) =>
    name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .slice(0, 50);

  useEffect(() => {
    if (!slugEdited && shopName) {
      setShopSlug(generateSlug(shopName));
    }
  }, [shopName, slugEdited]);

  // Redirect check handled inside the component body for better UX
  // We'll show a message instead of a silent redirect if they are already logged in


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

  if (password !== confirmPassword) {
    setError('Password dan Konfirmasi Password tidak cocok.');
    return;
  }

  if (!/^[a-z0-9-]+$/.test(shopSlug)) {
    setError('Slug toko hanya boleh berisi huruf kecil, angka, dan strip (-).');
    return;
  }

  if (!licenseToken.trim()) {
    setError('License Token wajib diisi.');
    return;
  }

  if (tokenStatus !== 'valid') {
    setError('Silakan verifikasi License Token Anda terlebih dahulu.');
    return;
  }

  setIsLoading(true);
  try {
    await register({ shopName, shopSlug, ownerName, email, password, licenseToken });
    // Redirect manual setelah register sukses
    navigate('/dashboard', { replace: true });
  } catch (err: any) {
    if (err.details?.fieldErrors) {
      const firstField = Object.keys(err.details.fieldErrors)[0];
      if (firstField) {
        setError(`${firstField}: ${err.details.fieldErrors[firstField][0]}`);
        setIsLoading(false);
        return;
      }
    }
    setError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
  } finally {
    setIsLoading(false);
  }
};

// Removed redundant redirect useEffect


  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 44px',
    borderRadius: 12,
    border: `1px solid ${isDark ? '#2e2e2e' : '#E2E8F0'}`,
    backgroundColor: isDark ? '#222222' : '#ffffff',
    color: isDark ? '#ffffff' : '#0F172A',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: isDark ? '#d6d3d1' : '#475569',
    marginBottom: 6,
  };

  const iconStyle = {
    position: 'absolute' as const,
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 18,
    height: 18,
    color: isDark ? '#78716c' : '#94A3B8',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: isDark
          ? '#111111'
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
          backgroundColor: isDark ? 'rgba(28, 25, 23, 0.5)' : '#ffffff',
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
          maxWidth: 800,
          borderRadius: 24,
          padding: '40px',
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          border: `1px solid ${isDark ? '#2e2e2e' : '#E2E8F0'}`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0,0,0,0.5)'
            : '0 10px 40px -10px rgba(0,0,0,0.08)',
        }}
      >
        {status === 'authenticated' && user ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <User style={{ width: 32, height: 32, color: '#f59e0b' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: isDark ? '#ffffff' : '#0F172A', marginBottom: 12 }}>
              Sesi Aktif Terdeteksi
            </h2>
            <p style={{ color: isDark ? '#888888' : '#475569', fontSize: 15, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 32px' }}>
              Anda sedang masuk sebagai <strong style={{ color: '#f59e0b' }}>{user.name}</strong> ({user.role}). 
              Silakan keluar terlebih dahulu jika ingin mendaftarkan toko baru.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                onClick={() => navigate(user.role === 'owner' ? '/dashboard' : '/pos')}
                style={{ padding: '12px 24px', borderRadius: 12, border: `1px solid ${isDark ? '#2e2e2e' : '#E2E8F0'}`, background: isDark ? '#222222' : '#ffffff', color: isDark ? '#ffffff' : '#0F172A', fontWeight: 700, cursor: 'pointer' }}
              >
                Kembali ke App
              </button>
              <button 
                onClick={async () => { await useAuth().logout(); }}
                style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#ef4444', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                Keluar Sesi
              </button>
            </div>
          </div>
        ) : (
          <>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-block', textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: isDark 
                  ? 'linear-gradient(135deg, #F59E0B, #D97706)' 
                  : 'linear-gradient(135deg, #0D9488, #0f766e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: isDark 
                  ? '0 8px 24px rgba(245, 158, 11, 0.2)' 
                  : '0 8px 24px rgba(13, 148, 136, 0.2)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Coffee style={{ width: 28, height: 28, color: '#ffffff' }} />
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: isDark ? '#ffffff' : '#0F172A',
                marginBottom: 4,
                letterSpacing: '-0.02em'
              }}
            >
              Daftarkan Toko Anda
            </h1>
          </Link>
          <p style={{ color: isDark ? '#888888' : '#475569', fontSize: 14, fontWeight: 500 }}>
            Mulai kelola bisnis lebih efisien dengan CoffeePos
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
              marginBottom: 24,
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
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 32 }}>
            {/* Left Column: Toko */}
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#F59E0B' : '#0D9488', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em' }}>
                <Store style={{ width: 20, height: 20 }} />
                Informasi Toko
              </h3>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Nama Toko</label>
                <div style={{ position: 'relative' }}>
                  <Store style={iconStyle} />
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    minLength={2}
                    placeholder="Contoh: Kopi Kenangan"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = isDark ? '#F59E0B' : '#14B8A6'; e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(20,184,166,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Slug Toko (URL)</label>
                <div style={{ position: 'relative' }}>
                  <LinkIcon style={iconStyle} />
                  <input
                    type="text"
                    value={shopSlug}
                    onChange={(e) => {
                      setShopSlug(e.target.value);
                      setSlugEdited(true);
                    }}
                    required
                    placeholder="kopi-kenangan"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = isDark ? '#F59E0B' : '#14B8A6'; e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(20,184,166,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {shopSlug && (
                  <p style={{ marginTop: 6, fontSize: 12, color: isDark ? '#a8a29e' : '#475569', fontWeight: 500 }}>
                    Preview: <span style={{ color: '#0D9488', fontWeight: 700 }}>{shopSlug}</span>.coffeepos.app
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Owner */}
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#F59E0B' : '#0D9488', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em' }}>
                <User style={{ width: 20, height: 20 }} />
                Akun Owner
              </h3>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Nama Lengkap</label>
                <div style={{ position: 'relative' }}>
                  <User style={iconStyle} />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    minLength={2}
                    placeholder="Nama Anda"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = isDark ? '#F59E0B' : '#14B8A6'; e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(20,184,166,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={iconStyle} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@toko.com"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = isDark ? '#F59E0B' : '#14B8A6'; e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(20,184,166,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={iconStyle} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = isDark ? '#F59E0B' : '#14B8A6'; e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(20,184,166,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isDark ? '#78716c' : '#94A3B8' }}
                  >
                    {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Konfirmasi Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={iconStyle} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Ketik ulang password"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = isDark ? '#F59E0B' : '#14B8A6'; e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(20,184,166,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isDark ? '#78716c' : '#94A3B8' }}
                  >
                    {showConfirmPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>License Token</label>
                <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Lock style={iconStyle} />
                    <input
                      type="text"
                      value={licenseToken}
                      onChange={(e) => {
                        setLicenseToken(e.target.value);
                        setTokenStatus('idle');
                        setTokenMessage('');
                      }}
                      required
                      placeholder="Masukkan Token Anda"
                      style={{
                        ...inputStyle,
                        borderColor: tokenStatus === 'valid' ? '#22c55e' : (tokenStatus === 'invalid' ? '#ef4444' : (isDark ? '#292524' : '#E2E8F0')),
                      }}
                      onFocus={(e) => { e.target.style.borderColor = isDark ? '#F59E0B' : '#14B8A6'; e.target.style.boxShadow = isDark ? '0 0 0 4px rgba(245,158,11,0.1)' : '0 0 0 4px rgba(20,184,166,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = tokenStatus === 'valid' ? '#22c55e' : (tokenStatus === 'invalid' ? '#ef4444' : (isDark ? '#292524' : '#E2E8F0')); e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={checkToken}
                    disabled={tokenStatus === 'checking' || !licenseToken.trim()}
                    style={{
                      padding: '0 16px',
                      background: isDark ? '#F59E0B' : '#14B8A6',
                      color: isDark ? '#1c1917' : '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: tokenStatus === 'checking' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isDark ? '0 4px 12px rgba(245,158,11,0.2)' : '0 4px 12px rgba(13,148,136,0.2)',
                    }}
                  >
                    {tokenStatus === 'checking' ? '...' : 'Cek'}
                  </button>
                </div>
                {tokenMessage && (
                  <p style={{ marginTop: 6, fontSize: 12, color: tokenStatus === 'valid' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {tokenMessage}
                  </p>
                )}
              </div>

            </div>
          </div>

          <div style={{ marginTop: 16 }}>
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
                  : (isDark ? '#F59E0B' : '#14B8A6'),
                color: isDark ? '#1c1917' : '#ffffff',
                fontSize: 16,
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: isLoading ? 'none' : (isDark ? '0 4px 14px rgba(245,158,11,0.25)' : '0 4px 14px rgba(20,184,166,0.25)'),
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.background = isDark ? '#D97706' : '#0D9488';
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.background = isDark ? '#F59E0B' : '#14B8A6';
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: 20, height: 20, animation: 'spin 0.8s linear infinite' }} />
                  Memproses...
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </div>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 14,
            color: isDark ? '#a8a29e' : '#475569',
            fontWeight: 500
          }}
        >
          Sudah punya akun?{' '}
          <Link
            to="/login"
            style={{
              color: isDark ? '#F59E0B' : '#0D9488',
              fontWeight: 700,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Masuk
          </Link>
        </p>
          </>
        )}
      </div>
    </div>
  );
}
