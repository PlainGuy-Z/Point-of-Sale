import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Package, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import type { Product } from '../types';
import { getApiBaseUrl } from '../services/apiBaseUrl';

/**
 * Public Customer Menu Page - Accessed via /menu/:shopSlug
 * Dynamically loads menu items for a specific shop from Supabase
 */
export default function CustomerMenu() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const { theme } = useTheme();
  const { format } = useCurrencyFormatter();
  const isDark = theme === 'dark';

  // ── States ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [shopName, setShopName] = useState<string>('');
  const [shopInfo, setShopInfo] = useState<{ phone?: string; address?: string; logo_url?: string | null }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  // ── Fetch Shop Data & Products ─────────────────────────────────────────────
  useEffect(() => {
    const fetchMenuData = async () => {
      if (!shopSlug) {
        setError('Shop slug tidak ditemukan di URL');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 1️⃣ Determine API base URL using centralized service
        let apiBase = '';
        try {
          apiBase = getApiBaseUrl();
        } catch (e) {
          // If VITE_API_BASE_URL is missing in production, fallback to a sensible default or show error
          apiBase = import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin;
        }
        
        const apiUrl = `${apiBase}/api/public/menu/${shopSlug}`;
        console.log('[CustomerMenu] Fetching menu dari:', apiUrl);

        // 2️⃣ Fetch dengan error handling lebih detail
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit', // Ensure no credentials sent to public endpoint
        });

        console.log('[CustomerMenu] Response status:', response.status);

        if (!response.ok) {
          let errorMessage = 'Gagal memuat menu';
          
          try {
            const textResponse = await response.text();
            
            // Check if response is HTML (often happens when route is not found and falls back to index.html)
            if (textResponse.trim().toLowerCase().startsWith('<!doctype html>')) {
              errorMessage = 'Koneksi ke server gagal (Endpoint tidak ditemukan).';
              console.error('[CustomerMenu] Received HTML instead of JSON. Ensure API Base URL is correct.');
            } else {
              const errorData = JSON.parse(textResponse);
              console.error('[CustomerMenu] API Error:', errorData);
              errorMessage = errorData.error?.message || errorMessage;
            }
          } catch {
            console.error('[CustomerMenu] Non-JSON response:', response.statusText);
            errorMessage = response.statusText || errorMessage;
          }

          if (response.status === 404) {
            setError(`Toko tidak ditemukan. Slug: "${shopSlug}"`);
          } else if (response.status === 400) {
            setError(`Slug tidak valid: "${shopSlug}"`);
          } else {
            setError(`${errorMessage} (Error: ${response.status})`);
          }
          setIsLoading(false);
          return;
        }

        const textData = await response.text();
        if (textData.trim().toLowerCase().startsWith('<!doctype html>')) {
          throw new Error('Koneksi ke server gagal. Pastikan konfigurasi URL API sudah benar.');
        }

        const data = JSON.parse(textData);
        console.log('[CustomerMenu] Menu loaded successfully:', data);

        // 2️⃣ Extract shop info
        if (data.shop) {
          setShopName(data.shop.name || 'Menu Digital');
          setShopInfo({
            phone: data.shop.phone,
            address: data.shop.address,
            logo_url: data.shop.logo_url,
          });
        }

        // 3️⃣ Extract products (filter only available items)
        const availableProducts = (data.products || []).filter(
          (p: Product) => p.isAvailable !== false && (p.stock > 0 || p.stock === -1 || p.stock === 0)
        );
        setProducts(availableProducts);

        // 4️⃣ Extract unique categories
        const uniqueCategories = ['All', ...Array.from(new Set(
          availableProducts
            .map((p: Product) => p.category)
            .filter((c: string | undefined) => c && typeof c === 'string')
        ) as Set<string>)];
        setCategories(uniqueCategories);

        // Reset selected category to 'All' if new categories loaded
        setSelectedCategory('All');
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Gagal memuat menu. Silakan coba lagi nanti.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [shopSlug]);

  // ── Handle Responsive ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── Filter & Sort Products ─────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    const categoryFilter = selectedCategory === 'All' 
      ? () => true
      : (p: Product) => p.category === selectedCategory;

    return products.filter(product => {
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
  }, [products, search, selectedCategory]);

  // ── Error State ────────────────────────────────────────────────────────────
  if (error && !isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-stone-950' : 'bg-white'} flex items-center justify-center p-4`}>
        <div className={`max-w-md w-full rounded-3xl border-2 p-8 text-center ${
          isDark
            ? 'bg-stone-900/80 border-red-500/30'
            : 'bg-red-50 border-red-200'
        }`}>
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? 'text-red-400' : 'text-red-500'
          }`} />
          <h2 className={`text-xl font-bold mb-3 ${
            isDark ? 'text-white' : 'text-[#0F172A]'
          }`}>
            Toko Tidak Ditemukan
          </h2>
          <p className={`text-sm mb-6 ${
            isDark ? 'text-stone-400' : 'text-[#475569]'
          }`}>
            {error}
          </p>
          <button
            onClick={() => window.history.back()}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              isDark
                ? 'bg-stone-800 hover:bg-stone-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-[#0F172A]'
            }`}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-stone-950' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${
            isDark ? 'text-amber-500' : 'text-teal-500'
          }`} />
          <p className={`text-sm font-semibold ${
            isDark ? 'text-stone-400' : 'text-[#475569]'
          }`}>
            Memuat menu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-stone-950' : 'bg-white'}`}>
      {/* ────────────────────────────────────────────────────────────────────────
          HEADER SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <div className={`${isDark ? 'bg-stone-900/80 border-stone-800' : 'bg-gradient-to-r from-teal-500 to-cyan-500 border-b border-teal-200'} border-b sticky top-0 z-30 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Logo & Shop Name */}
          {shopInfo.logo_url && (
            <div className="mb-4 flex items-center gap-3">
              <img
                src={shopInfo.logo_url}
                alt={shopName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isDark ? 'text-white' : 'text-white'
                }`}>
                  {shopName}
                </h1>
              </div>
            </div>
          )}
          {!shopInfo.logo_url && (
            <h1 className={`text-3xl sm:text-4xl font-black tracking-tight mb-2 ${
              isDark ? 'text-white' : 'text-white'
            }`}>
              📋 {shopName}
            </h1>
          )}

          {/* Description */}
          <p className={`text-sm sm:text-base mb-4 ${
            isDark ? 'text-stone-400' : 'text-white/90'
          }`}>
            Silakan pesan langsung ke Kasir
          </p>

          {/* Shop Info */}
          {(shopInfo.address || shopInfo.phone) && (
            <div className={`text-xs sm:text-sm mb-4 space-y-1 ${
              isDark ? 'text-stone-400' : 'text-white/80'
            }`}>
              {shopInfo.address && <p>📍 {shopInfo.address}</p>}
              {shopInfo.phone && <p>☎️ {shopInfo.phone}</p>}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mt-4">
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
      {!isMobile && categories.length > 0 && (
        <div className={`${isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'} border-b sticky top-[140px] z-20 backdrop-blur-sm`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? isDark
                        ? 'bg-amber-500 text-white'
                        : 'bg-teal-500 text-white'
                      : isDark
                        ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        : 'bg-white text-[#475569] hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MAIN CONTENT
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Category Filter */}
        {isMobile && categories.length > 0 && (
          <div className="mb-6 pb-4 border-b">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? isDark
                        ? 'bg-amber-500 text-white'
                        : 'bg-teal-500 text-white'
                      : isDark
                        ? 'bg-stone-800 text-stone-300'
                        : 'bg-gray-200 text-[#475569]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
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

            {/* Product Grid */}
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
        const { priceToShow, isPromoActive, discountPercent } = getEffectivePrice(product);

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

