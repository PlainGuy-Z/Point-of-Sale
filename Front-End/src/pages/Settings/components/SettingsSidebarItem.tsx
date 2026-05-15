import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { ChevronRight } from 'lucide-react';
import type { SettingsNavItem } from '../types';

interface SettingsSidebarItemProps {
  item: SettingsNavItem;
}

export default function SettingsSidebarItem({ item }: SettingsSidebarItemProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();

  const isActive = location.pathname === item.path || (item.path !== '/settings' && location.pathname.startsWith(item.path + '/'));
  const Icon = item.icon;

  return (
    <NavLink to={item.path} end={item.path === '/settings'}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-xs transition-all ${
          isActive
            ? isDark
              ? 'bg-amber-500/10'
              : 'bg-teal-50'
            : isDark
            ? 'hover:bg-stone-900'
            : 'hover:bg-gray-50'
        }`}
      >
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isActive ? (isDark ? 'bg-amber-500/20' : 'bg-teal-50') : isDark ? 'bg-stone-900' : 'bg-gray-50'
          }`}
        >
          <Icon size={16} className={isActive ? (isDark ? 'text-amber-500' : 'text-teal-500') : isDark ? 'text-stone-400' : 'text-gray-400'} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-bold flex items-center gap-2 ${
              isActive ? (isDark ? 'text-amber-500' : 'text-teal-600') : isDark ? 'text-stone-300' : 'text-gray-600'
            }`}
          >
            {item.label}
            {item.requiresSetup && (
              <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
            )}
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                {item.badge}
              </span>
            )}
          </p>
          <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
            {item.description}
          </p>
        </div>

        {/* Chevron (mobile only) */}
        <ChevronRight size={14} className={`lg:hidden ${isDark ? 'text-stone-600' : 'text-gray-400'}`} />
      </div>
    </NavLink>
  );
}
