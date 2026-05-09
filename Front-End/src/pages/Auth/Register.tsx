import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Coffee, Store, Link as LinkIcon, User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

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

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [status, user, navigate]);

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
      // AuthContext will update status -> useEffect will redirect
    } catch (err: any) {
      setError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 44px',
    borderRadius: 12,
    border: `1px solid ${isDark ? '#292524' : '#d6d3d1'}`,
    backgroundColor: isDark ? '#0c0a09' : '#fafaf9',
    color: isDark ? '#fafaf9' : '#0c0a09',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: isDark ? '#d6d3d1' : '#44403c',
    marginBottom: 6,
  };

  const iconStyle = {
    position: 'absolute' as const,
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 18,
    height: 18,
    color: isDark ? '#78716c' : '#a8a29e',
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
          : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #f9fafb 100%)',
        transition: 'background 0.3s',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 800,
          borderRadius: 24,
          padding: '40px',
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          border: `1px solid ${isDark ? '#292524' : '#e5e7eb'}`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0,0,0,0.5)'
            : '0 25px 50px -12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Coffee style={{ width: 28, height: 28, color: '#ffffff' }} />
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: isDark ? '#fafaf9' : '#0c0a09',
              marginBottom: 4,
            }}
          >
            Daftarkan Toko Anda
          </h1>
          <p style={{ color: isDark ? '#a8a29e' : '#78716c', fontSize: 14 }}>
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
              color: '#ef4444',
              fontSize: 14,
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
              <h3 style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#f59e0b' : '#d97706', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    placeholder="Contoh: Kopi Kenangan"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#d6d3d1'; e.target.style.boxShadow = 'none'; }}
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
                    onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#d6d3d1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {shopSlug && (
                  <p style={{ marginTop: 6, fontSize: 12, color: isDark ? '#a8a29e' : '#78716c' }}>
                    Preview: <span style={{ color: isDark ? '#f59e0b' : '#d97706' }}>{shopSlug}</span>.coffeepos.app
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Owner */}
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#f59e0b' : '#d97706', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    placeholder="Nama Anda"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#d6d3d1'; e.target.style.boxShadow = 'none'; }}
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
                    onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#d6d3d1'; e.target.style.boxShadow = 'none'; }}
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
                    placeholder="Minimal 8 karakter"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#d6d3d1'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isDark ? '#78716c' : '#a8a29e' }}
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
                    placeholder="Ketik ulang password"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = isDark ? '#292524' : '#d6d3d1'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isDark ? '#78716c' : '#a8a29e' }}
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
            color: isDark ? '#a8a29e' : '#78716c',
          }}
        >
          Sudah punya akun?{' '}
          <Link
            to="/login"
            style={{
              color: '#f59e0b',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
