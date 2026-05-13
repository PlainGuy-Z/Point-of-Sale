import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CartItemWithInput, Product } from '../types';
import { getEffectivePrice } from '../utils/priceUtils';

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItemWithInput[]>([]);

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
