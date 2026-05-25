import { useEffect, useState } from 'react';
import { Menu, Coffee } from 'lucide-react';
import logoIcon from '../../assets/icon.png';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getApiBaseUrl } from '../../services/apiBaseUrl';

export default function Layout() {
  const { theme, effectiveTheme } = useTheme();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [scaleStyle, setScaleStyle] = useState<React.CSSProperties | undefined>(undefined);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 1024;
      const landscape = w > h;

      if (mobile && landscape) {
        // Force virtual width to 1366px (standard laptop resolution)
        const TARGET_WIDTH = 1366; 
        const scaleFactor = w / TARGET_WIDTH;
        // Calculate virtual height so it perfectly fills the physical screen
        const virtualHeight = h / scaleFactor;
        
        setScaleStyle({
          width: `${TARGET_WIDTH}px`,
          height: `${virtualHeight}px`,
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'top left',
          position: 'fixed',
          top: 0,
          left: 0,
          overflow: 'hidden'
        });
      } else {
        setScaleStyle(undefined);
      }

      setIsMobileLandscape(mobile && landscape);

      if (w >= 1024 && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    
    handleResize(); // Init on mount

    // Use both resize/orientationchange and matchMedia for more reliable detection
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let mql: MediaQueryList | null = null
    try {
      if (typeof window !== 'undefined' && 'matchMedia' in window) {
        mql = window.matchMedia('(orientation: landscape)')
        const mmHandler = (_ev: MediaQueryListEvent) => handleResize()
        if (mql.addEventListener) mql.addEventListener('change', mmHandler)
        else if ((mql as any).addListener) (mql as any).addListener(mmHandler)
      }
    } catch (e) {
      // ignore
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (mql) {
        try {
          if (mql.removeEventListener) mql.removeEventListener('change', handleResize as any)
          else if ((mql as any).removeListener) (mql as any).removeListener(handleResize as any)
        } catch (e) {}
      }
    };
  }, [isMobileOpen]);

  const isDark = effectiveTheme === 'dark';

  return (
    <div 
      className={`relative ${isMobileLandscape ? 'h-full' : 'min-h-screen'} overflow-x-hidden transition-colors duration-300 ${
        effectiveTheme === 'dark' ? 'bg-stone-950' : 'bg-[#F8FAFC]'
      }`}
      style={scaleStyle}
    >
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        isMobileLandscape={isMobileLandscape}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        onNavigate={() => setIsMobileOpen(false)}
      />

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <main className={`relative flex-1 ${isMobileLandscape ? 'h-full' : 'h-screen'} overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'} ${isMobileLandscape ? (isCollapsed ? 'ml-[68px]' : 'ml-[240px]') : ''}`}>
        <div className={`fixed inset-x-0 top-0 z-30 h-14 border-b lg:hidden ${isMobileLandscape ? 'hidden' : ''} ${isDark ? 'bg-[#111111] border-stone-800' : 'bg-white border-[#E2E8F0]'}`}>
          <div className="flex h-full items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors duration-200 ${isDark ? 'border-stone-800 bg-stone-950 text-stone-100 hover:bg-stone-900' : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]'}`}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url.startsWith('http') ? settings.logo_url : `${getApiBaseUrl()}${settings.logo_url}`} 
                  alt="Logo" 
                  className="h-6 w-6 object-cover rounded-md" 
                />
              ) : (
                <img src={logoIcon} className="h-6 w-6 object-cover rounded-md" alt="Logo" />
              )}
              <span className={`text-sm font-extrabold tracking-tight truncate max-w-[150px] ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                {user?.shop?.name || 'SmartPOS'}
              </span>
            </div>
          </div>
        </div>

        <div className={`h-full overflow-hidden ${isMobileLandscape ? 'pt-0' : 'pt-14 lg:pt-0'}`}>
          <div className="p-4 lg:px-6 lg:py-5 h-full overflow-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}