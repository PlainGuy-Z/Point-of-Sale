import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product, Transaction, WasteLog, Customer, BusinessSettings, CheckoutParams, CartItemWithInput, AppDataState } from '../types';
import { appApi, normalizeAppStateWire, type AppStateWire } from '../services/appApi';
import { posApi } from '../services/posApi';
import { useAuth } from './AuthContext';
import { offlineCheckout } from '../services/sync/offlineCheckout';
import { getLocalProducts, getLocalCategories, syncCatalog } from '../services/db/catalogSync';
import { getPendingCount, getPendingAsTransactions } from '../services/db/pendingTransactions';
import { cacheSyncedTransactions, getCachedSyncedTransactions } from '../services/db/transactionCache';
import { addSyncListener } from '../services/sync/SyncManager';

interface AppContextType {
  products: Product[];
  transactions: Transaction[];
  wasteLogs: WasteLog[];
  customers: Customer[];
  settings: BusinessSettings;
  categories: string[];
  categoriesWithId: { id: string; name: string }[];
  transactionsCacheFrom?: string | null;
  transactionsCacheTo?: string | null;
  transactionsLimit?: number;
  isServiceLoading: boolean;
  serviceError: string | null;
  clearServiceError: () => void;
  checkout: (params: CheckoutParams) => Promise<Transaction>;
  refreshState: () => Promise<void>;
  updateSettings: (settings: Partial<BusinessSettings> & { shop_name?: string }) => Promise<BusinessSettings>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  addWasteLog: (waste: { productId: string; quantity: number; reason: string; notes?: string }) => Promise<void>;
}

