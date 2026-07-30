import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import type { Shift } from '../types';
import { OfflineShiftManager } from '../services/shift/OfflineShiftManager';

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
      
      // If we are online and successfully fetched the active shift, we can check if there's an offline shift
      // that we haven't synced yet. The SyncManager will handle it, but for UI sake, we prioritize the offline shift
      // if it's open, because it hasn't synced yet.
      const offlineShift = await OfflineShiftManager.getOfflineShift();
      if (offlineShift && offlineShift.status === 'open') {
        setActiveShift(offlineShift);
      } else {
        setActiveShift(response || null);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch active shift:', err);
      
      // Network error - fallback to offline shift
      if (err.message === 'Network request failed' || err.code === 'ECONNABORTED' || err.status === 0 || !err.status) {
        const offlineShift = await OfflineShiftManager.getOfflineShift();
        if (offlineShift && offlineShift.status === 'open') {
          setActiveShift(offlineShift);
          setError(null); // No error, we are using offline shift!
        } else {
          setActiveShift(null);
          // Don't set error, just act like no active shift offline
        }
      } else {
        setActiveShift(null);
        if (err?.status && err.status !== 404) {
          setError(err.message || 'Gagal memuat shift aktif');
        }
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
      if (err.message === 'Network request failed' || err.code === 'ECONNABORTED' || err.status === 0 || !err.status) {
        const offlineShift = await OfflineShiftManager.createOfflineShift(
          user!.id,
          user!.name,
          opening_cash,
          user!.branch_id
        );
        setActiveShift(offlineShift);
      } else {
        const msg = err?.message || 'Gagal membuka shift';
        setError(msg);
        throw err;
      }
    } finally {
      setIsOpening(false);
    }
  };

  const closeShift = async (closing_cash: number, notes?: string) => {
    setIsClosing(true);
    setError(null);
    try {
      await api.post('/shifts/close', { closing_cash, notes });
      
      // Also clear offline shift if it was the same one (although syncing handles this, it's safer to clear here if successful)
      if (activeShift && (activeShift as any).is_offline) {
        await OfflineShiftManager.clearOfflineShift();
      }
      
      setActiveShift(null);
      try {
        await refreshShift();
      } catch (refreshError) {
        console.error('Failed to refresh shift after closing:', refreshError);
      }
    } catch (err: any) {
      if (err.message === 'Network request failed' || err.code === 'ECONNABORTED' || err.status === 0 || !err.status) {
        if (!activeShift) throw new Error('No active shift to close');
        
        if ((activeShift as any).is_offline) {
           await OfflineShiftManager.updateOfflineShift({
             status: 'closed',
             closing_cash,
             notes: notes || null,
             closed_at: new Date().toISOString(),
             needs_sync_close: true,
           });
           setActiveShift(null);
        } else {
           await OfflineShiftManager.recordOfflineCloseForOnlineShift(activeShift, closing_cash, notes);
           setActiveShift(null);
        }
      } else {
        const msg = err?.message || 'Gagal menutup shift';
        setError(msg);
        throw err;
      }
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
