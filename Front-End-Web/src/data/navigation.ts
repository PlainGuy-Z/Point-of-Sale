// src/data/navigation.ts

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export interface NavSection {
  id: string;
  label: string | null;
  items: NavItem[];
  /** Icon shown as the single group icon when sidebar is collapsed. If null, items render individually. */
  collapsedIcon?: string;
}

export interface Navigation {
  sections: NavSection[];
}

// ─── Owner Navigation ─────────────────────────────────────────────────────────

const ownerNavigation: Navigation = {
  sections: [
    {
      id: 'main',
      label: null,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
      ],
    },
    {
      id: 'daily',
      label: 'HARIAN',
      collapsedIcon: 'ShoppingCart',
      items: [
        { id: 'pos', label: 'Point of Sale', icon: 'ShoppingCart', path: '/pos' },
        { id: 'sales-report', label: 'Laporan Penjualan', icon: 'BarChart2', path: '/sales-report' },
      ],
    },
    {
      id: 'reports',
      label: 'LAPORAN & ANALITIK',
      collapsedIcon: 'BarChart3',
      items: [
        { id: 'transactions', label: 'Riwayat Transaksi', icon: 'Receipt', path: '/transactions' },
        { id: 'business-insights', label: 'Business Intelligence', icon: 'BrainCircuit', path: '/insights' },
        { id: 'shifts', label: 'Laporan Shift', icon: 'ClipboardList', path: '/shifts' },
      ],
    },
    {
      id: 'products',
      label: 'PRODUK & STOK',
      collapsedIcon: 'Package',
      items: [
        { id: 'product-management', label: 'Manajemen Produk', icon: 'Package', path: '/operation/products' },
        { id: 'inventory', label: 'Inventory & Biaya', icon: 'Layers', path: '/operation/inventory-usage' },
        { id: 'waste-log', label: 'Waste Log', icon: 'Trash2', path: '/operation/waste-log' },
      ],
    },
    {
      id: 'customers',
      label: 'PELANGGAN',
      collapsedIcon: 'Users',
      items: [
        { id: 'members', label: 'Members', icon: 'Users', path: '/customers/members' },
        { id: 'loyalty', label: 'Loyalty & Kunjungan', icon: 'Trophy', path: '/customers/loyalty-insight' },
      ],
    },
    {
      id: 'management',
      label: 'MANAJEMEN',
      collapsedIcon: 'Settings',
      items: [
        { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
        { id: 'help', label: 'Help Center', icon: 'HelpCircle', path: '/help' },
      ],
    },
  ],
};

// ─── Cashier Navigation ───────────────────────────────────────────────────────

const cashierNavigation: Navigation = {
  sections: [
    {
      id: 'main',
      label: null,
      items: [
        { id: 'cashier-dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
        { id: 'pos', label: 'Point of Sale', icon: 'ShoppingCart', path: '/pos' },
      ],
    },
    {
      id: 'daily',
      label: 'HARIAN',
      items: [
        { id: 'waste-log', label: 'Waste Log', icon: 'Trash2', path: '/operation/waste-log' },
      ],
    },
    {
      id: 'reports',
      label: 'LAPORAN',
      items: [
        { id: 'shifts', label: 'Shift Saya', icon: 'Clock', path: '/cashier/shift' },
        { id: 'transactions', label: 'Riwayat Transaksi', icon: 'Receipt', path: '/history' },
      ],
    },
    {
      id: 'management',
      label: 'LAINNYA',
      items: [
        { id: 'settings', label: 'Settings', icon: 'Settings', path: '/cashier-settings' },
        { id: 'help', label: 'Help Center', icon: 'HelpCircle', path: '/help' },
      ],
    },
  ],
};

// ─── Getter ───────────────────────────────────────────────────────────────────

export function getNavigation(role: 'owner' | 'cashier'): Navigation {
  return role === 'owner' ? ownerNavigation : cashierNavigation;
}

// ─── Legacy export (kept for backward compatibility, may be removed later) ────

/** @deprecated Use getNavigation(role) instead */
export const navigationConfig = {
  mainMenu: [
    ...ownerNavigation.sections.flatMap((s) =>
      s.items.map((item) => ({
        id: item.id,
        title: item.label,
        path: item.path,
        iconName: item.icon,
        type: 'link' as const,
        allowedRoles: ['owner'] as Array<'owner' | 'cashier'>,
      }))
    ),
  ],
  bottomMenu: [] as Array<{
    id: string;
    title: string;
    path: string;
    iconName: string;
    type: 'link';
    allowedRoles: Array<'owner' | 'cashier'>;
  }>,
};
