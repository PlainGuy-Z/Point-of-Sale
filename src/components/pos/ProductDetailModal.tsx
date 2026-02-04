import { useState, useEffect } from 'react';
import { X, Minus, Plus, MessageSquare, CheckCircle, Hash, Package, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div 
        className={`w-full max-w-sm rounded-lg shadow-xl overflow-hidden ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        
        {/* Header */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-amber-50'}`}>
                <Package className={isDark ? 'text-amber-400' : 'text-amber-600'} size={20} />
              </div>
              <div>
                <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isManual ? 'Custom Entry' : product.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
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
              className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}
              tabIndex={0}
              aria-label="Close modal"
              title="Close (ESC)"
            >
              <X size={18} className="text-slate-400 hover:text-red-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto horizontal-scrollbar-thin">
          
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
                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${
                  quantity <= 1 
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
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
                    isDark ? 'text-white border-slate-600' : 'text-slate-900 border-slate-300'
                  }`}
                  tabIndex={0}
                />
                <div className="text-xs text-slate-500 mt-1">pcs</div>
              </div>

              <button 
                onClick={() => setQuantity(isManual ? quantity + 1 : Math.min(quantity + 1, product.stock))}
                disabled={!isManual && quantity >= product.stock}
                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${
                  (!isManual && quantity >= product.stock)
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
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
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
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
            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <MessageSquare size={14} /> {isManual ? 'Item Name' : 'Special Instructions'}
            </label>
            <textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              rows={2} 
              className={`w-full p-3 rounded-lg border text-sm outline-none resize-none ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`} 
              placeholder={isManual ? "Enter item name..." : "Add special instructions, requests, or notes..."} 
              tabIndex={0}
            />
          </div>

          {/* Summary */}
          <div className={`rounded-lg p-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-100'}`}>
          <button 
            onClick={handleSave} 
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 text-sm"
            tabIndex={0}
            title="Save Enter"
          >
            <CheckCircle size={18} />
            Update • Rp {totalPrice.toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}