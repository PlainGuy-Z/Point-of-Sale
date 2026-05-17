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
  checkout: (params: CheckoutParams) => Promise<Transaction>;
  refreshState: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: BusinessSettings = {
  storeName: 'Coffee Shop',
  address: 'Jl. Utama No. 123',
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

  const refreshState = useCallback(async () => {
    try {
      setIsServiceLoading(true);
      const next = await appApi.getAppState();
      setState(next);
    } catch (e) {
      console.error('Failed to load state:', e);
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let mounted = true;
    (async () => {
      try {
        setIsServiceLoading(true);
        const next = await appApi.getAppState();
        if (mounted) setState(next);
      } catch (e) {
        console.error('Failed to load state from backend:', e);
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

  const value = useMemo<AppContextType>(
    () => ({
      ...state,
      isServiceLoading,
      checkout,
      refreshState,
    }),
    [state, isServiceLoading, checkout, refreshState]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
