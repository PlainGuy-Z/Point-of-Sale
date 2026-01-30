export const navigationConfig = {
  mainMenu: [
    { 
      id: 'dashboard', 
      title: 'Dashboard', 
      path: '/', 
      iconName: 'LayoutDashboard', 
      type: 'link' 
    },
    { 
      id: 'pos', 
      title: 'Point of Sale', 
      path: '/pos', 
      iconName: 'ShoppingCart', 
      type: 'link' 
    },
    { 
      id: 'insights', 
      title: 'Business Insights', 
      path: '/insights', 
      iconName: 'BarChart3', 
      type: 'link' 
    },
    {
      id: 'operation',
      title: 'Operation',
      iconName: 'Box',
      type: 'collapse',
      subItems: [
        // Penempatan di dalam subItems agar muncul di SidebarCollapse
        { 
          id: 'prod-mgmt', 
          title: 'Manage Products', 
          path: '/operation/products', 
          iconName: 'PackagePlus', 
          type: 'link' 
        },
        { 
          id: 'waste-log', 
          title: 'Waste Log', 
          path: '/operation/waste-log', 
          iconName: 'Trash2', 
          type: 'link' 
        },
        { 
          id: 'inv-usage', 
          title: 'Inventory Usage', 
          path: '/operation/inventory-usage', 
          iconName: 'History', 
          type: 'link' 
        },
        { 
          id: 'cost-summary', 
          title: 'Cost Summary', 
          path: '/operation/cost-summary', 
          iconName: 'DollarSign', 
          type: 'link' 
        },
      ]
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
          iconName: 'UserCheck', 
          type: 'link' 
        },
        { 
          id: 'visit-history', 
          title: 'Visit History', 
          path: '/customers/visit-history', 
          iconName: 'Clock', 
          type: 'link' 
        },
        { 
          id: 'loyalty-insight', 
          title: 'Loyalty Insight', 
          path: '/customers/loyalty-insight', 
          iconName: 'Gem', 
          type: 'link' 
        },
      ]
    },
  ],
  bottomMenu: [
    { 
      id: 'settings', 
      title: 'Settings', 
      path: '/settings', 
      iconName: 'Settings', 
      type: 'link' 
    },
    { 
      id: 'help', 
      title: 'Help Center', 
      path: '/help', 
      iconName: 'HelpCircle', 
      type: 'link' 
    },
    { 
      id: 'logout', 
      title: 'Logout', 
      path: '/logout', 
      iconName: 'LogOut', 
      type: 'link' 
    },
  ]
};