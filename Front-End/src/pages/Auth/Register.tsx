import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
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
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  setIsLoading(true);
  try {
    await register({ shopName, shopSlug, ownerName, email, password });
    // Redirect manual setelah register sukses
    navigate('/verify-email', { replace: true });
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

// Tambah ini — redirect kalau sudah login saat buka halaman register
useEffect(() => {
  if (status === 'authenticated' && user) {
    // Sudah login → ke dashboard, bukan ke verify
    if (user.role === 'cashier') {
      navigate('/pos', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }
}, [status, user, navigate]);

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 44px',
    borderRadius: 12,
    border: `1px solid ${isDark ? '#292524' : '#E2E8F0'}`,
    backgroundColor: isDark ? '#0c0a09' : '#ffffff',
    color: isDark ? '#fafaf9' : '#0F172A',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
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
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          border: `1px solid ${isDark ? '#292524' : '#E2E8F0'}`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0,0,0,0.5)'
            : '0 10px 40px -10px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-block', textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
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
              <Coffee style={{ width: 28, height: 28, color: '#ffffff' }} />
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
              Daftarkan Toko Anda
            </h1>
          </Link>
          <p style={{ color: isDark ? '#a8a29e' : '#475569', fontSize: 14, fontWeight: 500 }}>
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
              <h3 style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#0D9488' : '#0D9488', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em' }}>
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
                    onFocus={(e) => { e.target.style.borderColor = '#0D9488'; e.target.style.boxShadow = '0 0 0 4px rgba(13,148,136,0.1)'; }}
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
                    onFocus={(e) => { e.target.style.borderColor = '#0D9488'; e.target.style.boxShadow = '0 0 0 4px rgba(13,148,136,0.1)'; }}
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
              <h3 style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#0D9488' : '#0D9488', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em' }}>
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
                    onFocus={(e) => { e.target.style.borderColor = '#0D9488'; e.target.style.boxShadow = '0 0 0 4px rgba(13,148,136,0.1)'; }}
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
                    onFocus={(e) => { e.target.style.borderColor = '#0D9488'; e.target.style.boxShadow = '0 0 0 4px rgba(13,148,136,0.1)'; }}
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
                    onFocus={(e) => { e.target.style.borderColor = '#0D9488'; e.target.style.boxShadow = '0 0 0 4px rgba(13,148,136,0.1)'; }}
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
                    onFocus={(e) => { e.target.style.borderColor = '#0D9488'; e.target.style.boxShadow = '0 0 0 4px rgba(13,148,136,0.1)'; }}
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
              color: '#0D9488',
              fontWeight: 700,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
