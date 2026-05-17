import { TrendingUp, Package, Trophy } from 'lucide-react';
import type { Product } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface TopProductsProps {
  products: (Product & { quantity?: number; revenue?: number })[];
  title?: string;
  limit?: number;
}

export default function TopProducts({ 
  products, 
  title = "Produk Terlaris", 
  limit = 5 
}: TopProductsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  
  // Pastikan ada data
  const topProducts = products.slice(0, limit).filter(p => p !== null);
  
  if (topProducts.length === 0) {
    return (
      <div className={`rounded-2xl p-5 border ${isDark 
        ? 'bg-gradient-to-br from-stone-900 to-stone-900 border-stone-800' 
        : 'bg-white border-[#E2E8F0] shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            {title}
          </h3>
          <Package className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
        </div>
        <div className={`text-center py-8 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tidak ada data penjualan hari ini</p>
        </div>
      </div>
    );
  }

  const maxRevenue = topProducts.length > 0 ? topProducts[0].revenue || 1 : 1;
  
  return (
    <div className={`rounded-2xl p-5 border ${isDark 
      ? 'bg-gradient-to-br from-stone-900 to-stone-900 border-stone-800' 
      : 'bg-white border-[#E2E8F0] shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          {title}
        </h3>
        <TrendingUp className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-teal-600'}`} />
      </div>
      
      <div className="space-y-4">
        {topProducts.map((product, index) => {
          const rank = index + 1;
          const quantity = product.quantity || 0;
          const revenue = product.revenue || 0;
          const progress = (revenue / maxRevenue) * 100;
          
          return (
            <div 
              key={product.id} 
              className={`group relative flex flex-col p-3 rounded-xl transition-all ${isDark 
                ? 'bg-stone-800/50 hover:bg-stone-800/70' 
                : 'hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-sm border ${
                    rank === 1 && !isDark ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    (rank === 2 || rank === 3) && !isDark ? 'bg-slate-50 text-slate-600 border-[#E2E8F0]' :
                    rank === 1 && isDark ? 'bg-amber-500 text-stone-950 border-amber-400' :
                    isDark ? 'bg-stone-700 text-stone-300 border-stone-600' : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {rank === 1 ? <Trophy size={14} /> : rank}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm leading-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                      {product.name}
                    </p>
                    <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>
                      {product.category} • {quantity} terjual
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold text-sm ${isDark ? 'text-amber-400' : 'text-teal-700'}`}>
                    {format(revenue)}
                  </p>
                </div>
              </div>

              {/* Progress bar fill mapping */}
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-stone-900' : 'bg-[#F1F5F9]'}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isDark 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                      : 'bg-gradient-to-r from-teal-500 to-teal-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {topProducts.length > 0 && (
        <div className={`mt-6 pt-4 border-t ${isDark ? 'border-stone-800' : 'border-[#E2E8F0]'}`}>
          <div className="flex justify-between items-center text-xs">
            <span className={`font-bold uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
              Total Revenue Top {topProducts.length}
            </span>
            <span className={`text-sm font-black ${isDark ? 'text-green-400' : 'text-teal-700'}`}>
              {format(topProducts.reduce((sum, p) => sum + (p.revenue || 0), 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}