interface ProductsContextType {
  products: Product[];
  categories: string[];
  categoriesWithId: { id: string; name: string }[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
}

interface TransactionsContextType {
  transactions: Transaction[];
  checkout: (params: CheckoutParams) => Promise<Transaction>;
  transactionsCacheFrom?: string | null;
  transactionsCacheTo?: string | null;
  transactionsLimit?: number;
}

interface SettingsContextType {
  settings: BusinessSettings;
  updateSettings: (settings: Partial<BusinessSettings> & { shop_name?: string }) => Promise<BusinessSettings>;
  customers: Customer[];
  wasteLogs: WasteLog[];
  isServiceLoading: boolean;
  serviceError: string | null;
  clearServiceError: () => void;
  refreshState: () => Promise<void>;
  addWasteLog: (waste: { productId: string; quantity: number; reason: string; notes?: string }) => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);
const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: BusinessSettings = {
  storeName: 'Default Store',
  address: 'Jl. Example No. 123',
  currency: 'IDR',
  currencyPosition: 'before',
  decimalPlaces: 0,
  thousandsSeparator: 'comma',
  receiptFooter: 'Terima kasih telah berbelanja!',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const [state, setState] = useState<AppDataState>({
    products: [],
    transactions: [],
    wasteLogs: [],
    customers: [],
    settings: defaultSettings,
    categories: [],
    categoriesWithId: [],
    transactionsCacheFrom: null,
    transactionsCacheTo: null,
    transactionsLimit: 200,
  });
  const [isServiceLoading, setIsServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const clearServiceError = useCallback(() => {
    setServiceError(null);
  }, []);

  /**
   * Merge unsynced pending transactions from SQLite into the state.
   * This ensures offline transactions remain visible in dashboard, sales report,
   * and history even after app restart when server state overwrites in-memory state.
   */
  const mergePendingIntoState = useCallback((serverState: AppDataState): AppDataState => {
    try {
      const pendingTxs = getPendingAsTransactions() as Transaction[];
      if (pendingTxs.length === 0) return serverState;

      // Deduplicate: remove any pending tx that already exists in server data
      const serverTxIds = new Set(serverState.transactions.map(t => t.id));
      const newPendingTxs = pendingTxs.filter(t => !serverTxIds.has(t.id));

      if (newPendingTxs.length === 0) return serverState;

      console.log(`[AppContext] Merging ${newPendingTxs.length} pending offline transactions into state`);

      // Merge: pending transactions go first (most recent), then server data
      const mergedTransactions = [
        ...newPendingTxs,
        ...serverState.transactions,
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        ...serverState,
        transactions: mergedTransactions,
      };
    } catch (err) {
      console.error('[AppContext] Failed to merge pending transactions:', err);
      return serverState;
    }
  }, []);

  const refreshState = useCallback(async () => {
    try {
      setIsServiceLoading(true);
      setServiceError(null);
      const next = await appApi.getAppState();
      setState(mergePendingIntoState(next));
      setIsOfflineMode(false);

      // Cache server transactions to local SQLite for offline history view
      try { cacheSyncedTransactions(next.transactions); } catch { /* ignore */ }

      // Also sync catalog to SQLite for offline fallback
      try { await syncCatalog(); } catch { /* non-critical */ }
    } catch (e: any) {
      console.error('Failed to load state:', e);

      // Fallback to local SQLite cache if server is unreachable
      setIsOfflineMode(true);
      try {
        const localProducts = getLocalProducts();
        const localCats = getLocalCategories();
        
        const cachedTxs = getCachedSyncedTransactions();
        const pendingTxs = getPendingAsTransactions() as Transaction[];
        
        if (localProducts.length > 0 || pendingTxs.length > 0 || cachedTxs.length > 0) {
          console.log('[AppContext] Using offline cache:', localProducts.length, 'products,', pendingTxs.length, 'pending txs,', cachedTxs.length, 'cached txs');
          
          // Merge pending and cached transactions
          const cachedTxIds = new Set(cachedTxs.map(t => t.id));
          const newPendingTxs = pendingTxs.filter(t => !cachedTxIds.has(t.id));
          const mergedTransactions = [...newPendingTxs, ...cachedTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setState(prev => ({
            ...prev,
            products: localProducts.length > 0 ? localProducts : prev.products,
            categories: localCats.names.length > 0 ? localCats.names : prev.categories,
            categoriesWithId: localCats.withId.length > 0 ? localCats.withId : prev.categoriesWithId,
            transactions: mergedTransactions,
          }));
          setServiceError(null); // Don't show error if we have cached data
          return;
        }
      } catch { /* SQLite not initialized yet */ }

      setServiceError(e?.message || 'Gagal memuat data dari server. Periksa koneksi internet Anda.');
    } finally {
      setIsServiceLoading(false);
    }
  }, [mergePendingIntoState]);

  useEffect(() => {
    if (status !== 'authenticated') {
      setState({
        products: [],
        transactions: [],
        wasteLogs: [],
        customers: [],
        settings: defaultSettings,
        categories: [],
        categoriesWithId: [],
      });
      setServiceError(null);
      setIsOfflineMode(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setIsServiceLoading(true);
        setServiceError(null);
        const next = await appApi.getAppState();
        if (mounted) {
          setState(mergePendingIntoState(next));
          setIsOfflineMode(false);
          // Cache server transactions to local SQLite for offline history view
          try { cacheSyncedTransactions(next.transactions); } catch { /* ignore */ }
        }

        // Sync catalog to SQLite for offline fallback
        try { await syncCatalog(); } catch { /* non-critical */ }
      } catch (e: any) {
        console.error('Failed to load state from backend:', e);

        // Fallback to local SQLite cache
        if (mounted) {
          setIsOfflineMode(true);
          try {
            const localProducts = getLocalProducts();
            const localCats = getLocalCategories();

            const cachedTxs = getCachedSyncedTransactions();
            const pendingTxs = getPendingAsTransactions() as Transaction[];
            
            if (localProducts.length > 0 || pendingTxs.length > 0 || cachedTxs.length > 0) {
              console.log('[AppContext] Offline fallback:', localProducts.length, 'products,', pendingTxs.length, 'pending txs,', cachedTxs.length, 'cached txs');
              
              // Merge pending and cached transactions
              const cachedTxIds = new Set(cachedTxs.map(t => t.id));
              const newPendingTxs = pendingTxs.filter(t => !cachedTxIds.has(t.id));
              const mergedTransactions = [...newPendingTxs, ...cachedTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              setState(prev => ({
                ...prev,
                products: localProducts.length > 0 ? localProducts : prev.products,
                categories: localCats.names.length > 0 ? localCats.names : prev.categories,
                categoriesWithId: localCats.withId.length > 0 ? localCats.withId : prev.categoriesWithId,
                transactions: mergedTransactions,
              }));
              setServiceError(null); // Don't show error — we have cached data
              return;
            }
          } catch { /* SQLite not initialized yet */ }

          setServiceError(e?.message || 'Gagal terhubung ke server backend.');
        }
      } finally {
        if (mounted) setIsServiceLoading(false);
      }
    })();

    // Subscribe to SyncManager completion to automatically refresh UI state when offline txs are synced
    const unsubscribeSync = addSyncListener((stats) => {
      if (stats && (stats.synced > 0 || stats.needsReview > 0)) {
        console.log('[AppContext] Offline transactions synced — refreshing UI state');
        refreshState();
      }
    });

    return () => {
      mounted = false;
      unsubscribeSync();
    };
  }, [status, refreshState]);

  const checkout = useCallback(async (params: CheckoutParams) => {
    // ── True Offline-First Checkout ──────────────────────────────────────────
    // No loading spinner. Instant local save. Background sync handles the rest.
    try {
      const savedBranchId = await AsyncStorage.getItem('selected_branch_id');
      const branch_id = (savedBranchId && savedBranchId !== 'all') ? savedBranchId : undefined;

      if (!user) throw new Error('User not authenticated');

      console.log('[AppContext] True offline-first checkout (<50ms)');
      
      const transaction = await offlineCheckout({
        cart: params.cart,
        paymentMethod: params.paymentMethod,
        customerId: params.selectedCustomer,
        customerName: params.customCustomerName,
        orderType: params.orderType,
        tableNumber: params.tableNumber,
        cashReceived: params.cashReceived,
        orderNote: params.orderNote,
        notes: params.notes,
        applyTax: params.applyTax,
        branchId: branch_id,
        shiftId: undefined, // Will be resolved from ShiftContext by caller
        cashierId: user.id,
        cashierName: user.name,
        shopId: user.shop_id,
      });

      // Update local state immediately for snappy UI
      try {
        const localProducts = getLocalProducts();
        if (localProducts.length > 0) {
          setState(prev => ({
            ...prev,
            products: localProducts,
            transactions: [transaction, ...prev.transactions.slice(0, 9999)],
          }));
        } else {
          setState(prev => ({
            ...prev,
            transactions: [transaction, ...prev.transactions.slice(0, 9999)],
          }));
        }
      } catch {
        setState(prev => ({
          ...prev,
          transactions: [transaction, ...prev.transactions.slice(0, 9999)],
        }));
      }

      // Note: We don't trigger sync manually here.
      // The auto-sync interval (30s) in SyncContext will automatically pick this up
      // and sync it in the background without blocking the UI.
      
      return transaction;
    } catch (err: any) {
      console.error('[AppContext] Offline checkout failed:', err);
      throw err;
    }
  }, [user]);


  const updateSettings = useCallback(async (newSettings: Partial<BusinessSettings> & { shop_name?: string }): Promise<BusinessSettings> => {
    setIsServiceLoading(true);
    try {
      const next = await appApi.updateSettings(newSettings);
      setState(next);
      return next.settings;
    } catch (e) {
      console.error('Failed to update settings:', e);
      throw e;
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    setIsServiceLoading(true);
    try {
      const fullState = await appApi.addProduct(product);
      setState(prev => ({
        ...prev,
        products: fullState.products,
        categories: fullState.categories,
        categoriesWithId: fullState.categoriesWithId,
      }));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (product: Product) => {
    setIsServiceLoading(true);
    try {
      const fullState = await appApi.updateProduct(product);
      setState(prev => ({
        ...prev,
        products: fullState.products,
        categories: fullState.categories,
        categoriesWithId: fullState.categoriesWithId,
      }));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setIsServiceLoading(true);
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
      }));
      const fullState = await appApi.deleteProduct(id);
      setState(prev => ({
        ...prev,
        products: fullState.products,
        categories: fullState.categories,
        categoriesWithId: fullState.categoriesWithId,
      }));
    } catch (e) {
      // Rollback
      await refreshState();
      throw e;
    } finally {
      setIsServiceLoading(false);
    }
  }, [refreshState]);

  const addCategory = useCallback(async (name: string) => {
    setIsServiceLoading(true);
    try {
      const fullState = await appApi.addCategory(name);
      setState(prev => ({
        ...prev,
        categories: fullState.categories,
        categoriesWithId: fullState.categoriesWithId,
      }));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (name: string) => {
    setIsServiceLoading(true);
    try {
      const fullState = await appApi.deleteCategory(name);
      setState(prev => ({
        ...prev,
        categories: fullState.categories,
        categoriesWithId: fullState.categoriesWithId,
      }));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const addWasteLog = useCallback(async (waste: { productId: string; quantity: number; reason: string; notes?: string }) => {
    setIsServiceLoading(true);
    try {
      const fullState = await appApi.addWasteLog(waste);
      setState(prev => ({
        ...prev,
        wasteLogs: fullState.wasteLogs,
        products: fullState.products, // update products since stock decreases
      }));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const productsValue = useMemo(() => ({
    products: state.products,
    categories: state.categories,
    categoriesWithId: state.categoriesWithId,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
  }), [state.products, state.categories, state.categoriesWithId, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory]);

  const transactionsValue = useMemo(() => ({
    transactions: state.transactions,
    checkout,
    transactionsCacheFrom: state.transactionsCacheFrom,
    transactionsCacheTo: state.transactionsCacheTo,
    transactionsLimit: state.transactionsLimit,
  }), [state.transactions, checkout, state.transactionsCacheFrom, state.transactionsCacheTo, state.transactionsLimit]);

  const settingsValue = useMemo(() => ({
    settings: state.settings,
    updateSettings,
    customers: state.customers,
    wasteLogs: state.wasteLogs,
    isServiceLoading,
    serviceError,
    clearServiceError,
    refreshState,
    addWasteLog,
  }), [state.settings, updateSettings, state.customers, state.wasteLogs, isServiceLoading, serviceError, clearServiceError, refreshState, addWasteLog]);

  return (
    <SettingsContext.Provider value={settingsValue}>
      <TransactionsContext.Provider value={transactionsValue}>
        <ProductsContext.Provider value={productsValue}>
          {children}
        </ProductsContext.Provider>
      </TransactionsContext.Provider>
    </SettingsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error('useProducts must be used within AppProvider');
  return context;
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (!context) throw new Error('useTransactions must be used within AppProvider');
  return context;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within AppProvider');
  return context;
}

export function useApp() {
  const products = useProducts();
  const transactions = useTransactions();
  const settings = useSettings();

  return useMemo(
    () => ({ ...products, ...transactions, ...settings }),
    [products, transactions, settings]
  );
}
