import { TrendingUp, Star, Package } from 'lucide-react';
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
      <div className={`rounded-2xl p-5 ${isDark 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
        : 'bg-gradient-to-br from-white to-gray-50 border border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <Package className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
        </div>
        <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada data penjualan hari ini</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`rounded-2xl p-5 ${isDark 
      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
      : 'bg-gradient-to-br from-white to-gray-50 border border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        <TrendingUp className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
      </div>
      
      <div className="space-y-3">
        {topProducts.map((product, index) => {
          const rank = index + 1;
          const quantity = product.quantity || 0;
          const revenue = product.revenue || 0;
          
          return (
            <div 
              key={product.id} 
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${isDark 
                ? 'bg-gray-700/50 hover:bg-gray-700/70' 
                : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  rank === 1 ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                  rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                  rank === 3 ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white' :
                  isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {rank}
                </div>
                <div>
                  <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {quantity} terjual
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {format(revenue)}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {format(product.price)}/pc
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {topProducts.length > 0 && (
        <div className={`mt-4 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Total {topProducts.length} produk
            </span>
            <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {format(topProducts.reduce((sum, p) => sum + (p.revenue || 0), 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}