
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useToast } from '../../../hooks/useToast';
import SettingsCard from '../components/SettingsCard';
import { Moon, Sun, Monitor, Hash, Globe, Check } from 'lucide-react';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

export default function AppearanceSection() {
  return (
    <ErrorBoundary>
      <_AppearanceSection />
    </ErrorBoundary>
  );
}

function _AppearanceSection() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { showToast, ToastComponent } = useToast();
  const isDark = effectiveTheme === 'dark';

  const handleUpdate = async (data: any) => {
    try {
      await updateSettings(data);
      showToast('Pengaturan tampilan diperbarui', 'success');
    } catch (err) {
      showToast('Gagal memperbarui pengaturan', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tampilan</h1>
        <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Kustomisasi antarmuka dan format data aplikasi.</p>
      </div>

      {/* CARD 1: Tema Tampilan */}
      <SettingsCard title="Tema Tampilan" icon={Moon}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          {[
            { id: 'light', label: 'Terang', icon: <Sun size={20} /> },
            { id: 'dark', label: 'Gelap', icon: <Moon size={20} /> },
            { id: 'system', label: 'Sistem', icon: <Monitor size={20} /> }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setTheme(mode.id as any)}
              className={`
                relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200
                ${theme === mode.id
                  ? (isDark ? 'border-amber-500 bg-amber-500/10' : 'border-teal-500 bg-teal-50')
                  : (isDark ? 'border-stone-800 bg-stone-900/50 hover:border-stone-700' : 'border-gray-200 bg-white hover:border-gray-300')
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${theme === mode.id
                  ? (isDark ? 'text-amber-500' : 'text-teal-600')
                  : (isDark ? 'text-stone-500' : 'text-gray-400')
                }
              `}>
                {mode.icon}
              </div>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{mode.label}</span>
              
              {theme === mode.id && (
                <div className={`absolute top-2 right-2 ${isDark ? 'text-amber-500' : 'text-teal-600'}`}>
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* CARD 2: Format Data */}
      <SettingsCard title="Format Data" icon={Hash}>
        <div className="space-y-6 mt-2">
          {/* Currency Format */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
                Format Mata Uang
              </label>
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isDark ? 'bg-amber-500/10 text-amber-500/50' : 'bg-gray-100 text-gray-400'}`}>
                Coming Soon
              </span>
            </div>
            <div className="flex flex-wrap gap-4 opacity-50 cursor-not-allowed">
              {[
                { id: 'Rp', label: 'Rp 15.000' },
                { id: 'IDR', label: 'IDR 15,000' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  disabled
                  className={`
                    flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all
                    ${settings?.currency_format === fmt.id
                      ? (isDark ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-teal-500 bg-teal-50 text-teal-700')
                      : (isDark ? 'border-stone-800 bg-stone-900/50 text-stone-400' : 'border-gray-200 bg-white text-gray-600')
                    }
                  `}
                >
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${settings?.currency_format === fmt.id
                      ? (isDark ? 'border-amber-500' : 'border-teal-500')
                      : (isDark ? 'border-stone-700' : 'border-gray-300')
                    }
                  `}>
                    {settings?.currency_format === fmt.id && (
                      <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-amber-500' : 'bg-teal-500'}`} />
                    )}
                  </div>
                  <span className="text-sm font-bold">{fmt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Format */}
          <div>
            <label className={`text-xs font-black uppercase tracking-wider mb-3 block ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
              Format Tanggal
            </label>
            <div className="flex flex-wrap gap-4">
              {[
                { id: 'DD/MM/YYYY', label: '15/05/2026' },
                { id: 'MM/DD/YYYY', label: '05/15/2026' },
                { id: 'YYYY-MM-DD', label: '2026-05-15' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => handleUpdate({ date_format: fmt.id })}
                  className={`
                    flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all
                    ${settings?.date_format === fmt.id
                      ? (isDark ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-teal-500 bg-teal-50 text-teal-700')
                      : (isDark ? 'border-stone-800 bg-stone-900/50 text-stone-400' : 'border-gray-200 bg-white text-gray-600')
                    }
                  `}
                >
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${settings?.date_format === fmt.id
                      ? (isDark ? 'border-amber-500' : 'border-teal-500')
                      : (isDark ? 'border-stone-700' : 'border-gray-300')
                    }
                  `}>
                    {settings?.date_format === fmt.id && (
                      <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-amber-500' : 'bg-teal-500'}`} />
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold">{fmt.id}</span>
                    <span className="text-[10px] opacity-60">{fmt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* CARD 3: Bahasa */}
      <SettingsCard title="Bahasa" icon={Globe}>
        <div className="flex flex-wrap gap-4 mt-2">
          {[
            { id: 'id', label: 'Bahasa Indonesia', comingSoon: false },
            { id: 'en', label: 'English', comingSoon: true }
          ].map((lang) => (
            <button
              key={lang.id}
              disabled={lang.comingSoon}
              onClick={() => handleUpdate({ language: lang.id })}
              className={`
                relative flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all
                ${settings?.language === lang.id
                  ? (isDark ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-teal-500 bg-teal-50 text-teal-700')
                  : (isDark ? 'border-stone-800 bg-stone-900/50 text-stone-400' : 'border-gray-200 bg-white text-gray-600')
                }
                ${lang.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${settings?.language === lang.id
                  ? (isDark ? 'border-amber-500' : 'border-teal-500')
                  : (isDark ? 'border-stone-700' : 'border-gray-300')
                }
              `}>
                {settings?.language === lang.id && (
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-amber-500' : 'bg-teal-500'}`} />
                )}
              </div>
              <span className="text-sm font-bold">{lang.label}</span>
              {lang.comingSoon && (
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isDark ? 'bg-stone-800 text-stone-500' : 'bg-gray-100 text-gray-400'}`}>
                  Coming Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </SettingsCard>
      {ToastComponent}
    </div>
  );
}
