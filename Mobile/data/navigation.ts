// Mobile Navigation Structure - Mirror of Web Navigation

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

export interface NavSection {
  id: string;
  label: string | null;
  items: NavItem[];
  collapsedIcon?: string;
}

export interface Navigation {
  sections: NavSection[];
}

// Owner Navigation
const ownerNavigation: Navigation = {
  sections: [
    {
      id: 'main',
      label: 'MENU UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: 'dashboard' },
      ],
    },
    {
      id: 'daily',
      label: 'HARIAN',
      collapsedIcon: 'ShoppingCart',
      items: [
        { id: 'pos', label: 'Point of Sale', icon: 'ShoppingCart', route: 'pos' },
        { id: 'sales-report', label: 'Laporan Penjualan', icon: 'BarChart2', route: 'sales-report' },
      ],
    },
    {
      id: 'reports',
      label: 'LAPORAN & ANALITIK',
      collapsedIcon: 'BarChart3',
      items: [
        { id: 'transactions', label: 'Riwayat Transaksi', icon: 'Receipt', route: 'transactions' },
        { id: 'business-insights', label: 'Business Intelligence', icon: 'BrainCircuit', route: 'insights' },
        { id: 'shifts', label: 'Laporan Shift', icon: 'ClipboardList', route: 'shifts' },
      ],
    },
    {
      id: 'products',
      label: 'PRODUK & STOK',
      collapsedIcon: 'Package',
      items: [
        { id: 'product-management', label: 'Manajemen Produk', icon: 'Package', route: 'products' },
        { id: 'inventory', label: 'Inventory & Biaya', icon: 'Layers', route: 'inventory' },
        { id: 'waste-log', label: 'Waste Log', icon: 'Trash2', route: 'waste-log' },
      ],
    },
    {
      id: 'customers',
      label: 'PELANGGAN',
      collapsedIcon: 'Users',
      items: [
        { id: 'members', label: 'Members', icon: 'Users', route: 'members' },
        { id: 'loyalty', label: 'Loyalty & Kunjungan', icon: 'Trophy', route: 'loyalty' },
      ],
    },
    {
      id: 'management',
      label: 'MANAJEMEN',
      collapsedIcon: 'Settings',
      items: [
        { id: 'settings', label: 'Settings', icon: 'Settings', route: 'settings' },
        { id: 'help', label: 'Help Center', icon: 'HelpCircle', route: 'help' },
      ],
    },
  ],
};

// Cashier Navigation
const cashierNavigation: Navigation = {
  sections: [
    {
      id: 'main',
      label: null,
      items: [
        { id: 'pos', label: 'Kasir', icon: 'ShoppingCart', route: 'pos' },
        { id: 'shift', label: 'Shift', icon: 'Clock', route: 'shift' },
        { id: 'history', label: 'Riwayat', icon: 'List', route: 'history' },
        { id: 'settings', label: 'Pengaturan', icon: 'Settings', route: 'settings' },
      ],
    },
  ],
};

export function getNavigation(role?: string): Navigation {
  if (role === 'cashier') {
    return cashierNavigation;
  }
  return ownerNavigation;
}
