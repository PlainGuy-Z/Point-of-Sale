import { useState } from 'react';
import { Search, ShoppingCart, Trash2, UserPlus, User, ChevronUp, ChevronDown, Edit3, X } from 'lucide-react'; // Tambah X
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

  // --- Logic Filter Produk ---
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Logic Keranjang ---
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
      if (!product) return prev;

      const newQty = item.quantity + delta;
      if (newQty > 0 && newQty <= product.stock) {
        newCart[index] = { ...item, quantity: newQty };
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
        newCart[editingItemIndex] = updatedItem;
        return newCart;
      });
      setEditingItemIndex(null);
    }
  };

  // --- Kalkulasi Dinamis Berdasarkan Settings ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCost = cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const taxRate = (settings?.taxRate || 0) / 100;
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + tax;
  const profit = subtotal - totalCost;

  const handlePaymentSuccess = (method: 'cash' | 'card' | 'qris') => {
    if (cart.length === 0) return;

    const transaction: Transaction = {
      id: `T${Date.now()}`,
      date: new Date(),
      items: [...cart],
      total: grandTotal,
      cost: totalCost,
      profit: profit,
      paymentMethod: method,
      customerId: selectedCustomer,
    };

    addTransaction(transaction);
    setCart([]);
    setSelectedCustomer(undefined);
    setPaymentModalOpen(false);
    alert(`Success! Order #${transaction.id} processed.`);
  };

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const editingProduct = editingItemIndex !== null ? products.find(p => p.id === cart[editingItemIndex].productId) : null;

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 overflow-hidden relative">
      
      {/* LEFT: Catalog */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-shrink-0 space-y-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Menu <span className="text-amber-500">Explorer</span>
              </h1>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Find deliciousness..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 outline-none text-sm transition-all ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-amber-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-amber-500 focus:bg-white'
                }`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 lg:pb-0 pr-1">
          <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
        </div>
      </div>

      {/* RIGHT: Ticket */}
      <div className={`
        flex flex-col fixed bottom-0 left-0 right-0 z-20 lg:static 
        w-full lg:w-[360px] xl:w-[400px] flex-shrink-0
        rounded-t-[2.5rem] lg:rounded-[2rem] border shadow-2xl lg:shadow-sm transition-all duration-500
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}
        ${isCartExpanded ? 'h-[85vh]' : 'h-20 lg:h-full lg:overflow-hidden'}
      `}>
        
        {/* Mobile Header Toggle */}
        <div className="lg:hidden w-full flex flex-col items-center py-3 cursor-pointer" onClick={() => setCartExpanded(!isCartExpanded)}>
          <div className={`w-12 h-1.5 rounded-full mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          {!isCartExpanded && (
            <div className="flex justify-between w-full px-6">
              <span className="font-bold text-amber-500">{cart.length} Items</span>
              <span className="font-black text-gray-800 dark:text-white text-lg">Rp {grandTotal.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className={`flex flex-col h-full ${!isCartExpanded ? 'hidden lg:flex' : 'flex'}`}>
          {/* Customer Section - FIXED */}
          <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Checkout</h3>
              
              {/* Tombol Add Member yang berubah menjadi Close */}
              {!isCustomerSelectorOpen ? (
                <button 
                  onClick={() => setCustomerSelectorOpen(true)} 
                  className="text-xs text-amber-500 font-bold hover:underline flex items-center gap-1 transition-all"
                >
                  <UserPlus size={14} /> Add Member
                </button>
              ) : (
                <button 
                  onClick={() => setCustomerSelectorOpen(false)} 
                  className="text-xs text-red-500 font-bold hover:text-red-400 flex items-center gap-1 transition-all"
                >
                  <X size={14} /> Close
                </button>
              )}
            </div>

            {/* Area Selector Pelanggan */}
            {isCustomerSelectorOpen ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <CustomerSelector 
                  customers={customers} 
                  selectedCustomer={selectedCustomer} 
                  onSelect={(id) => { 
                    setSelectedCustomer(id); 
                    setCustomerSelectorOpen(false); 
                  }} 
                />
              </div>
            ) : (
              /* Tampilan Info Customer Default */
              <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                  <User className={selectedCustomer ? 'text-amber-500' : 'text-gray-400'} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-gray-800 dark:text-white">
                    {selectedCustomerData ? selectedCustomerData.name : 'Walk-in Guest'}
                  </p>
                  <p className="text-[10px] uppercase font-black text-gray-500">
                    {selectedCustomerData ? 'Loyalty Member' : 'Default Customer'}
                  </p>
                </div>
                {selectedCustomer && (
                  <button onClick={() => setSelectedCustomer(undefined)} className="p-1 hover:bg-red-500/10 text-red-400 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cart List */}
          {/* Cart List Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <ShoppingCart size={48} className="mb-4 text-slate-500" />
                <p className="font-black text-sm uppercase tracking-tighter text-slate-500">Your tray is empty</p>
              </div>
            ) : (
              cart.map((item, idx) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                
                return (
                  <div 
                    key={`${item.productId}-${idx}`} 
                    onClick={() => setEditingItemIndex(idx)}
                    className={`p-4 rounded-2xl group cursor-pointer transition-all border-2 border-transparent 
                      ${isDark 
                        ? 'bg-slate-700/40 hover:bg-slate-700 hover:border-slate-500' 
                        : 'bg-slate-50 hover:border-amber-100 hover:bg-white shadow-sm'
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {product.name}
                        </p>
                        <p className={`text-xs font-black mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          Rp {product.price.toLocaleString()}
                        </p>
                      </div>

                      {/* KONTROL KUANTITAS - DIPERBAIKI */}
                      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <div className={`flex items-center gap-2 rounded-xl p-1.5 ${isDark ? 'bg-slate-900 border border-slate-600' : 'bg-white border shadow-sm'}`}>
                          <button 
                            onClick={() => updateQuantity(idx, -1)} 
                            className={`w-6 h-6 flex items-center justify-center rounded-lg hover:bg-amber-500 hover:text-white transition-colors font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                          >
                            -
                          </button>
                          
                          {/* ANGKA JUMLAH - Dibuat Putih Terang di Dark Mode agar Terlihat */}
                          <span className={`text-sm font-black w-5 text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {item.quantity}
                          </span>

                          <button 
                            onClick={() => updateQuantity(idx, 1)} 
                            disabled={item.quantity >= product.stock}
                            className={`w-6 h-6 flex items-center justify-center rounded-lg hover:bg-amber-500 hover:text-white transition-colors font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'} disabled:opacity-30`}
                          >
                            +
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(idx)} 
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove Item"
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

          {/* Order Summary */}
          <div className={`p-6 space-y-4 rounded-t-3xl ${
            isDark 
              ? 'bg-gray-900/80 border-t border-gray-700' 
              : 'bg-gray-50/80 border-t border-gray-100'
          }`}>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-gray-800 dark:text-gray-200 font-black">Rp {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>Tax ({settings.taxRate}%)</span>
                <span className="text-gray-800 dark:text-gray-200 font-black">Rp {tax.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <span className="font-black text-lg uppercase tracking-tighter text-gray-800 dark:text-white">Total</span>
              <span className="text-2xl font-black text-amber-500">Rp {grandTotal.toLocaleString()}</span>
            </div>

            <button 
              onClick={() => setPaymentModalOpen(true)} 
              disabled={cart.length === 0} 
              className={`
                w-full py-4 text-white font-black rounded-2xl shadow-xl 
                transition-all disabled:opacity-50 uppercase tracking-widest text-sm
                ${cart.length === 0 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95'
                }
              `}
            >
              Checkout Order
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingItemIndex !== null && editingProduct && (
        <ProductDetailModal 
          product={editingProduct} 
          item={cart[editingItemIndex]} 
          onClose={() => setEditingItemIndex(null)} 
          onSave={handleUpdateCartItem} 
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal total={grandTotal} onClose={() => setPaymentModalOpen(false)} onConfirm={handlePaymentSuccess} />
      )}
    </div>
  );
}