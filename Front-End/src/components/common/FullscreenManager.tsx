import React, { useEffect, useState } from 'react';
import { Maximize } from 'lucide-react';

const FullscreenManager: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Check if it's mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // iOS Safari doesn't support the Fullscreen API on the document element.
    // They must use "Add to Home Screen".
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // If it's already in a PWA standalone mode, we don't need this
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone || 
                         document.referrer.includes('android-app://');

    if (!isMobile || isStandalone) return;

    // Show overlay to force a user gesture
    setShowOverlay(true);
  }, []);

  const handleEnter = () => {
    const docEl = document.documentElement as any;
    const requestMethod = docEl.requestFullscreen || 
                          docEl.webkitRequestFullscreen || 
                          docEl.mozRequestFullScreen || 
                          docEl.msRequestFullscreen;

    if (requestMethod) {
      requestMethod.call(docEl).catch((err: any) => {
        console.warn(`Fullscreen request failed: ${err.message}`);
      });
    }
    
    setShowOverlay(false);
  };

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-stone-950 p-6 text-center">
      <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Maximize className="text-amber-500 w-10 h-10" />
      </div>
      <h2 className="text-white text-xl font-bold mb-2">Mode Kiosk Aktif</h2>
      <p className="text-stone-400 text-sm mb-8 max-w-xs">
        Klik tombol di bawah untuk masuk ke mode layar penuh agar pengalaman transaksi lebih maksimal.
      </p>
      <button
        onClick={handleEnter}
        className="w-full max-w-xs py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-95"
      >
        Masuk ke Aplikasi
      </button>
      
      <p className="mt-8 text-[10px] text-stone-600 uppercase tracking-tighter">
        Disarankan menggunakan fitur "Tambah ke Layar Utama"
      </p>
    </div>
  );
};

export default FullscreenManager;
