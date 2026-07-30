/* eslint-disable react-refresh/only-export-components -- Provider + hook in one module */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CartItemWithInput, Product } from '../types';
import { getEffectivePrice } from '../utils/priceUtils';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: CartItemWithInput[];
  setCart: React.Dispatch<React.SetStateAction<CartItemWithInput[]>>;
  addToCart: (product: Product) => boolean;
  addCustomItem: (item: CartItemWithInput) => void;
  removeFromCart: (index: number) => void;
  updateCartItem: (index: number, item: CartItemWithInput) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'coffee_pos_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [cart, setCart] = useState<CartItemWithInput[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setCart([]);
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [status]);

  const addToCart = useCallback((product: Product) => {
    if (product.isAvailable === false) return false;
    if (product.stock !== -1 && product.stock <= 0) return false;

    const { price: priceToUse, isPromoActive } = getEffectivePrice(product);
    let itemAdded = false;

    setCart(prev => {
      const existingIndex = prev.findIndex(item =>
        item.productId === product.id &&
        !item.note &&
        !item.variantName &&
        (!item.modifiers || item.modifiers.length === 0)
      );

      if (existingIndex >= 0) {
        const newCart = [...prev];
        if (product.stock === -1 || newCart[existingIndex].quantity + 1 <= product.stock) {
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: newCart[existingIndex].quantity + 1,
          };
          itemAdded = true;
        }
        return newCart;
      }

      const newItem: CartItemWithInput = {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: priceToUse,
        modifiers: [],
      };

      if (isPromoActive) {
        newItem.isPromo = true;
        newItem.originalPrice = product.price;
        newItem.promoPrice = priceToUse;
        newItem.promoLabel = product.promoLabel;
      }

      itemAdded = true;
      return [...prev, newItem];
    });

    return itemAdded;
  }, []);

  const addCustomItem = useCallback((item: CartItemWithInput) => {
    setCart(prev => [...prev, item]);
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  }, []);

  const updateCartItem = useCallback((index: number, item: CartItemWithInput) => {
    setCart(prev => {
      const next = [...prev];
      if (index < 0 || index >= next.length) return prev;
      next[index] = item;
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, setCart, addToCart, addCustomItem, removeFromCart, updateCartItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
