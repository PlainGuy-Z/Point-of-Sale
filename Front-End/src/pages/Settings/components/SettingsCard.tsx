import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { LucideIcon } from 'lucide-react';

interface SettingsCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function SettingsCard({ title, description, icon: Icon, children, footer }: SettingsCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl border overflow-hidden mb-6 transition-all duration-300 ${
        isDark 
          ? 'bg-stone-900 border-stone-800' 
          : 'bg-white border-gray-200 shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/[0.03]'
      }`}
    >
      {/* Card header */}
      <div className={`px-5 py-4 border-b flex items-center gap-3 ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-amber-500/10' : 'bg-teal-50'
            }`}
          >
            <Icon size={18} className={isDark ? 'text-amber-500' : 'text-teal-500'} />
          </div>
        )}
        <div>
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          {description && (
            <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>{description}</p>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">{children}</div>

      {/* Card footer (optional, for buttons) */}
      {footer && (
        <div className={`px-5 py-3 border-t ${isDark ? 'border-stone-800 bg-stone-950/50' : 'border-gray-200 bg-gray-50'}`}>
          {footer}
        </div>
      )}
    </div>
  );
}
