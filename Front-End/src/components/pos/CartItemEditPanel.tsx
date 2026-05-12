import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { CartItemWithInput } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface CartItemEditPanelProps {
  item: CartItemWithInput;
  itemIndex: number;
  onSave: (updatedItem: CartItemWithInput) => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function CartItemEditPanel({
  item,
  itemIndex,
  onSave,
  onRemove,
  onClose
}: CartItemEditPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  const quickVariantPrices = [3000, 5000, 7000, 10000, 15000, 20000, 25000];

  const [quantity, setQuantity] = useState(item.quantity);
  const [description, setDescription] = useState(item.description || '');
  const [variantName, setVariantName] = useState(item.variantName || '');
  const [variantPrice, setVariantPrice] = useState<number>(item.variantPrice || 0);
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
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1) {
      setQuantity(newQty);
    }
  };

  return (
    <>
      {/* Header */}
      <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-b ${isDark ? 'border-stone-900' : 'border-gray-100'}`}>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-xl transition-colors ${isDark ? 'hover:bg-stone-900 text-stone-400' : 'hover:bg-gray-100 text-stone-500'}`}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h3 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Edit Item
          </h3>
          <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {item.name}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 horizontal-scrollbar-thin">
        {/* Quantity Section */}
        <div>
          <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            Quantity
          </label>
          <div className={`flex items-center gap-3 p-1 rounded-2xl w-fit ${isDark ? 'bg-stone-900' : 'bg-gray-100'}`}>
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-amber-500 hover:text-white' : 'bg-white text-gray-700 hover:bg-amber-500 hover:text-white shadow-sm'}`}
            >
              <Minus size={16} />
            </button>
            <span className={`w-8 text-center font-black text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-base transition-all ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-amber-500 hover:text-white' : 'bg-white text-gray-700 hover:bg-amber-500 hover:text-white shadow-sm'}`}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <label className={`text-[10px] font-black uppercase block mb-1.5 flex justify-between ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            <span>Special Instructions</span>
            <span className="font-normal">(Optional)</span>
          </label>
          <textarea
            ref={descriptionRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., 'Pedas sekali', 'Tanpa bawang'"
            className={`w-full px-4 py-3 rounded-2xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                : 'bg-white border-gray-200 text-gray-800 placeholder-stone-400'
            }`}
            rows={3}
          />
        </div>

        {/* Variant Section */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Variant Name
              </label>
              <input
                type="text"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="e.g. Extra Keju"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                    : 'bg-white border-gray-200 text-gray-800 placeholder-stone-400'
                }`}
              />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Variant Price
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={variantPrice ? Number(variantPrice).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setVariantPrice(parseInt(raw) || 0);
                }}
                placeholder="0"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                    : 'bg-white border-gray-200 text-gray-800 placeholder-stone-400'
                }`}
              />
            </div>
          </div>
          
          {/* Quick variant price buttons */}
          <div className="flex gap-2 overflow-x-auto horizontal-scrollbar-thin pb-2 pt-1">
            {quickVariantPrices.map(p => {
              const isSelected = variantPrice === p;
              return (
                <button
                  key={p}
                  onClick={() => setVariantPrice(p)}
                  className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-black transition-all ${isSelected
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : isDark
                      ? 'bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-amber-400'
                      : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'
                    }`}
                >
                  +{p >= 1000 ? `${p / 1000}k` : p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Info Preview */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-amber-900/10 border-amber-800/30' : 'bg-amber-50/50 border-amber-100'}`}>
          <div className="flex justify-between text-xs mb-1">
            <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>Unit Price:</span>
            <span className={`font-bold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{format(item.price + variantPrice)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className={`font-black ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>Subtotal:</span>
            <span className={`font-black text-lg ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {format((item.price + variantPrice) * quantity)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className={`flex-shrink-0 p-4 border-t flex gap-2 ${isDark ? 'border-stone-900' : 'border-gray-100'}`}>
        <button
          onClick={onRemove}
          className={`flex items-center justify-center p-3 rounded-2xl border text-red-500 transition-all ${
            isDark
              ? 'border-red-900/30 hover:bg-red-900/20'
              : 'border-red-200 hover:bg-red-50'
          }`}
          title="Remove item"
        >
          <Trash2 size={20} />
        </button>

        <button
          onClick={handleSave}
          className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider text-sm transition-all shadow-lg shadow-amber-500/20"
        >
          Save Changes
        </button>
      </div>
    </>
  );
}
