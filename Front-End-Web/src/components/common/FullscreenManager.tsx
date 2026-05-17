import React, { useEffect, useState } from 'react';
import { Maximize } from 'lucide-react';

const FullscreenManager: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Check if it's mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    if (!isMobile) return;

    // Check if already in fullscreen
    if (document.fullscreenElement) return;

    // Show overlay always on mobile to ensure a clean user gesture for fullscreen
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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-stone-950 p-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Maximize className="text-teal-500 w-10 h-10" />
      </div>
      <h2 className="text-white text-2xl font-black mb-3 tracking-tight">Mode Kiosk Aktif</h2>
      <p className="text-stone-400 text-sm mb-10 max-w-xs leading-relaxed">
        Klik tombol di bawah untuk mengaktifkan mode layar penuh agar antarmuka kasir lebih maksimal.
      </p>
      
      <button
        onClick={handleEnter}
        className="w-full max-w-xs py-5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-teal-500/20 transition-all active:scale-95 hover:opacity-90"
      >
        Masuk ke Aplikasi
      </button>
      
      <div className="mt-12 flex flex-col items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-stone-800" />
        <p className="text-[9px] text-stone-600 font-bold uppercase tracking-[0.3em]">
          SmartPOS Pro System
        </p>
      </div>
    </div>
  );
};

export default FullscreenManager;
