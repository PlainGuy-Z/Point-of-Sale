import type { NavigationConfig } from '../types/navigation'; 

export const navigationConfig: NavigationConfig = {
  mainMenu: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      iconName: 'Home',
      type: 'link',
      path: '/',
    },
    {
      id: 'pos',
      title: 'Point of Sale',
      iconName: 'ShoppingCart',
      type: 'link',
      path: '/pos',
    },
    {
      id: 'insights',
      title: 'Business Insights',
      iconName: 'BarChart3',
      type: 'link',
      path: '/insights',
    },
    {
      id: 'operation',
      title: 'Operation',
      iconName: 'Package',
      type: 'collapse',
      subItems: [
        {
          id: 'waste-log',
          title: 'Waste Log',
          path: '/operation/waste-log',
          iconName: 'Trash2',
          type: 'link',
        },
        {
          id: 'inventory-usage',
          title: 'Inventory Usage',
          path: '/operation/inventory-usage',
          iconName: 'Package',
          type: 'link',
        },
        {
          id: 'cost-summary',
          title: 'Cost Summary',
          path: '/operation/cost-summary',
          iconName: 'DollarSign',
          type: 'link',
        },
      ],
    },
    {
      id: 'customers',
      title: 'Customers',
      iconName: 'Users',
      type: 'collapse',
      subItems: [
        {
          id: 'members',
          title: 'Members',
          path: '/customers/members',
          iconName: 'Users',
          type: 'link',
        },
        {
          id: 'visit-history',
          title: 'Visit History',
          path: '/customers/visit-history',
          iconName: 'Calendar',
          type: 'link',
        },
        {
          id: 'loyalty-insight',
          title: 'Loyalty Insight',
          path: '/customers/loyalty-insight',
          iconName: 'Award',
          type: 'link',
        },
      ],
    },
  ],
  
  bottomMenu: [
    {
      id: 'settings',
      title: 'Settings',
      iconName: 'Settings',
      type: 'link',
      path: '/settings',
    },
    {
      id: 'help',
      title: 'Help Center',
      iconName: 'HelpCircle',
      type: 'link',
      path: '/help',
    },
    {
      id: 'logout',
      title: 'Logout',
      iconName: 'LogOut',
      type: 'link',
      path: '/logout',
    },
  ],
};