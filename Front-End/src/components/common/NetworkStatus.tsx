import { useState, useEffect } from 'react';
import { WifiOff, ServerCrash, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function NetworkStatus() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isServerDown, setIsServerDown] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // ── Internet Connection ──
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // ── Server Status (Fetch Interceptor) ──
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        // If it's an API request and returns 5xx, server might be down
        if (typeof args[0] === 'string' && args[0].includes('http://localhost:5000')) {
          if (!response.ok && response.status >= 500) {
            setIsServerDown(true);
            setDismissed(false);
          } else {
            setIsServerDown(false);
          }
        }
        return response;
      } catch (error) {
        if (typeof args[0] === 'string' && args[0].includes('http://localhost:5000')) {
          setIsServerDown(true);
          setDismissed(false);
        }
        throw error;
      }
    };

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.fetch = originalFetch; // Restore fetch
    };
  }, []);

  if ((!isOffline && !isServerDown) || dismissed) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm animate-in slide-in-from-top-10 fade-in duration-300">
      <div className={`flex items-start gap-3 p-4 rounded-2xl shadow-2xl border ${
        isOffline 
          ? isDark ? 'bg-amber-950/90 border-amber-800/50 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-900'
          : isDark ? 'bg-red-950/90 border-red-800/50 text-red-100' : 'bg-red-50 border-red-200 text-red-900'
      }`}>
        <div className={`mt-0.5 ${
          isOffline 
            ? isDark ? 'text-amber-500' : 'text-amber-600'
            : isDark ? 'text-red-500' : 'text-red-600'
        }`}>
          {isOffline ? <WifiOff size={24} /> : <ServerCrash size={24} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm">
            {isOffline ? 'Koneksi Terputus' : 'Server Tidak Merespon'}
          </h3>
          <p className="text-xs mt-1 opacity-90 leading-relaxed">
            {isOffline 
              ? 'Aplikasi sedang offline. Periksa koneksi internet Anda agar data dapat disinkronkan kembali.'
              : 'Gagal terhubung ke server. Pastikan server backend sedang berjalan atau coba lagi nanti.'}
          </p>
        </div>

        <button 
          onClick={() => setDismissed(true)}
          className={`p-1.5 rounded-lg transition-colors active:scale-90 ${
            isOffline
              ? isDark ? 'hover:bg-amber-900/50 text-amber-500' : 'hover:bg-amber-200/50 text-amber-700'
              : isDark ? 'hover:bg-red-900/50 text-red-500' : 'hover:bg-red-200/50 text-red-700'
          }`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
