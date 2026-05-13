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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border ${
          isDark ? 'bg-stone-950/80 border-stone-800' : 'bg-white border-[#E2E8F0]'
        }`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        
        {/* Header */}
        <div className={`p-5 border-b ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-teal-50 border-teal-100'}`}>
                <Package className={isDark ? 'text-teal-400' : 'text-teal-600'} size={20} />
              </div>
              <div>
                <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                  {isManual ? 'Custom Entry' : product.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${isDark ? 'bg-stone-950/30 border-stone-800 text-stone-300' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'}`}>
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
              className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-stone-950 border border-stone-800 hover:bg-[#1a1614]' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'}`}
              tabIndex={0}
              aria-label="Close modal"
              title="Close (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto horizontal-scrollbar-thin">
          
          {/* Quantity Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase flex items-center gap-2 text-[#475569] dark:text-stone-400">
                <Hash size={14} /> Quantity
              </label>
              {!isManual && (
                <div className="text-xs text-[#94A3B8] dark:text-stone-400">
                  Available: <span className={`font-bold ${product.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{product.stock}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                disabled={quantity <= 1}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border transition-all ${
                  quantity <= 1 
                    ? 'bg-stone-100 dark:bg-stone-950 text-stone-400 cursor-not-allowed border-transparent' 
                    : isDark ? 'bg-stone-950 border-stone-800 hover:bg-[#1a1614] text-white' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
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
                    isDark ? 'text-white border-stone-600' : 'text-[#0F172A] border-teal-500'
                  }`}
                  tabIndex={0}
                />
                <div className="text-xs text-[#94A3B8] mt-1">pcs</div>
              </div>

              <button 
                onClick={() => setQuantity(isManual ? quantity + 1 : Math.min(quantity + 1, product.stock))}
                disabled={!isManual && quantity >= product.stock}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border transition-all ${
                  (!isManual && quantity >= product.stock)
                    ? 'bg-stone-100 dark:bg-stone-950 text-stone-400 cursor-not-allowed border-transparent' 
                    : isDark ? 'bg-stone-950 border-stone-800 hover:bg-[#1a1614] text-white' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
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
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    quantity === num
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
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
            <label className="text-xs font-bold uppercase flex items-center gap-2 text-[#475569] dark:text-stone-400">
              <MessageSquare size={14} /> {isManual ? 'Item Name' : 'Special Instructions'}
            </label>
            <textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              rows={2} 
              className={`w-full p-3 rounded-xl border text-sm outline-none resize-none transition-all focus:border-teal-400 focus:bg-white ${
                isDark 
                  ? 'bg-stone-950/30 border-stone-800 text-white placeholder-stone-500' 
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'
              }`} 
              placeholder={isManual ? "Enter item name..." : "Add special instructions, requests, or notes..."} 
              tabIndex={0}
            />
          </div>

          {/* Summary */}
          <div className={`rounded-2xl p-4 border ${isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#475569] dark:text-stone-400">Quantity</span>
                <span className="font-bold">{quantity} pcs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569] dark:text-stone-400">Unit Price</span>
                <span className="font-bold">{format(item.price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569] dark:text-stone-400">Total</span>
                <span className="text-lg font-black text-teal-600">{format(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-5 border-t ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <button 
            onClick={handleSave} 
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
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