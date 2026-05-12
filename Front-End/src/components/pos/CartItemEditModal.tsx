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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-stone-950/95 text-stone-100 border-stone-800'
            : 'bg-white/95 text-stone-900 border-stone-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex justify-between items-center ${
            isDark ? 'border-stone-800' : 'border-stone-200'
          }`}
        >
          <div>
            <h2 className="text-sm font-bold">Edit Item</h2>
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {item.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition ${
              isDark
                ? 'border-stone-800 hover:bg-stone-900'
                : 'border-stone-200 hover:bg-stone-100'
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
            <label className="block text-sm font-semibold mb-3">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className={`flex-shrink-0 p-2 rounded-lg border transition ${
                  isDark
                    ? 'border-stone-800 hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'border-stone-200 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                aria-label="Decrease quantity"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div
                className={`flex-1 text-center py-2 rounded-lg border font-semibold text-lg ${
                  isDark
                    ? 'bg-stone-900 border-stone-800'
                    : 'bg-stone-100 border-stone-200'
                }`}
              >
                {quantity}
              </div>

              <button
                onClick={() => handleQuantityChange(1)}
                className={`flex-shrink-0 p-2 rounded-lg border transition ${
                  isDark
                    ? 'border-stone-800 hover:bg-stone-900'
                    : 'border-stone-200 hover:bg-stone-100'
                }`}
                aria-label="Increase quantity"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Special Instructions
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {' '}
                (Optional)
              </span>
            </label>
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 'Pedas sekali', 'Tanpa bawang', 'Extra ice'"
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                  : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
              }`}
              rows={3}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {description.length}/100 characters
            </p>
          </div>

          {/* Variant Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-400 mb-2">
                Variant Name
              </label>
              <input
                type="text"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="e.g. Extra Keju"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-400 mb-2">
                Variant Price
              </label>
              <input
                type="number"
                value={variantPrice || ''}
                onChange={(e) => setVariantPrice(parseInt(e.target.value) || 0)}
                placeholder="0"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                }`}
              />
            </div>
          </div>

          {/* Price Info */}
          <div
            className={`p-3 rounded-lg border ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex justify-between text-sm mb-1">
              <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Unit Price:</span>
              <span className="font-semibold">{format(item.price + variantPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Subtotal:</span>
              <span className="font-bold text-base">
                {format((item.price + variantPrice) * quantity)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {showDeleteConfirm ? (
          <div className={`p-5 border-t space-y-3 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
            <p className="text-sm text-center font-semibold">Remove this item?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 py-2 px-3 rounded-lg border font-semibold transition ${
                  isDark
                    ? 'border-stone-800 hover:bg-stone-900'
                    : 'border-stone-200 hover:bg-stone-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`p-5 border-t flex gap-3 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}
          >
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`flex-shrink-0 p-2 rounded-lg border text-red-600 transition ${
                isDark
                  ? 'border-red-600/20 hover:bg-red-600/10'
                  : 'border-red-200 hover:bg-red-50'
              }`}
              title="Remove item"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className={`flex-1 py-2 px-3 rounded-lg border font-semibold transition ${
                isDark
                  ? 'border-stone-800 hover:bg-stone-900'
                  : 'border-stone-200 hover:bg-stone-100'
              }`}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
