import { useState, useEffect } from 'react';
import { Coffee, Moon, Sun, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import logoIcon from '../../assets/icon.png';
import { getNavigation } from '../../data/navigation';
import type { NavItem, NavSection } from '../../data/navigation';
import { getIconComponent } from '../../utils/iconUtils';
import SidebarItem from './SidebarItem';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useShift } from '../../contexts/ShiftContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ShiftCloseModal from '../shift/ShiftCloseModal';
import { appApi } from '../../services/appApi';
import { getApiBaseUrl } from '../../services/apiBaseUrl';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  isMobileLandscape?: boolean;
  onNavigate?: () => void;
}

// ─── Collapsed Group with Flyout ──────────────────────────────────────────────


function CollapsedGroup({
  section,
  isDark,
  getBadge,
  onNavigate,
}: {
  section: NavSection;
  isDark: boolean;
  getBadge: (id: string) => number | undefined;
  onNavigate?: () => void;
}) {
  const [showFlyout, setShowFlyout] = useState(false);
  const location = useLocation();

  const GroupIcon = section.collapsedIcon
    ? getIconComponent(section.collapsedIcon)
    : null;

  const isAnyActive = section.items.some(
    (item) => location.pathname === item.path
  );

  const totalBadge = section.items.reduce(
    (sum, item) => sum + (getBadge(item.id) ?? 0),
    0
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowFlyout(true)}
      onMouseLeave={() => setShowFlyout(false)}
    >
      {/* Single group icon */}
      <button
        type="button"
        onClick={() => setShowFlyout((v) => !v)}
        className={`
          group relative w-10 h-10 mx-auto flex items-center justify-center rounded-xl
          transition-all duration-200
          ${isAnyActive
            ? isDark
              ? 'bg-amber-500/10 border-l-[3px] border-l-amber-500'
              : 'bg-teal-500/8 border-l-[3px] border-l-teal-500'
            : isDark
              ? 'hover:bg-stone-900 border-l-[3px] border-l-transparent'
              : 'hover:bg-[#F1F5F9] border-l-[3px] border-l-transparent'
          }
        `}
      >
        {GroupIcon && (
          <GroupIcon
            className={`w-[18px] h-[18px] transition-colors duration-200 ${
              isAnyActive
                ? isDark ? 'text-amber-500' : 'text-teal-500'
                : isDark
                  ? 'text-stone-500'
                  : 'text-[#94A3B8]'
            }`}
          />
        )}

        {/* Badge dot */}
        {totalBadge > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isDark ? 'bg-amber-500' : 'bg-teal-500'}`} />
        )}
      </button>

      {/* Flyout popup */}
      {showFlyout && (
        <div className="absolute left-full top-0 z-[9999] pl-3">
          <div
            className={`
              min-w-[200px] rounded-2xl border shadow-2xl py-2
              ${isDark
                ? 'bg-stone-900 border-stone-700/80 shadow-black/40'
                : 'bg-white border-[#E2E8F0] shadow-stone-200/60'
              }
            `}
          >
            {/* Group label */}
            <p
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'text-stone-500' : 'text-[#94A3B8]'
              }`}
            >
              {section.label}
            </p>

            {/* Child items */}
            {section.items.map((item) => {
              const isItemActive = location.pathname === item.path;
              const ItemIcon = getIconComponent(item.icon);
              const badge = getBadge(item.id);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => {
                    if (onNavigate) onNavigate();
                    setShowFlyout(false);
                  }}
                  className={`
                    flex items-center gap-2.5 mx-2 px-3 py-2 rounded-xl
                    transition-all duration-150
                    ${isItemActive
                      ? isDark
                        ? 'bg-amber-500/10 text-amber-200'
                        : 'bg-teal-500/10 text-teal-900'
                      : isDark
                        ? 'hover:bg-stone-800 text-stone-300'
                        : 'hover:bg-[#F1F5F9] text-[#475569]'
                    }
                  `}
                >
                  {ItemIcon && (
                    <ItemIcon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isItemActive
                          ? isDark ? 'text-amber-500' : 'text-teal-500'
                          : isDark
                            ? 'text-[#94A3B8]'
                            : 'text-[#94A3B8]'
                      }`}
                    />
                  )}
                  <span className="text-[13px] font-semibold">{item.label}</span>
                  {badge != null && badge > 0 && (
                    <span className={`ml-auto flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full ${isDark ? 'bg-amber-500' : 'bg-teal-500'} px-1 text-[9px] font-bold ${isDark ? 'text-[#0F172A]' : 'text-white'} leading-none`}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                  {isItemActive && !(badge != null && badge > 0) && (
                    <div className={`ml-auto w-1.5 h-1.5 rounded-full ${isDark ? 'bg-amber-500' : 'bg-teal-500'}`} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ isCollapsed = false, onToggleCollapse, isMobileOpen = false, isMobileLandscape = false, onNavigate }: SidebarProps) {
  const [showCloseModal, setShowCloseModal] = useState(false);

  const { theme, effectiveTheme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { activeShift } = useShift();
  const navigate = useNavigate();
  const isDark = effectiveTheme === 'dark';

  // ── Void request badge polling (owner only) ─────────────────────────────────
  const [pendingVoidBadge, setPendingVoidBadge] = useState(0);

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
    
    const handleUpdate = () => {
      void poll();
    };
    window.addEventListener('void_badge_update', handleUpdate);
    
    return () => {
      cancelled = true;
      window.clearInterval(iv);
      window.removeEventListener('void_badge_update', handleUpdate);
    };
  }, [user?.role]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ── Navigation data ─────────────────────────────────────────────────────────
  const role = user?.role ?? 'cashier';
  const navigation = getNavigation(role);

  // ── Badge mapping ───────────────────────────────────────────────────────────
  const getBadge = (itemId: string): number | undefined => {
    if (itemId === 'transactions' && role === 'owner') return pendingVoidBadge || undefined;
    return undefined;
  };

  // ── Logout nav item ─────────────────────────────────────────────────────────
  const logoutItem: NavItem = {
    id: 'logout',
    label: 'Logout',
    icon: 'LogOut',
    path: '/logout',
  };

  return (
    <>
      <div
        className={`
          ${isDark ? 'bg-stone-950 text-stone-100 border-stone-800' : 'bg-white text-[#0F172A] border-[#CBD5E1]'}
          ${isCollapsed && !isMobileOpen ? 'w-[68px] overflow-visible' : 'w-[240px] overflow-hidden'}
          ${isMobileLandscape ? 'h-full' : 'h-screen'} fixed left-0 top-0 z-50 flex flex-col border-r transition-all duration-300
          ${isMobileLandscape ? 'flex' : 'flex'}
          ${isMobileOpen ? 'visible translate-x-0' : (isMobileLandscape ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible lg:translate-x-0')}
        `}
      >
        {/* ═══════════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════════ */}
        <div
          className={`
            ${isCollapsed ? 'p-3' : 'px-5 py-5'}
            border-b ${isDark ? 'border-stone-800/60' : 'border-[#CBD5E1]'}
            transition-all duration-300
          `}
        >
          <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-3'}`}>
            <div
              className={`
                ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'}
                rounded-2xl ${isDark ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/20' : 'bg-teal-50 border-teal-200'}
                flex items-center justify-center flex-shrink-0
                transition-all duration-300
                overflow-hidden border
              `}
            >
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url.startsWith('http') ? settings.logo_url : `${getApiBaseUrl()}${settings.logo_url}`} 
                  alt="Logo" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <img src={logoIcon} alt="Logo" className="w-full h-full object-cover" />
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                  {user?.shop?.name || 'Coffee Shop'}
                </h1>
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs truncate ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
                    SmartPos
                  </p>
                  {user?.role === 'cashier' && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        activeShift
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                    >
                      {activeShift ? '●' : '○'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {isMobileOpen && !isMobileLandscape ? (
              <button
                onClick={onNavigate}
                title="Tutup menu"
                className={`
                  ml-auto p-1.5 rounded-lg border
                  ${isDark
                    ? 'border-stone-800 hover:bg-stone-900 text-stone-300'
                    : 'border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#334155]'
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className={`
                    ${isCollapsed ? 'mt-2' : 'ml-auto'}
                    ${isDark
                      ? 'border-stone-800 hover:bg-stone-900 text-stone-500 hover:text-stone-300'
                      : 'border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#334155]'
                    }
                  `}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronLeft className="w-3.5 h-3.5" />
                  )}
                </button>
              )
            )}
          </div>

          {/* Shift counter for cashier */}
          {user?.role === 'cashier' && activeShift && !isCollapsed && (
            <div className="mt-2 flex items-center justify-between px-1">
              <span className={`text-xs ${isDark ? 'text-stone-500' : 'text-[#64748B]'}`}>
                Transaksi shift ini:
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-amber-500' : 'text-teal-600'}`}>
                {activeShift.current_total_transactions ?? activeShift.total_transactions ?? 0}
              </span>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            NAVIGATION SECTIONS
        ═══════════════════════════════════════════════════════════════════════ */}
        <div
          className={`
            flex-1 transition-all duration-300
            ${isCollapsed ? 'overflow-visible px-2 py-3' : 'overflow-y-auto px-3 py-3'}
            horizontal-scrollbar-thin
          `}
        >
          <nav className="space-y-1">
            {navigation.sections.map((section, sectionIndex) => (
              <div key={section.id}>
                {/* Section divider (between sections, not before the first one) */}
                {sectionIndex > 0 && (
                  <div
                    className={`
                      ${isCollapsed ? 'mx-2 my-2' : 'mx-1 my-2'}
                      h-px
                      ${isDark ? 'bg-stone-800/60' : 'bg-[#E2E8F0]/80'}
                    `}
                  />
                )}

                {/* Section label (expanded mode only) */}
                {section.label && !isCollapsed && (
                  <div className="px-3 pt-2 pb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-[0.08em] ${
                        isDark ? 'text-stone-600' : 'text-[#64748B]'
                      }`}
                    >
                      {section.label}
                    </span>
                  </div>
                )}

                {/* Section items */}
                {isCollapsed && section.collapsedIcon ? (
                  // ── COLLAPSED: grouped icon with flyout ──────────────────
                  <CollapsedGroup
                    section={section}
                    isDark={isDark}
                    getBadge={getBadge}
                    onNavigate={onNavigate}
                  />
                ) : (
                  // ── EXPANDED (or ungrouped collapsed): individual items ──
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = getIconComponent(item.icon);
                      return (
                        <SidebarItem
                          key={item.id}
                          item={item}
                          icon={Icon || undefined}
                          isCollapsed={isCollapsed}
                          badge={getBadge(item.id)}
                          onNavigate={onNavigate}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* ── Logout ─────────────────────────────────────────────────── */}
            <div>
              <div
                className={`
                  ${isCollapsed ? 'mx-2 my-2' : 'mx-1 my-2'}
                  h-px
                  ${isDark ? 'bg-stone-800/60' : 'bg-[#E2E8F0]/80'}
                `}
              />
              <SidebarItem
                item={logoutItem}
                icon={LogOut}
                isCollapsed={isCollapsed}
                onClick={handleLogout}
                onNavigate={onNavigate}
              />
            </div>
          </nav>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════════════════════ */}
        <div
          className={`
            ${isCollapsed ? 'p-2' : 'p-3'}
            border-t ${isDark ? 'border-stone-800/60' : 'border-[#E2E8F0]'}
            transition-all duration-300
          `}
        >
          {/* Cashier shift close button */}
          {user?.role === 'cashier' && activeShift && (
            <div className="mb-2">
              <button
                onClick={() => setShowCloseModal(true)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200
                  ${isDark
                    ? 'border-red-900/30 text-red-400 hover:bg-red-900/20'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
                  }
                `}
              >
                <LogOut className="w-4 h-4" />
                {!isCollapsed && (
                  <span className="text-xs font-bold uppercase tracking-wider">Tutup Shift</span>
                )}
              </button>
            </div>
          )}

          {/* User profile + theme toggle */}
          <div
            className={`
              flex ${isCollapsed ? 'flex-col items-center gap-2 p-2' : 'items-center gap-2.5 p-2.5'}
              rounded-xl border
              ${isDark
                ? 'bg-stone-900/50 border-stone-800/60'
                : 'bg-[#F8FAFC] border-[#CBD5E1]'
              }
            `}
          >
            <div
              className={`
                w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0
                ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-teal-50 border-teal-200'}
              `}
            >
              {!isCollapsed ? (
                <span
                  className={`font-black text-sm uppercase ${
                    isDark ? 'text-stone-200' : 'text-[#0F172A]'
                  }`}
                >
                  {user?.name?.[0] || 'U'}
                </span>
              ) : (
                <img src={logoIcon} className="w-4 h-4 object-cover" alt="User" />
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold truncate ${isDark ? 'text-stone-200' : 'text-[#0F172A]'}`}>
                  {user?.name || 'User'}
                </p>
                <p
                  className={`text-[10px] truncate uppercase tracking-wider font-semibold mt-0.5 ${
                    isDark ? 'text-amber-500/80' : 'text-teal-600/80'
                  }`}
                >
                  {user?.role || 'operator'}
                </p>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className={`
                ${isCollapsed ? '' : 'ml-auto'}
                inline-flex items-center gap-1.5
                ${isCollapsed ? 'p-2' : 'px-2.5 py-1.5'}
                ${isDark
                  ? 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-900'
                  : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#334155] hover:bg-[#E2E8F0]'
                }
              `}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-teal-600" />
              )}
              {!isCollapsed && <span>{isDark ? 'Light' : 'Dark'}</span>}
            </button>
          </div>
        </div>
      </div>

      {showCloseModal && <ShiftCloseModal onClose={() => setShowCloseModal(false)} />}
    </>
  );
}