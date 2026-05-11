import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
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
    <div className={`mb-4 flex items-center gap-2 rounded-2xl border px-4 py-2 ${containerClasses}`}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
      <span className="flex-1 text-sm">
        Email belum diverifikasi.{' '}
        <button
          onClick={() => navigate('/verify-email')}
          className="font-semibold underline hover:no-underline"
        >
          Verifikasi sekarang &rarr;
        </button>
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className={isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}
        aria-label="Dismiss verification banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
