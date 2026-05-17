import { useState } from 'react';
import type { Product } from '../../types';
import { useTheme } from '../../contexts/ThemeContext'; // Import context tema

interface AddWasteFormProps {
  products: Product[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function AddWasteForm({ products, onSubmit, onCancel }: AddWasteFormProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    reason: 'expired' as 'expired' | 'damaged' | 'spilled' | 'other',
    notes: '',
  });

  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const wasteData = {
      productId: formData.productId,
      productName: selectedProduct.name,
      quantity: formData.quantity,
      reason: formData.reason,
      costLoss: (selectedProduct.cost || 0) * formData.quantity,
      notes: formData.notes,
    };

    onSubmit(wasteData);
  };

  // Helper class untuk input agar konsisten
  const inputClass = `w-full rounded-xl px-4 py-2 border outline-none transition-all ${
    isDark 
      ? 'bg-stone-950 border-stone-800 text-white focus:border-amber-500/50' 
      : 'bg-white border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
  }`;

  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-stone-300' : 'text-gray-700'}`;

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Product Selection */}
        <div>
          <label className={labelClass}>Product</label>
          <select
            className={inputClass}
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            required
          >
            <option value="" className={isDark ? 'bg-stone-900' : ''}>Select a product</option>
            {products.map(product => (
              <option key={product.id} value={product.id} className={isDark ? 'bg-stone-900' : ''}>
                {product.name} (Stock: {product.stock})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className={labelClass}>Quantity</label>
          <input
            type="number"
            min="1"
            max={selectedProduct?.stock || 1}
            className={inputClass}
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            required
          />
          {selectedProduct && (
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
              Available stock: {selectedProduct.stock}
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className={labelClass}>Reason</label>
          <select
            className={inputClass}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
          >
            <option value="expired" className={isDark ? 'bg-stone-900' : ''}>Expired</option>
            <option value="damaged" className={isDark ? 'bg-stone-900' : ''}>Damaged</option>
            <option value="spilled" className={isDark ? 'bg-stone-900' : ''}>Spilled</option>
            <option value="other" className={isDark ? 'bg-stone-900' : ''}>Other</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes (Optional)</label>
          <textarea
            className={inputClass}
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional details..."
          />
        </div>

        {/* Cost Preview */}
        {selectedProduct && (
          <div className={`p-4 rounded-xl border transition-colors ${
            isDark ? 'bg-red-900/20 border-red-900/50' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className={`font-medium ${isDark ? 'text-red-400' : 'text-red-800'}`}>Cost Loss</p>
                <p className={`text-xs ${isDark ? 'text-red-500/70' : 'text-red-600'}`}>Deducted from inventory</p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {(selectedProduct.cost || 0) * formData.quantity}
                </p>
                <p className={`text-xs ${isDark ? 'text-red-500/50' : 'text-red-500'}`}>
                  {formData.quantity} × {selectedProduct.cost || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              isDark 
                ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
            disabled={!formData.productId}
          >
            Record Waste
          </button>
        </div>
      </div>
    </form>
  );
}