import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

interface SettingsInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
}

export default function SettingsInput({
  label,
  description,
  error,
  required,
  suffix,
  prefix,
  ...props
}: SettingsInputProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className={`text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && <span className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{description}</span>}
      </div>
      <div className="relative">
        {prefix && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
            {prefix}
          </div>
        )}
        <input
          {...props}
          className={`w-full py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${isDark ? 'focus:ring-amber-500/30' : 'focus:ring-teal-500/30'} ${
            error ? 'border-red-500' : isDark ? 'border-stone-700' : 'border-gray-300'
          } ${
            isDark
              ? 'bg-stone-800 text-white placeholder-stone-500'
              : 'bg-white text-gray-900 placeholder-gray-400'
          } ${prefix ? 'pl-8' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'} ${props.className || ''}`}
        />
        {suffix && (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
