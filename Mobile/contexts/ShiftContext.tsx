import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import type { Shift } from '../types';

interface ShiftContextValue {
  activeShift: Shift | null;
  isLoading: boolean;
  error: string | null;
  isOpening: boolean;
  isClosing: boolean;
  openShift: (opening_cash: number) => Promise<void>;
  closeShift: (closing_cash: number, notes?: string) => Promise<void>;
  refreshShift: () => Promise<void>;
  clearError: () => void;
}

const ShiftContext = createContext<ShiftContextValue | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const refreshShift = useCallback(async () => {
    if (status !== 'authenticated' || !user || user.role !== 'cashier') {
      setActiveShift(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<Shift | null>('/shifts/active');
      setActiveShift(response || null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch active shift:', err);
      setActiveShift(null);
      // Don't set error for 404 or similar - it's normal if no active shift
      if (err?.status && err.status !== 404) {
        setError(err.message || 'Gagal memuat shift aktif');
      }
    } finally {
      setIsLoading(false);
    }
  }, [status, user]);

  useEffect(() => {
    setIsLoading(true);
    void refreshShift();
  }, [refreshShift]);

  const openShift = async (opening_cash: number) => {
    setIsOpening(true);
    setError(null);
    try {
      const shift = await api.post<Shift>('/shifts/open', { opening_cash });
      setActiveShift(shift);
      try {
        await refreshShift();
      } catch (refreshError) {
        console.error('Failed to refresh shift after opening:', refreshError);
      }
    } catch (err: any) {
      const msg = err?.message || 'Gagal membuka shift';
      setError(msg);
      throw err;
    } finally {
      setIsOpening(false);
    }
  };

  const closeShift = async (closing_cash: number, notes?: string) => {
    setIsClosing(true);
    setError(null);
    try {
      await api.post('/shifts/close', { closing_cash, notes });
      setActiveShift(null);
      try {
        await refreshShift();
      } catch (refreshError) {
        console.error('Failed to refresh shift after closing:', refreshError);
      }
    } catch (err: any) {
      const msg = err?.message || 'Gagal menutup shift';
      setError(msg);
      throw err;
    } finally {
      setIsClosing(false);
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ShiftContext.Provider value={{ activeShift, isLoading, error, isOpening, isClosing, openShift, closeShift, refreshShift, clearError }}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
