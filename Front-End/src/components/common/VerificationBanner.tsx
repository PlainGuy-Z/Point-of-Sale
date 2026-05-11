import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Mail, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function VerificationBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('verifyBannerDismissed') === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('verifyBannerDismissed', 'true');
  };

  if (!user || user.is_verified || dismissed) {
    return null;
  }

  const containerClasses = isDark
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    : 'bg-amber-50 border-amber-200 text-amber-800';

  return (
    <div className={`mb-4 rounded-2xl border px-4 py-3 ${containerClasses}`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
        <div className="flex-1">
          <p className="font-semibold">Email Anda belum diverifikasi.</p>
          <p className={isDark ? 'text-amber-200 text-sm' : 'text-amber-700 text-sm'}>
            Verifikasi untuk keamanan akun Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/verify-email')}
          className="mr-2 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
        >
          <Mail className="w-3.5 h-3.5" />
          Verifikasi Sekarang
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className={isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}
          aria-label="Dismiss verification banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
