// @refresh reset
/* eslint-disable react-refresh/only-export-components -- Provider + hook in one module */
import React, { useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { http } from '../services/appApi';
import type { ShopSettings } from '../types';
import { SettingsContext, type SettingsContextValue } from './SettingsContextDef';

export type { ShopSettings };

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
