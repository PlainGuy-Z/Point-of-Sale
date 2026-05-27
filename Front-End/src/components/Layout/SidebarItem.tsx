import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { NavItem } from '../../data/navigation';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarItemProps {
  item: NavItem;
  icon?: LucideIcon;
  isCollapsed?: boolean;
  badge?: number;
  onClick?: () => void;
  onNavigate?: () => void;
}

export default function SidebarItem({
  item,
  icon: Icon,
  isCollapsed = false,
  badge,
  onClick,
  onNavigate,
}: SidebarItemProps) {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isActive = location.pathname === item.path;

  const content = (
    <>
      {/* Icon */}
      <div
        className={`flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          isCollapsed ? 'w-6 h-6' : 'w-6 h-6'
        }`}
      >
        {Icon && (
          <Icon
            className={`w-[20px] h-[20px] transition-colors duration-200 ${
              isActive
                ? 'text-teal-700'
                : isDark
                  ? 'text-stone-500'
                  : 'text-[#64748B]'
            }`}
          />
        )}
      </div>

      {/* Label */}
      {!isCollapsed && (
        <span
          className={`text-[15px] font-bold truncate flex-1 min-w-0 text-left transition-colors duration-200 ${
            isActive
              ? isDark
                ? 'text-amber-200'
                : 'text-teal-700'
              : isDark
                ? 'text-stone-300'
                : 'text-[#334155]'
          }`}
        >
          {item.label}
        </span>
      )}

      {/* Badge */}
      {!isCollapsed && badge != null && badge > 0 && (
        <span className={`ml-auto flex min-h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
          isDark ? 'bg-amber-500 text-stone-900' : 'bg-teal-100 text-teal-700'
        }`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Active dot (only when no badge) */}
      {!isCollapsed && isActive && !(badge != null && badge > 0) && (
        <div className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${isDark ? 'bg-amber-500' : 'bg-teal-600'}`} aria-hidden="true" />
      )}
    </>
  );

  const baseClasses = `
    group relative flex items-center transition-all duration-200 rounded-xl
    ${isCollapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full px-3 py-3 gap-3'}
  `;

  const stateClasses = isActive
    ? isDark
      ? 'bg-amber-500/10 border-l-[3px] border-l-amber-500'
      : 'bg-teal-50 border-l-2 border-teal-600 font-semibold'
    : isDark
      ? `hover:bg-stone-900 border-l-[3px] border-l-transparent`
      : `hover:bg-[#F8FAFC] hover:text-[#0F172A] border-l-2 border-transparent`;

  // If onClick is provided, render as a button (for logout)
  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          if (onNavigate) onNavigate();
          onClick();
        }}
        title={isCollapsed ? item.label : undefined}
        className={`${baseClasses} ${stateClasses}`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={item.path}
      title={isCollapsed ? item.label : undefined}
      onClick={() => {
        if (onNavigate) onNavigate();
      }}
      className={`${baseClasses} ${stateClasses}`}
    >
      {content}

      {/* Collapsed mode: tooltip */}
      {isCollapsed && (
        <div
          className={`
            pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold
            whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999]
            ${isDark ? 'bg-stone-800 text-stone-200 shadow-lg shadow-black/30' : 'bg-stone-900 text-white shadow-lg'}
          `}
        >
          {item.label}
          {badge != null && badge > 0 && (
            <span className={`ml-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ${
              isDark ? 'bg-amber-500 text-stone-900' : 'bg-teal-100 text-teal-700'
            }`}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}