import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { appApi } from '../services/appApi';
import type { Shift } from '../types';

interface ShiftContextValue {
  activeShift: Shift | null;
  isLoading: boolean;
  openShift: (opening_cash: number) => Promise<void>;
  closeShift: (closing_cash: number, notes?: string) => Promise<void>;
  refreshShift: () => Promise<void>;
}


const ShiftContext = createContext<ShiftContextValue | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshShift = useCallback(async () => {
    if (status !== 'authenticated' || !user || user.role !== 'cashier') {
      setActiveShift(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await appApi.get('/shifts/active');
      setActiveShift(response || null);
    } catch (error) {
      console.error('Failed to fetch active shift:', error);
      setActiveShift(null);
    } finally {
      setIsLoading(false);
    }
  }, [status, user]);

  useEffect(() => {
    setIsLoading(true);
    void refreshShift();
  }, [refreshShift]);

  const openShift = async (opening_cash: number) => {
    setIsLoading(true);
    try {
      const shift = await appApi.post('/shifts/open', { opening_cash });
      setActiveShift(shift);
    } finally {
      setIsLoading(false);
    }
  };

  const closeShift = async (closing_cash: number, notes?: string) => {
    setIsLoading(true);
    try {
      await appApi.post('/shifts/close', { closing_cash, notes });
      setActiveShift(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShiftContext.Provider value={{ activeShift, isLoading, openShift, closeShift, refreshShift }}>
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
