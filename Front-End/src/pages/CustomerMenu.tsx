import { useState, useEffect, useMemo } from 'react';
import { Search, Package } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ProductGrid from '../components/pos/ProductGrid';
import CategoryPills from '../components/pos/CategoryPills';
import type { Product } from '../types';

export default function CustomerMenu() {
  const { products, transactions } = useApp();
  const { theme } = useTheme();
  const { format } = useCurrencyFormatter();
  const isDark = theme === 'dark';

  // ── States ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // ── Filter & Sort Products ─────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    const categoryFilter = selectedCategory === 'All' 
      ? (p: Product) => true 
      : (p: Product) => p.category === selectedCategory;

    const filtered = products.filter(product => {
      // Show only available and in-stock products
      if (product.isAvailable === false) return false;
      if (product.stock === 0) return false;

      // Apply category filter
      if (!categoryFilter(product)) return false;

      // Apply search filter
      if (searchLower) {
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    return filtered;
  }, [products, search, selectedCategory]);

  // ── Responsive ─────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-stone-950' : 'bg-white'}`}>
      {/* ────────────────────────────────────────────────────────────────────────
          HEADER SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <div className={`${isDark ? 'bg-stone-900/80 border-stone-800' : 'bg-gradient-to-r from-teal-500 to-cyan-500 border-b border-teal-200'} border-b sticky top-0 z-30 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Title & Description */}
          <div className="mb-6">
            <h1 className={`text-3xl sm:text-4xl font-black tracking-tight mb-2 ${
              isDark ? 'text-white' : 'text-white'
            }`}>
              📋 Daftar Menu
            </h1>
            <p className={`text-sm sm:text-base ${
              isDark ? 'text-stone-400' : 'text-white/90'
            }`}>
              Silakan pesan langsung ke Kasir
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-stone-500' : 'text-white/60'
            }`} />
            <input
              type="text"
              placeholder="Cari menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 sm:py-4 rounded-2xl border-2 outline-none text-sm sm:text-base transition-all ${
                isDark
                  ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500 focus:border-amber-500'
                  : 'bg-white/20 border-white/30 text-white placeholder-white/70 focus:border-white focus:bg-white/30'
              }`}
            />
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          CATEGORY FILTER (Desktop Only)
      ──────────────────────────────────────────────────────────────────────── */}
      {!isMobile && (
        <div className={`${isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'} border-b sticky top-[110px] z-20 backdrop-blur-sm`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MAIN CONTENT
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Category Filter */}
        {isMobile && (
          <div className="mb-6 pb-4 border-b">
            <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 text-center rounded-3xl border-2 border-dashed ${
            isDark
              ? 'bg-stone-900/40 border-stone-700'
              : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <Package size={64} className={`mb-4 ${isDark ? 'text-stone-700' : 'text-[#CBD5E1]'}`} />
            <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isDark ? 'text-stone-300' : 'text-[#334155]'}`}>
              {search ? 'Tidak Ada Hasil Pencarian' : 'Tidak Ada Menu Tersedia'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'} max-w-sm`}>
              {search 
                ? `Coba cari dengan kata kunci lain: "${search}"`
                : 'Menu akan muncul di sini'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className={`text-sm font-semibold ${isDark ? 'text-stone-400' : 'text-[#64748B]'}`}>
                Menampilkan <span className="font-black text-amber-500">{filteredProducts.length}</span> menu
                {search && ` untuk "${search}"`}
              </p>
            </div>

            {/* Product Grid — Full Width, Read-Only */}
            <div className="w-full">
              <ProductGridReadOnly products={filteredProducts} isDark={isDark} format={format} />
            </div>
          </>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          FOOTER INFO
      ──────────────────────────────────────────────────────────────────────── */}
      <div className={`${isDark ? 'bg-stone-900/60 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'} border-t py-6 sm:py-8 mt-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
            💡 Silakan tunjukkan menu ini ke petugas kasir untuk melakukan pemesanan
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Read-only Product Grid (tidak bisa diklik)
 * Hanya menampilkan Foto, Nama Produk, dan Harga
 */
interface ProductGridReadOnlyProps {
  products: Product[];
  isDark: boolean;
  format: (value: number) => string;
}

function ProductGridReadOnly({ products, isDark, format }: ProductGridReadOnlyProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product, index) => {
        const imageUrl = product.image;
        const isOutOfStock = product.stock === 0;
        const isUnavailable = product.isAvailable === false;
        const isDisabled = isOutOfStock || isUnavailable;
        const { price: priceToShow, isPromoActive, discountPercent } = getEffectivePrice(product);

        return (
          <div
            key={product.id}
            className={`
              group rounded-2xl border overflow-hidden transition-all
              ${isDark
                ? 'bg-stone-900 border-stone-800 hover:border-amber-500/40'
                : 'bg-white border-teal-500/30 hover:border-teal-600 shadow-sm'
              }
              ${isDisabled ? 'opacity-60' : ''}
              animate-in
            `}
            style={{
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'both'
            }}
          >
            {/* Image & Badges */}
            <div className="relative w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '';
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className={`w-12 h-12 ${isDark ? 'text-stone-700' : 'text-[#CBD5E1]'}`} />
                </div>
              )}

              {/* Promo Badge */}
              {isPromoActive && (
                <div className="absolute top-2 left-2 z-10">
                  <div className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                    {product.promoLabel || 'PROMO'}
                  </div>
                </div>
              )}

              {/* Out of Stock Badge */}
              {isDisabled && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
                    isDark ? 'bg-stone-900 text-stone-400' : 'bg-stone-800 text-white'
                  }`}>
                    {isOutOfStock ? 'Stok Habis' : 'Tidak Tersedia'}
                  </span>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="p-3 sm:p-4">
              {/* Name */}
              <h3 className={`font-bold text-sm line-clamp-2 mb-2 ${
                isDark ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {product.name}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                {isPromoActive && product.promoPrice && (
                  <span className={`text-xs line-through ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
                    {format(product.price)}
                  </span>
                )}
                <span className={`font-black text-base ${
                  isPromoActive
                    ? isDark ? 'text-red-400' : 'text-red-600'
                    : isDark ? 'text-amber-400' : 'text-teal-700'
                }`}>
                  {format(priceToShow)}
                </span>
              </div>

              {/* Discount Badge */}
              {isPromoActive && discountPercent > 0 && (
                <p className={`text-xs font-bold mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  Hemat {discountPercent}%
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Helper: Get effective price (original or promo)
 */
function getEffectivePrice(product: Product) {
  const isPromoActive = product.isPromo && product.promoPrice && product.promoPrice > 0;
  const price = isPromoActive ? product.promoPrice! : product.price;
  const discountPercent = isPromoActive && product.promoPrice && product.price
    ? Math.round(((product.price - product.promoPrice) / product.price) * 100)
    : 0;

  return {
    price: product.price,
    promoPrice: product.promoPrice,
    priceToShow: price,
    isPromoActive,
    discountPercent,
  };
}
