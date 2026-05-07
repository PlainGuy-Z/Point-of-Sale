import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react'; 
import type { MenuItem } from '../../types/navigation'; 
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarItemProps {
  item: MenuItem;
  icon?: LucideIcon;
}

export default function SidebarItem({ item, icon: Icon }: SidebarItemProps) {
  const location = useLocation();
  const { theme } = useTheme();
  
  const isActive = location.pathname === item.path;

  return (
    <Link
      to={item.path || '#'}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-3xl
        transition-all duration-150 border
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
      {isActive && (
        <div className="ml-auto w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
      )}
    </Link>
  );
}