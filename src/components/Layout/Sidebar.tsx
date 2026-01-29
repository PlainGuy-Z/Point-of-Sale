import { useState } from 'react';
import { Coffee } from 'lucide-react';
import { navigationConfig } from '../../data/navigation'; 
import { getIconComponent } from '../../utils/iconUtils';
import SidebarItem from './SidebarItem';
import SidebarCollapse from './SidebarCollapse';
import { useTheme } from '../../contexts/ThemeContext';

export default function Sidebar() {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    operation: false,
    customers: false,
  });

  const { theme } = useTheme();

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  // SEDERHANAKAN - langsung pakai theme di sini
  const sidebarClass = theme === 'dark' 
    ? 'w-64 bg-gray-800 text-white border-gray-700' 
    : 'w-64 bg-gray-200 text-black border-slate-500';

  return (
    <div className={`${sidebarClass} h-screen fixed left-0 top-0 flex flex-col border-r-2`}>
      
      {/* Header */}
      <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-800'}`}>
        <div className="flex items-center gap-3">
          <Coffee className={`h-10 w-10 ${theme === 'dark' ? 'text-amber-400' : 'text-black'}`} />
          <div>
            <h1 className="text-xl font-bold">Coffee Shop</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
              POS System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {navigationConfig.mainMenu.map((item) => {
            const Icon = getIconComponent(item.iconName);
            
            if (item.type === 'collapse') {
              return (
                <SidebarCollapse
                  key={item.id}
                  item={item}
                  icon={Icon || undefined}
                  isOpen={openMenus[item.id] || false}
                  onToggle={() => toggleMenu(item.id)}
                  getIcon={getIconComponent}
                  // TIDAK PERLU PASS theme prop!
                />
              );
            }
            
            return (
              <SidebarItem
                key={item.id}
                item={item}
                icon={Icon || undefined}
                // TIDAK PERLU PASS theme prop!
              />
            );
          })}
        </div>

        <div className={`h-px my-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-900'}`}></div>

        <div className="space-y-1">
          {navigationConfig.bottomMenu.map((item) => {
            const Icon = getIconComponent(item.iconName);
            return (
              <SidebarItem
                key={item.id}
                item={item}
                icon={Icon || undefined}
              />
            );
          })}
        </div>
      </div>

      {/* User Profile */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-800'}`}>
        <div className={`flex items-center gap-3 p-3 rounded-lg ${
          theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-800/50'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-500'
          }`}>
            <span className="font-bold text-white">U</span>
          </div>
          <div>
            <p className="font-medium">Single User</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-900'}`}>
              Store Operator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}