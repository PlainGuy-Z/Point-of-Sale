import { useState, useEffect } from 'react';
import { X, Minus, Plus, MessageSquare, CheckCircle, Coffee } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Product, TransactionItem } from '../../types';

interface ProductDetailModalProps {
  product: Product;
  item: TransactionItem; // Item yang sedang diedit dari cart
  onClose: () => void;
  onSave: (updatedItem: TransactionItem) => void;
}

export default function ProductDetailModal({ product, item, onClose, onSave }: ProductDetailModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [quantity, setQuantity] = useState(item.quantity);
  const [note, setNote] = useState(item.note || '');
  const [modifiers, setModifiers] = useState<string[]>(item.modifiers || []);

  // Simulasi Opsi Modifier (Biasanya ini dari database)
  const modifierGroups = [
    {
      title: 'Sugar Level',
      options: ['Normal Sugar', 'Less Sugar', 'No Sugar']
    },
    {
      title: 'Ice Level',
      options: ['Normal Ice', 'Less Ice', 'No Ice']
    }
  ];

  const toggleModifier = (option: string) => {
    setModifiers(prev => {
      // Logic sederhana: jika sudah ada hapus, jika belum ada tambah
      // (Untuk select single option per group butuh logic lebih kompleks, ini simple version)
      if (prev.includes(option)) return prev.filter(m => m !== option);
      
      // Hapus opsi lain dalam grup yang sama (agar radio button behavior)
      const group = modifierGroups.find(g => g.options.includes(option));
      const cleaned = prev.filter(m => !group?.options.includes(m));
      return [...cleaned, option];
    });
  };

  const handleSave = () => {
    onSave({
      ...item,
      quantity,
      note,
      modifiers
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        
        {/* Header Image & Close */}
        <div className={`relative h-32 flex items-center justify-center ${
          isDark ? 'bg-gray-700' : 'bg-amber-50'
        }`}>
           <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
             <span className="text-white font-bold text-2xl">{product.category.charAt(0)}</span>
           </div>
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
           >
             <X size={20} />
           </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Title & Price */}
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</h2>
            <p className={`text-lg font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Rp {product.price.toLocaleString()}
            </p>
          </div>

          {/* Quantity Control */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'
          }`}>
            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Quantity</span>
            <div className={`flex items-center gap-4 rounded-lg px-2 py-1 ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center hover:text-amber-500 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Minus size={18} />
                </button>
                <span className={`text-lg font-bold w-8 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(quantity + 1, product.stock))}
                  className="w-8 h-8 flex items-center justify-center hover:text-amber-500 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Plus size={18} />
                </button>
            </div>
          </div>

          {/* Modifiers (Sugar/Ice) */}
          {modifierGroups.map((group) => (
            <div key={group.title}>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{group.title}</h3>
              <div className="flex flex-wrap gap-2">
                {group.options.map(option => {
                  const isSelected = modifiers.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => toggleModifier(option)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Notes Input */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-gray-400" />
              <label className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Special Request</label>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Contoh: Jangan pakai sedotan, saus dipisah..."
              className={`w-full p-3 rounded-xl outline-none border transition-all resize-none ${
                isDark 
                  ? 'bg-gray-900 border-gray-700 text-white focus:border-amber-500' 
                  : 'bg-white border-gray-200 text-gray-900 focus:border-amber-500 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <button
            onClick={handleSave}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            Update Order • Rp {(product.price * quantity).toLocaleString()}
          </button>
        </div>

      </div>
    </div>
  );
}