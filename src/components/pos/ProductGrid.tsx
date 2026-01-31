import { Plus, Package } from 'lucide-react';
import type { Product } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
}

export default function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    // Responsive grid yang adaptif untuk layout dengan sidebar
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {products.map(product => {
        const isOutOfStock = product.stock <= 0;

        return (
          <button
            key={product.id}
            onClick={() => onAddToCart(product.id)}
            disabled={isOutOfStock}
            className={`
              rounded-xl border p-3 text-left transition-all group relative flex flex-col bg-gradient-to-b
              ${isDark 
                ? 'from-gray-800 via-gray-800 to-gray-900 border-gray-700 hover:border-amber-500/50 hover:from-gray-750 hover:via-gray-750 hover:to-gray-800 shadow-sm' 
                : 'from-white via-white to-gray-50 border-gray-200 hover:border-amber-500 hover:shadow-sm hover:from-gray-50 hover:via-gray-50 hover:to-white'
              }
              ${isOutOfStock ? 'opacity-60 cursor-not-allowed grayscale-[0.5]' : ''}
            `}
          >
            {/* Area Gambar Produk */}
            <div className={`w-full aspect-square rounded-lg mb-3 flex items-center justify-center overflow-hidden transition-colors bg-gradient-to-br ${
              isDark ? 'from-gray-900 to-gray-800' : 'from-gray-50 to-gray-100'
            }`}>
              {product.image ? (
                // Menampilkan gambar dinamis dari state global
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
              ) : (
                // Tampilan Fallback jika gambar kosong
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base md:text-lg">
                    {product.category.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Informasi Produk */}
            <div className="flex-1 flex flex-col">
                <h3 className={`font-semibold text-sm md:text-base line-clamp-1 transition-colors ${
                  isDark ? 'text-white group-hover:text-amber-400' : 'text-gray-800 group-hover:text-amber-700'
                }`}>
                  {product.name}
                </h3>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'} mb-2`}>
                  {product.category}
                </p>

                <div className="mt-auto flex justify-between items-end">
                  <span className={`font-bold text-sm md:text-base ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    Rp {product.price.toLocaleString()}
                  </span>
                  
                  {/* Badge Stok Dinamis */}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-gradient-to-br ${
                    product.stock > 10 
                      ? isDark ? 'from-green-900/30 to-green-800/20 text-green-400' : 'from-green-50 to-green-100 text-green-600'
                      : isDark ? 'from-red-900/30 to-red-800/20 text-red-400' : 'from-red-50 to-red-100 text-red-600'
                  }`}>
                    {isOutOfStock ? '0' : product.stock}
                  </span>
                </div>
            </div>
            
            {/* Overlay Tombol Tambah (Hanya Desktop) */}
            <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 items-center justify-center rounded-xl transition-all pointer-events-none">
               <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <Plus className="w-6 h-6" />
               </div>
            </div>
          </button>
        );
      })}
      
      {products.length === 0 && (
        <div className="col-span-full text-center py-12">
          <Package className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
          <p className={isDark ? 'text-gray-500' : 'text-gray-400 font-medium'}>No products found</p>
        </div>
      )}
    </div>
  );
}