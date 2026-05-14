import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Trash2, User, Plus, PlusCircle,
  Flame, Trophy, TrendingUp, Zap, ChevronRight,
  Package, CreditCard, ReceiptText, Pencil, Hash,
  MessageSquare, ArrowLeft, ChevronUp, X
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCart } from '../../contexts/CartContext';
import { useProductCatalog } from '../../hooks/useProductCatalog';
import { getRecentSalesMapByPeriod } from '../../utils/analytics/productAnalytics';
import ProductGrid from '../../components/pos/ProductGrid';
import CategoryPills from '../../components/pos/CategoryPills';
import PaymentModal from '../../components/pos/PaymentModal';
import CheckoutDetailsForm from '../../components/pos/CheckoutDetailsForm';
import ReceiptModal from '../../components/pos/ReceiptModal';
import CartItemEditPanel from '../../components/pos/CartItemEditPanel';
import MobileCart from '../../components/pos/MobileCart';
import MobileCategoryCarousel from '../../components/pos/MobileCategoryCarousel.tsx';
import type { Transaction, TransactionItem, CartItemWithInput, Product } from '../../types';
import { ApiError } from '../../services/appApi';
import { posApi } from '../../services/posApi';
import { getEffectivePrice } from '../../utils/priceUtils';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import ShiftOpenModal from '../../components/shift/ShiftOpenModal';
import PointOfSaleSkeleton from '../../components/pos/PointOfSaleSkeleton';

// ─── Hooks ────────────────────────────────────────────────────────────────────

