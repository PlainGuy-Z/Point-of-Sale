import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, ShoppingCart, Trash2, User, X, Plus, PlusCircle,
  Flame, Trophy, TrendingUp, Zap, ChevronRight,
  Package, CreditCard, ReceiptText, Pencil, Hash,
  MessageSquare, ArrowLeft, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useProductCatalog } from '../../hooks/useProductCatalog';
import ProductGrid from '../../components/pos/ProductGrid';
import CustomerSelector from '../../components/pos/CustomerSelector';
import CategoryPills from '../../components/pos/CategoryPills';
import PaymentModal from '../../components/pos/PaymentModal';
import ProductDetailModal from '../../components/pos/ProductDetailModal';
import ReceiptModal from '../../components/pos/ReceiptModal';
import type { Transaction, TransactionItem, CartItemWithInput, Product } from '../../types';
import { ApiError } from '../../services/appApi';
import { posApi } from '../../services/posApi';
import { getEffectivePrice } from '../../utils/priceUtils';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

// ─── Panel view type ──────────────────────────────────────────────────────────
type CartPanel = 'cart' | 'checkout' | 'manual';

export default function PointOfSale() {
  const createManualItemId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `manual-${crypto.randomUUID()}`
      : `manual-${Date.now()}`;

  const { products, customers, checkout, settings, transactions, isServiceLoading } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  // ── Catalog ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [bestSellerPeriod, setBestSellerPeriod] = useState<number>(() => {
    const saved = localStorage.getItem('posBestSellerPeriod');
    return saved ? parseInt(saved) : 3;
  });

  // ── Cart ─────────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItemWithInput[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>();
  const [isCustomerSelectorOpen, setCustomerSelectorOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isCartExpanded, setCartExpanded] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);

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
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('pos_tax_enabled', String(taxEnabled));
  }, [taxEnabled]);

  // ── Quote (from backend) ─────────────────────────────────────────────────────
  const [quote, setQuote] = useState<{ subtotal: number; tax: number; grandTotal: number; taxRate?: number }>({
    subtotal: 0, tax: 0, grandTotal: 0, taxRate: settings?.taxRate || 0,
  });
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  // ── Manual item ──────────────────────────────────────────────────────────────
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [manualItemCategory, setManualItemCategory] = useState('');
  const [manualItemQuantity, setManualItemQuantity] = useState(1);
  const manualNameRef = useRef<HTMLInputElement>(null);

  // ── Product catalog ──────────────────────────────────────────────────────────
  const { sortedProducts, topBestSellers, promoProductsCount } = useProductCatalog(
    products, transactions, search, selectedCategory, bestSellerPeriod
  );

  useEffect(() => {
    localStorage.setItem('posBestSellerPeriod', bestSellerPeriod.toString());
  }, [bestSellerPeriod]);

  // Focus manual name input when panel switches to manual
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
    setManualItemQuantity(1);
  };

  const buildManualItem = (): CartItemWithInput | null => {
    if (!manualItemName.trim() || !manualItemPrice) return null;
    const price = parseFloat(manualItemPrice.replace(/\./g, ''));
    if (isNaN(price) || price <= 0) return null;
    const name = manualItemName.trim().charAt(0).toUpperCase() + manualItemName.trim().slice(1);
    return {
      productId: createManualItemId(),
      quantity: manualItemQuantity > 0 ? manualItemQuantity : 1,
      price,
      note: name,
      modifiers: manualItemCategory.trim() ? [manualItemCategory.trim()] : [],
    };
  };

  const addManualItemToCart = () => {
    const item = buildManualItem();
    if (!item) { alert('Masukkan nama dan harga yang valid'); return; }
    setCart(prev => [...prev, item]);
    resetManualForm();
    setPanel('cart');
  };

  const quickPayManualItem = () => {
    const item = buildManualItem();
    if (!item) { alert('Masukkan nama dan harga yang valid'); return; }
    setCart(prev => [...prev, item]);
    resetManualForm();
    setPanel('cart');
    setPaymentModalOpen(true);
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (product.isAvailable === false) return;
    if (product.stock !== -1 && product.stock <= 0) return;
    const { price: priceToUse, isPromoActive } = getEffectivePrice(product);
    setCart(prev => {
      const existingIndex = prev.findIndex(item =>
        item.productId === productId && !item.note && (!item.modifiers || item.modifiers.length === 0)
      );
      if (existingIndex >= 0) {
        const newCart = [...prev];
        if (product.stock === -1 || newCart[existingIndex].quantity + 1 <= product.stock) {
          newCart[existingIndex].quantity += 1;
        }
        return newCart;
      }
      if (product.stock !== -1 && product.stock < 1) return prev;
      const newItem: CartItemWithInput = { productId, quantity: 1, price: priceToUse, modifiers: [] };
      if (isPromoActive) {
        newItem.isPromo = true;
        newItem.originalPrice = product.price;
        newItem.promoPrice = priceToUse;
        newItem.promoLabel = product.promoLabel;
      }
      return [...prev, newItem];
    });
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

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));

  const handleUpdateCartItem = (updatedItem: TransactionItem) => {
    if (editingItemIndex !== null) {
      setCart(prev => { const n = [...prev]; n[editingItemIndex] = { ...updatedItem as CartItemWithInput }; return n; });
      setEditingItemIndex(null);
    }
  };

  // ── Backend quote ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cart.length) {
        setQuote({ subtotal: 0, tax: 0, grandTotal: 0, taxRate: settings?.taxRate || 0 });
        return;
      }
      setIsQuoteLoading(true);
      try {
        const res = await posApi.quote({
          cart: cart.map(i => ({
            productId: i.productId, quantity: i.quantity, note: i.note, modifiers: i.modifiers,
            ...(i.productId.startsWith('manual-') ? { price: i.price } : {}),
          })),
          customerId: selectedCustomer, customerName: customCustomerName,
          orderType, tableNumber: orderType === 'dine-in' ? tableNumber : undefined, orderNote,
          applyTax: taxEnabled,
        });
        if (!cancelled) setQuote({ subtotal: res.subtotal, tax: res.tax, grandTotal: res.grandTotal, taxRate: res.taxRate });
      } catch {
        if (!cancelled) setQuote({ subtotal: 0, tax: 0, grandTotal: 0, taxRate: settings?.taxRate || 0 });
      } finally { if (!cancelled) setIsQuoteLoading(false); }
    };
    const t = window.setTimeout(run, 250);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [cart, selectedCustomer, customCustomerName, orderType, tableNumber, orderNote, settings?.taxRate, taxEnabled]);

  // ── Computed totals (Immediate UI feedback derived from backend subtotal) ──
  const { subtotal, taxRate } = quote;
  // Handle both 0.11 and 11 formats robustly
  const getRate = (r: number | undefined) => {
    if (r === undefined) return 0.11;
    return r > 1 ? r / 100 : r;
  };
  const effectiveTaxRate = getRate(taxRate ?? settings?.taxRate);
  const displayTax = taxEnabled ? Math.round(subtotal * effectiveTaxRate) : 0;
  const displayTotal = subtotal + displayTax;

  const cartIsEmpty = cart.length === 0;
  const canPay = !cartIsEmpty && !isServiceLoading && !isQuoteLoading && displayTotal > 0;

  // ── Payment ──────────────────────────────────────────────────────────────────
  const handleCheckout = useCallback(
    async (method: 'cash' | 'card' | 'qris', cashReceived?: number, change?: number) =>
      await checkout({ cart, paymentMethod: method, selectedCustomer, customCustomerName, orderType, tableNumber, cashReceived, change, orderNote, applyTax: taxEnabled }),
    [checkout, cart, selectedCustomer, customCustomerName, orderType, tableNumber, orderNote, taxEnabled],
  );

  const handlePaymentSuccess = async (method: 'cash' | 'card' | 'qris', cashReceived?: number, change?: number) => {
    if (cartIsEmpty) return;
    try {
      const transaction = await handleCheckout(method, cashReceived, change);
      setCart([]); setSelectedCustomer(undefined); setCustomCustomerName('');
      setTableNumber(''); setOrderNote(''); setPanel('cart');
      setPaymentModalOpen(false); setReceiptTransaction(transaction);
    } catch (error) {
      const err = error as unknown;
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === 'INSUFFICIENT_STOCK') { alert('Stok tidak cukup. Cek stok lalu coba lagi.'); return; }
        alert(`Checkout gagal: ${err.message}`); return;
      }
      alert(`Checkout failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const quickPayCart = () => { if (!canPay) return; setPanel('cart'); setPaymentModalOpen(true); };

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

  // ── Quick price buttons ───────────────────────────────────────────────────────
  const quickPrices = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000];

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 relative">

      {/* ══════════════════════════════════════════════════════════════════════════
          LEFT — Product Catalog
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex-shrink-0 space-y-3 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Menu <span className="text-amber-500">Explorer</span>
            </h1>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari menu..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 outline-none text-sm transition-all ${isDark
                    ? 'bg-stone-900 border-stone-800 text-white focus:border-amber-500'
                    : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-amber-500'
                  }`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />

          {/* Trending bar */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-bold ${isDark ? 'bg-stone-800 text-amber-400 border border-amber-800/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
              <TrendingUp size={12} />
              <span>Trending:</span>
              <select
                value={bestSellerPeriod}
                onChange={e => setBestSellerPeriod(Number(e.target.value))}
                className={`${isDark ? 'bg-stone-800 text-amber-300' : 'bg-amber-50 text-amber-600'} border-none outline-none text-xs font-bold appearance-none cursor-pointer`}
              >
                <option value="1">Today</option>
                <option value="3">3 Hari</option>
                <option value="7">7 Hari</option>
                <option value="14">14 Hari</option>
                <option value="30">30 Hari</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              {promoProductsCount > 0 && (
                <div className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
                  }`}>
                  <Flame size={10} /><span>{promoProductsCount} PROMO</span>
                </div>
              )}
              {topBestSellers.length > 0 && (
                <div className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'
                  }`}>
                  <Trophy size={10} /><span>{topBestSellers.length} BEST</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0 pr-1 horizontal-scrollbar-thin">
          <ProductGrid products={sortedProducts} onAddToCart={addToCart} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          RIGHT — Cart Panel
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className={`
        flex flex-col
        fixed bottom-0 left-0 right-0 z-20
        lg:static lg:w-[380px] xl:w-[420px] lg:flex-shrink-0
        rounded-t-3xl lg:rounded-2xl
        border shadow-2xl
        transition-all duration-500
        ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-gray-100'}
        ${isCartExpanded ? 'h-[88vh]' : 'h-20 lg:h-full lg:overflow-hidden'}
      `}>

        {/* Mobile drag handle */}
        <button
          className="lg:hidden w-full flex flex-col items-center pt-3 pb-2 cursor-pointer"
          onClick={() => setCartExpanded(!isCartExpanded)}
          aria-label={isCartExpanded ? 'Collapse cart' : 'Expand cart'}
        >
          <div className={`w-10 h-1 rounded-full mb-2 ${isDark ? 'bg-stone-800' : 'bg-gray-300'}`} />
          {!isCartExpanded && (
            <div className="flex justify-between w-full px-5">
              <span className={`font-black text-sm ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>
                {cart.length} Item{cart.length !== 1 ? 's' : ''}
              </span>
              <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {format(displayTotal)}
              </span>
            </div>
          )}
        </button>

        <div className={`flex flex-col h-full ${!isCartExpanded ? 'hidden lg:flex' : 'flex'}`}>

          {/* ── Panel: CART ──────────────────────────────────────────────────── */}
          {panel === 'cart' && (
            <>
              {/* Cart header */}
              <div className={`flex-shrink-0 px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-stone-900 bg-stone-950/40' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                    <ShoppingCart size={16} />
                  </div>
                  <div>
                    <h3 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Shopping Cart
                    </h3>
                    {!cartIsEmpty && (
                      <p className={`text-[10px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} Items Selected
                      </p>
                    )}
                  </div>
                </div>
                {!cartIsEmpty && (
                  <button 
                    onClick={() => setCart([])}
                    className={`p-2 rounded-xl transition-all ${isDark ? 'text-stone-700 hover:text-red-400 hover:bg-red-400/10' : 'text-stone-300 hover:text-red-500 hover:bg-red-50'}`}
                    title="Kosongkan keranjang"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto">
                {cartIsEmpty ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] opacity-20 ${isDark ? 'bg-amber-500' : 'bg-amber-300'}`} />
                    
                    <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                      <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-gray-100 shadow-amber-500/5'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                          <ShoppingCart size={24} />
                        </div>
                      </div>
                      <h4 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Your cart is empty
                      </h4>
                      <p className={`text-sm mt-2 max-w-[200px] leading-relaxed ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        Add some delicious coffee to start your transaction
                      </p>
                      
                      <div className="flex flex-col w-full gap-2 mt-8">
                        <button
                          onClick={() => setPanel('manual')}
                          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            isDark 
                              ? 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shadow-lg shadow-amber-500/20' 
                              : 'bg-black text-white hover:bg-[#1a1614] active:scale-95 shadow-lg shadow-black/10'
                          }`}
                        >
                          <Plus size={14} />
                          Custom Item
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {/* Add manual button at top of filled cart */}
                    <button
                      onClick={() => setPanel('manual')}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-2xl text-xs font-bold border border-dashed transition-all ${isDark
                          ? 'border-stone-800 text-stone-500 hover:border-amber-500/50 hover:text-amber-400'
                          : 'border-gray-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
                        }`}
                    >
                      <PlusCircle size={13} /> Tambah Item Manual
                    </button>

                    {cart.map((item, idx) => {
                      const product = products.find(p => p.id === item.productId);
                      const itemName = product ? product.name : (item.note || 'Custom Item');
                      const isPromoItem = item.isPromo && item.originalPrice;
                      const lineTotal = item.price * item.quantity;
                      const isManual = item.productId.startsWith('manual-');

                      return (
                        <div
                          key={`${item.productId}-${idx}`}
                          className={`rounded-2xl border transition-all ${isPromoItem
                              ? isDark ? 'bg-red-900/15 border-red-800/30' : 'bg-red-50 border-red-200'
                              : isManual
                                ? isDark ? 'bg-amber-900/10 border-amber-800/20' : 'bg-amber-50 border-amber-100'
                                : isDark ? 'bg-stone-900/60 border-stone-800' : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                          <div className="flex items-center gap-3 p-3">
                            {/* Item info */}
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => setEditingItemIndex(idx)}
                            >
                              <div className="flex items-center gap-1.5">
                                {isManual && (
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-600'
                                    }`}>Custom</span>
                                )}
                                {isPromoItem && (
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600'
                                    }`}>{item.promoLabel || 'Promo'}</span>
                                )}
                              </div>
                              <p className={`font-bold text-sm truncate mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {itemName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {isPromoItem && (
                                  <span className={`text-[10px] line-through ${isDark ? 'text-stone-700' : 'text-stone-400'}`}>
                                    {format(item.originalPrice!)}
                                  </span>
                                )}
                                <span className={`text-xs font-black ${isPromoItem
                                    ? isDark ? 'text-red-400' : 'text-red-600'
                                    : isDark ? 'text-amber-400' : 'text-amber-600'
                                  }`}>
                                  {format(item.price)}
                                </span>
                              </div>
                            </div>

                            {/* Qty controls */}
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => updateQuantity(idx, -1)}
                                disabled={item.quantity <= 1}
                                className={`w-7 h-7 flex items-center justify-center rounded-xl text-sm font-black transition-all disabled:opacity-30 ${isDark ? 'bg-stone-800 hover:bg-amber-500 hover:text-white text-stone-300' : 'bg-gray-200 hover:bg-amber-500 hover:text-white text-gray-600'
                                  }`}
                              >−</button>
                              <span className={`w-7 text-center text-sm font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(idx, 1)}
                                disabled={!!product && product.stock !== -1 && item.quantity >= product.stock}
                                className={`w-7 h-7 flex items-center justify-center rounded-xl text-sm font-black transition-all disabled:opacity-30 ${isDark ? 'bg-stone-800 hover:bg-amber-500 hover:text-white text-stone-300' : 'bg-gray-200 hover:bg-amber-500 hover:text-white text-gray-600'
                                  }`}
                              >+</button>
                            </div>

                            {/* Line total */}
                            <div className="text-right min-w-[60px]">
                              <p className={`text-sm font-black ${isPromoItem
                                  ? isDark ? 'text-red-400' : 'text-red-600'
                                  : isDark ? 'text-amber-400' : 'text-amber-600'
                                }`}>
                                {format(lineTotal)}
                              </p>
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeFromCart(idx)}
                              className="text-stone-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Footer: summary + action buttons ── */}
              <div className={`flex-shrink-0 border-t p-4 space-y-3 ${isDark ? 'border-stone-900 bg-stone-950/80' : 'border-gray-100 bg-white/90'}`}>
                {!cartIsEmpty && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>Subtotal</span>
                      <span className={`font-bold ${isDark ? 'text-stone-200' : 'text-gray-700'}`}>{format(subtotal)}</span>
                    </div>

                    {/* Tax toggle row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>
                        Pajak ({(effectiveTaxRate * 100).toFixed(0)}%)
                        </span>
                        <button
                          onClick={() => setTaxEnabled(t => !t)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${taxEnabled ? 'bg-amber-500' : isDark ? 'bg-stone-800' : 'bg-gray-300'}`}
                          title={taxEnabled ? 'Nonaktifkan pajak' : 'Aktifkan pajak'}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${taxEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </button>
                      </div>
                      <span className={`font-bold ${taxEnabled ? (isDark ? 'text-stone-200' : 'text-gray-700') : (isDark ? 'text-stone-700 line-through' : 'text-stone-300 line-through')}`}>
                        {format(displayTax)}
                      </span>
                    </div>

                    <div className={`flex justify-between pt-1.5 border-t ${isDark ? 'border-stone-900' : 'border-gray-100'}`}>
                      <span className={`font-black text-sm uppercase ${isDark ? 'text-white' : 'text-gray-800'}`}>Total</span>
                      <span className="font-black text-lg text-amber-500">{format(displayTotal)}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {/* Quick Pay */}
                  <button
                    onClick={quickPayCart}
                    disabled={!canPay}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm uppercase tracking-wide transition-all ${canPay
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:opacity-90 active:scale-[0.98]'
                        : isDark ? 'bg-stone-900 text-stone-700 cursor-not-allowed' : 'bg-gray-100 text-stone-300 cursor-not-allowed'
                      }`}
                  >
                    <Zap size={15} />
                    Quick Pay
                  </button>

                  {/* Checkout detail */}
                  <button
                    onClick={() => { if (!cartIsEmpty) setPanel('checkout'); }}
                    disabled={cartIsEmpty}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm uppercase tracking-wide border transition-all ${cartIsEmpty
                        ? isDark ? 'border-stone-900 text-stone-700 cursor-not-allowed' : 'border-gray-100 text-stone-300 cursor-not-allowed'
                        : isDark
                          ? 'border-stone-800 text-stone-200 hover:border-amber-500/40 hover:text-amber-400'
                          : 'border-gray-200 text-gray-700 hover:border-amber-400 hover:text-amber-700'
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
              {/* Header */}
              <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-b ${isDark ? 'border-stone-900' : 'border-gray-100'}`}>
                <button
                  onClick={() => setPanel('cart')}
                  className={`p-1.5 rounded-xl transition-colors ${isDark ? 'hover:bg-stone-900 text-stone-400' : 'hover:bg-gray-100 text-stone-500'}`}
                >
                  <ArrowLeft size={16} />
                </button>
                <h3 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Checkout Detail
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Order type */}
                <div>
                  <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    Tipe Order
                  </label>
                  <div className={`flex gap-1 p-1 rounded-2xl ${isDark ? 'bg-stone-900' : 'bg-gray-100'}`}>
                    {(['dine-in', 'take-away'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => handleOrderType(type)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${orderType === type
                            ? isDark ? 'bg-stone-800 text-amber-400' : 'bg-white text-amber-600 shadow-sm'
                            : isDark ? 'text-stone-400' : 'text-stone-500'
                          }`}
                      >
                        {type === 'dine-in' ? 'Dine In' : 'Take Away'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer info */}
                <div>
                  <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    Info Customer
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Nama customer (opsional)"
                        value={selectedCustomerData ? selectedCustomerData.name : customCustomerName}
                        onChange={e => { if (selectedCustomer) setSelectedCustomer(undefined); setCustomCustomerName(e.target.value); }}
                        className={`w-full pl-8 pr-3 py-2.5 text-xs rounded-2xl border outline-none transition-all ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                          }`}
                      />
                    </div>
                    {orderType === 'dine-in' && (
                      <div className="relative">
                        <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Nomor meja"
                          value={tableNumber}
                          onChange={e => { if (e.target.value === '' || /^\d+$/.test(e.target.value)) setTableNumber(e.target.value); }}
                          onKeyDown={handleTableNumberKeyDown}
                          className={`w-full pl-8 pr-3 py-2.5 text-xs rounded-2xl border outline-none transition-all ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                            }`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Order note */}
                <div>
                  <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    <span className="flex items-center gap-1.5"><MessageSquare size={10} /> Catatan (opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. No sugar, extra hot, allergy info..."
                    value={orderNote}
                    onChange={e => setOrderNote(e.target.value)}
                    className={`w-full p-3 text-xs rounded-2xl border outline-none resize-none transition-all ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                      }`}
                  />
                </div>

                {/* Order summary */}
                <div className={`rounded-2xl border p-3 space-y-1.5 ${isDark ? 'border-stone-900 bg-stone-900/40' : 'border-gray-100 bg-gray-50'}`}>
                  <p className={`text-[10px] font-black uppercase mb-2 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Ringkasan</p>
                  {cart.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    const name = product?.name ?? item.note ?? 'Item';
                    return (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className={`truncate flex-1 ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
                          {item.quantity}× {name}
                          {item.note && !!product && <span className={isDark ? 'text-stone-700' : 'text-stone-400'}> ({item.note})</span>}
                        </span>
                        <span className={`font-bold ml-2 ${isDark ? 'text-stone-200' : 'text-gray-700'}`}>
                          {format(item.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                  <div className={`pt-1.5 mt-1.5 border-t space-y-1 ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
                    <div className="flex justify-between text-xs">
                      <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>Subtotal</span>
                      <span className={isDark ? 'text-stone-300' : 'text-gray-600'}>{format(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>Pajak ({(effectiveTaxRate * 100).toFixed(0)}%)</span>
                        <button
                          onClick={() => setTaxEnabled(t => !t)}
                          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${taxEnabled ? 'bg-amber-500' : isDark ? 'bg-stone-800' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${taxEnabled ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                        </button>
                      </div>
                      <span className={taxEnabled ? (isDark ? 'text-stone-300' : 'text-gray-600') : (isDark ? 'text-stone-800 line-through' : 'text-stone-300 line-through')}>
                        {format(displayTax)}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-sm pt-1">
                      <span className={isDark ? 'text-white' : 'text-gray-800'}>Total</span>
                      <span className="text-amber-500">{format(displayTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout footer buttons */}
              <div className={`flex-shrink-0 p-4 border-t flex gap-2 ${isDark ? 'border-stone-900' : 'border-gray-100'}`}>
                <button
                  onClick={() => setPanel('cart')}
                  className={`flex-1 py-3 rounded-2xl font-black text-sm border transition-all ${isDark ? 'border-stone-800 text-stone-300 hover:bg-stone-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  Batal
                </button>
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  disabled={!canPay}
                  className={`flex-2 flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white uppercase tracking-wide transition-all ${canPay
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-[0.98]'
                      : 'bg-gray-400 cursor-not-allowed'
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
              {/* Header */}
              <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-b ${isDark ? 'border-stone-900' : 'border-gray-100'}`}>
                <button
                  onClick={() => { resetManualForm(); setPanel('cart'); }}
                  className={`p-1.5 rounded-xl transition-colors ${isDark ? 'hover:bg-stone-900 text-stone-400' : 'hover:bg-gray-100 text-stone-500'}`}
                >
                  <ArrowLeft size={16} />
                </button>
                <h3 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Item Manual
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Nama */}
                <div>
                  <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    <span className="flex items-center gap-1"><Pencil size={9} /> Nama Item</span>
                  </label>
                  <input
                    ref={manualNameRef}
                    type="text"
                    placeholder="Nama item..."
                    value={manualItemName}
                    onChange={e => setManualItemName(e.target.value)}
                    className={`w-full p-3 rounded-2xl border outline-none text-sm transition-all focus:ring-2 focus:ring-amber-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                      }`}
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    Kategori (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Service, Custom..."
                    value={manualItemCategory}
                    onChange={e => setManualItemCategory(e.target.value)}
                    className={`w-full p-3 rounded-2xl border outline-none text-sm transition-all focus:ring-2 focus:ring-amber-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                      }`}
                  />
                </div>

                {/* Harga */}
                <div>
                  <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    Harga (Rp)
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? 'text-stone-400' : 'text-stone-400'}`}>Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={manualItemPrice ? Number(manualItemPrice).toLocaleString('id-ID') : ''}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setManualItemPrice(raw);
                      }}
                      className={`w-full pl-10 pr-3 py-3 rounded-2xl border outline-none text-sm font-black text-right transition-all focus:ring-2 focus:ring-amber-500/40 ${isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500' : 'bg-white border-gray-200 text-gray-800'
                        }`}
                    />
                  </div>
                  {/* Quick price buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {quickPrices.map(p => {
                      const isSelected = manualItemPrice === p.toString();
                      return (
                        <button
                          key={p}
                          onClick={() => setManualItemPrice(p.toString())}
                          className={`py-2 rounded-2xl text-[10px] font-black transition-all ${isSelected
                              ? 'bg-amber-500 text-white'
                              : isDark
                                ? 'bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-amber-400'
                                : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'
                            }`}
                        >
                          {p >= 1000000 ? `${p / 1000000}jt` : `${p / 1000}k`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Jumlah */}
                <div>
                  <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    Jumlah
                  </label>
                  <div className={`flex items-center gap-3 p-1 rounded-2xl w-fit ${isDark ? 'bg-stone-900' : 'bg-gray-100'}`}>
                    <button
                      onClick={() => setManualItemQuantity(q => Math.max(1, q - 1))}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-base transition-all ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-amber-500 hover:text-white' : 'bg-white text-gray-700 hover:bg-amber-500 hover:text-white shadow-sm'
                        }`}
                    >−</button>
                    <span className={`w-8 text-center font-black text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {manualItemQuantity}
                    </span>
                    <button
                      onClick={() => setManualItemQuantity(q => q + 1)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-base transition-all ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-amber-500 hover:text-white' : 'bg-white text-gray-700 hover:bg-amber-500 hover:text-white shadow-sm'
                        }`}
                    >+</button>
                  </div>
                </div>

                {/* Preview total */}
                {manualItemPrice && Number(manualItemPrice) > 0 && (
                  <div className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100'}`}>
                    <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      Total ({manualItemQuantity}×)
                    </span>
                    <span className={`text-base font-black ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      {format(Number(manualItemPrice) * manualItemQuantity)}
                    </span>
                  </div>
                )}
              </div>

              {/* Manual item footer */}
              <div className={`flex-shrink-0 p-4 border-t flex gap-2 ${isDark ? 'border-stone-900' : 'border-gray-100'}`}>
                <button
                  onClick={quickPayManualItem}
                  disabled={!manualItemName.trim() || !manualItemPrice}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all ${manualItemName.trim() && manualItemPrice
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-[0.98]'
                      : isDark ? 'bg-stone-900 text-stone-700 cursor-not-allowed' : 'bg-gray-100 text-stone-300 cursor-not-allowed'
                    }`}
                >
                  <Zap size={14} /> Quick Pay
                </button>
                <button
                  onClick={addManualItemToCart}
                  disabled={!manualItemName.trim() || !manualItemPrice}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm border transition-all ${manualItemName.trim() && manualItemPrice
                      ? isDark
                        ? 'border-stone-700 text-stone-200 hover:border-amber-500/50 hover:text-amber-400'
                        : 'border-gray-300 text-gray-700 hover:border-amber-400 hover:text-amber-700'
                      : isDark ? 'border-stone-900 text-stone-700 cursor-not-allowed' : 'border-gray-100 text-stone-300 cursor-not-allowed'
                    }`}
                >
                  <Package size={14} /> Ke Cart
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {editingItemIndex !== null && editingProduct && (
        <ProductDetailModal
          product={editingProduct}
          item={cart[editingItemIndex]}
          onClose={() => setEditingItemIndex(null)}
          onSave={handleUpdateCartItem}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          total={displayTotal}
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