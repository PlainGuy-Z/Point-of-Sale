import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Branch } from '../types';
import { branchApi } from '../services/branchApi';
import { useAuth } from './AuthContext';

export interface BranchContextType {
  branches: Branch[];
  selectedBranchId: string | 'all';
  setSelectedBranchId: (id: string | 'all') => void;
  currentBranch: Branch | null;
  hasSingleBranch: boolean;
  refreshBranches: () => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY = 'selected_branch_id';

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isOwner, isCashier } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshBranches = useCallback(async () => {
    if (!isAuthenticated) {
      setBranches([]);
      return;
    }
    setIsLoading(true);
    try {
      if (isOwner) {
        const list = await branchApi.getBranches();
        setBranches(list || []);
      } else if (isCashier && user?.branch_id) {
        setBranches([
          {
            id: user.branch_id,
            shop_id: user.shop_id,
            name: user.branch_name || 'Cabang Saya',
            is_active: true,
            is_default: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isOwner, isCashier, user?.branch_id, user?.branch_name, user?.shop_id]);

  useEffect(() => {
    refreshBranches();
  }, [refreshBranches]);

  useEffect(() => {
    (async () => {
      if (isCashier && user?.branch_id) {
        setSelectedBranchIdState(user.branch_id);
      } else if (isOwner) {
        try {
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (saved) {
            setSelectedBranchIdState(saved);
          } else {
            setSelectedBranchIdState('all');
          }
        } catch {
          setSelectedBranchIdState('all');
        }
      }
    })();
  }, [isOwner, isCashier, user?.branch_id]);

  const setSelectedBranchId = useCallback(async (id: string | 'all') => {
    if (isCashier && user?.branch_id) {
      // Cashier cannot change branch selection
      return;
    }
    setSelectedBranchIdState(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, [isCashier, user?.branch_id]);

  const activeBranches = useMemo(() => branches.filter((b) => b.is_active), [branches]);
  const hasSingleBranch = useMemo(() => activeBranches.length <= 1, [activeBranches]);

  const currentBranch = useMemo(() => {
    if (selectedBranchId === 'all') return null;
    return branches.find((b) => b.id === selectedBranchId) || null;
  }, [branches, selectedBranchId]);

  const value = useMemo<BranchContextType>(
    () => ({
      branches,
      selectedBranchId,
      setSelectedBranchId,
      currentBranch,
      hasSingleBranch,
      refreshBranches,
      isLoading,
    }),
    [branches, selectedBranchId, setSelectedBranchId, currentBranch, hasSingleBranch, refreshBranches, isLoading]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}
