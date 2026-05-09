import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react'; 
import type { MenuItem } from '../../types/navigation'; 
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarItemProps {
  item: MenuItem;
  icon?: LucideIcon;
  isCollapsed?: boolean;
}

export default function SidebarItem({ item, icon: Icon, isCollapsed = false }: SidebarItemProps) {
  const location = useLocation();
  const { theme } = useTheme();
  
  const isActive = location.pathname === item.path;

  return (
    <Link
      to={item.path || '#'}
      title={isCollapsed ? item.title : undefined}
      className={`
        flex items-center transition-all duration-300 border overflow-hidden
        ${isCollapsed 
          ? 'w-12 h-12 mx-auto justify-center p-0 rounded-2xl' 
          : 'w-full px-4 py-3 gap-3 rounded-3xl'}
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
      {!isCollapsed && isActive && (
        <div className="ml-auto w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" aria-hidden="true" />
      )}
    </Link>
  );
}