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

  // 1. HAPUS NESTED DIV - langsung apply ke Link
  // 2. Gunakan ternary sederhana
  return (
    <Link
      to={item.path || '#'}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg 
        transition-all duration-150
        ${isActive
          ? theme === 'dark'
            ? 'bg-gray-700 text-cyan-300 border-l-4 border-cyan-400'
            : 'bg-gray-300 text-cyan-700 border-l-4 border-cyan-500'
          : theme === 'dark'
            ? 'hover:bg-gray-600 text-white'
            : 'hover:bg-gray-300 text-slate-900'
        }
      `}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span className="font-medium">{item.title}</span>
    </Link>
  );
}