const useResponsive = () => {
  const [responsive, setResponsive] = useState({
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
    isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
  });

  useEffect(() => {
    const handler = () => {
      setResponsive({
        isMobile: window.innerWidth < 1024,
        isLandscape: window.innerWidth > window.innerHeight,
      });
    };
    
    handler(); // Init
    
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  return responsive;
};

interface CategoryCarousel {
  categoryName: string;
  totalSales: number;
  products: Product[];
}

function useCategoryCarousels(
  products: Product[],
  transactions: Transaction[],
  periodDays: number,
  searchTerm: string = ''
): CategoryCarousel[] {
  return useMemo(() => {
    const salesMap = getRecentSalesMapByPeriod(transactions, periodDays);
    const searchLower = searchTerm.toLowerCase().trim();
    const availableProducts = products
      .filter(product => {
        const isAvailable = product.isAvailable !== false && product.stock !== 0;
        if (!isAvailable) return false;
        if (!searchLower) return true;
        return product.name.toLowerCase().includes(searchLower) || product.category?.toLowerCase().includes(searchLower);
      })
      .map(product => ({
        ...product,
        recentSalesCount: salesMap.get(product.id) || 0
      }));

    const grouped = new Map<string, { products: Product[]; totalSales: number }>();

    for (const product of availableProducts) {
      const categoryName = product.category || 'Lainnya';
      const productSales = product.recentSalesCount || 0;
      const entry = grouped.get(categoryName) || { products: [], totalSales: 0 };
      entry.products.push(product);
      entry.totalSales += productSales;
      grouped.set(categoryName, entry);
    }

    const categories = Array.from(grouped.entries()).map(([categoryName, bucket]) => ({
      categoryName,
      totalSales: bucket.totalSales,
      products: bucket.products
        .slice()
        .sort((a, b) => {
          const delta = (b.recentSalesCount || 0) - (a.recentSalesCount || 0);
          return delta !== 0 ? delta : a.name.localeCompare(b.name);
        })
        .slice(0, 10),
    }));

    const top10Overall = [...availableProducts]
      .sort((a, b) => {
        const delta = (b.recentSalesCount || 0) - (a.recentSalesCount || 0);
        return delta !== 0 ? delta : a.name.localeCompare(b.name);
      })
      .slice(0, 10);

    const sortedCategories = categories.sort((a, b) => b.totalSales - a.totalSales);

    return [
      {
        categoryName: 'Semua',
        totalSales: Number.POSITIVE_INFINITY,
        products: top10Overall,
      },
      ...sortedCategories,
    ];
  }, [products, transactions, periodDays, searchTerm]);
}

// ─── Panel view type ──────────────────────────────────────────────────────────
type CartPanel = 'cart' | 'checkout' | 'manual' | 'edit';

// ─── Bottom Sheet height states ───────────────────────────────────────────────
type SheetState = 'collapsed' | 'peek' | 'expanded';

// ─── Swipe state per item ─────────────────────────────────────────────────────
interface SwipeState {
  activeIndex: number | null;
  startX: number;
  currentX: number;
  isConfirmedSwipe: boolean; // true once horizontal intent is confirmed
}

export default function PointOfSale() {
  const createManualItemId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `manual-${crypto.randomUUID()}`
      : `manual-${Date.now()}`;

  const { products, customers, checkout, transactions, isServiceLoading } = useApp();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { activeShift, isLoading: shiftLoading, refreshShift } = useShift();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  const { isMobile, isLandscape } = useResponsive();
  const isMobileLandscape = isMobile && isLandscape;
  const showMobilePortrait = isMobile && !isLandscape;
  const showDesktopLayout = !isMobile || isLandscape;

  // ── Catalog ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [bestSellerPeriod, setBestSellerPeriod] = useState<number>(() => {
    const saved = localStorage.getItem('posBestSellerPeriod');
    return saved ? parseInt(saved) : 3;
  });

  // ── Cart ─────────────────────────────────────────────────────────────────────
  const { cart, setCart, addToCart: addProductToCart, addCustomItem, removeFromCart: removeCartItem, updateCartItem, clearCart } = useCart();
  const [selectedCustomer, setSelectedCustomer] = useState<string>();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isCheckoutDetailsFormOpen, setCheckoutDetailsFormOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [shiftGateOpen, setShiftGateOpen] = useState(false);

  // ── Swipe-to-delete (mobile) ─────────────────────────────────────────────────
  const [revealedDeleteIndex, setRevealedDeleteIndex] = useState<number | null>(null);
  const swipeRef = useRef<SwipeState>({
    activeIndex: null,
    startX: 0,
    currentX: 0,
    isConfirmedSwipe: false,
  });
  const swipeStartYRef = useRef<number>(0);
  const swipeIntentLockedRef = useRef<'none' | 'horizontal' | 'vertical'>('none');

  const resetSwipe = useCallback(() => {
    setRevealedDeleteIndex(null);
    swipeRef.current = { activeIndex: null, startX: 0, currentX: 0, isConfirmedSwipe: false };
    swipeIntentLockedRef.current = 'none';
  }, []);

  const handleCartItemTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeRef.current = {
      activeIndex: index,
      startX: touch.clientX,
      currentX: touch.clientX,
      isConfirmedSwipe: false,
    };
    swipeStartYRef.current = touch.clientY;
    swipeIntentLockedRef.current = 'none';
    if (revealedDeleteIndex !== null && revealedDeleteIndex !== index) {
      setRevealedDeleteIndex(null);
    }
  }, [revealedDeleteIndex]);

  const handleCartItemTouchMove = useCallback((index: number, e: React.TouchEvent) => {
    const s = swipeRef.current;
    if (s.activeIndex !== index) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - s.startX;
    const deltaY = touch.clientY - swipeStartYRef.current;

    if (swipeIntentLockedRef.current === 'none') {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        swipeIntentLockedRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }
    }

    if (swipeIntentLockedRef.current !== 'horizontal') return;

    e.preventDefault();

    swipeRef.current.currentX = touch.clientX;
    const clampedDelta = Math.max(-88, Math.min(0, deltaX));

    if (clampedDelta <= -44) {
      setRevealedDeleteIndex(index);
    } else {
      setRevealedDeleteIndex(null);
    }
  }, []);

  const handleCartItemTouchEnd = useCallback((index: number) => {
    const s = swipeRef.current;
    if (s.activeIndex !== index) return;

    const deltaX = s.currentX - s.startX;

    if (swipeIntentLockedRef.current === 'horizontal') {
      if (deltaX <= -44) {
        setRevealedDeleteIndex(index);
      } else {
        setRevealedDeleteIndex(null);
      }
    }

    swipeRef.current = { ...s, activeIndex: null, isConfirmedSwipe: false };
  }, []);

  // ── Mobile Bottom Sheet ───────────────────────────────────────────────────────
  const [sheetState, setSheetState] = useState<SheetState>('collapsed');

  useEffect(() => {
    if (cart.length === 0 && sheetState !== 'collapsed') {
      setSheetState('collapsed');
    }
  }, [cart.length, sheetState]);

  // ── Panel ────────────────────────────────────────────────────────────────────
  const [panel, setPanel] = useState<CartPanel>('cart');

  // ── Order details ────────────────────────────────────────────────────────────
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away'>('dine-in');
  const [orderNote, setOrderNote] = useState('');

  // ── Tax toggle ───────────────────────────────────────────────────────────────
  const [taxEnabled, setTaxEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pos_tax_enabled');
    if (saved !== null) return saved === 'true';
    return settings?.tax_enabled ?? true;
  });

  useEffect(() => {
    localStorage.setItem('pos_tax_enabled', String(taxEnabled));
  }, [taxEnabled]);

  const [quote, setQuote] = useState<{
    subtotal: number;
    tax: number;
    serviceCharge: number;
    grandTotal: number;
    taxRate?: number;
    taxLabel?: string;
    serviceChargeRate?: number;
    serviceChargeLabel?: string;
  }>({
    subtotal: 0,
    tax: 0,
    serviceCharge: 0,
    grandTotal: 0,
    taxRate: settings?.tax_rate || 0,
  });
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  // ── Manual item ──────────────────────────────────────────────────────────────
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [manualItemCategory, setManualItemCategory] = useState('');
  const [manualItemDescription, setManualItemDescription] = useState('');
  const [manualItemVariantName, setManualItemVariantName] = useState('');
  const [manualItemVariantPrice, setManualItemVariantPrice] = useState('');
  const [manualItemQuantity, setManualItemQuantity] = useState(1);
  const manualNameRef = useRef<HTMLInputElement>(null);

  // ── Product catalog ──────────────────────────────────────────────────────────
  const { sortedProducts, topBestSellers, promoProductsCount } = useProductCatalog(
    products, transactions, search, selectedCategory, bestSellerPeriod
  );
  const categoryCarousels = useCategoryCarousels(products, transactions, bestSellerPeriod, search);

  useEffect(() => {
    localStorage.setItem('posBestSellerPeriod', bestSellerPeriod.toString());
  }, [bestSellerPeriod]);

  useEffect(() => {
    if (panel === 'manual') {
      setTimeout(() => manualNameRef.current?.focus(), 150);
    }
  }, [panel]);

  // ── Stock validation ─────────────────────────────────────────────────────────
  const validateStock = useCallback((productId: string, currentQuantity: number, delta: number): boolean => {
    if (productId.startsWith('manual-')) return true;
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    if (product.stock === -1) return true;
    const newQuantity = currentQuantity + delta;
    return newQuantity > 0 && newQuantity <= product.stock;
  }, [products]);

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const resetManualForm = () => {
    setManualItemName('');
    setManualItemPrice('');
    setManualItemCategory('');
    setManualItemDescription('');
    setManualItemVariantName('');
    setManualItemVariantPrice('');
    setManualItemQuantity(1);
  };

  const buildManualItem = (): CartItemWithInput | null => {
    if (!manualItemName.trim() || !manualItemPrice) return null;
    const price = parseFloat(manualItemPrice.replace(/\./g, ''));
    if (isNaN(price) || price <= 0) return null;
    const variantPrice = parseFloat(manualItemVariantPrice.replace(/\./g, '')) || 0;
    const name = manualItemName.trim().charAt(0).toUpperCase() + manualItemName.trim().slice(1);
    return {
      productId: createManualItemId(),
      name,
      quantity: manualItemQuantity > 0 ? manualItemQuantity : 1,
      price,
      note: name,
      description: manualItemDescription.trim() || undefined,
      variantName: manualItemVariantName.trim() || undefined,
      variantPrice: variantPrice > 0 ? variantPrice : undefined,
      modifiers: manualItemCategory.trim() ? [manualItemCategory.trim()] : [],
    };
  };

  const addManualItemToCart = () => {
    const item = buildManualItem();
    if (!item) { alert('Masukkan nama dan harga yang valid'); return; }
    addCustomItem(item);
    resetManualForm();
    setPanel('cart');
  };

  const quickPayManualItem = () => {
    if (isPaymentModalOpen) return;
    const item = buildManualItem();
    if (!item) { alert('Masukkan nama dan harga yang valid'); return; }
    addCustomItem(item);
    resetManualForm();
    setPanel('cart');
    if (blockCheckoutForShift()) return;
    setPaymentModalOpen(true);
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    addProductToCart(product);
  };

  const updateQuantity = (index: number, delta: number) => {
    if (!validateStock(cart[index].productId, cart[index].quantity, delta)) return;
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const newQty = item.quantity + delta;
      if (newQty > 0) { newCart[index] = { ...item, quantity: newQty, tempInput: undefined }; return newCart; }
      return prev;
    });
  };

  const removeFromCart = (index: number) => {
    resetSwipe();
    removeCartItem(index);
  };

  const handleUpdateCartItem = (updatedItem: TransactionItem) => {
    if (editingItemIndex !== null) {
      updateCartItem(editingItemIndex, { ...updatedItem as CartItemWithInput });
      setEditingItemIndex(null);
      setPanel('cart');
    }
  };

  // ── Backend quote ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cart.length) {
        setQuote({
          subtotal: 0,
          tax: 0,
          serviceCharge: 0,
          grandTotal: 0,
          taxRate: settings?.tax_rate || 0
        });
        return;
      }
      setIsQuoteLoading(true);
      try {
        const res = await posApi.quote({
          cart: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            note: i.note,
            modifiers: i.modifiers,
            variantName: i.variantName,
            variantPrice: i.variantPrice,
            description: i.description,
            ...(i.productId.startsWith('manual-') ? { price: i.price } : {}),
          })),
          customerId: selectedCustomer, customerName: customCustomerName,
          orderType, tableNumber: orderType === 'dine-in' ? tableNumber : undefined, orderNote,
          applyTax: taxEnabled,
        });
        if (!cancelled) setQuote(res);
      } catch (e) {
        console.error('Quote failed:', e);
        if (!cancelled) setQuote({ subtotal: 0, tax: 0, serviceCharge: 0, grandTotal: 0, taxRate: settings?.tax_rate || 0 });
      } finally { if (!cancelled) setIsQuoteLoading(false); }
    };
    const t = window.setTimeout(run, 250);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [cart, selectedCustomer, customCustomerName, orderType, tableNumber, orderNote, settings, taxEnabled]);

  const cartIsEmpty = cart.length === 0;
  const canPay = !cartIsEmpty && !isServiceLoading && !isQuoteLoading && quote.grandTotal > 0;

  const cashierNeedsShift =
    user?.role === 'cashier' && !shiftLoading && !activeShift;

  const blockCheckoutForShift = () => {
    if (cashierNeedsShift) {
      setShiftGateOpen(true);
      return true;
    }
    return false;
  };

  // ── Payment ──────────────────────────────────────────────────────────────────
  const handleCheckout = useCallback(
    async (method: 'cash' | 'card' | 'qris', cashReceived?: number, change?: number) =>
      await checkout({
        cart: cart.map(item => ({
          ...item,
          variantName: item.variantName,
          variantPrice: item.variantPrice,
          description: item.description
        })),
        paymentMethod: method,
        selectedCustomer,
        customCustomerName,
        orderType,
        tableNumber,
        cashReceived,
        change,
        orderNote,
        notes: orderNote,
        applyTax: taxEnabled
      }),
    [checkout, cart, selectedCustomer, customCustomerName, orderType, tableNumber, orderNote, taxEnabled],
  );

  const handlePaymentSuccess = async (method: 'cash' | 'card' | 'qris', cashReceived?: number, change?: number) => {
    if (cartIsEmpty) return;
    try {
      const transaction = await handleCheckout(method, cashReceived, change);
      setCart([]);
      setSelectedCustomer(undefined);
      setCustomCustomerName('');
      setTableNumber('');
      setOrderNote('');
      setPanel('cart');
      setPaymentModalOpen(false);
      setCheckoutDetailsFormOpen(false);
      setReceiptTransaction(transaction);
      setSheetState('collapsed');
      await refreshShift();
    } catch (error) {
      const err = error as unknown;
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === 'INSUFFICIENT_STOCK') {
          alert('Stok tidak cukup. Cek stok lalu coba lagi.');
          return;
        }
        alert(`Checkout gagal: ${err.message}`);
        return;
      }
      alert(`Checkout failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCheckoutDetailsSubmit = () => {
    if (blockCheckoutForShift()) return;
    setCheckoutDetailsFormOpen(false);
    setPaymentModalOpen(true);
  };

  const quickPayCart = () => {
    if (!canPay) return;
    if (blockCheckoutForShift()) return;
    setPanel('cart');
    setPaymentModalOpen(true);
  };

  // ── Misc ─────────────────────────────────────────────────────────────────────
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const editingItem = editingItemIndex !== null ? cart[editingItemIndex] : null;
  const editingProduct = editingItem
    ? (products.find(p => p.id === editingItem.productId) || ({
      id: editingItem.productId, name: editingItem.note || 'Manual Item',
      price: editingItem.price, stock: 999, minStock: 0, category: 'Custom',
      cost: editingItem.cost, unit: 'pcs', image: null, isPromo: false,
      isBestSeller: false, recentSalesCount: 0, bestSellerRank: 0,
      promoPrice: 0, promoLabel: '', salesCount: 0, bestSellerPeriod: 0,
      bestSellerUpdatedAt: new Date().toISOString(), discount: 0,
    } as Product))
    : null;

  const handleOrderType = (type: 'dine-in' | 'take-away') => {
    setOrderType(type);
    if (type === 'take-away') setTableNumber('');
  };

  const handleTableNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ([8, 9, 27, 13, 46].includes(e.keyCode) ||
      (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
      (e.keyCode >= 35 && e.keyCode <= 39) ||
      (e.keyCode >= 48 && e.keyCode <= 57) ||
      (e.keyCode >= 96 && e.keyCode <= 105)) return;
    e.preventDefault();
  };

  const quickPrices = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000];

  // ─────────────────────────────────────────────────────────────────────────────
  // CART ITEM — extracted for clarity
  // ─────────────────────────────────────────────────────────────────────────────
  const renderCartItem = (item: CartItemWithInput, idx: number) => {
    const product = products.find(p => p.id === item.productId);
    const itemName = product ? product.name : (item.note || 'Custom Item');
    const isPromoItem = item.isPromo && item.originalPrice;
    const basePrice = item.price + (item.variantPrice || 0);
    const lineTotal = basePrice * item.quantity;
    const isManual = item.productId.startsWith('manual-');
    const isRevealed = revealedDeleteIndex === idx;

    const cardBg = isPromoItem
      ? isDark ? 'bg-red-900/15 border-red-800/30' : 'bg-red-50 border border-red-200'
      : isManual
        ? isDark ? 'bg-amber-900/10 border-amber-800/20' : 'bg-blue-50 border border-blue-200'
        : isDark ? 'bg-stone-900/60 border-stone-800' : 'bg-[#F8FAFC] border border-[#E2E8F0]';

    return (
      <div
        key={`${item.productId}-${idx}`}
        className="relative"
        onClick={() => {
          if (isRevealed) resetSwipe();
        }}
      >
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex"
            style={{
              transform: isRevealed ? 'translateX(-80px)' : 'translateX(0)',
              transition: 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onTouchStart={e => handleCartItemTouchStart(idx, e)}
            onTouchMove={e => handleCartItemTouchMove(idx, e)}
            onTouchEnd={() => handleCartItemTouchEnd(idx)}
          >
            {/* ── Card ── */}
            <div className={`flex-shrink-0 w-full rounded-2xl border transition-colors ${cardBg}`}>
              <div className="flex items-center gap-2 p-3">
                {/* Info — tappable to edit */}
                <div
                  className="flex-1 min-w-0 cursor-pointer active:opacity-70"
                  onClick={e => {
                    e.stopPropagation();
                    if (isRevealed) { resetSwipe(); return; }
                    setEditingItemIndex(idx);
                    setPanel('edit');
                  }}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isManual && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide ${isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-100 text-blue-600'}`}>
                        Custom
                      </span>
                    )}
                    {isPromoItem && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide ${isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600'}`}>
                        {item.promoLabel || 'Promo'}
                      </span>
                    )}
                  </div>
                  <p className={`font-bold text-sm truncate mt-0.5 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                    {itemName}
                    {item.description && (
                      <span className="font-normal italic opacity-60"> — {item.description}</span>
                    )}
                  </p>
                  {item.variantName && (
                    <p className={`text-[10px] font-medium mt-0.5 ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                      + {item.variantName} ({format(item.variantPrice || 0)})
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {isPromoItem && (
                      <span className={`text-[10px] line-through ${isDark ? 'text-stone-600' : 'text-[#94A3B8]'}`}>
                        {format(item.originalPrice!)}
                      </span>
                    )}
                    <span className={`text-xs font-black ${isPromoItem
                      ? isDark ? 'text-red-400' : 'text-red-600 font-black'
                      : isDark ? 'text-amber-400' : 'text-teal-700 font-black'
                      }`}>
                      {format(basePrice)}
                    </span>
                  </div>
                </div>

                {/* Qty stepper */}
                <div
                  className="flex items-center gap-1"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => updateQuantity(idx, -1)}
                    disabled={item.quantity <= 1}
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-xl text-base font-black
                      transition-all active:scale-90 disabled:opacity-30 select-none
                      ${isDark
                        ? 'bg-stone-800 hover:bg-amber-500 hover:text-white text-stone-300'
                        : 'bg-[#F1F5F9] hover:bg-teal-500 hover:text-white text-[#475569]'}
                    `}
                    style={{ minWidth: 32, minHeight: 32 }}
                  >
                    −
                  </button>
                  <span className={`w-7 text-center text-sm font-black tabular-nums select-none ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(idx, 1)}
                    disabled={!!product && product.stock !== -1 && item.quantity >= product.stock}
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-xl text-base font-black
                      transition-all active:scale-90 disabled:opacity-30 select-none
                      ${isDark
                        ? 'bg-stone-800 hover:bg-amber-500 hover:text-white text-stone-300'
                        : 'bg-[#F1F5F9] hover:bg-teal-500 hover:text-white text-[#475569]'}
                    `}
                    style={{ minWidth: 32, minHeight: 32 }}
                  >
                    +
                  </button>
                </div>

                {/* Line total */}
                <div className="text-right" style={{ minWidth: 56 }}>
                  <p className={`text-sm font-black tabular-nums ${isPromoItem
                    ? isDark ? 'text-red-400' : 'text-red-600'
                    : isDark ? 'text-amber-400' : 'text-teal-700'
                    }`}>
                    {format(lineTotal)}
                  </p>
                </div>

                {/* Desktop-only inline delete */}
                <button
                  onClick={e => { e.stopPropagation(); removeFromCart(idx); }}
                  className={`
                    hidden lg:flex items-center justify-center w-7 h-7 rounded-xl
                    transition-all active:scale-90
                    ${isDark
                      ? 'text-stone-700 hover:text-red-400 hover:bg-red-400/10'
                      : 'text-[#CBD5E1] hover:text-red-500 hover:bg-red-50'}
                  `}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* MOBILE DELETE ZONE */}
            <div
              className="lg:hidden flex-shrink-0 flex items-center justify-center bg-red-500 rounded-2xl ml-2"
              style={{ width: 68 }}
              onClick={e => {
                e.stopPropagation();
                removeFromCart(idx);
              }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <Trash2 size={18} className="text-white" />
                <span className="text-[9px] font-black text-white uppercase tracking-wide">Hapus</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // CART CONTENT (shared between desktop panel & mobile sheet)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderCartContent = () => (
    <>
      {/* ── Panel: CART ──────────────────────────────────────────────────── */}
      {panel === 'cart' && (
        <>
          {/* Cart header */}
          <div className={`flex-shrink-0 px-5 py-4 border-b flex items-center justify-between lg:flex ${isMobile ? 'hidden' : 'flex'} ${isDark ? 'border-stone-900 bg-stone-950/40' : 'border-[#E2E8F0] bg-white'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-teal-50 text-teal-600'}`}>
                <ShoppingCart size={16} />
              </div>
              <div>
                <h3 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                  Shopping Cart
                </h3>
                {!cartIsEmpty && (
                  <p className={`text-[10px] font-bold ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} item dipilih
                  </p>
                )}
              </div>
            </div>
            {!cartIsEmpty && (
              <button
                onClick={() => setCart([])}
                className={`p-2 rounded-xl transition-all ${isDark ? 'text-stone-700 hover:text-red-400 hover:bg-red-400/10' : 'text-[#CBD5E1] hover:text-red-500 hover:bg-red-50'}`}
                title="Kosongkan keranjang"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Cart items */}
          <div
            className="flex-1 overflow-y-auto horizontal-scrollbar-thin"
            onClick={() => { if (revealedDeleteIndex !== null) resetSwipe(); }}
          >
            {cartIsEmpty ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] opacity-20 ${isDark ? 'bg-amber-500' : 'bg-amber-300'}`} />
                <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-[#E2E8F0] shadow-amber-500/5'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                      <ShoppingCart size={24} />
                    </div>
                  </div>
                  <h4 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                    Keranjang kosong
                  </h4>
                  <p className={`text-sm mt-2 max-w-[200px] leading-relaxed ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
                    Pilih menu untuk memulai transaksi
                  </p>
                  <button
                    onClick={() => setPanel('manual')}
                    className={`mt-8 flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${isDark
                      ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-black text-white hover:bg-[#1a1614] shadow-lg shadow-black/10'
                      }`}
                  >
                    <Plus size={14} />
                    Item Custom
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {/* Add manual item shortcut */}
                <button
                  onClick={() => setPanel('manual')}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold border border-dashed transition-all active:scale-[0.98] ${isDark
                    ? 'border-stone-800 text-stone-500 hover:border-amber-500/50 hover:text-amber-400'
                    : 'border-[#CBD5E1] text-[#0F172A] hover:border-teal-500 hover:text-teal-700 shadow-sm'
                    }`}
                >
                  <PlusCircle size={13} /> Tambah Item Manual
                </button>

                {/* Swipe hint */}
                {isMobile && cart.length > 0 && revealedDeleteIndex === null && (
                  <p className={`text-center text-[10px] font-bold pb-0.5 ${isDark ? 'text-stone-700' : 'text-red-500'}`}>
                    ← geser untuk hapus
                  </p>
                )}

                {cart.map((item, idx) => renderCartItem(item, idx))}
              </div>
            )}
          </div>

          {/* Footer: summary + action buttons */}
          <div className={`flex-shrink-0 border-t p-4 space-y-3 ${isDark ? 'border-stone-900 bg-stone-950/80' : 'border-[#E2E8F0] bg-white/95'}`}>
            {!cartIsEmpty && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className={isDark ? 'text-stone-500' : 'text-[#475569] font-semibold'}>Subtotal</span>
                  <span className={`font-bold tabular-nums ${isDark ? 'text-stone-200' : 'text-[#0F172A]'}`}>{format(quote.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={isDark ? 'text-stone-500' : 'text-[#475569] font-semibold'}>
                      Pajak ({quote.taxRate || 0}%)
                    </span>
                    <button
                      onClick={() => setTaxEnabled(t => !t)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${taxEnabled ? 'bg-teal-500' : isDark ? 'bg-stone-800' : 'bg-[#CBD5E1]'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${taxEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>
                  <span className={`font-bold tabular-nums ${taxEnabled ? (isDark ? 'text-stone-200' : 'text-[#0F172A]') : (isDark ? 'text-stone-700 line-through' : 'text-[#CBD5E1] line-through')}`}>
                    {format(quote.tax)}
                  </span>
                </div>
                {quote.serviceCharge > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-stone-500' : 'text-[#475569] font-semibold'}>
                      {quote.serviceChargeLabel || 'Service'} ({quote.serviceChargeRate || 0}%)
                    </span>
                    <span className={`font-bold tabular-nums ${isDark ? 'text-stone-200' : 'text-[#0F172A]'}`}>{format(quote.serviceCharge)}</span>
                  </div>
                )}
                <div className={`flex justify-between pt-1.5 border-t ${isDark ? 'border-stone-900' : 'border-[#E2E8F0]'}`}>
                  <span className={`font-black text-sm uppercase ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Total</span>
                  <span className="font-black text-lg text-amber-500 tabular-nums">{format(quote.grandTotal)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={quickPayCart}
                disabled={!canPay}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide transition-all duration-200 active:scale-[0.97] ${canPay
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600'
                  : isDark ? 'bg-stone-900 text-stone-700 cursor-not-allowed' : 'bg-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
                  }`}
              >
                <Zap size={15} />
                Quick Pay
              </button>
              <button
                onClick={() => { if (!cartIsEmpty) { resetSwipe(); setPanel('checkout'); } }}
                disabled={cartIsEmpty}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide border transition-all active:scale-[0.97] ${cartIsEmpty
                  ? isDark ? 'border-stone-900 text-stone-700 cursor-not-allowed' : 'border-[#E2E8F0] text-[#CBD5E1] cursor-not-allowed'
                  : isDark
                    ? 'border-stone-800 text-stone-200 hover:border-amber-500/40 hover:text-amber-400'
                    : 'border border-[#E2E8F0] text-[#0F172A] hover:border-teal-300 hover:text-teal-700'
                  }`}
              >
                <ReceiptText size={15} />
                Checkout
                {!cartIsEmpty && <ChevronRight size={13} />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Panel: CHECKOUT DETAIL ────────────────────────────────────────── */}
      {panel === 'checkout' && (
        <>
          <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-b ${isDark ? 'border-stone-900' : 'border-[#E2E8F0]'}`}>
            <button
              onClick={() => setPanel('cart')}
              className={`p-2 rounded-xl transition-colors active:scale-90 ${isDark ? 'hover:bg-stone-900 text-stone-400' : 'hover:bg-[#F1F5F9] text-[#475569]'}`}
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Checkout Detail
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 horizontal-scrollbar-thin">
            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Tipe Order</label>
              <div className={`flex gap-1 p-1 rounded-2xl ${isDark ? 'bg-stone-900' : 'bg-[#F1F5F9]'}`}>
                {(['dine-in', 'take-away'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => handleOrderType(type)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-[0.97] ${orderType === type
                      ? isDark ? 'bg-stone-800 text-amber-400' : 'bg-white text-teal-600 shadow-sm'
                      : isDark ? 'text-stone-400' : 'text-[#475569]'
                      }`}
                  >
                    {type === 'dine-in' ? 'Dine In' : 'Take Away'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Info Customer</label>
              <div className="space-y-2">
                <div className="relative">
                  <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Nama customer (opsional)"
                    value={selectedCustomerData ? selectedCustomerData.name : customCustomerName}
                    onChange={e => { if (selectedCustomer) setSelectedCustomer(undefined); setCustomCustomerName(e.target.value); }}
                    className={`w-full pl-8 pr-3 py-3 text-sm rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'}`}
                  />
                </div>
                {orderType === 'dine-in' && (
                  <div className="relative">
                    <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Nomor meja"
                      value={tableNumber}
                      onChange={e => { if (e.target.value === '' || /^\d+$/.test(e.target.value)) setTableNumber(e.target.value); }}
                      onKeyDown={handleTableNumberKeyDown}
                      className={`w-full pl-8 pr-3 py-3 text-sm rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'}`}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
                <span className="flex items-center gap-1.5"><MessageSquare size={10} /> Catatan (opsional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. No sugar, extra hot..."
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
                className={`w-full p-3 text-sm rounded-2xl border outline-none resize-none transition-all focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'}`}
              />
            </div>

            <div className={`rounded-2xl border p-3 space-y-1.5 ${isDark ? 'border-stone-900 bg-stone-900/40' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
              <p className={`text-[10px] font-black uppercase mb-2 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Ringkasan</p>
              {cart.map((item, idx) => {
                const product = products.find(p => p.id === item.productId);
                const name = product?.name ?? item.note ?? 'Item';
                return (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className={`truncate flex-1 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
                      {item.quantity}× {name}
                    </span>
                    <span className={`font-bold ml-2 tabular-nums ${isDark ? 'text-stone-200' : 'text-[#0F172A]'}`}>
                      {format(item.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
              <div className={`pt-1.5 mt-1.5 border-t space-y-1 ${isDark ? 'border-stone-800' : 'border-[#E2E8F0]'}`}>
                <div className="flex justify-between text-xs">
                  <span className={isDark ? 'text-stone-500' : 'text-[#94A3B8]'}>Subtotal</span>
                  <span className={`tabular-nums ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>{format(quote.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={isDark ? 'text-stone-500' : 'text-[#94A3B8]'}>
                      {quote.taxLabel || 'Pajak'} ({quote.taxRate || 0}%)
                    </span>
                    <button
                      onClick={() => setTaxEnabled(t => !t)}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${taxEnabled ? 'bg-teal-500' : isDark ? 'bg-stone-800' : 'bg-[#CBD5E1]'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${taxEnabled ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>
                  <span className={`tabular-nums ${taxEnabled ? (isDark ? 'text-stone-300' : 'text-[#475569]') : (isDark ? 'text-stone-800 line-through' : 'text-[#CBD5E1] line-through')}`}>
                    {format(quote.tax)}
                  </span>
                </div>
                {quote.serviceCharge > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-stone-500' : 'text-[#94A3B8]'}>
                      {quote.serviceChargeLabel || 'Service'} ({quote.serviceChargeRate || 0}%)
                    </span>
                    <span className={`tabular-nums ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>{format(quote.serviceCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed mt-1 dark:border-stone-800">
                  <span className={isDark ? 'text-white' : 'text-[#0F172A]'}>Total</span>
                  <span className="text-amber-500 tabular-nums">{format(quote.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`flex-shrink-0 p-4 border-t flex gap-2 ${isDark ? 'border-stone-900' : 'border-[#E2E8F0]'}`}>
            <button
              onClick={() => setPanel('cart')}
              className={`flex-1 py-3.5 rounded-2xl font-black text-sm border transition-all active:scale-[0.97] ${isDark ? 'border-stone-800 text-stone-300 hover:bg-stone-900' : 'border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'}`}
            >
              Batal
            </button>
            <button
              onClick={() => { if (blockCheckoutForShift()) return; setPaymentModalOpen(true); }}
              disabled={!canPay}
              className={`flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white uppercase tracking-wide transition-all duration-200 active:scale-[0.97] ${canPay
                ? 'bg-teal-500 shadow-lg shadow-teal-500/20 hover:bg-teal-600'
                : 'bg-stone-400 cursor-not-allowed'
                }`}
            >
              {isServiceLoading ? 'Memproses...' : isQuoteLoading ? 'Menghitung...' : (
                <><CreditCard size={15} /> Proses Pembayaran</>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── Panel: MANUAL ITEM ────────────────────────────────────────────── */}
      {panel === 'manual' && (
        <>
          <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-b ${isDark ? 'border-stone-900' : 'border-[#E2E8F0]'}`}>
            <button
              onClick={() => { resetManualForm(); setPanel('cart'); }}
              className={`p-2 rounded-xl transition-colors active:scale-90 ${isDark ? 'hover:bg-stone-900 text-stone-400' : 'hover:bg-[#F1F5F9] text-[#475569]'}`}
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Item Manual
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 horizontal-scrollbar-thin">
            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-amber-400' : 'text-teal-600'}`}>
                <span className="flex items-center gap-1"><Pencil size={9} /> Nama Item *</span>
              </label>
              <input
                ref={manualNameRef}
                type="text"
                placeholder="Nama item..."
                value={manualItemName}
                onChange={e => setManualItemName(e.target.value)}
                className={`w-full p-3 rounded-2xl border outline-none text-sm transition-all focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'}`}
              />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Kategori (opsional)</label>
              <input
                type="text"
                placeholder="e.g. Service, Custom..."
                value={manualItemCategory}
                onChange={e => setManualItemCategory(e.target.value)}
                className={`w-full p-3 rounded-2xl border outline-none text-sm transition-all focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'}`}
              />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Deskripsi (opsional)</label>
              <textarea
                value={manualItemDescription}
                onChange={e => setManualItemDescription(e.target.value)}
                placeholder="e.g. Pedas sekali, Tanpa bawang"
                className={`w-full min-h-[88px] p-3 rounded-2xl border outline-none text-sm resize-none transition-all focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Variant</label>
                <input
                  type="text"
                  placeholder="e.g. Extra Keju"
                  value={manualItemVariantName}
                  onChange={e => setManualItemVariantName(e.target.value)}
                  className={`w-full p-3 rounded-2xl border outline-none text-sm transition-all focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'}`}
                />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Harga Variant (Rp)</label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={manualItemVariantPrice ? Number(manualItemVariantPrice).toLocaleString('id-ID') : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setManualItemVariantPrice(raw);
                    }}
                    className={`w-full pl-10 pr-3 py-3 rounded-2xl border outline-none text-sm font-black text-right transition-all focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-[#E2E8F0] text-[#0F172A]'}`}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto horizontal-scrollbar-thin pb-1">
              {quickPrices.map(p => {
                const isSelected = manualItemVariantPrice === p.toString();
                return (
                  <button
                    key={p}
                    onClick={() => setManualItemVariantPrice(p.toString())}
                    className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-black transition-all active:scale-95 ${isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : isDark
                        ? 'bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-amber-400'
                        : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700'
                    }`}
                  >
                    {p >= 1000000 ? `${p / 1000000}jt` : `${p / 1000}k`}
                  </button>
                );
              })}
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-amber-400' : 'text-teal-600'}`}>Harga (Rp) *</label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={manualItemPrice ? Number(manualItemPrice).toLocaleString('id-ID') : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setManualItemPrice(raw);
                  }}
                  className={`w-full pl-10 pr-3 py-3 rounded-2xl border outline-none text-sm font-black text-right transition-all focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-[#E2E8F0] text-[#0F172A]'}`}
                />
              </div>
              <div className="flex gap-2 mt-2 overflow-x-auto horizontal-scrollbar-thin pb-1">
                {quickPrices.map(p => {
                  const isSelected = manualItemPrice === p.toString();
                  return (
                    <button
                      key={p}
                      onClick={() => setManualItemPrice(p.toString())}
                      className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-black transition-all active:scale-95 ${isSelected
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : isDark
                          ? 'bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-amber-400'
                          : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700'
                        }`}
                    >
                      {p >= 1000000 ? `${p / 1000000}jt` : `${p / 1000}k`}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Jumlah</label>
              <div className={`flex items-center gap-3 p-1 rounded-2xl w-fit ${isDark ? 'bg-stone-900' : 'bg-[#F1F5F9]'}`}>
                <button
                  onClick={() => setManualItemQuantity(q => Math.max(1, q - 1))}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg transition-all active:scale-90 ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-amber-500 hover:text-white' : 'bg-white text-[#475569] hover:bg-teal-500 hover:text-white shadow-sm'}`}
                >−</button>
                <span className={`w-10 text-center font-black text-base ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{manualItemQuantity}</span>
                <button
                  onClick={() => setManualItemQuantity(q => q + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg transition-all active:scale-90 ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-amber-500 hover:text-white' : 'bg-white text-[#475569] hover:bg-teal-500 hover:text-white shadow-sm'}`}
                >+</button>
              </div>
            </div>
            {manualItemPrice && Number(manualItemPrice) > 0 && (
              <div className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-[#F0FDFA] border border-[#99F6E4]'}`}>
                <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-teal-700'}`}>Total ({manualItemQuantity}×)</span>
                <span className={`text-base font-black tabular-nums ${isDark ? 'text-amber-300' : 'text-teal-700'}`}>
                  {format(Number(manualItemPrice) * manualItemQuantity)}
                </span>
              </div>
            )}
          </div>

          <div className={`flex-shrink-0 p-4 border-t flex gap-2 ${isDark ? 'border-stone-900' : 'border-[#E2E8F0]'}`}>
            <button
              onClick={quickPayManualItem}
              disabled={!manualItemName.trim() || !manualItemPrice || isPaymentModalOpen}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 active:scale-[0.97] ${manualItemName.trim() && manualItemPrice
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 hover:bg-teal-600'
                : isDark ? 'bg-stone-900 text-stone-700 cursor-not-allowed' : 'bg-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
                }`}
            >
              <Zap size={14} /> Quick Pay
            </button>
            <button
              onClick={addManualItemToCart}
              disabled={!manualItemName.trim() || !manualItemPrice}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm border transition-all duration-200 active:scale-[0.97] ${manualItemName.trim() && manualItemPrice
                ? isDark
                  ? 'border-stone-700 text-stone-200 hover:border-amber-500/50 hover:text-amber-400'
                  : 'border border-[#E2E8F0] text-[#0F172A] hover:border-teal-300 hover:text-teal-700'
                : isDark ? 'border-stone-900 text-stone-700 cursor-not-allowed' : 'border-[#E2E8F0] text-[#CBD5E1] cursor-not-allowed'
                }`}
            >
              <Package size={14} /> Ke Cart
            </button>
          </div>
        </>
      )}

      {/* ── Panel: EDIT ITEM ───────────────────────────────────────────── */}
      {panel === 'edit' && editingItemIndex !== null && cart[editingItemIndex] && (
        <CartItemEditPanel
          item={cart[editingItemIndex]}
          itemIndex={editingItemIndex}
          onSave={(updatedItem) => {
            setCart(prev => {
              const newCart = [...prev];
              newCart[editingItemIndex] = updatedItem;
              return newCart;
            });
            setEditingItemIndex(null);
            setPanel('cart');
          }}
          onRemove={() => {
            setCart(prev => prev.filter((_, i) => i !== editingItemIndex));
            setEditingItemIndex(null);
            setPanel('cart');
          }}
          onClose={() => {
            setEditingItemIndex(null);
            setPanel('cart');
          }}
        />
      )}
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (isServiceLoading && products.length === 0) {
    return <PointOfSaleSkeleton />;
  }

  return (
    <div className={`h-full min-h-0 flex ${showDesktopLayout ? 'flex-row' : 'flex-col'} gap-4 relative animate-in fade-in duration-300 overflow-hidden`}>

      {/* ══════════════════════════════════════════════════════════════════════════
          LEFT — Product Catalog
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex-shrink-0 space-y-3 mb-4">
          {cashierNeedsShift && (
            <div className={`rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>Shift belum dibuka</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-amber-900/80'}`}>
                  Jelajahi menu seperti biasa. Saat Anda mengeklik pembayaran, sistem akan meminta membuka shift terlebih dahulu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/cashier/shift')}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 active:scale-95"
              >
                Buka halaman shift
              </button>
            </div>
          )}
          {/* ── Catalog Header ── */}
          <div className={`${isMobile ? 'sticky top-0 z-20 pt-2 pb-1 -mx-4 px-4 bg-inherit' : 'mb-4'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
              <div className="flex items-center gap-3">
                <h1 className={`text-xl md:text-2xl font-black tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-[#0F172A]'} ${showDesktopLayout ? 'block' : 'hidden'}`}>
                  Menu <span className="text-amber-500">Explorer</span>
                </h1>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    className={`w-full pl-10 pr-4 py-3 min-h-[44px] rounded-2xl border-2 outline-none text-sm transition-all shadow-sm ${isDark
                      ? 'bg-stone-900 border-stone-800 text-white focus:border-amber-500'
                      : 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-[#64748B] focus:border-teal-500'
                      }`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={(e) => {
                      if (isMobile) {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  />
                </div>
                <button
                  onClick={() => setPanel('manual')}
                  className={`flex items-center justify-center gap-2 px-3 h-11 rounded-2xl border transition-all shrink-0 ${
                    isDark ? 'border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800' : 'border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-sm'
                  }`}
                  title="Item Manual"
                >
                  <PlusCircle size={16} />
                  <span className={`text-[10px] font-black uppercase ${isLandscape ? 'inline' : 'hidden sm:inline'}`}>Manual</span>
                </button>
              </div>
            </div>

            <div className={showDesktopLayout ? 'block' : 'hidden'}>
              <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
            </div>

            <div className="flex items-center justify-between pb-2">
              <div className={`flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-2xl text-xs font-bold ${isDark ? 'bg-stone-800 text-amber-400 border border-amber-800/30' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                <TrendingUp size={12} />
                <span>Trending:</span>
                <select
                  value={bestSellerPeriod}
                  onChange={e => setBestSellerPeriod(Number(e.target.value))}
                  className={`${isDark ? 'bg-stone-800 text-amber-300' : 'bg-teal-50 text-teal-600'} border-none outline-none text-xs font-bold appearance-none cursor-pointer`}
                >
                  <option value="1">1 Hari</option>
                  <option value="2">2 Hari</option>
                  <option value="3">3 Hari</option>
                  <option value="7">7 Hari</option>
                  <option value="14">14 Hari</option>
                  <option value="30">30 Hari</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                {promoProductsCount > 0 && (
                  <div className={`px-2 py-1.5 min-h-[32px] rounded-xl text-[10px] font-bold border flex items-center gap-1 ${isDark ? 'bg-red-900/30 text-red-400 border-red-800/30' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    <Flame size={10} /><span>{promoProductsCount} PROMO</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className={`flex-1 overflow-y-auto horizontal-scrollbar-thin pr-1 ${showMobilePortrait ? 'pb-24' : ''}`}>
          {showMobilePortrait && (
            <div className="py-2">
            {categoryCarousels.length === 0 || categoryCarousels.every(c => c.products.length === 0) ? (
              <div className={`flex flex-col items-center justify-center min-h-[300px] text-center px-4 ${isDark ? 'text-stone-400' : 'text-[#64748B]'}`}>
                <Package size={48} className={`mb-4 ${isDark ? 'text-stone-700' : 'text-[#CBD5E1]'}`} />
                <p className="font-semibold text-sm mb-1">
                  {search ? 'Tidak ada hasil pencarian' : 'Tidak ada produk'}
                </p>
                <p className="text-xs">
                  {search ? `Coba cari dengan kata kunci lain "${search}"` : 'Produk akan muncul di sini'}
                </p>
              </div>
            ) : (
              categoryCarousels
                .filter(carousel => carousel.products.length > 0)
                .map(carousel => (
                  <MobileCategoryCarousel
                    key={carousel.categoryName}
                    carousel={carousel}
                    isDark={isDark}
                    onAddToCart={addToCart}
                    onViewAll={(catName) => navigate(`/pos/category/${encodeURIComponent(catName)}`)}
                  />
                ))
              )}
            </div>
          )}
          {showDesktopLayout && (
            <div className="h-full">
              <ProductGrid products={sortedProducts} onAddToCart={addToCart} isMobileLandscape={isMobileLandscape} />
            </div>
          )}
        </div>

        {showMobilePortrait && (
          <div>
            <MobileCart
            cart={cart}
            quote={quote}
            sheetState={sheetState}
            isDark={isDark}
            canPay={canPay}
            onOpen={() => setSheetState('peek')}
            onClose={() => setSheetState('collapsed')}
            onQuickPay={quickPayCart}
            onCheckout={() => {
              if (!cartIsEmpty) {
                resetSwipe();
                setSheetState('collapsed');
                setPanel('checkout');
              }
            }}
            onEditItem={(index) => {
              setEditingItemIndex(index);
              setSheetState('collapsed');
              setPanel('edit');
            }}
            onRemoveItem={removeFromCart}
            onClearCart={() => setCart([])}
            onUpdateQuantity={(index, delta) => updateQuantity(index, delta)}
            onManualItem={() => setPanel('manual')}
          />
        </div>
      )}

        {/* ── Mobile Panel Overlay ── */}
        {showMobilePortrait && panel !== 'cart' && (
          <div>
            <div
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => { setPanel('cart'); setEditingItemIndex(null); }}
            />
            <div
              className={`fixed bottom-0 left-0 right-0 z-40 mx-2 flex flex-col rounded-t-3xl border shadow-[0_-12px_60px_rgba(0,0,0,0.40)] transition-all duration-300 ease-out animate-in slide-in-from-bottom-96 ${isDark ? 'border-stone-800/20 bg-stone-950' : 'border-[#E2E8F0] bg-white'}`}
              style={{ height: '88vh', maxHeight: '92vh' }}
            >
              {renderCartContent()}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          DESKTOP & LANDSCAPE — Right Cart Panel
      ══════════════════════════════════════════════════════════════════════════ */}
      {showDesktopLayout && (
        <div className={`
          flex flex-col flex-shrink-0
          w-[380px] xl:w-[420px]
          rounded-2xl border shadow-xl overflow-hidden
          ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-[#E2E8F0] shadow-xl'}
        `}>
          {renderCartContent()}
        </div>
      )}

      {/* ── Modals ── */}
      {isCheckoutDetailsFormOpen && (
        <CheckoutDetailsForm
          customerName={customCustomerName}
          tableNumber={tableNumber}
          orderDescription={orderNote}
          orderType={orderType}
          onCustomerNameChange={setCustomCustomerName}
          onTableNumberChange={setTableNumber}
          onOrderTypeChange={handleOrderType}
          onOrderDescriptionChange={setOrderNote}
          onClose={() => setCheckoutDetailsFormOpen(false)}
          onSubmit={handleCheckoutDetailsSubmit}
        />
      )}

      {shiftGateOpen && (
        <ShiftOpenModal
          onSuccess={() => {
            setShiftGateOpen(false);
            void refreshShift();
            setCheckoutDetailsFormOpen(true);
          }}
          onCancel={() => setShiftGateOpen(false)}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          total={quote.grandTotal}
          onClose={() => setPaymentModalOpen(false)}
          onConfirm={handlePaymentSuccess}
        />
      )}

      {receiptTransaction && (
        <ReceiptModal
          transaction={receiptTransaction}
          onClose={() => setReceiptTransaction(null)}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
}