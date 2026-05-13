import { useState, useRef, useCallback } from 'react';
import { ShoppingCart, Trash2, Zap, ReceiptText, X, ChevronUp } from 'lucide-react';
import type { CartItemWithInput } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

export interface MobileCartProps {
  cart: CartItemWithInput[];
  quote: {
    subtotal: number;
    tax: number;
    serviceCharge: number;
    grandTotal: number;
    taxRate?: number;
    taxLabel?: string;
    serviceChargeLabel?: string;
    serviceChargeRate?: number;
  };
  sheetState: 'collapsed' | 'peek' | 'expanded';
  isDark: boolean;
  canPay: boolean;
  onOpen: () => void;
  onClose: () => void;
  onQuickPay: () => void;
  onCheckout: () => void;
  onEditItem: (index: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onUpdateQuantity: (index: number, delta: number) => void;
}

export default function MobileCart({
  cart,
  quote,
  sheetState,
  isDark,
  canPay,
  onOpen,
  onClose,
  onQuickPay,
  onCheckout,
  onEditItem,
  onRemoveItem,
  onClearCart,
  onUpdateQuantity,
}: MobileCartProps) {
  const { format } = useCurrencyFormatter();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasItems = cart.length > 0;

  // ── Swipe-to-delete state ──────────────────────────────────────────────────
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const intentLocked = useRef<'none' | 'horizontal' | 'vertical'>('none');

  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    intentLocked.current = 'none';
    // Close any previously revealed item
    if (revealedIndex !== null && revealedIndex !== index) {
      setRevealedIndex(null);
    }
  }, [revealedIndex]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    if (intentLocked.current === 'none' && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      intentLocked.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, index: number) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    if (intentLocked.current === 'horizontal') {
      // Left swipe > 50px → reveal delete
      if (diffX > 50) {
        setRevealedIndex(index);
      }
      // Right swipe or small movement → close
      else if (diffX < -30 || Math.abs(diffX) <= 50) {
        setRevealedIndex(null);
      }
    }
  }, []);

  const handleItemTap = useCallback((index: number) => {
    // Only navigate to edit if not a swipe and not revealed
    if (intentLocked.current === 'none' || intentLocked.current === 'vertical') {
      if (revealedIndex === index) {
        setRevealedIndex(null);
      } else if (revealedIndex === null) {
        onEditItem(index);
      } else {
        setRevealedIndex(null);
      }
    }
  }, [revealedIndex, onEditItem]);

  return (
    <>
      {/* ── Floating Bar (collapsed, has items) ── */}
      {sheetState === 'collapsed' && hasItems && (
        <button
          type="button"
          onClick={onOpen}
          className={`fixed bottom-4 left-4 right-4 z-40 rounded-2xl shadow-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-transform duration-200 ${isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-gray-200 text-gray-900'} hover:-translate-y-0.5`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
              <ShoppingCart size={20} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-black uppercase tracking-wide">Keranjang</p>
              <p className="text-xs font-semibold text-stone-500 truncate">
                {itemCount} item • {format(quote.grandTotal)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-500 px-3 py-2 text-[11px] font-black uppercase text-white shadow-sm">
              Buka
            </span>
            <ChevronUp size={18} className={isDark ? 'text-stone-200' : 'text-gray-600'} />
          </div>
        </button>
      )}

      {/* ── Expanded Sheet ── */}
      {sheetState !== 'collapsed' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/*
            Sheet container: uses flex-col so header (shrink-0), scrollable content (flex-1),
            and footer (shrink-0) are always laid out correctly. The footer never scrolls away.
          */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-40 mx-2 flex flex-col rounded-t-3xl border shadow-[0_-12px_60px_rgba(0,0,0,0.40)] transition-all duration-300 ease-out animate-in slide-in-from-bottom-96 ${isDark ? 'border-stone-800/20 bg-stone-950' : 'border-gray-200 bg-white'}`}
            style={{ height: '88vh', maxHeight: '92vh' }}
          >
            {/* ── Header (flex-shrink-0) ── */}
            <div className="flex-shrink-0 px-4 pt-3 pb-3">
              <div className={`mx-auto h-1.5 w-16 rounded-full ${isDark ? 'bg-stone-700/70' : 'bg-gray-300'}`} />
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Keranjang</p>
                  <p className={`mt-1 text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{itemCount} item • {format(quote.grandTotal)}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-2xl border p-2 transition ${isDark ? 'border-stone-700/70 bg-stone-900/90 text-stone-300 hover:bg-stone-800' : 'border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  aria-label="Tutup keranjang"
                >
                  <X size={18} />
                </button>
              </div>
              {/* Kosongkan button */}
              {hasItems && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClearCart}
                    className={`rounded-2xl border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition ${isDark ? 'border-stone-700/70 bg-stone-900/90 text-stone-300 hover:bg-stone-800' : 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Kosongkan
                  </button>
                </div>
              )}
              {/* Divider */}
              <div className={`mt-3 h-px ${isDark ? 'bg-stone-800' : 'bg-gray-200'}`} />
            </div>

            {/* ── Scrollable Cart Items (flex-1, overflow-y-auto) ── */}
            <div
              className="flex-1 min-h-0 overflow-y-auto px-4 py-1"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: isDark ? '#44403c #1c1917' : '#d6d3d1 #f5f5f4' }}
              onClick={() => { if (revealedIndex !== null) setRevealedIndex(null); }}
            >
              {/* Custom scrollbar styles */}
              <style>{`
                .mobile-cart-scroll::-webkit-scrollbar { width: 5px; }
                .mobile-cart-scroll::-webkit-scrollbar-track { background: ${isDark ? '#1c1917' : '#f5f5f4'}; border-radius: 10px; }
                .mobile-cart-scroll::-webkit-scrollbar-thumb { background: ${isDark ? '#44403c' : '#d6d3d1'}; border-radius: 10px; }
                .mobile-cart-scroll::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#57534e' : '#a8a29e'}; }
              `}</style>

              {!hasItems ? (
                <div className={`flex min-h-[200px] items-center justify-center rounded-3xl border p-6 text-center text-sm ${isDark ? 'border-stone-800/60 bg-stone-900/80 text-stone-400' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                  Keranjang kosong. Pilih produk untuk mulai membuat pesanan.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Swipe hint */}
                  {revealedIndex === null && (
                    <p className={`text-center text-[10px] font-medium pb-0.5 ${isDark ? 'text-stone-700' : 'text-stone-300'}`}>
                      ← geser kiri hapus · tap untuk edit
                    </p>
                  )}

                  {cart.map((item, index) => {
                    const isPromoItem = item.isPromo && item.originalPrice;
                    const basePrice = item.price + (item.variantPrice || 0);
                    const lineTotal = basePrice * item.quantity;
                    const isRevealed = revealedIndex === index;

                    return (
                      <div
                        key={`${item.productId}-${index}`}
                        className="overflow-hidden rounded-2xl"
                      >
                        <div
                          className="flex"
                          style={{
                            transform: isRevealed ? 'translateX(-80px)' : 'translateX(0)',
                            transition: 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          }}
                          onTouchStart={(e) => handleTouchStart(e, index)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={(e) => handleTouchEnd(e, index)}
                          onClick={() => handleItemTap(index)}
                        >
                          {/* ── Item Card ── */}
                          <div className={`flex-shrink-0 w-full rounded-2xl border p-3 transition-colors ${
                            isDark ? 'bg-stone-900/60 border-stone-800' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {isPromoItem && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                      {item.promoLabel || 'PROMO'}
                                    </span>
                                  )}
                                  {item.productId.startsWith('manual-') && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <p className={`font-bold text-sm truncate mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {item.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {isPromoItem && (
                                    <span className={`text-[10px] line-through ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                                      {format(item.originalPrice!)}
                                    </span>
                                  )}
                                  <span className={`text-xs font-bold ${
                                    isPromoItem
                                      ? isDark ? 'text-red-400' : 'text-red-600'
                                      : isDark ? 'text-amber-400' : 'text-amber-600'
                                  }`}>
                                    {format(basePrice)}
                                  </span>
                                </div>
                              </div>

                              {/* Quantity stepper */}
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(index, -1); }}
                                  disabled={item.quantity <= 1}
                                  className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-base transition-all active:scale-90 disabled:opacity-30 select-none ${
                                    isDark
                                      ? 'bg-stone-800 text-stone-300'
                                      : 'bg-gray-200 text-gray-600'
                                  }`}
                                  style={{ minWidth: 32, minHeight: 32 }}
                                >
                                  −
                                </button>
                                <span className={`w-7 text-center text-sm font-black tabular-nums select-none ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(index, 1); }}
                                  className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-base transition-all active:scale-90 select-none ${
                                    isDark
                                      ? 'bg-stone-800 text-stone-300 hover:bg-amber-500 hover:text-white'
                                      : 'bg-gray-200 text-gray-600 hover:bg-amber-500 hover:text-white'
                                  }`}
                                  style={{ minWidth: 32, minHeight: 32 }}
                                >
                                  +
                                </button>
                              </div>

                              {/* Line total */}
                              <div className="text-right" style={{ minWidth: 52 }}>
                                <p className={`text-sm font-black tabular-nums ${
                                  isPromoItem
                                    ? isDark ? 'text-red-400' : 'text-red-600'
                                    : isDark ? 'text-amber-400' : 'text-amber-600'
                                }`}>
                                  {format(lineTotal)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* ── Swipe Delete Zone ── */}
                          <div
                            className="flex-shrink-0 flex items-center justify-center bg-red-500 rounded-2xl ml-2"
                            style={{ width: 68 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveItem(index);
                              setRevealedIndex(null);
                            }}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <Trash2 size={18} className="text-white" />
                              <span className="text-[9px] font-black text-white uppercase tracking-wide">Hapus</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer (flex-shrink-0, always visible) ── */}
            <div className={`flex-shrink-0 border-t px-4 py-4 ${isDark ? 'border-stone-800/70 bg-stone-950' : 'border-gray-200 bg-white'}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className={`text-[11px] uppercase tracking-[0.24em] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Total pesanan</p>
                  <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{format(quote.grandTotal)}</p>
                </div>
                <div className={`rounded-3xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-sm ${isDark ? 'bg-stone-900 text-amber-400 shadow-amber-500/10' : 'bg-amber-50 text-amber-600 shadow-amber-500/5'}`}>
                  {itemCount} item
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onQuickPay}
                  disabled={!canPay}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black uppercase tracking-wide transition-all active:scale-[0.97] ${
                    canPay
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:opacity-95'
                      : isDark
                        ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Zap size={15} /> Pay
                </button>
                <button
                  type="button"
                  onClick={onCheckout}
                  disabled={!canPay}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-black uppercase tracking-wide transition-all active:scale-[0.97] ${
                    canPay
                      ? isDark
                        ? 'border-amber-500 text-amber-300 hover:bg-amber-500/10'
                        : 'border-amber-500 text-amber-600 hover:bg-amber-50'
                      : isDark
                        ? 'border-stone-800 text-stone-600 cursor-not-allowed'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ReceiptText size={15} /> Checkout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
