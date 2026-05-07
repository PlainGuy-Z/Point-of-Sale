import { useState } from 'react';
import { Coffee, Moon, Sun } from 'lucide-react';
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

  const { theme, toggleTheme } = useTheme();

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const sidebarClass =
    theme === 'dark'
      ? 'w-64 bg-slate-900 text-slate-100 border-slate-800'
      : 'w-64 bg-white text-slate-900 border-slate-200';

  return (
    <div className={`${sidebarClass} h-screen fixed left-0 top-0 flex flex-col border-r`}>
      
      {/* Header */}
      <div className={`p-6 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Coffee className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Coffee Shop</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              POS System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto horizontal-scrollbar-thin">
        <div className="space-y-1">
          {navigationConfig.mainMenu.map((item) => {
            const Icon = getIconComponent(item.iconName);
            
            if (item.type === 'collapse') {
              return (
                <SidebarCollapse
                  key={item.id}
                  item={item as any}
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
                item={item as any}
                icon={Icon || undefined}
                // TIDAK PERLU PASS theme prop!
              />
            );
          })}
        </div>

        <div className={`h-px my-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        <div className="space-y-1">
          {navigationConfig.bottomMenu.map((item) => {
            const Icon = getIconComponent(item.iconName);
            return (
              <SidebarItem
                key={item.id}
                item={item as any}
                icon={Icon || undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Footer (profile + theme toggle) */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className={`flex items-center gap-3 p-3 rounded-3xl border ${
          theme === 'dark'
            ? 'bg-slate-950/40 border-slate-800'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`w-10 h-10 rounded-3xl flex items-center justify-center border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <span className={`font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>U</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">Single User</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Store Operator
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-3xl border text-xs font-black transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-amber-500" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}