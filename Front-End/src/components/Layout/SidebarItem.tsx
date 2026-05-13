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
          isCollapsed ? 'w-5 h-5' : 'w-5 h-5'
        }`}
      >
        {Icon && (
          <Icon
            className={`w-[18px] h-[18px] transition-colors duration-200 ${
              isActive
                ? 'text-amber-500'
                : isDark
                  ? 'text-stone-500'
                  : 'text-stone-400'
            }`}
          />
        )}
      </div>

      {/* Label */}
      {!isCollapsed && (
        <span
          className={`text-[13px] font-semibold truncate flex-1 min-w-0 text-left transition-colors duration-200 ${
            isActive
              ? isDark
                ? 'text-amber-200'
                : 'text-amber-900'
              : isDark
                ? 'text-stone-300'
                : 'text-stone-700'
          }`}
        >
          {item.label}
        </span>
      )}

      {/* Badge */}
      {!isCollapsed && badge != null && badge > 0 && (
        <span className="ml-auto flex min-h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-stone-900 leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Active dot (only when no badge) */}
      {!isCollapsed && isActive && !(badge != null && badge > 0) && (
        <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
      )}
    </>
  );

  const baseClasses = `
    group relative flex items-center transition-all duration-200 rounded-xl
    ${isCollapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full px-3 py-2 gap-2.5'}
  `;

  const stateClasses = isActive
    ? isDark
      ? 'bg-amber-500/10 border-l-[3px] border-l-amber-500'
      : 'bg-amber-500/8 border-l-[3px] border-l-amber-500'
    : isDark
      ? `hover:bg-stone-900 border-l-[3px] border-l-transparent`
      : `hover:bg-stone-100 border-l-[3px] border-l-transparent`;

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
            <span className="ml-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-stone-900 leading-none">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}