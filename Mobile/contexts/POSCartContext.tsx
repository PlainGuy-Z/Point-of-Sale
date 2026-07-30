import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItemWithInput, Product } from '../types';
import { useApp } from './AppContext';
import { getEffectivePrice } from '../utils/priceUtils';

const CART_STORAGE_KEY = '@pos_mobile_cart_items';
const CHECKOUT_STORAGE_KEY = '@pos_mobile_checkout_data';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CheckoutData {
  orderType: 'dine-in' | 'take-away';
  tableNumber: string;
  customerName: string;
  orderNote: string;
  applyTax: boolean;
}

type CartPanel = 'cart' | 'checkout' | 'manual' | 'edit' | 'payment';

interface POSCartContextValue {
  // Cart items
  cart: CartItemWithInput[];
  setCart: React.Dispatch<React.SetStateAction<CartItemWithInput[]>>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  removeAtIndex: (index: number) => void;
  updateQuantity: (index: number, delta: number) => void;
  updateCartItem: (index: number, item: CartItemWithInput) => void;
  addCustomItem: (item: CartItemWithInput) => void;
  clearCart: () => void;

  // Checkout data
  checkout: CheckoutData;
  setOrderType: (type: 'dine-in' | 'take-away') => void;
  setTableNumber: (value: string) => void;
  setCustomerName: (value: string) => void;
  setOrderNote: (value: string) => void;
  setApplyTax: (value: boolean) => void;
  resetCheckout: () => void;

  // Panel navigation
  panel: CartPanel;
  setPanel: (panel: CartPanel) => void;
  editingItemIndex: number | null;
  setEditingItemIndex: (index: number | null) => void;

  // Computed
  subtotal: number;
  taxAmount: number;
  total: number;
  cartIsEmpty: boolean;
  totalItems: number;
  totalQuantity: number;
  getCheckoutData?: () => CheckoutData;
}

// ─── Default values ─────────────────────────────────────────────────────────────

const defaultCheckout: CheckoutData = {
  orderType: 'dine-in',
  tableNumber: '',
  customerName: '',
  orderNote: '',
  applyTax: false,
};

const POSCartStateContext = createContext<any>(undefined);
const POSCartActionsContext = createContext<any>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────────

