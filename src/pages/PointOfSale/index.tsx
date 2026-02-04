import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, ShoppingCart, Trash2, User, X, PlusCircle, Percent, Flame, Trophy, TrendingUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useProductCatalog } from '../../hooks/useProductCatalog'; // ✅ Custom hook baru
import ProductGrid from '../../components/pos/ProductGrid';
import CustomerSelector from '../../components/pos/CustomerSelector';
import CategoryPills from '../../components/pos/CategoryPills';
import PaymentModal from '../../components/pos/PaymentModal';
import ProductDetailModal from '../../components/pos/ProductDetailModal';
import ReceiptModal from '../../components/pos/ReceiptModal';
import type { Transaction, TransactionItem, Product, CartItemWithInput } from '../../types';

export default function PointOfSale() {
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  
  const { products, customers, addTransaction, settings, transactions } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ✅ SIMPLIFY: Hanya satu search state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [bestSellerPeriod, setBestSellerPeriod] = useState<number>(() => {
    const saved = localStorage.getItem('posBestSellerPeriod');
    return saved ? parseInt(saved) : 3;
  });

  // Cart state
  const [cart, setCart] = useState<CartItemWithInput[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>();
  const [isCustomerSelectorOpen, setCustomerSelectorOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isCartExpanded, setCartExpanded] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // Order details
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away'>('dine-in');

  // Manual input
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [manualItemDescription, setManualItemDescription] = useState('');

  // ✅ USE CUSTOM HOOK untuk product catalog
  const {
    sortedProducts,
    topBestSellers,
    promoProductsCount,
    bestSellerCount
  } = useProductCatalog(products, transactions, search, selectedCategory, bestSellerPeriod);

  // Debounced search (opsional - bisa dihapus jika tidak perlu)
  const searchTimeoutRef = useRef<number | null>(null);

  // Save best seller period preference
  useEffect(() => {
    localStorage.setItem('posBestSellerPeriod', bestSellerPeriod.toString());
  }, [bestSellerPeriod]);

  // ==================== HELPER FUNCTIONS ====================
  const formatCurrencyInput = (value: string): string => {
    const cleanValue = value.replace(/\./g, '');
    if (!cleanValue) return '';
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('id-ID');
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('id-ID');
  };

  // ==================== VALIDATION FUNCTIONS ====================
  const validateStock = useCallback((productId: string, currentQuantity: number, delta: number): boolean => {
    if (productId.startsWith('manual-')) return true;
    
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    
    const newQuantity = currentQuantity + delta;
    return newQuantity > 0 && newQuantity <= product.stock;
  }, [products]);

  const validateExactStock = useCallback((productId: string, exactQuantity: number): boolean => {
    if (productId.startsWith('manual-')) return exactQuantity > 0;
    
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    return exactQuantity > 0 && exactQuantity <= product.stock;
  }, [products]);

  // ==================== CART FUNCTIONS ====================
  const addManualItemToCart = () => {
    if (!manualItemName || !manualItemPrice) return;
    
    const cleanPrice = manualItemPrice.replace(/\./g, '');
    const price = parseFloat(cleanPrice);
    
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    const capitalizedName = manualItemName.trim().charAt(0).toUpperCase() + manualItemName.trim().slice(1);
    
    let note = capitalizedName;
    if (manualItemDescription && manualItemDescription.trim() !== '') {
      note = `${capitalizedName} - ${manualItemDescription.trim()}`;
    }

    const newItem: CartItemWithInput = {
      productId: `manual-${Date.now()}`,
      quantity: 1,
      price: price,
      cost: price * 0.7,
      note: note,
      modifiers: []
    };

    setCart(prev => [...prev, newItem]);
    handleCloseManualInput();
  };

  const handleCloseManualInput = () => {
    setIsManualInputOpen(false);
    setManualItemName('');
    setManualItemDescription('');
    setManualItemPrice('');
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    const priceToUse = (product.isPromo && product.promoPrice) ? product.promoPrice : product.price;
    
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.productId === productId && !item.note && (!item.modifiers || item.modifiers.length === 0)
      );
      
      if (existingIndex >= 0) {
        const newCart = [...prev];
        if (newCart[existingIndex].quantity + 1 <= product.stock) {
          newCart[existingIndex].quantity += 1;
        }
        return newCart;
      }
      
      if (product.stock < 1) return prev;
      
      const newItem: CartItemWithInput = {
        productId,
        quantity: 1,
        price: priceToUse,
        cost: product.cost,
        modifiers: []
      };
      
      if (product.isPromo && product.promoPrice) {
        newItem.isPromo = true;
        newItem.originalPrice = product.price;
        newItem.promoPrice = product.promoPrice;
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
      if (newQty > 0) {
        newCart[index] = { ...item, quantity: newQty, tempInput: undefined };
        return newCart;
      }
      return prev;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCartItem = (updatedItem: TransactionItem) => {
    if (editingItemIndex !== null) {
      setCart(prev => {
        const newCart = [...prev];
        newCart[editingItemIndex] = { ...updatedItem as CartItemWithInput };
        return newCart;
      });
      setEditingItemIndex(null);
    }
  };

  // ==================== CALCULATE TOTALS ====================
  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), 
    [cart]
  );
  
  const totalCost = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0), 
    [cart]
  );
  
  const taxRate = useMemo(() => 
    (settings?.taxRate || 0) / 100, 
    [settings?.taxRate]
  );
  
  const tax = useMemo(() => 
    subtotal * taxRate, 
    [subtotal, taxRate]
  );
  
  const grandTotal = useMemo(() => 
    subtotal + tax, 
    [subtotal, tax]
  );
  
  const profit = useMemo(() => 
    subtotal - totalCost, 
    [subtotal, totalCost]
  );

  // ==================== HANDLE PAYMENT ====================
  const handlePaymentSuccess = (method: 'cash' | 'card' | 'qris', cashReceived?: number, change?: number) => {
    if (cart.length === 0) return;
    
    // Create transaction object
    const transaction: Transaction = {
      id: `T${Date.now()}`,
      date: new Date(),
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        note: item.note,
        modifiers: item.modifiers,
        isPromo: item.isPromo,
        originalPrice: item.originalPrice,
        promoPrice: item.promoPrice,
        promoLabel: item.promoLabel
      })),
      total: grandTotal,
      cost: totalCost,
      profit: profit,
      paymentMethod: method,
      customerId: selectedCustomer,
      customerName: customCustomerName || (customers.find(c => c.id === selectedCustomer)?.name),
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      orderType,
      cashReceived,
      change,
      taxRate: settings?.taxRate || 0,
    };
    
    try {
      // Pass transaction to AppContext
      addTransaction(transaction);
      
      // Clear cart and reset states
      setCart([]);
      setSelectedCustomer(undefined);
      setCustomCustomerName('');
      setTableNumber('');
      setPaymentModalOpen(false);
      setReceiptTransaction(transaction);
    } catch (error) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // ==================== CALCULATE SAVINGS ====================
  const totalSavings = useMemo(() => 
    cart.reduce((sum, item) => {
      if (item.isPromo && item.originalPrice) {
        return sum + ((item.originalPrice - item.price) * item.quantity);
      }
      return sum;
    }, 0), 
    [cart]
  );

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  
  const editingItem = editingItemIndex !== null ? cart[editingItemIndex] : null;
  const editingProduct = editingItem 
    ? (products.find(p => p.id === editingItem.productId) || { 
        id: editingItem.productId, 
        name: editingItem.note || 'Manual Item', 
        price: editingItem.price, 
        stock: 999, 
        minStock: 0,
        category: 'Custom' as any,
        cost: editingItem.cost,
        unit: 'pcs',
        image: null,
        isPromo: false,
        isBestSeller: false,
        recentSalesCount: 0,
        bestSellerRank: 0,
        promoPrice: 0,
        promoLabel: '',
        salesCount: 0,
        bestSellerPeriod: 0,
        bestSellerUpdatedAt: new Date().toISOString()
      }) 
    : null;

  const handleOrderType = (type: 'dine-in' | 'take-away') => {
    setOrderType(type);
    if (type === 'take-away') {
      setTableNumber('');
    }
  };

  // ==================== INPUT VALIDATION ====================
  const handleTableNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].includes(e.keyCode) ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39) ||
        // Allow: numbers
        (e.keyCode >= 48 && e.keyCode <= 57) ||
        (e.keyCode >= 96 && e.keyCode <= 105)) {
      return;
    }
    e.preventDefault();
  };

  // ==================== RENDER ====================
  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 relative">
      {/* LEFT: Catalog */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-shrink-0 space-y-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Menu <span className="text-amber-500">Explorer</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 outline-none text-sm transition-all ${
                    isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white focus:border-amber-500' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 text-gray-800 focus:border-amber-500'
                  }`}
                  value={search} // ✅ Langsung search state
                  onChange={(e) => setSearch(e.target.value)} // ✅ Langsung setSearch
                />
              </div>
              
              <button 
                onClick={() => setIsManualInputOpen(true)}
                className={`p-2.5 rounded-2xl border-2 transition-all bg-gradient-to-br ${
                  isDark 
                    ? 'from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-400 hover:from-amber-500/20 hover:to-orange-500/10 hover:text-amber-300' 
                    : 'from-amber-50 to-orange-50 border-amber-500/30 text-amber-600 hover:from-amber-100 hover:to-orange-100 hover:text-amber-700'
                }`}
                title="Add manual item (Alt+M)"
                aria-label="Add manual item"
              >
                <PlusCircle size={20} />
              </button>
            </div>
          </div>
          
          <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-1">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
              isDark 
                ? 'bg-gray-700 text-amber-400 border border-amber-800/30' 
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              <TrendingUp size={12} />
              <span>Trending:</span>
              <select 
                value={bestSellerPeriod}
                onChange={(e) => setBestSellerPeriod(Number(e.target.value))}
                className={`bg-transparent border-none outline-none text-xs font-bold appearance-none cursor-pointer ${
                  isDark ? 'text-amber-300' : 'text-amber-600'
                }`}
                aria-label="Select best seller period"
              >
                <option value="1">Today</option>
                <option value="3">3 Days</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              {promoProductsCount > 0 && (
                <div className="relative group">
                  <div 
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                      isDark 
                        ? 'bg-red-900/30 text-red-400' 
                        : 'bg-red-100 text-red-600'
                    }`}
                    aria-label={`${promoProductsCount} promo items available`}
                    role="status"
                  >
                    <Flame size={10} />
                    <span>{promoProductsCount} PROMO</span>
                  </div>
                  <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50">
                    {promoProductsCount} items are on promotion
                  </div>
                </div>
              )}
              
              {topBestSellers.length > 0 && (
                <div className="relative group">
                  <div 
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                      isDark 
                        ? 'bg-amber-900/30 text-amber-400' 
                        : 'bg-amber-100 text-amber-600'
                    }`}
                    aria-label={`Top ${topBestSellers.length} sellers in last ${bestSellerPeriod} days`}
                    role="status"
                  >
                    <Trophy size={10} />
                    <span>{topBestSellers.length} BEST SELLERS</span>
                  </div>
                  <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50">
                    Top {topBestSellers.length} items in last {bestSellerPeriod} days
                  </div>
                </div>
              )}
              
              {topBestSellers.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  <div className="text-[10px] text-gray-500">|</div>
                  <div className={`text-[10px] font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                    #{1}: {topBestSellers[0]?.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto horizontal-scrollbar-thin pb-24 lg:pb-0 pr-1">
          <ProductGrid 
            products={sortedProducts} // ✅ Dari custom hook
            onAddToCart={addToCart}
            transactions={transactions}
            bestSellerPeriod={bestSellerPeriod}
          />
        </div>
      </div>

      {/* RIGHT: Ticket */}
      <div className={`flex flex-col fixed bottom-0 left-0 right-0 z-20 lg:static w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 rounded-t-[2.5rem] lg:rounded-[2rem] border shadow-2xl transition-all duration-500 bg-gradient-to-b ${isDark ? 'from-gray-800 via-gray-800 to-gray-900 border-gray-700' : 'from-white via-white to-gray-50 border-gray-100'} ${isCartExpanded ? 'h-[85vh]' : 'h-20 lg:h-full lg:overflow-hidden'}`}>
        <button 
          className="lg:hidden w-full flex flex-col items-center py-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-t-[2.5rem]"
          onClick={() => setCartExpanded(!isCartExpanded)}
          aria-label={isCartExpanded ? "Collapse cart" : "Expand cart"}
          aria-expanded={isCartExpanded}
        >
          <div className={`w-12 h-1.5 rounded-full mb-2 bg-gradient-to-r ${isDark ? 'from-gray-700 to-gray-600' : 'from-gray-300 to-gray-200'}`}></div>
          {!isCartExpanded && (
            <div className="flex justify-between w-full px-6">
              <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>{cart.length} Items</span>
              <span className={`font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Rp {grandTotal.toLocaleString()}</span>
            </div>
          )}
        </button>

        <div className={`flex flex-col h-full ${!isCartExpanded ? 'hidden lg:flex' : 'flex'}`}>
          <div className={`p-3 border-b ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white/50 border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Checkout</h3>
              <button 
                onClick={() => setCustomerSelectorOpen(!isCustomerSelectorOpen)} 
                className={`text-xs font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isCustomerSelectorOpen 
                    ? 'bg-amber-500 text-white' 
                    : isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-amber-400 hover:text-amber-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-amber-600 hover:text-amber-700'
                }`}
                aria-label={isCustomerSelectorOpen ? "Close customer selector" : "Select member"}
                aria-expanded={isCustomerSelectorOpen}
              >
                {isCustomerSelectorOpen ? (
                  '✕'
                ) : (
                  <div className="flex items-center gap-0.5 whitespace-nowrap">
                    <User size={9} />
                    <span className="text-[9px] text-muted-foreground leading-none">
                      Select Member
                    </span>
                  </div>
                )}
              </button>
            </div>
            
            {!isCustomerSelectorOpen ? (
              <div className="space-y-2">
                <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800" role="radiogroup" aria-label="Order type">
                  <button
                    onClick={() => handleOrderType('dine-in')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      orderType === 'dine-in'
                        ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                    }`}
                    role="radio"
                    aria-checked={orderType === 'dine-in'}
                  >
                    Dine In
                    {orderType === 'dine-in' && tableNumber && tableNumber !== '' && (
                      <span className="ml-1 text-[10px] opacity-75">(⌗{tableNumber})</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleOrderType('take-away')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      orderType === 'take-away'
                        ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                    }`}
                    role="radio"
                    aria-checked={orderType === 'take-away'}
                  >
                    Take Away
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                    <User size={12} className={selectedCustomer ? 'text-amber-500' : 'text-gray-400'} />
                  </div>
                  <input 
                    type="text" 
                    placeholder={selectedCustomer ? "Member" : "Customer name"} 
                    value={selectedCustomerData ? selectedCustomerData.name : customCustomerName} 
                    onChange={(e) => {
                      if (!selectedCustomer) {
                        setCustomCustomerName(e.target.value);
                      }
                    }}
                    disabled={!!selectedCustomer}
                    className={`w-full pl-8 pr-7 py-2 text-xs rounded-lg border bg-gradient-to-br outline-none transition-all focus:ring-2 focus:ring-amber-500 ${
                      selectedCustomer 
                        ? isDark 
                          ? 'from-amber-900/40 to-amber-800/30 border-amber-700/40 text-amber-300 bg-amber-950/30' 
                          : 'from-amber-100 to-amber-50 border-amber-300 text-amber-900 bg-amber-50'
                        : isDark 
                          ? 'from-gray-800 to-gray-800/90 border-gray-600 text-white placeholder-gray-400' 
                          : 'from-white to-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    aria-label="Customer name"
                  />
                  
                  {selectedCustomer && (
                    <button 
                      onClick={() => {
                        setSelectedCustomer(undefined);
                        setCustomCustomerName('');
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      title="Clear customer"
                      aria-label="Clear customer selection"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  )}
                </div>

                {orderType === 'dine-in' && (
                  <div className="relative">
                    <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                      <span className="text-gray-500 text-xs">⌗</span>
                    </div>
                    <input 
                      type="text"
                      inputMode="numeric" 
                      placeholder="Table number" 
                      value={tableNumber || ''} 
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setTableNumber(value);
                        }
                      }}
                      onKeyDown={handleTableNumberKeyDown}
                      onPaste={(e) => {
                        const pastedText = e.clipboardData.getData('text');
                        if (!/^\d*$/.test(pastedText)) {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg border bg-gradient-to-br outline-none transition-all focus:ring-2 focus:ring-amber-500 ${
                        tableNumber && tableNumber !== ''
                          ? isDark 
                            ? 'from-amber-900/40 to-amber-800/30 border-amber-700/40 text-white placeholder-amber-500/50' 
                            : 'from-amber-100 to-amber-50 border-amber-300 text-amber-900 placeholder-amber-500/70'
                          : isDark 
                            ? 'from-gray-800 to-gray-800/90 border-gray-600 text-gray-300 placeholder-gray-500' 
                            : 'from-white to-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      aria-label="Table number"
                    />
                  </div>
                )}
                
                {selectedCustomerData && (
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        Member
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        <span className="font-bold text-amber-500">{selectedCustomerData.totalVisits || 0}</span> visits
                      </span>
                      <span className="text-gray-500 hidden sm:inline">
                        <span className="font-bold text-green-500">Rp {(selectedCustomerData.totalSpent || 0).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <CustomerSelector 
                customers={customers} 
                selectedCustomer={selectedCustomer} 
                onSelect={(id) => { 
                  setSelectedCustomer(id); 
                  setCustomerSelectorOpen(false);
                  setCustomCustomerName('');
                }} 
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto horizontal-scrollbar-thin p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                <ShoppingCart size={48} className="mb-4 text-gray-400" />
                <p className="font-black text-sm uppercase text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              cart.map((item, idx) => {
                const product = products.find(p => p.id === item.productId);
                const itemName = product ? product.name : (item.note || 'Custom Item');
                const itemPrice = item.price * item.quantity;
                const isPromoItem = item.isPromo && item.originalPrice;
                
                return (
                  <div 
                    key={`${item.productId}-${idx}-${item.quantity}`} 
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit ${itemName} in cart`}
                    onClick={() => setEditingItemIndex(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setEditingItemIndex(idx);
                        e.preventDefault();
                      }
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isPromoItem
                        ? isDark 
                          ? 'bg-red-900/20 hover:bg-red-900/30 border border-red-500/20' 
                          : 'bg-red-50/80 hover:bg-red-100/80 border border-red-200'
                        : isDark 
                          ? 'bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700' 
                          : 'bg-gray-50 hover:bg-white border border-gray-200'
                    }`}
                  >
                    <div className="absolute top-[-3px] left-[-3px] rounded-lg flex flex-col gap-0.5 items-start z-10">
                      {isPromoItem && (
                        <div className="px-2 py-0.5 rounded-tr-md rounded-br-md text-[9px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm transform -rotate-3">
                          {item.promoLabel || 'PROMO'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1 mb-1">
                          <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {itemName}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isPromoItem ? (
                            <>
                              <p className={`text-xs font-black line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Rp {item.originalPrice?.toLocaleString()}
                              </p>
                              <p className={`text-xs font-black ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                Rp {item.price.toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <p className={`text-xs font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                              Rp {item.price.toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {isPromoItem && item.originalPrice && (
                            <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                              Save Rp {((item.originalPrice - item.price) * item.quantity).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
                        <div className={`text-sm font-bold ${isPromoItem ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-amber-400' : 'text-amber-600')}`}>
                          Rp {itemPrice.toLocaleString()}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-0.5 rounded-lg p-0.5 ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200 shadow-xs'}`}>
                            <button 
                              onClick={() => updateQuantity(idx, -1)} 
                              className="w-5 h-5 flex items-center justify-center rounded-md text-xs hover:bg-amber-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                              disabled={item.quantity <= 1}
                              aria-label={`Decrease quantity of ${itemName}`}
                            >
                              -
                            </button>
                            <span className={`text-xs font-bold w-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(idx, 1)} 
                              disabled={product && item.quantity >= product.stock}
                              className="w-5 h-5 flex items-center justify-center rounded-md text-xs hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              aria-label={`Increase quantity of ${itemName}`}
                            >
                              +
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(idx)} 
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                            aria-label={`Remove ${itemName} from cart`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={`p-4 space-y-3 rounded-t-3xl border-t bg-gradient-to-b ${isDark ? 'from-gray-900/80 via-gray-900/60 to-gray-800 border-gray-700' : 'from-gray-50/80 via-gray-50/60 to-gray-50/40 border-gray-100'}`}>
            {totalSavings > 0 && (
              <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/15 border border-gray-800/30' : 'bg-green-50/70 border border-green-200/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Percent className={`w-3.5 h-3.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-xs font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>Total Savings</span>
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    Rp {totalSavings.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Subtotal</span>
                <span className="text-gray-800 dark:text-gray-200 font-black">Rp {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Tax ({settings?.taxRate || 0}%)</span>
                <span className="text-gray-800 dark:text-gray-200 font-black">Rp {tax.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-200 dark:border-gray-700">
              <span className={`font-bold text-base uppercase ${isDark ? 'text-white' : 'text-gray-800'}`}>Total</span>
              <span className="text-xl font-black text-amber-500">Rp {grandTotal.toLocaleString()}</span>
            </div>
            
            <button 
              onClick={() => setPaymentModalOpen(true)} 
              disabled={cart.length === 0} 
              className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all uppercase tracking-wider text-sm bg-gradient-to-r focus:outline-none focus:ring-4 focus:ring-amber-500/50 ${
                cart.length === 0 
                  ? 'from-gray-300 to-gray-400 cursor-not-allowed' 
                  : 'from-amber-500 via-orange-500 to-amber-600 hover:opacity-90 active:scale-95 shadow-md shadow-amber-500/20'
              }`}
              aria-label="Checkout order"
            >
              Checkout Order
            </button>
          </div>
        </div>
      </div>

      {isManualInputOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-label="Manual item entry"
          aria-modal="true"
        >
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl bg-gradient-to-br ${isDark ? 'from-gray-800 via-gray-800 to-gray-900 border border-gray-700' : 'from-white via-white to-gray-50 border border-gray-200'} mx-4`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Manual Entry</h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Add custom item to cart</p>
              </div>
              <button 
                onClick={handleCloseManualInput}
                className="p-1 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Close manual entry"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={`text-xs font-bold uppercase block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Item Name
                </label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="e.g., Extra Service, Special Order..." 
                  className={`w-full p-2 rounded-lg border outline-none transition-all text-sm focus:ring-2 focus:ring-amber-500 ${
                    isDark 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`} 
                  value={manualItemName} 
                  onChange={(e) => setManualItemName(e.target.value)} 
                  aria-required="true"
                />
              </div>
              
              <div>
                <label className={`text-xs font-bold uppercase block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Description <span className="font-normal normal-case text-gray-500">(optional)</span>
                </label>
                <textarea 
                  rows={2}
                  placeholder="Add item description or notes..."
                  className={`w-full p-2 rounded-lg border outline-none transition-all text-sm resize-none focus:ring-2 focus:ring-amber-500 ${
                    isDark 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  value={manualItemDescription}
                  onChange={(e) => setManualItemDescription(e.target.value)}
                  maxLength={100}
                />
                <div className={`text-right text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {(manualItemDescription || '').length}/100
                </div>
              </div>
              
              <div>
                <label className={`text-xs font-bold uppercase block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Price (Rp)
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="0" 
                    className={`w-full p-2 pl-8 pr-3 rounded-lg border outline-none text-right text-sm font-bold focus:ring-2 focus:ring-amber-500 ${
                      isDark 
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`} 
                    value={manualItemPrice} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) return;
                      const formattedValue = formatCurrencyInput(value);
                      setManualItemPrice(formattedValue);
                    }}
                    onBlur={() => {
                      if (manualItemPrice) {
                        const cleanValue = manualItemPrice.replace(/\./g, '');
                        const numValue = parseFloat(cleanValue);
                        if (!isNaN(numValue)) {
                          setManualItemPrice(formatCurrency(numValue));
                        }
                      }
                    }}
                    aria-required="true"
                  />
                  <div className={`absolute left-2 top-1/2 -translate-y-1/2 font-bold text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Rp</div>
                </div>
                
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {[5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000].map((price) => {
                    const cleanManualPrice = manualItemPrice.replace(/\./g, '');
                    const currentPrice = parseFloat(cleanManualPrice);
                    const isSelected = !isNaN(currentPrice) && currentPrice === price;
                    
                    return (
                      <button
                        key={price}
                        type="button"
                        onClick={() => setManualItemPrice(formatCurrency(price))}
                        className={`p-1.5 rounded text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isSelected
                            ? 'bg-amber-500 text-white'
                            : isDark 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        aria-label={`Set price to ${price}`}
                      >
                        {price >= 1000000 
                          ? `${(price/1000000).toFixed(0)}jt` 
                          : price >= 1000 
                            ? `${(price/1000).toFixed(0)}k` 
                            : price}
                      </button>
                    );
                  })}
                </div>
              </div>

              {manualItemName && manualItemPrice && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="text-xs text-gray-500 mb-1">Preview:</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {manualItemName.trim().charAt(0).toUpperCase() + manualItemName.trim().slice(1)}
                      </span>
                      <span className="text-amber-500 font-medium text-sm">
                        Rp {formatCurrency(parseFloat(manualItemPrice.replace(/\./g, '')) || 0)}
                      </span>
                    </div>
                    {manualItemDescription && (
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                        {manualItemDescription}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button 
                onClick={addManualItemToCart} 
                disabled={!manualItemName || !manualItemPrice} 
                className={`w-full py-2.5 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/50 ${
                  !manualItemName || !manualItemPrice
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.98]'
                }`}
                aria-label="Add to cart"
              >
                <PlusCircle size={15} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

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
          total={grandTotal} 
          onClose={() => setPaymentModalOpen(false)} 
          onConfirm={handlePaymentSuccess} 
        />
      )}

      {receiptTransaction && (
        <ReceiptModal 
          transaction={receiptTransaction}
          onClose={() => setReceiptTransaction(null)}
          onPrint={() => {
            window.print();
          }}
        />
      )}
    </div>
  );
}