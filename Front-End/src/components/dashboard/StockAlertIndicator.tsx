import { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Package, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface StockItem {
  name: string;
  stock: number;
  category?: string;
}

interface StockAlertIndicatorProps {
  lowStockProducts: StockItem[];
  outOfStockProducts: StockItem[];
}

export default function StockAlertIndicator({ lowStockProducts, outOfStockProducts }: StockAlertIndicatorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const totalAlerts = lowStockProducts.length + outOfStockProducts.length;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`relative p-2.5 rounded-2xl border transition-all active:scale-95 ${
          isDark
            ? 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white hover:border-stone-700'
            : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300'
        }`}
        aria-label={`${totalAlerts} peringatan stok`}
      >
        <Bell size={18} />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-lg shadow-red-500/30">
            {totalAlerts > 99 ? '99+' : totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 top-full mt-2 z-50 w-[320px] max-h-[400px] overflow-hidden rounded-2xl border shadow-2xl ${
            isDark
              ? 'bg-stone-950 border-stone-800 shadow-black/40'
              : 'bg-white border-gray-200 shadow-gray-200/60'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-stone-800' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Peringatan Stok</span>
              {totalAlerts > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">{totalAlerts}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-stone-800 text-stone-500' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[340px] p-2">
            {totalAlerts === 0 ? (
              <div className={`py-8 text-center text-sm ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
                <Package size={24} className="mx-auto mb-2 opacity-40" />
                Semua stok aman
              </div>
            ) : (
              <>
                {/* Out of stock */}
                {outOfStockProducts.length > 0 && (
                  <div className="mb-2">
                    <p className={`px-2 py-1.5 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      Stok Habis ({outOfStockProducts.length})
                    </p>
                    {outOfStockProducts.slice(0, 10).map((p, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 ${isDark ? 'bg-red-500/5 hover:bg-red-500/10' : 'bg-red-50 hover:bg-red-100/70'} transition`}
                      >
                        <span className={`text-sm font-medium truncate ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>{p.name}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">HABIS</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Low stock */}
                {lowStockProducts.length > 0 && (
                  <div>
                    <p className={`px-2 py-1.5 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      Stok Menipis ({lowStockProducts.length})
                    </p>
                    {lowStockProducts.slice(0, 10).map((p, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 ${isDark ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'bg-amber-50 hover:bg-amber-100/70'} transition`}
                      >
                        <span className={`text-sm font-medium truncate ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>{p.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                          Sisa {p.stock}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
