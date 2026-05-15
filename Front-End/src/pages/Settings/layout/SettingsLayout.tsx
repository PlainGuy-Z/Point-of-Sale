import React, { useEffect } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { type LucideIcon, Store, User, Printer, CreditCard, Palette, Bell, Database, Users, ChevronLeft } from 'lucide-react';
import SettingsSidebarItem from '../components/SettingsSidebarItem';

import type { SettingsNavItem } from '../types';

const settingsNavItems: SettingsNavItem[] = [
  {
    path: '/settings',
    label: 'Profil Toko',
    description: 'Nama, alamat, logo toko',
    icon: Store,
  },
  {
    path: '/settings/cashiers',
    label: 'Manajemen Kasir',
    description: 'Kelola akun kasir',
    icon: Users,
  },
  {
    path: '/settings/account',
    label: 'Akun & Keamanan',
    description: 'Password, PIN, profil',
    icon: User,
  },
  {
    path: '/settings/printer',
    label: 'Printer & Struk',
    description: 'RawBT, template, ukuran kertas',
    icon: Printer,
    requiresSetup: true,
  },
  {
    path: '/settings/payment',
    label: 'Pembayaran & Pajak',
    description: 'Tax rate, metode bayar',
    icon: CreditCard,
  },
  {
    path: '/settings/appearance',
    label: 'Tampilan',
    description: 'Dark mode, bahasa, format',
    icon: Palette,
  },
  {
    path: '/settings/notifications',
    label: 'Notifikasi',
    description: 'Alert stok, laporan harian',
    icon: Bell,
  },
  {
    path: '/settings/data',
    label: 'Data & Backup',
    description: 'Export, backup, reset',
    icon: Database,
  }
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  const isIndex = location.pathname === '/settings';

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
          <h2 className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Pengaturan
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
            Kelola toko dan akun
          </p>
        </div>

        {/* Nav Items */}
        <nav className="p-2 space-y-0.5">
          {settingsNavItems.map((item) => (
            <SettingsSidebarItem key={item.path} item={item} />
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div
        className={`
          flex-1 overflow-y-auto bg-white dark:bg-[#0c0a09]
          ${isIndex ? 'hidden lg:block' : 'block'}
        `}
      >
        {/* Mobile Header with Back Button */}
        <div className={`lg:hidden p-4 border-b flex items-center gap-3 sticky top-0 z-10 ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-gray-200'}`}>
          <button 
            onClick={() => navigate('/settings')}
            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Pengaturan</span>
        </div>
        
        {children}
      </div>
    </div>
  );
}
