import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { Info, Image as ImageIcon } from 'lucide-react';
import { getApiBaseUrl } from '../../../services/apiBaseUrl';

export default function CashierProfileSection() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Profil Saya
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
          Informasi akun Anda (hanya bisa diubah oleh Owner)
        </p>
      </div>

      {/* Profile Display Card */}
      <div
        className={`rounded-2xl border mb-6 overflow-hidden ${
          isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-6">
          {/* Avatar + Name + Role Section */}
          <div className="flex items-start gap-4 mb-8">
            {/* Avatar Circle */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-2xl ${
                isDark ? 'bg-amber-500' : 'bg-teal-600'
              }`}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {/* Name + Email + Badge */}
            <div className="flex-1">
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.name || '-'}
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                {user?.email || '-'}
              </p>
              <div className="mt-3">
                <span
                  className={`inline-block text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                    isDark
                      ? 'bg-amber-500 text-black'
                      : 'bg-teal-600 text-white'
                  }`}
                >
                  Kasir
                </span>
              </div>
            </div>
          </div>

          {/* Info Grid (2x2) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Cell 1: NAMA */}
            <div
              className={`rounded-xl p-4 border ${
                isDark
                  ? 'bg-stone-950 border-stone-800'
                  : 'bg-[#F8FAFC] border-gray-200'
              }`}
            >
              <label className={`text-[10px] uppercase tracking-widest font-bold ${
                isDark ? 'text-stone-500' : 'text-gray-400'
              }`}>
                NAMA
              </label>
              <p className={`font-bold text-sm mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.name || '-'}
              </p>
            </div>

            {/* Cell 2: EMAIL */}
            <div
              className={`rounded-xl p-4 border ${
                isDark
                  ? 'bg-stone-950 border-stone-800'
                  : 'bg-[#F8FAFC] border-gray-200'
              }`}
            >
              <label className={`text-[10px] uppercase tracking-widest font-bold ${
                isDark ? 'text-stone-500' : 'text-gray-400'
              }`}>
                EMAIL
              </label>
              <p className={`font-bold text-sm mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.email || '-'}
              </p>
            </div>

            {/* Cell 3: ROLE */}
            <div
              className={`rounded-xl p-4 border ${
                isDark
                  ? 'bg-stone-950 border-stone-800'
                  : 'bg-[#F8FAFC] border-gray-200'
              }`}
            >
              <label className={`text-[10px] uppercase tracking-widest font-bold ${
                isDark ? 'text-stone-500' : 'text-gray-400'
              }`}>
                ROLE
              </label>
              <p className={`font-bold text-sm mt-2 ${isDark ? 'text-amber-400' : 'text-teal-600'}`}>
                Kasir
              </p>
            </div>

            {/* Cell 4: TOKO */}
            <div
              className={`rounded-xl p-4 border ${
                isDark
                  ? 'bg-stone-950 border-stone-800'
                  : 'bg-[#F8FAFC] border-gray-200'
              }`}
            >
              <label className={`text-[10px] uppercase tracking-widest font-bold ${
                isDark ? 'text-stone-500' : 'text-gray-400'
              }`}>
                TOKO
              </label>
              <p className={`font-bold text-sm mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.shop?.name || settings?.shop_name || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Toko Card */}
      <div
        className={`rounded-2xl border mb-6 overflow-hidden ${
          isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={20} className={isDark ? 'text-amber-500' : 'text-teal-600'} />
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Logo Toko
            </h3>
          </div>
          <div className="flex items-center justify-center">
            <div className={`w-32 h-32 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all ${
              isDark ? 'border-stone-800 bg-stone-950' : 'border-gray-100 bg-gray-50'
            }`}>
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url.startsWith('http') ? settings.logo_url : `${getApiBaseUrl()}${settings.logo_url}`} 
                  alt="Logo Toko" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <ImageIcon size={48} className={isDark ? 'text-stone-700' : 'text-gray-300'} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div
        className={`rounded-xl p-4 border flex items-start gap-3 ${
          isDark
            ? 'bg-blue-950/20 border-blue-800/30'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <Info
          size={16}
          className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}
        />
        <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          Untuk mengubah nama atau email, hubungi Owner toko Anda.
        </p>
      </div>
    </div>
  );
}
