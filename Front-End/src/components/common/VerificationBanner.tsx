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
    : 'bg-[#F0FDFA] border-[#99F6E4] text-teal-800';

  return (
    <div className={`mb-4 flex items-center gap-3 rounded-2xl border px-4 py-2.5 ${containerClasses}`}>
      <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-amber-500' : 'text-teal-600'}`} />
      <span className="flex-1 text-sm font-medium">
        Email belum diverifikasi.{' '}
        <button
          onClick={() => navigate('/verify-email')}
          className={`ml-2 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
            isDark 
              ? 'text-amber-400 underline hover:no-underline' 
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/20 active:scale-95'
          }`}
        >
          Verifikasi sekarang &rarr;
        </button>
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className={isDark ? 'text-amber-400 hover:text-amber-300' : 'text-teal-600 hover:text-teal-700'}
        aria-label="Dismiss verification banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
