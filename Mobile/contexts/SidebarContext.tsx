import React, { createContext, useContext } from 'react';

export interface SidebarContextValue {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  isSidebarExpanded: boolean;
  isLandscape: boolean;
  sidebarWidth: number;
  isSidebarOpen: boolean;
}

export const SidebarContext = createContext<SidebarContextValue>({
  openSidebar: () => {},
  closeSidebar: () => {},
  toggleSidebar: () => {},
  isSidebarExpanded: false,
  isLandscape: false,
  sidebarWidth: 0,
  isSidebarOpen: false,
});

export function useSidebar() {
  return useContext(SidebarContext);
}
