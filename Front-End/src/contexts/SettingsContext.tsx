import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { http } from '../services/appApi';

export interface ShopSettings {
  shop_name: string;
  shop_slug: string;
  phone: string;
  address: string;
  logo_url: string;
  open_time: string;
  close_time: string;

  tax_enabled: boolean;
  tax_rate: number;
  tax_label: string;
  tax_inclusive: boolean;

  service_charge_enabled: boolean;
  service_charge_rate: number;
  service_charge_label: string;

  receipt_footer: string;
  receipt_show_logo: boolean;
  receipt_paper_size: '58mm' | '80mm';
  receipt_auto_print: boolean;
  receipt_show_tax: boolean;

  default_order_type: 'dine_in' | 'takeaway';
  require_customer_name: boolean;
  require_table_number: boolean;

  payment_cash: boolean;
  payment_qris: boolean;
  payment_transfer: boolean;

  low_stock_threshold: number;
  auto_disable_zero_stock: boolean;
}

export interface SettingsContextValue {
  settings: ShopSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (data: Partial<ShopSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    // Only load settings for owners.
    if (!user || user.role !== 'owner') {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await http<ShopSettings>('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const updateSettings = async (data: Partial<ShopSettings>) => {
    if (!user || user.role !== 'owner') return;
    try {
      setError(null);
      const updated = await http<ShopSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setSettings(updated);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
