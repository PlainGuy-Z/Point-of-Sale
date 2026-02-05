import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';

export default function Layout() {
  const { theme } = useTheme();

  return (
    <div className={`flex min-h-screen p-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Sidebar />
      
      <main className="ml-64 flex-1 overflow-auto">
        {/* Tanpa header sama sekali */}
        <div className="p-0"> 
          <Outlet />
        </div>
      </main>
    </div>
  );
}