export function POSCartProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  const [cart, setCart] = useState<CartItemWithInput[]>([]);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(() => ({
    ...defaultCheckout,
    applyTax: false,
  }));
  const [panel, setPanel] = useState<CartPanel>('cart');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const tableNumberRef = useRef('');
  const customerNameRef = useRef('');
  const orderNoteRef = useRef('');

  // Restore cart and checkout from AsyncStorage on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        const savedCheckout = await AsyncStorage.getItem(CHECKOUT_STORAGE_KEY);

        if (mounted) {
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (Array.isArray(parsedCart)) {
              setCart(parsedCart);
            }
          }
          if (savedCheckout) {
            const parsedCheckout = JSON.parse(savedCheckout);
            if (parsedCheckout && typeof parsedCheckout === 'object') {
              setCheckoutData(prev => ({ ...prev, ...parsedCheckout }));
              if (parsedCheckout.tableNumber) tableNumberRef.current = parsedCheckout.tableNumber;
              if (parsedCheckout.customerName) customerNameRef.current = parsedCheckout.customerName;
              if (parsedCheckout.orderNote) orderNoteRef.current = parsedCheckout.orderNote;
            }
          }
        }
      } catch (err) {
        console.error('Failed to load cart from AsyncStorage:', err);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Save cart to AsyncStorage whenever cart changes
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)).catch(err => {
      console.error('Failed to save cart to AsyncStorage:', err);
    });
  }, [cart, isLoaded]);

  // Save checkout to AsyncStorage whenever checkoutData changes
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({
      ...checkoutData,
      tableNumber: tableNumberRef.current,
      customerName: customerNameRef.current,
      orderNote: orderNoteRef.current,
    })).catch(err => {
      console.error('Failed to save checkout to AsyncStorage:', err);
    });
  }, [checkoutData, isLoaded]);

  const getCheckoutData = useCallback(() => ({
    ...checkoutData,
    tableNumber: tableNumberRef.current,
    customerName: customerNameRef.current,
    orderNote: orderNoteRef.current,
  }), [checkoutData]);

  // ── Cart operations ─────────────────────────────────────────────────────────

  const addToCart = useCallback((product: Product) => {
    if (product.stock === 0) return; // sold out guard

    const priceInfo = getEffectivePrice(product);

    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.productId === product.id);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        // Stock check
        if (product.stock !== -1 && existing.quantity >= product.stock) return prev;
        const updated = [...prev];
        updated[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return updated;
      }

      const newItem: CartItemWithInput = {
        productId: product.id,
        name: product.name,
        price: priceInfo.price,
        quantity: 1,
        isPromo: priceInfo.isPromoActive,
        originalPrice: priceInfo.isPromoActive ? product.price : undefined,
        promoLabel: product.promoLabel,
        image: product.image ?? undefined,
        note: product.name,
      };
      return [...prev, newItem];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.productId !== productId);
    });
  }, []);

  const removeAtIndex = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, delta: number) => {
    setCart(prev => {
      const item = prev[index];
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== index);
      const updated = [...prev];
      updated[index] = { ...item, quantity: newQty };
      return updated;
    });
  }, []);

  const updateCartItem = useCallback((index: number, item: CartItemWithInput) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index] = item;
      return updated;
    });
  }, []);

  const addCustomItem = useCallback((item: CartItemWithInput) => {
    setCart(prev => [...prev, item]);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
  }, []);

  // ── Checkout operations ─────────────────────────────────────────────────────

  const setOrderType = useCallback((type: 'dine-in' | 'take-away') => {
    setCheckoutData(prev => ({
      ...prev,
      orderType: type,
    }));
    if (type === 'take-away') {
      tableNumberRef.current = '';
    }
  }, []);

  const setTableNumber = useCallback((value: string) => {
    tableNumberRef.current = value;
    setCheckoutData(prev => ({ ...prev, tableNumber: value }));
  }, []);

  const setCustomerName = useCallback((value: string) => {
    customerNameRef.current = value;
    setCheckoutData(prev => ({ ...prev, customerName: value }));
  }, []);

  const setOrderNote = useCallback((value: string) => {
    orderNoteRef.current = value;
    setCheckoutData(prev => ({ ...prev, orderNote: value }));
  }, []);

  const setApplyTax = useCallback((value: boolean) => {
    setCheckoutData(prev => ({ ...prev, applyTax: value }));
  }, []);

  const resetCheckout = useCallback(() => {
    setCart([]);
    setCheckoutData({
      ...defaultCheckout,
      applyTax: false,
    });
    tableNumberRef.current = '';
    customerNameRef.current = '';
    orderNoteRef.current = '';
    setPanel('cart');
    setEditingItemIndex(null);
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
    AsyncStorage.removeItem(CHECKOUT_STORAGE_KEY).catch(() => {});
  }, []);

  // ── Computed ────────────────────────────────────────────────────────────────

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + (Number(i.price) + Number(i.variantPrice || 0)) * Number(i.quantity), 0),
    [cart]
  );

  const taxRate = settings?.tax_rate ?? settings?.taxRate ?? 11;
  const taxAmount = useMemo(
    () => (checkoutData.applyTax ? Math.round(subtotal * (taxRate / 100)) : 0),
    [subtotal, checkoutData.applyTax, taxRate]
  );

  const total = subtotal + taxAmount;
  const cartIsEmpty = cart.length === 0;
  const totalItems = cart.length;
  const totalQuantity = useMemo(
    () => cart.reduce((s, i) => s + i.quantity, 0),
    [cart]
  );

  // ── Value ───────────────────────────────────────────────────────────────────

  const cartActionsValue = useMemo(() => ({
    setCart,
    addToCart,
    removeFromCart,
    removeAtIndex,
    updateQuantity,
    updateCartItem,
    addCustomItem,
    clearCart,
    setOrderType,
    setTableNumber,
    setCustomerName,
    setOrderNote,
    setApplyTax,
    resetCheckout,
    setPanel,
    setEditingItemIndex,
    getCheckoutData,
  }), [
    addToCart, removeFromCart, removeAtIndex, updateQuantity,
    updateCartItem, addCustomItem, clearCart,
    setOrderType, setTableNumber, setCustomerName,
    setOrderNote, setApplyTax, resetCheckout,
    getCheckoutData
  ]);

  const cartStateValue = useMemo(() => ({
    cart,
    checkout: checkoutData,
    panel,
    editingItemIndex,
    subtotal,
    taxAmount,
    total,
    cartIsEmpty,
    totalItems,
    totalQuantity,
  }), [
    cart, checkoutData, panel, editingItemIndex,
    subtotal, taxAmount, total, cartIsEmpty, totalItems, totalQuantity,
  ]);

  return (
    <POSCartStateContext.Provider value={cartStateValue}>
      <POSCartActionsContext.Provider value={cartActionsValue}>
        {children}
      </POSCartActionsContext.Provider>
    </POSCartStateContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export const usePOSCartState = () => useContext(POSCartStateContext);
export const usePOSCartActions = () => useContext(POSCartActionsContext);

export function usePOSCart(): POSCartContextValue {
  const state = usePOSCartState();
  const actions = usePOSCartActions();
  
  if (!state || !actions) {
    throw new Error('usePOSCart must be used within POSCartProvider');
  }
  
  return { ...state, ...actions };
}
