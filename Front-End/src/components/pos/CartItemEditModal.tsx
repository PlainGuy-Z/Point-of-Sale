import { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { CartItemWithInput } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface CartItemEditModalProps {
  item: CartItemWithInput;
    itemIndex: number;
  onSave: (updatedItem: CartItemWithInput) => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function CartItemEditModal({
  item,
    itemIndex,   
  onSave,
  onRemove,
  onClose
}: CartItemEditModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  const [quantity, setQuantity] = useState(item.quantity);
  const [description, setDescription] = useState(item.description || '');
  const [variantName, setVariantName] = useState(item.variantName || '');
  const [variantPrice, setVariantPrice] = useState<number>(item.variantPrice || 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    descriptionRef.current?.focus();
  }, []);

  const handleSave = () => {
    const updatedItem: CartItemWithInput = {
      ...item,
      quantity: Math.max(1, quantity),
      description: description.trim(),
      variantName: variantName.trim() || undefined,
      variantPrice: variantPrice > 0 ? variantPrice : undefined
    };
    onSave(updatedItem);
    onClose();
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1) {
      setQuantity(newQty);
    }
  };

  const handleRemove = () => {
    onRemove();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-stone-950/95 text-stone-100 border-stone-800'
            : 'bg-white text-[#0F172A] border-[#E2E8F0]'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex justify-between items-center ${
            isDark ? 'border-stone-800' : 'border-[#F1F5F9]'
          }`}
        >
          <div>
            <h2 className="text-sm font-bold">Edit Item</h2>
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>
              {item.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'border-stone-800 hover:bg-stone-900'
                : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Quantity Section */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className={`flex-shrink-0 p-3 rounded-xl border transition-all ${
                  isDark
                    ? 'border-stone-800 hover:bg-stone-900 disabled:opacity-50'
                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50'
                }`}
                aria-label="Decrease quantity"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div
                className={`flex-1 text-center py-3 rounded-xl border font-bold text-xl ${
                  isDark
                    ? 'bg-stone-900 border-stone-800'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
                }`}
              >
                {quantity}
              </div>

              <button
                onClick={() => handleQuantityChange(1)}
                className={`flex-shrink-0 p-3 rounded-xl border transition-all ${
                  isDark
                    ? 'border-stone-800 hover:bg-stone-900'
                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
                aria-label="Increase quantity"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
              Special Instructions
            </label>
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 'Extra ice', 'Tanpa gula'"
              className={`w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none transition-all focus:border-teal-400 ${
                isDark
                  ? 'bg-stone-900 border-stone-800 focus:bg-stone-900 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-teal-500'
                  : 'focus:bg-white bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'
              }`}
              rows={2}
            />
          </div>

          {/* Variant Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
                Variant Name
              </label>
              <input
                type="text"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="e.g. Large"
                className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all focus:border-teal-400 ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 focus:bg-stone-900 text-stone-100 focus:ring-1 focus:ring-teal-500'
                    : 'focus:bg-white bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
                Variant Price
              </label>
              <input
                type="number"
                value={variantPrice || ''}
                onChange={(e) => setVariantPrice(parseInt(e.target.value) || 0)}
                placeholder="0"
                className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all focus:border-teal-400 ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 focus:bg-stone-900 text-stone-100 focus:ring-1 focus:ring-teal-500'
                    : 'focus:bg-white bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]'
                }`}
              />
            </div>
          </div>

          {/* Price Info */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-stone-950 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}
          >
            <div className="flex justify-between text-xs mb-2">
              <span className={isDark ? 'text-stone-400' : 'text-[#475569]'}>Unit Price:</span>
              <span className="font-semibold">{format(item.price + variantPrice)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-dashed border-[#E2E8F0] dark:border-stone-800">
              <span className={`font-bold ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Subtotal:</span>
              <span className="font-black text-teal-600 text-lg">
                {format((item.price + variantPrice) * quantity)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {showDeleteConfirm ? (
          <div className={`p-5 border-t space-y-3 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
            <p className="text-sm text-center font-bold text-red-600">Hapus item ini dari keranjang?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                  isDark
                    ? 'border-stone-700 text-stone-300'
                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`p-5 border-t flex gap-3 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}
          >
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`flex-shrink-0 p-3 rounded-xl border transition-all ${
                isDark
                  ? 'border-red-900/40 text-red-400 hover:bg-red-950/30'
                  : 'bg-white border-red-200 text-red-500 hover:bg-red-50'
              }`}
              title="Remove item"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                isDark
                  ? 'border-stone-700 text-stone-300'
                  : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
              }`}
            >
              Batal
            </button>

            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]"
            >
              Simpan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
