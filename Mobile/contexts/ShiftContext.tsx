import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import type { Shift } from '../types';
import { OfflineShiftManager } from '../services/shift/OfflineShiftManager';
import { getPendingTotalsByShiftId } from '../services/db/pendingTransactions';
import { addSyncListener } from '../services/sync/SyncManager';

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
      
      let finalShift = response || null;
      const offlineShift = await OfflineShiftManager.getOfflineShift();
      
      if (response) {
        // If there is an active shift from server, cache it for offline fallback.
        // But if we have an unsynced offline shift that we JUST opened, 
        // we prioritize the offline shift until it syncs to prevent UI jumps.
        if (offlineShift && offlineShift.needs_sync_open) {
          finalShift = offlineShift;
        } else if (offlineShift && offlineShift.needs_sync_close) {
          finalShift = offlineShift;
        } else {
          await OfflineShiftManager.cacheOnlineShift(response);
          finalShift = response;
        }
      } else {
        // Server says no active shift
        if (offlineShift && offlineShift.needs_sync_open) {
          // Keep our pending open intent
          finalShift = offlineShift;
        } else {
          // If we had a cached shift but server says it's closed, clear it
          await OfflineShiftManager.clearOfflineShift();
          finalShift = null;
        }
      }
      
      if (finalShift) {
        const pendingTotals = getPendingTotalsByShiftId(finalShift.id);
        if (pendingTotals.totalTransactions > 0 || (finalShift as any).is_offline) {
            finalShift = {
                ...finalShift,
                current_total_sales: ((finalShift as any).is_offline ? 0 : (finalShift.current_total_sales || 0)) + pendingTotals.totalSales,
                current_total_transactions: ((finalShift as any).is_offline ? 0 : (finalShift.current_total_transactions || 0)) + pendingTotals.totalTransactions,
                current_expected_cash: ((finalShift as any).is_offline ? finalShift.opening_cash : (finalShift.current_expected_cash || finalShift.opening_cash)) + pendingTotals.totalSales,
            };
        }
      }
      
      setActiveShift(finalShift);
      
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch active shift:', err);
      
      // Network error - fallback to offline shift
      if (err.message === 'Network request failed' || err.code === 'ECONNABORTED' || err.status === 0 || !err.status) {
        const offlineShift = await OfflineShiftManager.getOfflineShift();
        if (offlineShift && offlineShift.status === 'open') {
          let finalShift: Shift = offlineShift;
          const pendingTotals = getPendingTotalsByShiftId(finalShift.id);
          finalShift = {
              ...finalShift,
              current_total_sales: ((finalShift as any).is_offline ? 0 : (finalShift.current_total_sales || 0)) + pendingTotals.totalSales,
              current_total_transactions: ((finalShift as any).is_offline ? 0 : (finalShift.current_total_transactions || 0)) + pendingTotals.totalTransactions,
              current_expected_cash: ((finalShift as any).is_offline ? finalShift.opening_cash : (finalShift.current_expected_cash || finalShift.opening_cash)) + pendingTotals.totalSales,
          };
          setActiveShift(finalShift);
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

  useEffect(() => {
    // Subscribe to SyncManager completion to automatically refresh shift state when offline txs are synced
    const unsubscribeSync = addSyncListener((stats) => {
      if (stats && (stats.synced > 0 || stats.needsReview > 0)) {
        console.log('[ShiftContext] Offline transactions synced — refreshing shift state');
        refreshShift();
      }
    });

    return () => {
      unsubscribeSync();
    };
  }, [refreshShift]);

  const openShift = async (opening_cash: number) => {
    setIsOpening(true);
    setError(null);
    try {
      const shift = await api.post<Shift>('/shifts/open', { opening_cash });
      setActiveShift(shift);
      await OfflineShiftManager.cacheOnlineShift(shift);
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

  const contextValue = useMemo(() => ({ activeShift, isLoading, error, isOpening, isClosing, openShift, closeShift, refreshShift, clearError }), [activeShift, isLoading, error, isOpening, isClosing, openShift, closeShift, refreshShift, clearError]);

  return (
    <ShiftContext.Provider value={contextValue}>
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
