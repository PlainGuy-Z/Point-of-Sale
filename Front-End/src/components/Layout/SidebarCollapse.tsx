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
}

export default function SidebarCollapse({ 
  item, 
  icon: Icon, 
  isOpen, 
  onToggle,
  getIcon 
}: SidebarCollapseProps) {
  const location = useLocation();
  const { theme } = useTheme();
  
  const isActive = item.subItems?.some(
    subItem => subItem.path === location.pathname
  );

  return (
    <div className="mb-1">
      {/* Parent Item  */}
      <button
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-3xl
          transition-all duration-150 mb-1 border
          ${isActive
            ? theme === 'dark'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-amber-500/10 text-slate-900 border-amber-500/40'
            : theme === 'dark'
              ? 'hover:bg-slate-800 text-slate-200 border-transparent hover:border-slate-800'
              : 'hover:bg-slate-100 text-slate-800 border-transparent hover:border-slate-200'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-3xl flex items-center justify-center border ${
            isActive
              ? 'border-amber-500/40'
              : theme === 'dark'
                ? 'border-slate-800'
                : 'border-slate-200'
          }`}>
            {Icon && <Icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />}
          </div>
          <span className="font-semibold">{item.title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Sub Items  */}
      {isOpen && item.subItems && (
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
                      : 'bg-amber-500/10 text-slate-900 border-amber-500/40'
                    : theme === 'dark'
                      ? 'hover:bg-slate-800 text-slate-200 border-transparent hover:border-slate-800'
                      : 'hover:bg-slate-100 text-slate-800 border-transparent hover:border-slate-200'
                  }
                `}
              >
                {SubIcon && <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-amber-500' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />}
                <span className="text-sm font-semibold">{subItem.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}