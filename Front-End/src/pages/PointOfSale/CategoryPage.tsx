import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../contexts/AppContext.tsx';
import { useTheme } from '../../contexts/ThemeContext.tsx';
import { useCart } from '../../contexts/CartContext.tsx';
import MobileCart from '../../components/pos/MobileCart.tsx';
import { MobileProductCard } from '../../components/pos/MobileCategoryCarousel.tsx';
import CartItemEditPanel from '../../components/pos/CartItemEditPanel.tsx';
import type { CartItemWithInput } from '../../types/index.ts';
import { getRecentSalesMapByPeriod } from '../../utils/analytics/productAnalytics.ts';

export default function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const { products, transactions } = useApp();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { cart, addToCart, removeFromCart, updateCartItem, clearCart } = useCart();
  const [sheetState, setSheetState] = useState<'collapsed' | 'peek' | 'expanded'>('collapsed');
  const [panel, setPanel] = useState<'cart' | 'edit'>('cart');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const decodedCategory = decodeURIComponent(categoryName || '');
  const [bestSellerPeriod] = useState<number>(() => {
    const saved = localStorage.getItem('posBestSellerPeriod');
    return saved ? parseInt(saved, 10) : 3;
  });

  const salesMap = useMemo(() => {
    return getRecentSalesMapByPeriod(transactions, bestSellerPeriod);
  }, [transactions, bestSellerPeriod]);

  const categoryProducts = useMemo(() => {
    return products
      .filter(product =>
        (decodedCategory === 'Semua' || product.category === decodedCategory) && product.isAvailable !== false
      )
      .map(product => ({
        ...product,
        recentSalesCount: salesMap.get(product.id) || 0
      }));
  }, [products, decodedCategory, salesMap]);

  const sortedProducts = useMemo(() => {
    return [...categoryProducts].sort((a, b) => {
      const delta = (b.recentSalesCount || 0) - (a.recentSalesCount || 0);
      return delta !== 0 ? delta : a.name.localeCompare(b.name);
    });
  }, [categoryProducts]);

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    addToCart(product);
  };

  const handleSaveCartItem = (updatedItem: CartItemWithInput) => {
    if (editingItemIndex === null) return;
    updateCartItem(editingItemIndex, updatedItem);
    setEditingItemIndex(null);
    setPanel('cart');
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setPanel('edit');
  };

  const quote = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const variantPrice = item.variantPrice || 0;
      return sum + (item.price + variantPrice) * item.quantity;
    }, 0);
    return {
      subtotal,
      tax: 0,
      serviceCharge: 0,
      grandTotal: subtotal,
      taxRate: 0,
    };
  }, [cart]);

  const canPay = cart.length > 0;

  return (
    <div className={`${isDark ? 'bg-stone-950 text-white' : 'bg-white text-gray-900'} min-h-screen pb-28`}>
      <div className={`flex items-center gap-3 p-4 border-b ${isDark ? 'border-stone-800' : 'border-gray-200'} ${isDark ? 'bg-stone-950' : 'bg-white'}`}>
        <button
          type="button"
          onClick={() => navigate('/pos')}
          className={`p-2 rounded-2xl ${isDark ? 'bg-stone-800 text-stone-200' : 'bg-gray-100 text-gray-900'}`}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-black text-base tracking-tight">{decodedCategory || 'Kategori'}</h1>
          <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{sortedProducts.length} produk</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pb-28">
        {sortedProducts.map((product, index) => (
          <MobileProductCard
            key={product.id}
            product={product}
            isDark={isDark}
            onAdd={() => handleAddToCart(product.id)}
            rank={index < 3 ? index + 1 : undefined}
          />
        ))}
      </div>

      {cart.length > 0 && panel === 'cart' && (
        <MobileCart
          cart={cart}
          quote={quote}
          sheetState={sheetState}
          isDark={isDark}
          canPay={canPay}
          onOpen={() => setSheetState('peek')}
          onClose={() => setSheetState('collapsed')}
          onQuickPay={() => navigate('/pos')}
          onCheckout={() => navigate('/pos')}
          onEditItem={handleEditItem}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onUpdateQuantity={(index, delta) => {
            const item = cart[index];
            if (!item) return;
            const nextQuantity = item.quantity + delta;
            if (nextQuantity <= 0) return;
            updateCartItem(index, { ...item, quantity: nextQuantity });
          }}
          showManualButton={false}
        />
      )}

      {panel === 'edit' && editingItemIndex !== null && cart[editingItemIndex] && (
        <div className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center p-4`}> 
          <div className={`w-full max-w-md rounded-t-3xl overflow-hidden border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-gray-200'}`}> 
            <CartItemEditPanel
              item={cart[editingItemIndex]}
              itemIndex={editingItemIndex}
              onSave={handleSaveCartItem}
              onRemove={() => {
                removeFromCart(editingItemIndex);
                setEditingItemIndex(null);
                setPanel('cart');
              }}
              onClose={() => {
                setEditingItemIndex(null);
                setPanel('cart');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
