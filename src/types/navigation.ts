export type MenuItemType = 'link' | 'collapse';

export interface SubMenuItem {
  id: string;
  title: string;
  path: string;
  iconName: string;
  type: 'link';
}

export interface MenuItem {
  id: string;
  title: string;
  iconName: string;
  type: MenuItemType;
  path?: string;
  subItems?: SubMenuItem[];
}

export interface NavigationConfig {
  mainMenu: MenuItem[];
  bottomMenu: MenuItem[];
}

export const navigationConfig = {
  mainMenu: [
    { id: 'dashboard', title: 'Dashboard', path: '/', iconName: 'LayoutDashboard', type: 'link' },
    { id: 'pos', title: 'Point of Sale', path: '/pos', iconName: 'ShoppingCart', type: 'link' },
    { id: 'insights', title: 'Business Insights', path: '/insights', iconName: 'BarChart3', type: 'link' },
    {
      id: 'operation',
      title: 'Operation',
      iconName: 'Box',
      type: 'collapse',
      subItems: [
        { id: 'prod-mgmt', title: 'Manage Products', path: '/operation/products', iconName: 'PackagePlus', type: 'link' }, // Menu Baru
        { id: 'waste-log', title: 'Waste Log', path: '/operation/waste-log', iconName: 'Trash2', type: 'link' },
        { id: 'inv-usage', title: 'Inventory Usage', path: '/operation/inventory-usage', iconName: 'History', type: 'link' },
      ]
    },
    // ... rest of config
  ],
  bottomMenu: [ /* ... settings, help ... */ ]
};