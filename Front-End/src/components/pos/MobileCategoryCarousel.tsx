import { useMemo, useRef, useState } from 'react';
import { ChevronRight, Coffee } from 'lucide-react';
import type { Product } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { getEffectivePrice } from '../../utils/priceUtils';

export interface CategoryCarousel {
  categoryName: string;
  totalSales: number;
  products: Product[];
}

interface MobileCategoryCarouselProps {
  carousel: CategoryCarousel;
  isDark: boolean;
  onAddToCart: (productId: string) => void;
  onViewAll: (categoryName: string) => void;
}

interface MobileProductCardProps {
  product: Product;
  isDark: boolean;
  onAdd: () => void;
  rank?: number;
  totalSold?: number;
}

function getSafeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function MobileProductCard({ product, isDark, onAdd, rank, totalSold = 0 }: MobileProductCardProps) {
  const { format } = useCurrencyFormatter();
  const { price: effectivePrice, isPromoActive } = getEffectivePrice(product);
  const isSoldOut = product.stock === 0;

  return (
    <div
      style={{ width: 160, scrollSnapAlign: 'start', flexShrink: 0 }}
      className={`min-h-[280px] flex flex-col justify-between rounded-2xl overflow-hidden border transition-all ${
        isDark 
          ? 'bg-stone-950 border-stone-800' 
          : 'bg-white border-slate-200 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.16)] hover:shadow-[0_16px_44px_-24px_rgba(15,23,42,0.12)] hover:border-teal-300'
      } shadow-black/5`}
    >
      <div className={`relative h-[110px] ${isDark ? 'bg-stone-800' : 'bg-[#F1F5F9]'}`}>
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Coffee size={32} className="text-amber-500/40" />
          </div>
        )}

        {rank && rank <= 3 && (
          <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${
            isDark 
              ? 'bg-amber-500 text-white' 
              : 'bg-amber-50 border border-amber-200 text-amber-700'
          }`}>
            #{rank}
          </div>
        )}

        {(product.isPromo || product.discount > 0) && (
          <div className={`absolute top-2 right-2 rounded-lg px-1.5 py-0.5 text-[9px] font-black shadow-sm ${
            isDark 
              ? 'bg-red-500 text-white' 
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {product.discount > 0 ? `-${product.discount}%` : 'PROMO'}
          </div>
        )}

        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-3xl">
            <span className="text-white font-black text-xs">SOLD OUT</span>
          </div>
        )}
      </div>

      <div className="p-2.5">
        <p className={`font-bold text-[11px] leading-tight line-clamp-2 ${isDark ? 'text-white' : 'text-[#0F172A]'} mb-1`}>
          {product.name}
        </p>

        <div className="mb-2">
          {effectivePrice < product.price ? (
            <>
              <p className={`font-black text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {format(effectivePrice)}
              </p>
              <p className={`text-[10px] line-through ${isDark ? 'text-stone-500' : 'text-[#CBD5E1]'}`}>
                {format(product.price)}
              </p>
            </>
          ) : (
            <p className={`font-black text-sm ${isDark ? 'text-amber-500' : 'text-teal-700'}`}>
              {format(product.price)}
            </p>
          )}
        </div>

        <div className="mb-2">
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${
            isDark 
              ? 'bg-stone-900/80 text-stone-200' 
              : 'bg-amber-50 text-amber-600'
          }`}>
            {totalSold} terjual (estimasi lokal)
          </span>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={isSoldOut}
          className={`w-full py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
            isSoldOut
              ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
              : 'bg-amber-500 text-black hover:bg-amber-400'
          }`}
        >
          {isSoldOut ? 'Habis' : '+ Tambah'}
        </button>
      </div>
    </div>
  );
}

export default function MobileCategoryCarousel({
  carousel,
  isDark,
  onAddToCart,
  onViewAll,
}: MobileCategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeId = getSafeId(carousel.categoryName);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.scrollWidth / carousel.products.length;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(index, 0), carousel.products.length - 1));
  };

  const dotItems = useMemo(() => {
    const maxDots = 10;
    return carousel.products.slice(0, maxDots);
  }, [carousel.products]);

  return (
    <div className="mb-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <h2 className={`font-black text-base ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            {carousel.categoryName}
          </h2>
          {carousel.totalSales > 0 && carousel.categoryName !== 'Semua' && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'
            }`}>
              {carousel.totalSales} terjual (estimasi lokal)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onViewAll(carousel.categoryName)}
          className="text-xs font-bold text-amber-500 flex items-center gap-1"
        >
          Lihat Semua <ChevronRight size={14} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className={`carousel-${safeId} flex gap-3 overflow-x-auto px-4 pb-3 scroll-smooth no-scrollbar`}
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onScroll={handleScroll}
      >
        {carousel.products.map((product, index) => (
          <MobileProductCard
            key={product.id}
            product={product}
            isDark={isDark}
            onAdd={() => onAddToCart(product.id)}
            rank={index < 3 ? index + 1 : undefined}
            totalSold={product.recentSalesCount ?? product.salesCount ?? 0}
          />
        ))}
      </div>

      <style>{`.carousel-${safeId}::-webkit-scrollbar { display: none; }`}</style>

      {carousel.products.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2 px-4">
          {dotItems.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex
                  ? 'w-4 bg-amber-500'
                  : isDark
                    ? 'w-1.5 bg-stone-700'
                    : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
