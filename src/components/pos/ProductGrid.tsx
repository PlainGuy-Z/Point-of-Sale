import { Plus, Package, Percent, Flame, Trophy, TrendingUp } from 'lucide-react';
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
      {products.map((product, index) => {
        const isOutOfStock = product.stock <= 0;
        const isPromoActive = product.isPromo && product.promoPrice && product.promoPrice > 0;
        const discountPercent = isPromoActive 
          ? Math.round(((product.price - product.promoPrice!) / product.price) * 100)
          : 0;
        const priceToShow = isPromoActive ? product.promoPrice! : product.price;
        const isBestSellerActive = product.isBestSeller;

        return (
          <button
            key={product.id}
            onClick={() => onAddToCart(product.id)}
            disabled={isOutOfStock}
            className={`
              rounded-xl border p-3 text-left transition-all group relative flex flex-col bg-gradient-to-b overflow-hidden
              ${isDark 
                ? 'from-gray-800 via-gray-800 to-gray-900 border-gray-700 hover:border-amber-500/50 hover:from-gray-750 hover:via-gray-750 hover:to-gray-800 shadow-sm' 
                : 'from-white via-white to-gray-50 border-gray-200 hover:border-amber-500 hover:shadow-sm hover:from-gray-50 hover:via-gray-50 hover:to-white'
              }
              ${isOutOfStock ? 'opacity-60 cursor-not-allowed grayscale-[0.5]' : ''}
              animate-in
            `}
            style={{
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'both'
            }}
          >
            {/* Promo Badge */}
            {isPromoActive && (
              <div className="absolute top-2 left-2 z-10">
                <div className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                  {product.promoLabel || `${discountPercent}% OFF`}
                </div>
              </div>
            )}
            
            {/* Best Seller Badge */}
            {isBestSellerActive && !isPromoActive && (
              <div className="absolute top-2 right-2 z-10">
                <div className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                  <Trophy size={10} className="inline mr-1" />
                  Best Seller
                </div>
              </div>
            )}
            
            {/* Jika ada promo DAN best seller */}
            {isPromoActive && isBestSellerActive && (
              <div className="absolute top-2 right-2 z-10">
                <div className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                  <Trophy size={10} className="inline mr-1" />
                  Best Seller
                </div>
              </div>
            )}
            
            {/* Out of Stock Badge */}
            {isOutOfStock && (
              <div className="absolute top-10 left-2 z-10">
                <div className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-gray-600 to-gray-800 text-white">
                  SOLD OUT
                </div>
              </div>
            )}

            {/* Area Gambar Produk */}
            <div className={`w-full aspect-square rounded-lg mb-3 flex items-center justify-center overflow-hidden transition-colors relative bg-gradient-to-br ${
              isDark ? 'from-gray-900 to-gray-800' : 'from-gray-50 to-gray-100'
            } ${isOutOfStock ? 'animate-pulse-subtle' : ''}`}>
              {product.image ? (
                // Menampilkan gambar dinamis dari state global
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
              ) : (
                // Tampilan Fallback jika gambar kosong
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg ${isOutOfStock ? 'animate-pulse-subtle' : ''} ${
                  isPromoActive ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                  isBestSellerActive ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                  'bg-gradient-to-br from-amber-500 to-orange-500'
                }`}>
                  <span className="text-white font-bold text-base md:text-lg">
                    {product.category.charAt(0)}
                  </span>
                </div>
              )}
              
              {/* Promo Overlay */}
              {isPromoActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 via-transparent to-transparent opacity-70"></div>
              )}
              
              {/* Best Seller Overlay */}
              {isBestSellerActive && !isPromoActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-70"></div>
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

              {/* Bagian harga dengan promo */}
              <div className="mt-auto flex flex-col items-start">
                <div className="flex items-baseline gap-1 w-full">
                  <span className={`text-xs font-semibold ${isPromoActive ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                    Rp
                  </span>
                  <span className={`font-bold text-sm md:text-base ${isPromoActive ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-amber-400' : 'text-amber-600')}`}>
                    {priceToShow.toLocaleString()}
                  </span>
                </div>
                
                {/* Original Price dengan line-through jika promo */}
                {isPromoActive && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Rp {product.price.toLocaleString()}
                    </span>
                    <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`}>
                      Save {discountPercent}%
                    </span>
                  </div>
                )}
                
                {/* Best Seller Info */}
                {isBestSellerActive && (
                  <div className="flex items-center gap-1 mt-1 w-full">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
                      <Trophy className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      <span className={`text-[10px] font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                        {product.salesCount || 0} sold
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center w-full mt-1">
                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Stok:
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-gradient-to-br ${
                    product.stock > 10 
                      ? isDark ? 'from-green-900/30 to-green-800/20 text-green-400' : 'from-green-50 to-green-100 text-green-600'
                      : isDark ? 'from-red-900/30 to-red-800/20 text-red-400' : 'from-red-50 to-red-100 text-red-600'
                  } ${isOutOfStock ? 'animate-pulse-subtle' : ''}`}>
                    {isOutOfStock ? '0' : product.stock}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Overlay Tombol Tambah (Hanya Desktop) */}
            <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 items-center justify-center rounded-xl transition-all pointer-events-none">
               <div className={`p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform ${
                 isPromoActive 
                   ? 'bg-gradient-to-br from-red-500 to-pink-500' 
                   : isBestSellerActive
                     ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                     : 'bg-gradient-to-br from-amber-500 to-orange-500'
               }`}>
                  <Plus className="w-6 h-6 text-white" />
               </div>
            </div>
          </button>
        );
      })}
      
      {products.length === 0 && (
        <div className="col-span-full text-center py-12 animate-in">
          <Package className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-700' : 'text-gray-300'} animate-pulse-subtle`} />
          <p className={`${isDark ? 'text-gray-500' : 'text-gray-400 font-medium'} animate-in`} style={{animationDelay: '0.2s'}}>
            No products found
          </p>
        </div>
      )}
    </div>
  );
}