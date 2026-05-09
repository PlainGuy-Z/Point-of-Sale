import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react'; 
import { Link, useLocation } from 'react-router-dom';
import type { MenuItem, SubMenuItem } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarCollapseProps {
  item: MenuItem;
  icon?: LucideIcon;
  isOpen: boolean;
  onToggle: () => void;
  getIcon: (iconName: string) => LucideIcon | null;
  isCollapsed?: boolean;
}

export default function SidebarCollapse({ 
  item, 
  icon: Icon, 
  isOpen, 
  onToggle,
  getIcon,
  isCollapsed = false
}: SidebarCollapseProps) {
  const location = useLocation();
  const { theme } = useTheme();
  const [showFlyout, setShowFlyout] = useState(false);
  
  const isActive = item.subItems?.some(
    subItem => subItem.path === location.pathname
  );

  return (
    <div
      className="relative mb-1"
      onMouseLeave={() => isCollapsed && setShowFlyout(false)}
    >
      {/* Parent Item  */}
      <button
        onClick={() => isCollapsed ? setShowFlyout(prev => !prev) : onToggle()}
        onMouseEnter={() => isCollapsed && setShowFlyout(true)}
        title={isCollapsed ? item.title : undefined}
        className={`
          flex items-center transition-all duration-300 mb-1 border
          ${isCollapsed 
            ? 'w-12 h-12 mx-auto justify-center p-0 rounded-2xl' 
            : 'w-full justify-between px-4 py-3 rounded-3xl'}
          ${isActive
            ? theme === 'dark'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-amber-500/10 text-stone-900 border-amber-500/40'
            : theme === 'dark'
              ? 'hover:bg-[#1a1614] text-stone-200 border-transparent hover:border-stone-800'
              : 'hover:bg-stone-100 text-stone-800 border-transparent hover:border-stone-200'
          }
        `}
      >
        <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'} overflow-hidden`}>
          <div className={`${isCollapsed ? 'w-5 h-5' : 'w-9 h-9'} flex-shrink-0 rounded-3xl flex items-center justify-center border transition-all duration-300 ${
            isActive
              ? 'border-amber-500/40'
              : theme === 'dark'
                ? 'border-stone-800'
                : 'border-stone-200'
          } ${isCollapsed ? 'border-none' : ''}`}>
            {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-500' : theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`} />}
          </div>
          {!isCollapsed && <span className="font-semibold truncate">{item.title}</span>}
        </div>
        {!isCollapsed && (
          isOpen ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )
        )}
      </button>

      {isCollapsed && showFlyout && (
        <div className="absolute left-full top-0 z-[9999] pl-3">
          <div className={`
            min-w-48 rounded-2xl border shadow-xl py-2
            ${theme === 'dark'
              ? 'bg-stone-900 border-stone-700'
              : 'bg-white border-stone-200'}
          `}>
            {/* Group label */}
            <p className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${
              theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
            }`}>
              {item.title}
            </p>

            {/* Child items */}
            {item.subItems?.map((subItem: SubMenuItem) => {
              const isSubActive = location.pathname === subItem.path;
              const SubIcon = getIcon(subItem.iconName);

              return (
                <Link
                  key={subItem.id}
                  to={subItem.path}
                  onClick={() => setShowFlyout(false)}
                  className={`
                    flex items-center gap-3 mx-2 px-3 py-2 rounded-xl
                    transition-all duration-150
                    ${isSubActive
                      ? theme === 'dark'
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'bg-amber-500/10 text-stone-900'
                      : theme === 'dark'
                        ? 'hover:bg-stone-800 text-stone-300'
                        : 'hover:bg-stone-100 text-stone-700'
                    }
                  `}
                >
                  {SubIcon && (
                    <SubIcon className={`w-4 h-4 flex-shrink-0 ${
                      isSubActive ? 'text-amber-500'
                      : theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
                    }`} />
                  )}
                  <span className="text-sm font-semibold">{subItem.title}</span>
                  {isSubActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub Items — expanded mode only */}
      {!isCollapsed && isOpen && item.subItems && (
        <div className="ml-8 space-y-1">
          {item.subItems.map((subItem: SubMenuItem) => {
            const isSubActive = location.pathname === subItem.path;
            const SubIcon = getIcon(subItem.iconName);
            
            return (
              <Link
                key={subItem.id}
                to={subItem.path}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-3xl
                  transition-all duration-150 border
                  ${isSubActive
                    ? theme === 'dark'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-amber-500/10 text-stone-900 border-amber-500/40'
                    : theme === 'dark'
                      ? 'hover:bg-[#1a1614] text-stone-200 border-transparent hover:border-stone-800'
                      : 'hover:bg-stone-100 text-stone-800 border-transparent hover:border-stone-200'
                  }
                `}
              >
                {SubIcon && <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-amber-500' : theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`} />}
                <span className="text-sm font-semibold">{subItem.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}