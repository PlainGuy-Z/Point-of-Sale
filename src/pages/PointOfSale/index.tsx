import { useState } from 'react';
import { Search, ShoppingCart, Trash2, User, X, PlusCircle, Hash } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import ProductGrid from '../../components/pos/ProductGrid';
import CustomerSelector from '../../components/pos/CustomerSelector';
import CategoryPills from '../../components/pos/CategoryPills';
import PaymentModal from '../../components/pos/PaymentModal';
import ProductDetailModal from '../../components/pos/ProductDetailModal';
import type { Transaction, TransactionItem } from '../../types';

export default function PointOfSale() {
  const { products, customers, addTransaction, settings } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>();
  const [isCustomerSelectorOpen, setCustomerSelectorOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isCartExpanded, setCartExpanded] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [quantityInput, setQuantityInput] = useState<{ [key: number]: string }>({});

  const [customCustomerName, setCustomCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');

  // Fungsi helper untuk format input currency
  const formatCurrencyInput = (value: string): string => {
    const cleanValue = value.replace(/\./g, '');
    if (!cleanValue) return '';
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('id-ID');
  };

  // Fungsi helper untuk format currency (tanpa desimal untuk harga)
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('id-ID');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addManualItemToCart = () => {
    if (!manualItemName || !manualItemPrice) return;
    
    // Bersihkan format pemisah ribuan
    const cleanPrice = manualItemPrice.replace(/\./g, '');
    const price = parseFloat(cleanPrice);
    
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    const capitalizedName = manualItemName.trim().charAt(0).toUpperCase() + manualItemName.trim().slice(1);

    const newItem: TransactionItem = {
      productId: `manual-${Date.now()}`,
      quantity: 1,
      price: price,
      cost: price * 0.7,
      note: capitalizedName,
      modifiers: []
    };

    setCart(prev => [...prev, newItem]);
    handleCloseManualInput();
  };

  const handleCloseManualInput = () => {
    setIsManualInputOpen(false);
    setManualItemName('');
    setManualItemPrice('');
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.productId === productId && !item.note && (!item.modifiers || item.modifiers.length === 0)
      );
      
      if (existingIndex >= 0) {
        const newCart = [...prev];
        if (newCart[existingIndex].quantity < product.stock) {
          newCart[existingIndex].quantity += 1;
        }
        return newCart;
      }
      return [...prev, { productId, quantity: 1, price: product.price, cost: product.cost }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const product = products.find(p => p.id === item.productId);
      
      const newQty = item.quantity + delta;
      if (newQty > 0) {
        if (product && newQty > product.stock) return prev;
        newCart[index] = { ...item, quantity: newQty };
        return newCart;
      }
      return prev;
    });
  };

  const handleQuantityInput = (index: number, value: string) => {
    setQuantityInput(prev => ({ ...prev, [index]: value }));
  };

  const applyQuantityInput = (index: number) => {
    const inputValue = quantityInput[index];
    if (!inputValue) return;
    const newQty = parseInt(inputValue);
    if (isNaN(newQty) || newQty <= 0) {
      setQuantityInput(prev => ({ ...prev, [index]: '' }));
      return;
    }

    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const product = products.find(p => p.id === item.productId);
      
      if (newQty > 0) {
        if (product && newQty > product.stock) return prev;
        newCart[index] = { ...item, quantity: newQty };
      }
      return newCart;
    });
    setQuantityInput(prev => ({ ...prev, [index]: '' }));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCartItem = (updatedItem: TransactionItem) => {
    if (editingItemIndex !== null) {
      setCart(prev => {
        const newCart = [...prev];
        newCart[editingItemIndex] = updatedItem;
        return newCart;
      });
      setEditingItemIndex(null);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCost = cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const taxRate = (settings?.taxRate || 0) / 100;
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + tax;
  const profit = subtotal - totalCost;

  const handlePaymentSuccess = (method: 'cash' | 'card' | 'qris', cashReceived?: number, change?: number) => {
    if (cart.length === 0) return;
    const transaction: any = {
      id: `T${Date.now()}`,
      date: new Date(),
      items: [...cart],
      total: grandTotal,
      cost: totalCost,
      profit: profit,
      paymentMethod: method,
      customerId: selectedCustomer,
      customerName: customCustomerName || (customers.find(c => c.id === selectedCustomer)?.name),
      tableNumber: tableNumber,
      cashReceived,
      change,
    };
    addTransaction(transaction);
    setCart([]);
    setSelectedCustomer(undefined);
    setCustomCustomerName('');
    setTableNumber('');
    setPaymentModalOpen(false);
    alert(`Success! Order #${transaction.id} processed.`);
  };

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
        image: null
      }) 
    : null;

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 overflow-hidden relative">
      {/* LEFT: Catalog */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-shrink-0 space-y-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Menu <span className="text-amber-500">Explorer</span>
            </h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 outline-none text-sm transition-all ${
                    isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white focus:border-amber-500' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 text-gray-800 focus:border-amber-500'
                  }`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsManualInputOpen(true)}
                className={`p-2.5 rounded-2xl border-2 transition-all bg-gradient-to-br ${
                  isDark 
                    ? 'from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-400 hover:from-amber-500/20 hover:to-orange-500/10 hover:text-amber-300' 
                    : 'from-amber-50 to-orange-50 border-amber-500/30 text-amber-600 hover:from-amber-100 hover:to-orange-100 hover:text-amber-700'
                }`}
                title="Add manual item"
              >
                <PlusCircle size={20} />
              </button>
            </div>
          </div>
          <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 lg:pb-0 pr-1">
          <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
        </div>
      </div>

      {/* RIGHT: Ticket */}
      <div className={`flex flex-col fixed bottom-0 left-0 right-0 z-20 lg:static w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 rounded-t-[2.5rem] lg:rounded-[2rem] border shadow-2xl transition-all duration-500 bg-gradient-to-b ${isDark ? 'from-gray-800 via-gray-800 to-gray-900 border-gray-700' : 'from-white via-white to-gray-50 border-gray-100'} ${isCartExpanded ? 'h-[85vh]' : 'h-20 lg:h-full lg:overflow-hidden'}`}>
        <div className="lg:hidden w-full flex flex-col items-center py-3 cursor-pointer" onClick={() => setCartExpanded(!isCartExpanded)}>
          <div className={`w-12 h-1.5 rounded-full mb-2 bg-gradient-to-r ${isDark ? 'from-gray-700 to-gray-600' : 'from-gray-300 to-gray-200'}`}></div>
          {!isCartExpanded && (
            <div className="flex justify-between w-full px-6">
              <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>{cart.length} Items</span>
              <span className={`font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Rp {grandTotal.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className={`flex flex-col h-full ${!isCartExpanded ? 'hidden lg:flex' : 'flex'}`}>
          <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Checkout</h3>
              <button 
                onClick={() => setCustomerSelectorOpen(!isCustomerSelectorOpen)} 
                className="text-xs font-bold hover:underline text-amber-500"
              >
                {isCustomerSelectorOpen ? 'Close' : 'Select Member'}
              </button>
            </div>
            {!isCustomerSelectorOpen ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r ${isDark ? 'from-gray-900/80 to-gray-800/50' : 'from-gray-50 to-white'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-gray-800 to-gray-700' : 'from-white to-gray-50 shadow-sm'}`}>
                    <User className={selectedCustomer ? 'text-amber-500' : 'text-gray-400'} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-gray-800 dark:text-white">
                      {selectedCustomerData ? selectedCustomerData.name : (customCustomerName || 'Walk-in Guest')}
                    </p>
                    <p className="text-[10px] uppercase font-black text-gray-500">
                      {selectedCustomerData ? 'Loyalty Member' : 'Default Customer'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      placeholder="Customer name..." 
                      value={customCustomerName} 
                      onChange={(e) => setCustomCustomerName(e.target.value)} 
                      disabled={!!selectedCustomer}
                      className={`w-full p-2 rounded-xl border text-xs bg-gradient-to-br outline-none transition-all ${
                        isDark 
                          ? 'from-gray-900/50 to-gray-800/30 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500' 
                          : 'from-gray-50 to-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      placeholder="Table #" 
                      value={tableNumber} 
                      onChange={(e) => setTableNumber(e.target.value)} 
                      className={`w-full p-2 rounded-xl border text-xs bg-gradient-to-br outline-none transition-all ${
                        isDark 
                          ? 'from-gray-900/50 to-gray-800/30 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500' 
                          : 'from-gray-50 to-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <CustomerSelector 
                customers={customers} 
                selectedCustomer={selectedCustomer} 
                onSelect={(id) => { 
                  setSelectedCustomer(id); 
                  setCustomerSelectorOpen(false);
                  if (id) setCustomCustomerName('');
                }} 
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
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
                
                return (
                  <div 
                    key={`${item.productId}-${idx}`} 
                    onClick={() => setEditingItemIndex(idx)} 
                    className={`p-4 rounded-2xl cursor-pointer border-2 border-transparent transition-all bg-gradient-to-r ${
                      isDark 
                        ? 'from-gray-700/40 via-gray-700/30 to-gray-700/20 hover:from-gray-700 hover:via-gray-700/80 hover:to-gray-700/60 hover:border-amber-500/30' 
                        : 'from-gray-50 via-gray-50/80 to-white hover:from-white hover:via-white hover:to-gray-50 hover:border-amber-500/50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {itemName}
                        </p>
                        <p className={`text-xs font-black mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          Rp {item.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <div className={`flex items-center gap-1 rounded-xl p-1 bg-gradient-to-r ${isDark ? 'from-gray-900 to-gray-800 border border-gray-600' : 'from-white to-gray-50 border border-gray-200 shadow-sm'}`}>
                          <button 
                            onClick={() => updateQuantity(idx, -1)} 
                            className="w-6 h-6 flex items-center justify-center rounded-lg font-bold text-sm hover:bg-amber-500 hover:text-white transition-colors bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700"
                          >
                            -
                          </button>
                          <span className={`text-xs font-bold w-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(idx, 1)} 
                            disabled={product && item.quantity >= product.stock}
                            className="w-6 h-6 flex items-center justify-center rounded-lg font-bold text-sm hover:bg-amber-500 hover:text-white transition-colors bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className={`text-sm font-bold text-right min-w-[80px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          Rp {itemPrice.toLocaleString()}
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(idx)} 
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={`p-6 space-y-4 rounded-t-3xl border-t bg-gradient-to-b ${isDark ? 'from-gray-900/80 via-gray-900/60 to-gray-800 border-gray-700' : 'from-gray-50/80 via-gray-50/60 to-gray-50/40 border-gray-100'}`}>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Subtotal</span>
                <span className="text-gray-800 dark:text-gray-200 font-black">Rp {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Tax ({settings?.taxRate || 0}%)</span>
                <span className="text-gray-800 dark:text-gray-200 font-black">Rp {tax.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className={`font-black text-lg uppercase ${isDark ? 'text-white' : 'text-gray-800'}`}>Total</span>
              <span className="text-2xl font-black text-amber-500">Rp {grandTotal.toLocaleString()}</span>
            </div>
            <button 
              onClick={() => setPaymentModalOpen(true)} 
              disabled={cart.length === 0} 
              className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm bg-gradient-to-r ${
                cart.length === 0 
                  ? 'from-gray-300 to-gray-400 cursor-not-allowed' 
                  : 'from-amber-500 via-orange-500 to-amber-600 hover:opacity-90 active:scale-95 shadow-lg shadow-amber-500/25'
              }`}
            >
              Checkout Order
            </button>
          </div>
        </div>
      </div>

      {/* Manual Input Modal */}
      {isManualInputOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCloseManualInput();
            if (e.key === 'Enter' && manualItemName && manualItemPrice) addManualItemToCart();
          }}
        >
          <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl bg-gradient-to-br ${isDark ? 'from-gray-800 via-gray-800 to-gray-900 border border-gray-700' : 'from-white via-white to-gray-50 border border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Manual Entry</h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Add custom item to cart</p>
              </div>
              <button 
                onClick={handleCloseManualInput}
                className="p-1.5 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Item Name
                </label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="e.g., Extra Service, Special Order..." 
                  className={`w-full p-3 rounded-xl border-2 outline-none transition-all bg-gradient-to-br ${
                    isDark 
                      ? 'from-gray-900 to-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500' 
                      : 'from-white to-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                  }`} 
                  value={manualItemName} 
                  onChange={(e) => setManualItemName(e.target.value)} 
                />
              </div>
              
              {/* Enhanced Price Input */}
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Price (Rp)
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="0" 
                    className={`w-full p-3 pl-10 pr-4 rounded-xl border-2 outline-none transition-all text-right text-lg font-bold bg-gradient-to-br ${
                      isDark 
                        ? 'from-gray-900 to-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500' 
                        : 'from-white to-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500'
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
                  />
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Rp</div>
                </div>
                
                {/* Quick Price Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000].map((price) => {
                    const cleanManualPrice = manualItemPrice.replace(/\./g, '');
                    const currentPrice = parseFloat(cleanManualPrice);
                    const isSelected = !isNaN(currentPrice) && currentPrice === price;
                    
                    return (
                      <button
                        key={price}
                        type="button"
                        onClick={() => setManualItemPrice(formatCurrency(price))}
                        className={`p-2 rounded-lg text-xs font-bold transition-all bg-gradient-to-br ${
                          isSelected
                            ? 'from-amber-500 to-orange-500 text-white'
                            : isDark 
                              ? 'from-gray-700 to-gray-600 text-gray-300 hover:from-gray-600 hover:to-gray-500'
                              : 'from-gray-100 to-gray-50 text-gray-700 hover:from-gray-200 hover:to-gray-100'
                        }`}
                      >
                        {formatCurrency(price)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              {manualItemName && manualItemPrice && (
                <div className={`p-4 rounded-xl bg-gradient-to-r ${isDark ? 'from-gray-700/50 via-gray-700/40 to-gray-800/30 border border-gray-600' : 'from-gray-50 via-gray-50/80 to-white/50 border border-gray-200'}`}>
                  <div className="text-xs text-gray-500 mb-1">Preview:</div>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {manualItemName.charAt(0).toUpperCase() + manualItemName.slice(1)}
                    </span>
                    <span className="text-amber-500 font-bold">
                      Rp {formatCurrency(parseFloat(manualItemPrice.replace(/\./g, '')) || 0)}
                    </span>
                  </div>
                </div>
              )}

              <button 
                onClick={addManualItemToCart} 
                disabled={!manualItemName || !manualItemPrice} 
                className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${
                  !manualItemName || !manualItemPrice
                    ? 'from-gray-400 to-gray-500 cursor-not-allowed' 
                    : 'from-amber-500 via-orange-500 to-amber-600 hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                <PlusCircle size={18} />
                Add to Cart
              </button>
              
              <div className={`text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Press <kbd className={`px-2 py-1 rounded mx-1 bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-600' : 'from-gray-200 to-gray-100'}`}>Enter</kbd> to confirm • 
                Press <kbd className={`px-2 py-1 rounded mx-1 bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-600' : 'from-gray-200 to-gray-100'}`}>Esc</kbd> to cancel
              </div>
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
    </div>
  );
}