import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';

export default function Layout() {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`flex min-h-screen p-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-stone-950' : 'bg-gray-50'
    }`}>
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
      />
      
      <main className={`${isCollapsed ? 'ml-16' : 'ml-64'} flex-1 overflow-auto transition-all duration-300`}>
        {/* Tanpa header sama sekali */}
        <div className="p-0"> 
          <Outlet />
        </div>
      </main>
    </div>
  );
}