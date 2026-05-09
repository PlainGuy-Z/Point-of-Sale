import { useState, useEffect } from 'react';
import { X, Minus, Plus, MessageSquare, CheckCircle, Hash, Package, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Product, TransactionItem } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface ProductDetailModalProps {
  product: Product;
  item: TransactionItem;
  onClose: () => void;
  onSave: (updatedItem: TransactionItem) => void;
}

export default function ProductDetailModal({ product, item, onClose, onSave }: ProductDetailModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  const isManual = item.productId.startsWith('manual-');
  const [quantity, setQuantity] = useState(item.quantity);
  const [note, setNote] = useState(item.note || '');

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter') {
        handleSave();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const handleSave = () => {
    const formattedNote = note.trim() 
      ? note.trim().charAt(0).toUpperCase() + note.trim().slice(1) 
      : '';
    onSave({ ...item, quantity, note: formattedNote });
    onClose();
  };

  const totalPrice = item.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div 
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border ${
          isDark ? 'bg-stone-950/80 border-stone-800' : 'bg-white/80 border-stone-200'
        }`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        
        {/* Header */}
        <div className={`p-5 border-b ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-3xl border ${isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-amber-50 border-amber-100'}`}>
                <Package className={isDark ? 'text-amber-400' : 'text-amber-600'} size={20} />
              </div>
              <div>
                <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {isManual ? 'Custom Entry' : product.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-3xl text-[10px] font-black uppercase border ${isDark ? 'bg-stone-950/30 border-stone-800 text-stone-300' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
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
            
            <button 
              onClick={onClose}
              className={`p-2 rounded-3xl ${isDark ? 'bg-stone-950 border border-stone-800 hover:bg-[#1a1614]' : 'bg-white border border-stone-200 hover:bg-stone-50'}`}
              tabIndex={0}
              aria-label="Close modal"
              title="Close (ESC)"
            >
              <X size={18} className="text-stone-400 hover:text-red-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto horizontal-scrollbar-thin">
          
          {/* Quantity Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-stone-600 dark:text-stone-400 flex items-center gap-2">
                <Hash size={14} /> Quantity
              </label>
              {!isManual && (
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Available: <span className={`font-bold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{product.stock}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                disabled={quantity <= 1}
                className={`w-12 h-12 rounded-3xl flex items-center justify-center font-black text-xl border ${
                  quantity <= 1 
                    ? 'bg-stone-200 dark:bg-stone-950 text-stone-400 cursor-not-allowed border-transparent' 
                    : isDark ? 'bg-stone-950 border-stone-800 hover:bg-[#1a1614] text-white' : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-800'
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
                  className={`w-full py-3 text-center text-2xl font-black bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-b-2 ${
                    isDark ? 'text-white border-stone-600' : 'text-stone-900 border-stone-300'
                  }`}
                  tabIndex={0}
                />
                <div className="text-xs text-stone-500 mt-1">pcs</div>
              </div>

              <button 
                onClick={() => setQuantity(isManual ? quantity + 1 : Math.min(quantity + 1, product.stock))}
                disabled={!isManual && quantity >= product.stock}
                className={`w-12 h-12 rounded-3xl flex items-center justify-center font-black text-xl border ${
                  (!isManual && quantity >= product.stock)
                    ? 'bg-stone-200 dark:bg-stone-950 text-stone-400 cursor-not-allowed border-transparent' 
                    : isDark ? 'bg-stone-950 border-stone-800 hover:bg-[#1a1614] text-white' : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-800'
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
                  className={`flex-1 py-2 rounded-md text-xs font-bold ${
                    quantity === num
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                  }`}
                  tabIndex={0}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase text-stone-600 dark:text-stone-400 flex items-center gap-2">
              <MessageSquare size={14} /> {isManual ? 'Item Name' : 'Special Instructions'}
            </label>
            <textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              rows={2} 
              className={`w-full p-3 rounded-3xl border text-sm outline-none resize-none ${
                isDark 
                  ? 'bg-stone-950/30 border-stone-800 text-white placeholder-stone-500' 
                  : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
              }`} 
              placeholder={isManual ? "Enter item name..." : "Add special instructions, requests, or notes..."} 
              tabIndex={0}
            />
          </div>

          {/* Summary */}
          <div className={`rounded-3xl p-4 border ${isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">Quantity</span>
                <span className="font-bold">{quantity} pcs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">Unit Price</span>
                <span className="font-bold">{format(item.price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">Total</span>
                <span className="text-lg font-black text-amber-500">{format(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-5 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <button 
            onClick={handleSave} 
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white font-black rounded-3xl shadow-lg flex items-center justify-center gap-2 text-sm"
            tabIndex={0}
            title="Save Enter"
          >
            <CheckCircle size={18} />
            Update • {format(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}