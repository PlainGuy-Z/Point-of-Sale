import { AlertCircle, Package, ArrowRight } from 'lucide-react';
import type { Product } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { isLowStock, isOutOfStock as isOOS } from '../../utils/stockUtils';

interface LowStockAlertProps {
  products: Product[];
}

export default function LowStockAlert({ products }: LowStockAlertProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const lowStockProducts = products.filter(p => isLowStock(p) || isOOS(p));

  const getSeverity = (product: Product) => {
    if (isOOS(product)) return 'critical';
    if (product.stock <= product.minStock * 0.5) return 'high';
    return 'medium';
  };

  return (
    <div className={`
      rounded-2xl border p-6 transition-all duration-300
      ${isDark 
        ? 'bg-gradient-to-br from-stone-900 to-stone-900 border-stone-800 hover:border-red-500/30' 
        : 'bg-white border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1]'
      }
      ${lowStockProducts.length > 0 ? 'animate-pulse-subtle' : ''}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-2xl relative
            ${lowStockProducts.length > 0 
              ? isDark ? 'bg-red-900/30' : 'bg-red-50'
              : isDark ? 'bg-green-900/30' : 'bg-teal-50'
            }
          `}>
            {lowStockProducts.length > 0 ? (
              <AlertCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            ) : (
              <Package className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-teal-600'}`} />
            )}
            
            {lowStockProducts.length > 0 && (
              <div className="absolute -top-1 -right-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full absolute top-0 left-0"></div>
              </div>
            )}
          </div>
          <div>
            <h3 className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Peringatan Stok
            </h3>
            <p className={`text-sm font-medium ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>
              {lowStockProducts.length > 0 ? 'Perlu perhatian segera' : 'Semua stok aman'}
            </p>
          </div>
        </div>
        
        {lowStockProducts.length > 0 && (
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
            isDark 
              ? 'bg-red-900/40 text-red-400 border border-red-800' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            {lowStockProducts.length} Alert
          </div>
        )}
      </div>
      
      {/* List */}
      {lowStockProducts.length > 0 ? (
        <div className="space-y-3">
          {lowStockProducts.slice(0, 3).map(product => {
            const severity = getSeverity(product);
            const severityColors = {
              critical: isDark ? 'bg-red-900/40 border-red-800' : 'bg-red-50 border-red-200',
              high: isDark ? 'bg-orange-900/30 border-orange-800' : 'bg-amber-50 border-amber-200',
              medium: isDark ? 'bg-amber-900/30 border-amber-800' : 'bg-amber-50 border-amber-200'
            };

            return (
              <div 
                key={product.id} 
                className={`
                  flex items-center justify-between p-3 rounded-2xl border transition-all 
                  hover:scale-[1.01] cursor-pointer group
                  ${severityColors[severity]}
                  ${!isDark && severity === 'critical' ? 'hover:bg-red-100/50' : !isDark ? 'hover:bg-amber-100/50' : ''}
                `}
                onClick={() => navigate(`/operation/products`)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-stone-900/50' : 'bg-white shadow-sm'
                  }`}>
                    <Package className={`w-5 h-5 ${
                      severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isDark ? 'text-stone-200' : 'text-[#0F172A]'}`}>
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                        severity === 'critical' 
                          ? isDark ? 'bg-red-900/60 text-red-300 border-red-800' : 'bg-red-100 text-red-700 border-red-200'
                          : isDark ? 'bg-amber-900/60 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {product.stock === 0 ? 'HABIS' : 'RENDAH'}
                      </span>
                      <span className={`text-xs font-bold ${
                        severity === 'critical' && !isDark ? 'text-red-600' : 
                        !isDark ? 'text-amber-600' : 'text-stone-500'
                      }`}>
                        {product.stock}/{product.minStock} {product.unit}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <button className={`
                    p-2 rounded-xl transition-all
                    ${isDark 
                      ? 'text-red-400 hover:bg-red-500/10' 
                      : 'text-slate-400 group-hover:text-slate-600 group-hover:bg-black/5'
                    }
                  `}>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {lowStockProducts.length > 3 && (
            <button 
              onClick={() => navigate(`/operation/products`)}
              className={`
                w-full py-2.5 mt-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                flex items-center justify-center gap-2
                ${isDark 
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300' 
                  : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569]'
                }
              `}
            >
              Lihat {lowStockProducts.length} Peringatan
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className={`w-16 h-16 rounded-3xl mx-auto mb-3 flex items-center justify-center ${
            isDark ? 'bg-green-900/30' : 'bg-teal-50'
          }`}>
            <Package className={`w-8 h-8 ${isDark ? 'text-green-500' : 'text-teal-600'}`} />
          </div>
          <p className={`font-bold ${isDark ? 'text-stone-300' : 'text-[#0F172A]'}`}>
            Stok Mencukupi
          </p>
          <p className={`text-xs mt-1 font-medium ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
            Semua item tersedia dengan aman
          </p>
        </div>
      )}
    </div>
  );
}