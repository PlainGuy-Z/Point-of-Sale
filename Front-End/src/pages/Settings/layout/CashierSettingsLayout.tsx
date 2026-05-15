import React, { useEffect } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { type LucideIcon, User, KeyRound, Printer, Palette, Bell, ChevronLeft, Coffee } from 'lucide-react';
import SettingsSidebarItem from '../components/SettingsSidebarItem';
import { getApiBaseUrl } from '../../../services/apiBaseUrl';

import type { SettingsNavItem } from '../types';

const cashierNavItems: SettingsNavItem[] = [
  {
    path: '/cashier-settings',
    label: 'Profil Saya',
    description: 'Informasi akun Anda',
    icon: User,
  },
  {
    path: '/cashier-settings/pin',
    label: 'PIN Kasir',
    description: 'Atur PIN keamanan',
    icon: KeyRound,
  },
  {
    path: '/cashier-settings/printer',
    label: 'Printer & Struk',
    description: 'Test print & cek koneksi',
    icon: Printer,
  },
  {
    path: '/cashier-settings/appearance',
    label: 'Tampilan',
    description: 'Dark mode, format',
    icon: Palette,
  },
  {
    path: '/cashier-settings/notifications',
    label: 'Notifikasi',
    description: 'Alert & pengingat',
    icon: Bell,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function CashierSettingsLayout({ children }: SettingsLayoutProps) {
  const { effectiveTheme } = useTheme();
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = effectiveTheme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  const isIndex = location.pathname === '/cashier-settings';

  return (
    <div className="flex h-full min-h-0">
      {/* Settings Nav Panel */}
      <div
        className={`
          flex-shrink-0 lg:w-60 lg:border-r overflow-y-auto
          ${!isIndex ? 'hidden lg:block' : 'w-full lg:w-60'}
          ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-gray-200'}
        `}
      >
        {/* Nav Header */}
        <div className={`p-4 border-b ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            {settings?.logo_url ? (
              <img 
                src={settings.logo_url.startsWith('http') ? settings.logo_url : `${getApiBaseUrl()}${settings.logo_url}`} 
                alt="Logo" 
                className="h-8 w-8 object-cover rounded-lg flex-shrink-0" 
              />
            ) : (
              <Coffee className={`h-6 w-6 ${isDark ? 'text-amber-500' : 'text-teal-600'} flex-shrink-0`} />
            )}
            <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
              {user?.shop?.name || settings?.shop_name || 'SmartPOS'}
            </span>
          </div>
          <h2 className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Pengaturan Akun
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
            Kelola profil dan preferensi Anda
          </p>
        </div>

        {/* Nav Items */}
        <nav className="p-2 space-y-0.5">
          {cashierNavItems.map((item) => (
            <SettingsSidebarItem key={item.path} item={item} />
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div
        className={`
          flex-1 overflow-y-auto ${isDark ? 'bg-[#0c0a09]' : 'bg-[#F8FAFC]'}
          ${isIndex ? 'hidden lg:block' : 'block'}
        `}
      >
        {/* Mobile Header with Back Button */}
        <div className={`lg:hidden p-4 border-b flex items-center gap-3 sticky top-0 z-10 ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-gray-200'}`}>
          <button 
            onClick={() => navigate('/cashier-settings')}
            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Pengaturan Akun</span>
        </div>
        
        {children}
      </div>
    </div>
  );
}
