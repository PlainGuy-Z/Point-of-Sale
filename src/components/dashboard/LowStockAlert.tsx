import { AlertCircle, Package, ArrowRight } from 'lucide-react';
import type { Product } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface LowStockAlertProps {
  products: Product[];
}

export default function LowStockAlert({ products }: LowStockAlertProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  
  const getSeverity = (product: Product) => {
    if (product.stock === 0) return 'critical';
    if (product.stock <= product.minStock * 0.5) return 'high';
    return 'medium';
  };

  return (
    <div className={`
      rounded-2xl border p-6 transition-all duration-300
      ${isDark 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-red-500/30' 
        : 'bg-white border-gray-100 shadow-sm hover:border-red-200'
      }
      ${lowStockProducts.length > 0 ? 'animate-pulse-subtle' : ''}
    `}>
      {/* Header dengan animasi */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-xl relative
            ${lowStockProducts.length > 0 
              ? isDark ? 'bg-red-900/30' : 'bg-red-50'
              : isDark ? 'bg-green-900/30' : 'bg-green-50'
            }
          `}>
            {lowStockProducts.length > 0 ? (
              <AlertCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            ) : (
              <Package className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            )}
            
            {/* Titik animasi untuk alert */}
            {lowStockProducts.length > 0 && (
              <div className="absolute -top-1 -right-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full absolute top-0 left-0"></div>
              </div>
            )}
          </div>
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Peringatan Stok
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {lowStockProducts.length > 0 ? 'Perlu perhatian' : 'Semua baik'}
            </p>
          </div>
        </div>
        
        {lowStockProducts.length > 0 && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            isDark 
              ? 'bg-red-900/40 text-red-400 border border-red-800' 
              : 'bg-red-100 text-red-600 border border-red-200'
          }`}>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            {lowStockProducts.length} peringatan{lowStockProducts.length !== 1 ? '' : ''}
          </div>
        )}
      </div>
      
      {/* Konten */}
      {lowStockProducts.length > 0 ? (
        <div className="space-y-3">
          {lowStockProducts.slice(0, 3).map(product => {
            const severity = getSeverity(product);
            const severityColors = {
              critical: isDark ? 'bg-red-900/40 border-red-800' : 'bg-red-50 border-red-200',
              high: isDark ? 'bg-orange-900/30 border-orange-800' : 'bg-orange-50 border-orange-200',
              medium: isDark ? 'bg-amber-900/30 border-amber-800' : 'bg-amber-50 border-amber-200'
            };

            return (
              <div 
                key={product.id} 
                className={`
                  flex items-center justify-between p-3 rounded-xl border transition-all 
                  hover:scale-[1.01] cursor-pointer group
                  ${severityColors[severity]}
                `}
                onClick={() => navigate(`/operation/products`)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-gray-800/50' : 'bg-white shadow-sm'
                  }`}>
                    <Package className={`w-5 h-5 ${
                      severity === 'critical' ? 'text-red-500' :
                      severity === 'high' ? 'text-orange-500' : 'text-amber-500'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        severity === 'critical' 
                          ? isDark ? 'bg-red-900/60 text-red-300' : 'bg-red-100 text-red-700'
                          : severity === 'high'
                          ? isDark ? 'bg-orange-900/60 text-orange-300' : 'bg-orange-100 text-orange-700'
                          : isDark ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {product.stock === 0 ? 'STOK HABIS' : 'STOK RENDAH'}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Stok: {product.stock}/{product.minStock} {product.unit}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <button className={`
                    p-2 rounded-lg transition-all group-hover:bg-white/10
                    ${isDark 
                      ? 'text-cyan-400 hover:text-cyan-300' 
                      : 'text-blue-600 hover:text-blue-800'
                    }
                  `}>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Tombol Lihat Semua */}
          {lowStockProducts.length > 3 && (
            <button 
              onClick={() => navigate(`/operation/products`)}
              className={`
                w-full py-2.5 mt-2 rounded-lg text-sm font-medium transition-all
                flex items-center justify-center gap-2
                ${isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }
              `}
            >
              Lihat semua {lowStockProducts.length} peringatan
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
            isDark ? 'bg-green-900/30' : 'bg-green-50'
          }`}>
            <Package className={`w-8 h-8 ${isDark ? 'text-green-500' : 'text-green-600'}`} />
          </div>
          <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
            Semua stok mencukupi
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Tidak ada item yang perlu dipesan ulang
          </p>
        </div>
      )}
    </div>
  );
}