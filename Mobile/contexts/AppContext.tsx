import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { Product, Transaction, WasteLog, Customer, BusinessSettings, CheckoutParams, CartItemWithInput, AppDataState } from '../types';
import { appApi, normalizeAppStateWire, type AppStateWire } from '../services/appApi';
import { posApi } from '../services/posApi';
import { useAuth } from './AuthContext';

interface AppContextType {
  products: Product[];
  transactions: Transaction[];
  wasteLogs: WasteLog[];
  customers: Customer[];
  settings: BusinessSettings;
  categories: string[];
  categoriesWithId: { id: string; name: string }[];
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
  const { status } = useAuth();
  const [state, setState] = useState<AppDataState>({
    products: [],
    transactions: [],
    wasteLogs: [],
    customers: [],
    settings: defaultSettings,
    categories: [],
    categoriesWithId: [],
  });
  const [isServiceLoading, setIsServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const clearServiceError = useCallback(() => {
    setServiceError(null);
  }, []);

  const refreshState = useCallback(async () => {
    try {
      setIsServiceLoading(true);
      setServiceError(null);
      const next = await appApi.getAppState();
      setState(next);
    } catch (e: any) {
      console.error('Failed to load state:', e);
      setServiceError(e?.message || 'Gagal memuat data dari server. Periksa koneksi internet Anda.');
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

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
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setIsServiceLoading(true);
        setServiceError(null);
        const next = await appApi.getAppState();
        if (mounted) setState(next);
      } catch (e: any) {
        console.error('Failed to load state from backend:', e);
        if (mounted) {
          setServiceError(e?.message || 'Gagal terhubung ke server backend.');
        }
      } finally {
        if (mounted) setIsServiceLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [status]);

  const checkout = useCallback(async (params: CheckoutParams) => {
    setIsServiceLoading(true);
    try {
      const { transaction, appState } = await posApi.createTransaction({
        cart: params.cart.map((i: CartItemWithInput) => ({
          productId: i.productId,
          quantity: i.quantity,
          note: i.note,
          modifiers: i.modifiers,
          description: i.description,
          variantName: i.variantName,
          variantPrice: i.variantPrice,
          ...(i.productId.startsWith('manual-') ? { price: i.price } : {}),
        })),
        paymentMethod: params.paymentMethod,
        customerId: params.selectedCustomer,
        customerName: params.customCustomerName,
        orderType: params.orderType,
        tableNumber: params.tableNumber,
        cashReceived: params.cashReceived,
        orderNote: params.orderNote,
        notes: params.notes,
        applyTax: params.applyTax,
      });

      const normalized = normalizeAppStateWire(appState as AppStateWire);
      setState(prev => ({
        ...prev,
        products: normalized.products,
        transactions: [transaction, ...prev.transactions.slice(0, 199)],
      }));
      return transaction;
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

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

  const value = useMemo<AppContextType>(
    () => ({
      ...state,
      isServiceLoading,
      serviceError,
      clearServiceError,
      checkout,
      refreshState,
      updateSettings,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      deleteCategory,
    }),
    [
      state,
      isServiceLoading,
      serviceError,
      clearServiceError,
      checkout,
      refreshState,
      updateSettings,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      deleteCategory,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
