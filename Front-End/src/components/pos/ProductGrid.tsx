import { Plus, Package, Trophy, Lock } from 'lucide-react';
import type { Product } from '../../types';
import { getEffectivePrice } from '../../utils/priceUtils';
import { isOutOfStock as checkOutOfStock, getStockDisplay } from '../../utils/stockUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';


interface ProductGridProps {
  products: Product[]; // Produk sudah terurut dari parent
  onAddToCart: (productId: string) => void;
}

export default function ProductGrid({ 
  products, 
  onAddToCart
}: ProductGridProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {products.map((product, index) => {
        const isUnavailable = product.isAvailable === false;
        const isOutOfStock = checkOutOfStock(product);
        const isDisabled = isUnavailable || isOutOfStock;
        const { price: priceToShow, isPromoActive, discountPercent } = getEffectivePrice(product);
        
        const totalSold = product.recentSalesCount || 0;
        
        // Tentukan apakah produk ini best seller (untuk styling saja)
        const isBestSeller = product.isBestSeller || false;
        const bestSellerRank = product.bestSellerRank;
        
        // Hanya tampilkan badge jika memang best seller rank 1-3
        const showBestSellerBadge = isBestSeller && bestSellerRank && bestSellerRank >= 1 && bestSellerRank <= 3;

        return (
          <button
            key={product.id}
            onClick={() => onAddToCart(product.id)}
            disabled={isDisabled}
            className={`
              rounded-3xl border p-4 text-left transition-all group relative flex flex-col overflow-hidden
              ${isDark
                ? 'bg-stone-950 border-stone-800 hover:border-amber-500/40'
                : 'bg-white border-stone-200 hover:border-amber-500/50'
              }
              ${isDisabled ? 'opacity-60 cursor-not-allowed grayscale-[0.5]' : ''}
              animate-in
            `}
            style={{
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'both'
            }}
          >
            {/* Promo Badge (KIRI ATAS) */}
            {isPromoActive && (
              <div className="absolute top-2 left-2 z-10">
                <div className="px-2 py-1 rounded-xl text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                  {product.promoLabel || 'PROMO'}
                </div>
              </div>
            )}
            
            {/* Best Seller Badge - HANYA untuk TOP 3 (KANAN ATAS) */}
            {showBestSellerBadge && bestSellerRank && (
              <div className="absolute top-2 right-2 z-10">
                <div className={`px-2 py-1 rounded-xl text-[10px] font-bold text-white shadow-lg flex items-center gap-1 ${
                  bestSellerRank === 1 
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600' 
                    : bestSellerRank === 2
                      ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                      : 'bg-gradient-to-br from-amber-700 to-amber-800'
                }`}>
                  <Trophy size={10} />
                  <span>#{bestSellerRank}</span>
                </div>
              </div>
            )}
            
            {/* Out of Stock Badge */}
            {isOutOfStock && (
              <div className="absolute top-10 left-2 z-10">
                <div className="px-2 py-1 rounded-xl text-[10px] font-bold bg-gradient-to-r from-gray-600 to-gray-800 text-white">
                  SOLD OUT
                </div>
              </div>
            )}

            {/* Area Gambar Produk */}
            <div className={`
              w-full aspect-square rounded-3xl mb-4 flex items-center justify-center
              overflow-hidden relative
              ${isDark ? 'bg-stone-950' : 'bg-stone-50'}
              ${isOutOfStock ? 'animate-pulse-subtle' : ''}
            `}>
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
              ) : (
                <div className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg
                  ${isOutOfStock ? 'animate-pulse-subtle' : ''}
                  ${isPromoActive ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                    showBestSellerBadge ? (bestSellerRank === 1 
                      ? 'bg-gradient-to-br from-yellow-500 to-amber-500' 
                      : bestSellerRank === 2
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                        : 'bg-gradient-to-br from-amber-700 to-amber-800'
                    ) :
                    'bg-gradient-to-br from-amber-500 to-cyan-500'}
                `}>
                  <span className="text-white font-bold text-base md:text-lg">
                    {product.category.charAt(0)}
                  </span>
                </div>
              )}
              
              {/* Promo Overlay */}
              {isPromoActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 via-transparent to-transparent opacity-70"></div>
              )}
              
              {/* Best Seller Overlay untuk TOP 3 */}
              {showBestSellerBadge && !isPromoActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-70"></div>
              )}
            </div>

            {/* Informasi Produk */}
            <div className="flex-1 flex flex-col">
              <h3 className={`
                font-semibold text-sm md:text-base line-clamp-1 transition-colors
                ${isDark ? 'text-white group-hover:text-amber-400' : 'text-gray-800 group-hover:text-amber-700'}
              `}>
                {product.name}
              </h3>
              
              <p className={`
                text-[10px] font-bold uppercase tracking-wider mb-2
                ${isDark ? 'text-stone-500' : 'text-stone-400'}
              `}>
                {product.category}
              </p>

              {/* Bagian harga dan info */}
              <div className="mt-auto flex flex-col items-start">
                {/* Harga saat ini */}
                <div className="flex items-baseline gap-1 w-full">
                  <span className={`
                    font-bold text-sm md:text-base
                      ${isPromoActive ? (isDark ? 'text-red-400' : 'text-red-600') : 'text-amber-500'}
                  `}>
                    {format(priceToShow)}
                  </span>
                </div>
                
                {/* Harga asli jika promo/discount */}
                {isPromoActive && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`
                      text-[10px] line-through
                      ${isDark ? 'text-stone-500' : 'text-stone-400'}
                    `}>
                       {format(product.price)}
                    </span>
                    <span className={`
                      text-[10px] px-1 py-0.5 rounded font-bold
                      ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}
                    `}>
                      -{discountPercent}%
                    </span>
                  </div>
                )}
                
                {/* INFO PENJUALAN - Tampilkan hanya jika ada penjualan */}
                {totalSold > 0 && (
                  <div className="flex items-center gap-1 mt-1 w-full">
                    <div className={`
                      flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold
                      ${isDark 
                        ? 'bg-stone-900/50 text-stone-300' 
                        : 'bg-gray-100 text-gray-700'
                      }
                    `}>
                      <span>
                        {totalSold} terjual 
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Info Stok */}
                <div className="flex justify-between items-center w-full mt-1">
                  <span className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                    Stok:
                  </span>
                  <span className={`
                    text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-gradient-to-br
                    ${isOutOfStock ? 'animate-pulse-subtle' : ''}
                    ${
                      product.stock === -1 || product.stock > 10 
                        ? isDark 
                          ? 'from-green-900/30 to-green-800/20 text-green-400'
                          : 'from-green-50 to-green-100 text-green-600'
                        : product.stock > 0
                          ? isDark 
                            ? 'from-amber-900/30 to-amber-800/20 text-amber-400'
                            : 'from-amber-50 to-amber-100 text-amber-600'
                          : isDark 
                            ? 'from-red-900/30 to-red-800/20 text-red-400'
                            : 'from-red-50 to-red-100 text-red-600'
                    }
                  `}>
                    {product.stock === -1 ? '∞' : product.stock}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Overlay Tombol Tambah (Hanya Desktop) */}
            <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 items-center justify-center rounded-3xl transition-all pointer-events-none">
              <div className={`
                p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform
                ${
                  isPromoActive 
                    ? 'bg-gradient-to-br from-red-500 to-pink-500' 
                    : showBestSellerBadge
                      ? (bestSellerRank === 1 
                          ? 'bg-gradient-to-br from-yellow-500 to-amber-500' 
                          : bestSellerRank === 2
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                            : 'bg-gradient-to-br from-amber-700 to-amber-800'
                        )
                      : 'bg-gradient-to-br from-amber-500 to-orange-500'
                }
              `}>
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Unavailable Overlay */}
            {isUnavailable && (
              <div className="absolute inset-0 rounded-3xl z-20 bg-stone-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                <Lock className="w-8 h-8 text-stone-400" />
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Tidak Tersedia
                </span>
              </div>
            )}
          </button>
        );
      })}
      
      {/* Empty State */}
      {products.length === 0 && (
        <div className="col-span-full text-center py-12 animate-in">
          <Package className={`
            w-12 h-12 mx-auto mb-2 animate-pulse-subtle
            ${isDark ? 'text-stone-700' : 'text-stone-300'}
          `} />
          <p className={`
            animate-in
            ${isDark ? 'text-stone-500' : 'text-stone-400 font-medium'}
          `} style={{ animationDelay: '0.2s' }}>
            No products found
          </p>
        </div>
      )}
    </div>
  );
}