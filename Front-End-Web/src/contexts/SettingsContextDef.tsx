import { createContext } from 'react';
import type { ShopSettings } from '../types';

export interface SettingsContextValue {
  settings: ShopSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (data: Partial<ShopSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);
