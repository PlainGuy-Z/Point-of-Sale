import { useState, useEffect } from 'react';
import { Coffee, Moon, Sun, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { navigationConfig } from '../../data/navigation'; 
import { getIconComponent } from '../../utils/iconUtils';
import SidebarItem from './SidebarItem';
import SidebarCollapse from './SidebarCollapse';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { useNavigate } from 'react-router-dom';
import ShiftCloseModal from '../shift/ShiftCloseModal';
import { appApi } from '../../services/appApi';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    operation: false,
    customers: false,
  });
  const [showCloseModal, setShowCloseModal] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { activeShift } = useShift();
  const navigate = useNavigate();

  const [pendingVoidBadge, setPendingVoidBadge] = useState(0);
  const ownerVoidBadge = user?.role === 'owner' ? pendingVoidBadge : 0;

  useEffect(() => {
    if (user?.role !== 'owner') return undefined;

    let cancelled = false;
    const poll = async () => {
      try {
        const r = await appApi.get<{ total: number }>('/transactions/void-requests');
        if (!cancelled) setPendingVoidBadge(typeof r.total === 'number' ? r.total : 0);
      } catch {
        if (!cancelled) setPendingVoidBadge(0);
      }
    };
    void poll();
    const iv = window.setInterval(poll, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [user?.role]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = user?.role;
  const canSeeMenu = (allowed?: Array<'owner' | 'cashier'>) => {
    if (!role) return false;
    if (!allowed?.length) return true;
    return allowed.includes(role);
  };

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const sidebarClass =
    theme === 'dark'
      ? 'bg-stone-950 text-stone-100 border-stone-800'
      : 'bg-white text-stone-900 border-stone-200';

  return (
    <>
      <div className={`${sidebarClass} ${isCollapsed ? 'w-16 overflow-visible' : 'w-64 overflow-hidden'} h-screen fixed left-0 top-0 z-40 flex flex-col border-r transition-all duration-300`}>
        
        {/* Header */}
        <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b ${theme === 'dark' ? 'border-stone-800' : 'border-stone-200'} transition-all duration-300`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-3'}`}>
            <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 transition-all duration-300`}>
              <Coffee className={`${isCollapsed ? 'h-5 w-5' : 'h-6 w-6'} text-amber-500`} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold truncate">{user?.shop?.name || 'Coffee Shop'}</h1>
                <div className="flex items-center gap-2">
                  <p className={`text-sm truncate ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                    POS System
                  </p>
                  {user?.role === 'cashier' && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeShift ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {activeShift ? '●' : '○'}
                    </span>
                  )}
                </div>
              </div>
            )}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={`${isCollapsed ? 'mt-3' : 'ml-auto'} p-1.5 rounded-xl border transition-all duration-150 ${
                  theme === 'dark'
                    ? 'border-stone-800 hover:bg-[#1a1614] text-stone-400 hover:text-stone-200'
                    : 'border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-stone-800'
                }`}
              >
                {isCollapsed
                  ? <ChevronRight className="w-4 h-4" />
                  : <ChevronLeft className="w-4 h-4" />
                }
              </button>
            )}
          </div>

          {user?.role === 'cashier' && activeShift && !isCollapsed && (
            <div className="mt-1 flex items-center justify-between px-2">
              <span
                className={`text-xs ${
                  theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
                }`}
              >
                Transaksi shift ini:
              </span>
              <span className="text-xs font-bold text-amber-500">
                {activeShift.current_total_transactions ?? activeShift.total_transactions ?? 0}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={`flex-1 ${isCollapsed ? 'overflow-visible px-2' : 'overflow-y-auto p-4'} horizontal-scrollbar-thin transition-all duration-300`}>
          <div className="space-y-1">
            {navigationConfig.mainMenu
              .filter((item) => canSeeMenu(item.allowedRoles))
              .map((item) => {
                const Icon = getIconComponent(item.iconName);
                
                if (item.type === 'collapse') {
                  const subItems = item.subItems?.filter((sub) => canSeeMenu(sub.allowedRoles));
                  if (!subItems || subItems.length === 0) return null;
                  
                  const filteredItem = { ...item, subItems };
                  
                  return (
                    <SidebarCollapse
                      key={item.id}
                      item={filteredItem}
                      icon={Icon || undefined}
                      isOpen={openMenus[item.id] || false}
                      onToggle={() => !isCollapsed && toggleMenu(item.id)}
                      getIcon={getIconComponent}
                      isCollapsed={isCollapsed}
                    />
                  );
                }
                
                return (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    icon={Icon || undefined}
                    isCollapsed={isCollapsed}
                  />
                );
              })}
          </div>

          {!isCollapsed && <div className={`h-px my-4 ${theme === 'dark' ? 'bg-[#1a1614]' : 'bg-stone-200'}`}></div>}

          <div className="space-y-1">
            {navigationConfig.bottomMenu
              .filter((item) => canSeeMenu(item.allowedRoles))
              .map((item) => {
                const Icon = getIconComponent(item.iconName);
                if (item.id === 'logout') {
                  return (
                    <div key={item.id} onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                      <SidebarItem
                        item={item}
                        icon={Icon || undefined}
                        isCollapsed={isCollapsed}
                      />
                    </div>
                  );
                }
                return (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    icon={Icon || undefined}
                    isCollapsed={isCollapsed}
                    badge={item.id === 'owner-history' ? ownerVoidBadge : undefined}
                  />
                );
              })}
          </div>
        </div>

        {/* Footer (profile + theme toggle) */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t ${theme === 'dark' ? 'border-stone-800' : 'border-stone-200'} transition-all duration-300`}>
          
          {user?.role === 'cashier' && activeShift && (
            <div className="mb-3">
              <button
                onClick={() => setShowCloseModal(true)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-3xl border transition-all duration-150 ${
                  theme === 'dark'
                    ? 'border-red-900/30 text-red-400 hover:bg-red-900/20'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut className="w-4 h-4" />
                {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Tutup Shift</span>}
              </button>
            </div>
          )}

          <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2 p-2' : 'items-center gap-3 p-3'} rounded-3xl border ${
            theme === 'dark'
              ? 'bg-stone-950/40 border-stone-800'
              : 'bg-stone-50 border-stone-200'
          }`}>
            <div className={`w-10 h-10 rounded-3xl flex items-center justify-center border flex-shrink-0 ${
              theme === 'dark' ? 'bg-stone-950 border-stone-800' : 'bg-white border-stone-200'
            }`}>
              {!isCollapsed ? (
                <span className={`font-black uppercase ${theme === 'dark' ? 'text-stone-200' : 'text-stone-900'}`}>
                  {user?.name?.[0] || 'U'}
                </span>
              ) : (
                <Coffee className="w-5 h-5 text-amber-500" />
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="font-semibold truncate">{user?.name || 'User'}</p>
                <p className={`text-xs truncate uppercase tracking-wider font-semibold mt-0.5 ${theme === 'dark' ? 'text-amber-500/80' : 'text-amber-600'}`}>
                  {user?.role || 'operator'}
                </p>
              </div>
            )}
            <button
              onClick={toggleTheme}
              className={`${isCollapsed ? '' : 'ml-auto'} inline-flex items-center gap-2 ${isCollapsed ? 'p-2' : 'px-3 py-2'} rounded-3xl border text-xs font-black transition-all ${
                theme === 'dark'
                  ? 'bg-stone-950 border-stone-800 text-stone-200 hover:bg-[#1a1614]'
                  : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50'
              }`}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-amber-500" />}
              {!isCollapsed && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
            </button>
          </div>
        </div>
      </div>
      
      {showCloseModal && <ShiftCloseModal onClose={() => setShowCloseModal(false)} />}
    </>
  );
}