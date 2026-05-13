import { useEffect, useState } from 'react';
import { Menu, Coffee } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import VerificationBanner from '../common/VerificationBanner';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  const isDark = theme === 'dark';

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-stone-950' : 'bg-[#F8FAFC]'
    }`}>
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
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

      <main className={`relative flex-1 h-screen overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'}`}>
        <div className={`fixed inset-x-0 top-0 z-30 h-14 border-b lg:hidden ${isDark ? 'bg-[#111111] border-stone-800' : 'bg-white border-[#E2E8F0]'}`}>
          <div className="flex h-full items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors duration-200 ${isDark ? 'border-stone-800 bg-stone-950 text-stone-100 hover:bg-stone-900' : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]'}`}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm font-bold text-center">
              <Coffee className="h-5 w-5 text-amber-500" />
              <span className={isDark ? 'text-white' : 'text-[#0F172A]'}>SmartPOS</span>
            </div>

            <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black ${isDark ? 'border-stone-800 bg-stone-950 text-white' : 'border-[#E2E8F0] bg-white text-[#0F172A]'}`}>
              {user?.name?.[0] ?? 'U'}
            </div>
          </div>
        </div>

        <div className="pt-14 lg:pt-0 h-full overflow-hidden">
          <div className="p-4 lg:px-6 lg:py-5 h-full overflow-auto">
            <VerificationBanner />
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}