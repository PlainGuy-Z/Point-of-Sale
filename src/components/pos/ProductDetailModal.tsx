import { useState, useEffect } from 'react';
import { X, Minus, Plus, MessageSquare, CheckCircle, Hash, Package, Tag, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Product, TransactionItem } from '../../types';

interface ProductDetailModalProps {
  product: Product;
  item: TransactionItem;
  onClose: () => void;
  onSave: (updatedItem: TransactionItem) => void;
}

export default function ProductDetailModal({ product, item, onClose, onSave }: ProductDetailModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isManual = item.productId.startsWith('manual-');
  const [quantity, setQuantity] = useState(item.quantity);
  const [note, setNote] = useState(item.note || '');
  const [modifiers, setModifiers] = useState<string[]>(item.modifiers || []);

  const modifierOptions = [
    { id: 'priority', label: 'Priority Order', icon: '⚡' },
    { id: 'take-away', label: 'Take Away', icon: '📦' },
    { id: 'gift-pack', label: 'Gift Wrap', icon: '🎁' },
    { id: 'custom-req', label: 'Special Request', icon: '✏️' },
  ];

  // Handle ESC key untuk cancel
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Juga handle Enter untuk save
      if (e.key === 'Enter') {
        handleSave();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const toggleModifier = (modifierId: string) => {
    setModifiers(prev => prev.includes(modifierId) ? prev.filter(id => id !== modifierId) : [...prev, modifierId]);
  };

  const handleSave = () => {
    const formattedNote = note.trim() 
      ? note.trim().charAt(0).toUpperCase() + note.trim().slice(1) 
      : '';
    onSave({ ...item, quantity, note: formattedNote, modifiers });
    onClose();
  };

  const totalPrice = item.price * quantity;
  const cost = item.cost * quantity;
  const profit = totalPrice - cost;
  const profitPercent = totalPrice > 0 ? ((profit / totalPrice) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-b ${isDark ? 'from-slate-800 via-slate-800 to-slate-900 border border-slate-700' : 'from-white via-white to-slate-50 border border-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1} // Agar bisa fokus untuk keyboard events
      >
        
        {/* Header dengan informasi lengkap */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${isDark ? 'from-slate-700 to-slate-600' : 'from-amber-50 to-orange-50'}`}>
                <Package className={isDark ? 'text-amber-400' : 'text-amber-600'} size={20} />
              </div>
              <div>
                <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isManual ? 'Custom Entry' : product.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-gradient-to-br ${isDark ? 'from-slate-700 to-slate-600 text-slate-300' : 'from-slate-100 to-slate-50 text-slate-600'}`}>
                    {isManual ? 'Manual Item' : product.category}
                  </span>
                  {!isManual && product.stock <= product.minStock && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                      <AlertCircle size={10} />
                      Low Stock
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tombol X yang bisa di-tab dan memiliki keyboard shortcut */}
            <button 
              onClick={onClose}
              className={`p-2 rounded-xl transition-all bg-gradient-to-br ${
                isDark 
                  ? 'from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50' 
                  : 'from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/50'
              }`}
              tabIndex={0}
              aria-label="Close modal"
              title="Close (ESC)"
            >
              <X size={18} className="text-slate-400 hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* Price Information Card */}
          <div className={`rounded-xl p-4 bg-gradient-to-br ${isDark ? 'from-slate-900/50 to-slate-800/30' : 'from-slate-50 to-slate-100'}`}>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Unit Price</div>
                <div className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Rp {item.price.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Unit Cost</div>
                <div className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Rp {item.cost.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Margin</div>
                <div className={`text-sm font-bold ${parseFloat(profitPercent) >= 50 ? 'text-green-500' : parseFloat(profitPercent) >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                  {profitPercent}%
                </div>
              </div>
            </div>
          </div>

          {/* Quantity Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Hash size={14} /> Quantity
              </label>
              {!isManual && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Available: <span className={`font-bold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{product.stock}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                disabled={quantity <= 1}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all bg-gradient-to-br focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  quantity <= 1 
                    ? 'from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 text-slate-400 cursor-not-allowed' 
                    : 'from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-600 hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-500 active:scale-95'
                }`}
                tabIndex={0}
              >
                <Minus size={20} />
              </button>
              
              <div className="flex-1 text-center relative">
                <input 
                  type="number"
                  value={isNaN(quantity) ? '' : quantity}
                  onChange={(e) => {
                    const val = e.target.value === '' ? NaN : parseInt(e.target.value);
                    if (isManual) {
                      setQuantity(isNaN(val) ? 1 : Math.max(1, val));
                    } else {
                      setQuantity(isNaN(val) ? 1 : Math.min(product.stock, Math.max(1, val)));
                    }
                  }}
                  className={`w-full py-3 text-center text-2xl font-black bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-b-2 focus:outline-none focus:border-amber-500 ${
                    isDark ? 'text-white border-slate-600' : 'text-slate-900 border-slate-300'
                  }`}
                  tabIndex={0}
                />
                <div className="text-xs text-slate-500 mt-1">pcs</div>
              </div>

              <button 
                onClick={() => setQuantity(isManual ? quantity + 1 : Math.min(quantity + 1, product.stock))}
                disabled={!isManual && quantity >= product.stock}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all bg-gradient-to-br focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  (!isManual && quantity >= product.stock)
                    ? 'from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 text-slate-400 cursor-not-allowed' 
                    : 'from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-600 hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-500 active:scale-95'
                }`}
                tabIndex={0}
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Quantity Quick Buttons */}
            <div className="flex gap-2">
              {[1, 5, 10, 25].map(num => (
                <button
                  key={num}
                  onClick={() => setQuantity(isManual ? num : Math.min(num, product.stock))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all bg-gradient-to-br focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    quantity === num
                      ? 'from-amber-500 to-orange-500 text-white'
                      : 'from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300 hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-500'
                  }`}
                  tabIndex={0}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Modifiers */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Options</label>
            <div className="grid grid-cols-2 gap-2">
              {modifierOptions.map(opt => (
                <button 
                  key={opt.id} 
                  onClick={() => toggleModifier(opt.id)} 
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all bg-gradient-to-br focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    modifiers.includes(opt.id) 
                      ? 'from-amber-500/20 to-orange-500/10 border-amber-500 text-amber-600 dark:text-amber-400' 
                      : 'from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-600/50 dark:hover:to-slate-500/50 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  tabIndex={0}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-[10px] font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <MessageSquare size={14} /> {isManual ? 'Item Name' : 'Special Instructions'}
            </label>
            <textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              rows={2} 
              className={`w-full p-3 rounded-xl border text-sm outline-none resize-none transition-all bg-gradient-to-br focus:outline-none focus:border-amber-500 ${
                isDark 
                  ? 'from-slate-900 to-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500' 
                  : 'from-white to-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
              }`} 
              placeholder={isManual ? "Enter item name..." : "Add special instructions, requests, or notes..."} 
              tabIndex={0}
            />
          </div>

          {/* Summary */}
          <div className={`rounded-xl p-4 bg-gradient-to-br ${isDark ? 'from-slate-900/50 to-slate-800/30' : 'from-slate-50 to-slate-100'}`}>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Quantity</span>
                <span className="font-bold">{quantity} pcs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Unit Price</span>
                <span className="font-bold">Rp {item.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Total</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">Rp {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-700/30 dark:border-slate-600/30">
                <span className="text-slate-500 dark:text-slate-400">Margin</span>
                <span className={`font-bold ${parseFloat(profitPercent) >= 50 ? 'text-green-500' : parseFloat(profitPercent) >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                  Rp {profit.toLocaleString()} ({profitPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer dengan dua tombol: Cancel dan Save */}
        <div className={`p-4 border-t bg-gradient-to-br ${isDark ? 'from-slate-800/50 to-slate-900/30 border-slate-700' : 'from-white/50 to-slate-50/50 border-slate-100'}`}>
          <div className="flex gap-3">

            
            {/* Tombol Save */}
            <button 
              onClick={handleSave} 
              className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-90 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              tabIndex={0}
              title="Save Enter"
            >
              <CheckCircle size={18} />
              Update • Rp {totalPrice.toLocaleString()}
            </button>
          </div>
          

        </div>
      </div>
    </div>
  );
}