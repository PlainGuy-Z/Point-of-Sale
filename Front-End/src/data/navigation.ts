export const navigationConfig = {
  mainMenu: [
    { 
      id: 'dashboard', 
      title: 'Dashboard', 
      path: '/', 
      iconName: 'LayoutDashboard', 
      type: 'link',
      allowedRoles: ['owner', 'cashier'] as Array<'owner' | 'cashier'>
    },
    { 
      id: 'pos', 
      title: 'Point of Sale', 
      path: '/pos', 
      iconName: 'ShoppingCart', 
      type: 'link',
      allowedRoles: ['owner', 'cashier'] as Array<'owner' | 'cashier'>
    },
    { 
      id: 'insights', 
      title: 'Business Insights', 
      path: '/insights', 
      iconName: 'BarChart3', 
      type: 'link',
      allowedRoles: ['owner'] as Array<'owner' | 'cashier'>
    },
    {
      id: 'operation',
      title: 'Operation',
      iconName: 'Box',
      type: 'collapse',
      allowedRoles: ['owner', 'cashier'] as Array<'owner' | 'cashier'>,
      subItems: [
        { 
          id: 'prod-mgmt', 
          title: 'Manage Products', 
          path: '/operation/products', 
          iconName: 'PackagePlus', 
          type: 'link',
          allowedRoles: ['owner'] as Array<'owner' | 'cashier'>
        },
        { 
          id: 'waste-log', 
          title: 'Waste Log', 
          path: '/operation/waste-log', 
          iconName: 'Trash2', 
          type: 'link',
          allowedRoles: ['owner', 'cashier'] as Array<'owner' | 'cashier'>
        },
        { 
          id: 'inv-usage', 
          title: 'Inventory Usage', 
          path: '/operation/inventory-usage', 
          iconName: 'History', 
          type: 'link',
          allowedRoles: ['owner'] as Array<'owner' | 'cashier'>
        },
        { 
          id: 'cost-summary', 
          title: 'Cost Summary', 
          path: '/operation/cost-summary', 
          iconName: 'DollarSign', 
          type: 'link',
          allowedRoles: ['owner'] as Array<'owner' | 'cashier'>
        },
      ]
    },
    {
      id: 'customers',
      title: 'Customers',
      iconName: 'Users',
      type: 'collapse',
      allowedRoles: ['owner'] as Array<'owner' | 'cashier'>,
      subItems: [
        { 
          id: 'members', 
          title: 'Members', 
          path: '/customers/members', 
          iconName: 'UserCheck', 
          type: 'link',
          allowedRoles: ['owner'] as Array<'owner' | 'cashier'>
        },
        { 
          id: 'visit-history', 
          title: 'Visit History', 
          path: '/customers/visit-history', 
          iconName: 'Clock', 
          type: 'link',
          allowedRoles: ['owner'] as Array<'owner' | 'cashier'>
        },
        { 
          id: 'loyalty-insight', 
          title: 'Loyalty Insight', 
          path: '/customers/loyalty-insight', 
          iconName: 'Gem', 
          type: 'link',
          allowedRoles: ['owner'] as Array<'owner' | 'cashier'>
        },
      ]
    },
  ],
  bottomMenu: [
    { 
      id: 'shifts', 
      title: 'Laporan Shift', 
      path: '/shifts', 
      iconName: 'ClipboardList', 
      type: 'link',
      allowedRoles: ['owner'] as Array<'owner' | 'cashier'>
    },
    { 
      id: 'settings', 
      title: 'Settings', 
      path: '/settings', 
      iconName: 'Settings', 
      type: 'link',
      allowedRoles: ['owner', 'cashier'] as Array<'owner' | 'cashier'>
    },
    { 
      id: 'help', 
      title: 'Help Center', 
      path: '/help', 
      iconName: 'HelpCircle', 
      type: 'link',
      allowedRoles: ['owner', 'cashier'] as Array<'owner' | 'cashier'>
    },
    { 
      id: 'logout', 
      title: 'Logout', 
      path: '/logout', 
      iconName: 'LogOut', 
      type: 'link',
      allowedRoles: ['owner', 'cashier'] as Array<'owner' | 'cashier'>
    },
  ]
};