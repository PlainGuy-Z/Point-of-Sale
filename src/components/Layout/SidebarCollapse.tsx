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
          w-full flex items-center justify-between px-4 py-3 rounded-lg 
          transition-all duration-150 mb-1
          ${isActive
            ? theme === 'dark'
              ? 'bg-gray-700 text-cyan-300'
              : 'bg-gray-300 text-cyan-700'
            : theme === 'dark'
              ? 'hover:bg-gray-600 text-white'
              : 'hover:bg-gray-300 text-slate-900'
          }
        `}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5" />}
          <span className="font-medium">{item.title}</span>
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
                  flex items-center gap-3 px-4 py-2 rounded-lg 
                  transition-all duration-150
                  ${isSubActive
                    ? theme === 'dark'
                      ? 'bg-gray-700 text-cyan-300 border-l-4 border-cyan-400'
                      : 'bg-gray-300 text-cyan-700 border-l-4 border-cyan-500'
                    : theme === 'dark'
                      ? 'hover:bg-gray-600 text-white'
                      : 'hover:bg-gray-300 text-slate-900'
                  }
                `}
              >
                {SubIcon && <SubIcon className="w-4 h-4" />}
                <span className="text-sm font-medium">{subItem.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}