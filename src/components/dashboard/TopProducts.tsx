import { Coffee, Trophy, TrendingUp } from 'lucide-react';
import type { Product, Transaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface TopProductsProps {
  transactions: Transaction[];
  products: Product[];
}

export default function TopProducts({ transactions, products }: TopProductsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const productSales: Record<string, number> = {};
  const productRevenue: Record<string, number> = {};
  
  transactions.forEach(t => {
    t.items.forEach(item => {
      productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      productRevenue[item.productId] = (productRevenue[item.productId] || 0) + (item.price * item.quantity);
    });
  });

  const topProducts = Object.entries(productSales)
    .map(([productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      const revenue = productRevenue[productId] || 0;
      return { product, quantity, revenue };
    })
    .filter((item): item is { product: Product, quantity: number, revenue: number } => item.product !== undefined)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxRevenue = Math.max(...topProducts.map(p => p.revenue), 1);

  const rankColors = [
    'from-amber-500 to-yellow-500',  // 1st
    'from-gray-400 to-gray-500',     // 2nd
    'from-orange-500 to-amber-700',  // 3rd
    'from-blue-400 to-cyan-500',     // 4th
    'from-purple-400 to-violet-500', // 5th
  ];

  return (
    <div className={`
      rounded-2xl border p-6 transition-all duration-300
      ${isDark 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-white border-gray-100 shadow-sm'
      }
    `}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-amber-50'}`}>
            <Trophy className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Top Products</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>By revenue today</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
          isDark 
            ? 'bg-gray-700 text-amber-400' 
            : 'bg-amber-100 text-amber-700'
        }`}>
          <TrendingUp className="w-3 h-3" />
          Top 5
        </div>
      </div>

      <div className="space-y-4">
        {topProducts.map(({ product, quantity, revenue }, index) => (
          <div 
            key={product.id} 
            className="flex items-center justify-between group cursor-pointer hover:scale-[1.01] transition-transform"
          >
            {/* Ranking dan info produk */}
            <div className="flex items-center gap-3 flex-1">
              {/* Ranking badge */}
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                bg-gradient-to-br ${rankColors[index]} text-white text-xs font-bold
                shadow-sm
              `}>
                #{index + 1}
              </div>
              
              {/* Product info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {product.category}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2">
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${rankColors[index]}`}
                      style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {quantity} sold
                    </span>
                    <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                      Rp {revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Price per unit */}
            <div className="text-right ml-4">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                Rp {product.price.toLocaleString()}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                per unit
              </p>
            </div>
          </div>
        ))}
        
        {topProducts.length === 0 && (
          <div className="text-center py-8">
            <Coffee className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              No sales data today
            </p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Start selling to see top products
            </p>
          </div>
        )}
      </div>

      {/* Footer dengan summary */}
      {topProducts.length > 0 && (
        <div className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total revenue from top products
              </p>
              <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Rp {topProducts.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              isDark ? 'bg-gray-700 text-green-400' : 'bg-green-50 text-green-700'
            }`}>
              {((topProducts.reduce((sum, p) => sum + p.revenue, 0) / 
                (transactions.reduce((sum, t) => sum + t.total, 0) || 1)) * 100).toFixed(1)}% of total
            </div>
          </div>
        </div>
      )}
    </div>
  );
}