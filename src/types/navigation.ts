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