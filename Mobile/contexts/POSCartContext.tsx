import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { CartItemWithInput, Product } from '../types';
import { useApp } from './AppContext';
import { getEffectivePrice } from '../utils/priceUtils';

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
}

// ─── Default values ─────────────────────────────────────────────────────────────

const defaultCheckout: CheckoutData = {
  orderType: 'dine-in',
  tableNumber: '',
  customerName: '',
  orderNote: '',
  applyTax: false,
};

const POSCartContext = createContext<POSCartContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────────

export function POSCartProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  const [cart, setCart] = useState<CartItemWithInput[]>([]);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(() => ({
    ...defaultCheckout,
    applyTax: settings?.tax_enabled ?? settings?.taxEnabled ?? false,
  }));
  const [panel, setPanel] = useState<CartPanel>('cart');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Sync applyTax with business settings when they load or update
  useEffect(() => {
    const taxEnabled = settings?.tax_enabled ?? settings?.taxEnabled ?? false;
    setCheckoutData(prev => ({
      ...prev,
      applyTax: taxEnabled,
    }));
  }, [settings?.tax_enabled, settings?.taxEnabled]);

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
  }, []);

  // ── Checkout operations ─────────────────────────────────────────────────────

  const setOrderType = useCallback((type: 'dine-in' | 'take-away') => {
    setCheckoutData(prev => ({
      ...prev,
      orderType: type,
      tableNumber: type === 'take-away' ? '' : prev.tableNumber,
    }));
  }, []);

  const setTableNumber = useCallback((value: string) => {
    setCheckoutData(prev => ({ ...prev, tableNumber: value }));
  }, []);

  const setCustomerName = useCallback((value: string) => {
    setCheckoutData(prev => ({ ...prev, customerName: value }));
  }, []);

  const setOrderNote = useCallback((value: string) => {
    setCheckoutData(prev => ({ ...prev, orderNote: value }));
  }, []);

  const setApplyTax = useCallback((value: boolean) => {
    setCheckoutData(prev => ({ ...prev, applyTax: value }));
  }, []);

  const resetCheckout = useCallback(() => {
    setCart([]);
    setCheckoutData({
      ...defaultCheckout,
      applyTax: settings?.tax_enabled ?? settings?.taxEnabled ?? false,
    });
    setPanel('cart');
    setEditingItemIndex(null);
  }, [settings?.tax_enabled, settings?.taxEnabled]);

  // ── Computed ────────────────────────────────────────────────────────────────

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + (i.price + (i.variantPrice || 0)) * i.quantity, 0),
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

  const value = useMemo<POSCartContextValue>(
    () => ({
      cart,
      setCart,
      addToCart,
      removeFromCart,
      removeAtIndex,
      updateQuantity,
      updateCartItem,
      addCustomItem,
      clearCart,
      checkout: checkoutData,
      setOrderType,
      setTableNumber,
      setCustomerName,
      setOrderNote,
      setApplyTax,
      resetCheckout,
      panel,
      setPanel,
      editingItemIndex,
      setEditingItemIndex,
      subtotal,
      taxAmount,
      total,
      cartIsEmpty,
      totalItems,
      totalQuantity,
    }),
    [
      cart, addToCart, removeFromCart, removeAtIndex, updateQuantity,
      updateCartItem, addCustomItem, clearCart,
      checkoutData, setOrderType, setTableNumber, setCustomerName,
      setOrderNote, setApplyTax, resetCheckout,
      panel, editingItemIndex,
      subtotal, taxAmount, total, cartIsEmpty, totalItems, totalQuantity,
    ]
  );

  return (
    <POSCartContext.Provider value={value}>
      {children}
    </POSCartContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function usePOSCart() {
  const context = useContext(POSCartContext);
  if (!context) {
    throw new Error('usePOSCart must be used within POSCartProvider');
  }
  return context;
}
