import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, FlatList, useWindowDimensions, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, TrendingUp, Flame, Award, PlusCircle, Package, Menu } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getColors } from '../../utils/theme';
import { usePOSCart } from '../../contexts/POSCartContext';
import { useProductCatalog } from '../../hooks/useProductCatalog';
import { useCategoryCarousels } from '../../hooks/useCategoryCarousels';
import ProductCard from './ProductCard';
import CategoryCarousel from './CategoryCarousel';
import FloatingCart from './FloatingCart';
import CartPanel from './CartPanel';
import CartItem from './CartItem';
import CartItemEditModal from './CartItemEditModal';
import AddManualItemModal from './AddManualItemModal';
import CheckoutSheet from './CheckoutSheet';
import PaymentScreen from './PaymentScreen';
import PaymentSuccessScreen from './PaymentSuccessScreen';
import SidebarModal from './SidebarModal';
import type { CartItemWithInput, Transaction } from '../../types';

// ─── Trending period options ────────────────────────────────────────────────────

const TRENDING_PERIODS = [
  { label: '1 Hari', value: 1 },
  { label: '2 Hari', value: 2 },
  { label: '3 Hari', value: 3 },
  { label: '7 Hari', value: 7 },
  { label: '30 Hari', value: 30 },
];

export default function POSScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

  const { products, transactions, categories, checkout: appCheckout } = useApp();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const {
    cart, addToCart, removeFromCart, removeAtIndex, updateQuantity,
    updateCartItem, addCustomItem, clearCart,
    checkout: checkoutData, resetCheckout,
    panel, setPanel,
    editingItemIndex, setEditingItemIndex,
    subtotal, taxAmount, total, cartIsEmpty, totalQuantity,
  } = usePOSCart();

  // ── Catalog state ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [bestSellerPeriod, setBestSellerPeriod] = useState(3);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [categoryModal, setCategoryModal] = useState<null | { title: string; products: any[] }>(null);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  // ── Product catalog (with sorting and analytics) ──────────────────────────
  const { sortedProducts, promoProductsCount, bestSellerCount } = useProductCatalog(
    products, transactions, search, selectedCategory, bestSellerPeriod
  );
  const categoryCarousels = useCategoryCarousels(
    products, transactions, bestSellerPeriod, search
  );

  // ── Cart quantity lookup ──────────────────────────────────────────────────
  const getCartQty = useCallback((productId: string) =>
    cart.find(i => i.productId === productId)?.quantity || 0,
    [cart]
  );

  // ── Edit item ─────────────────────────────────────────────────────────────
  const editingItem = editingItemIndex !== null ? cart[editingItemIndex] : null;

  const handleEditSave = useCallback((updatedItem: CartItemWithInput) => {
    if (editingItemIndex !== null) {
      updateCartItem(editingItemIndex, updatedItem);
      setEditingItemIndex(null);
    }
  }, [editingItemIndex, updateCartItem, setEditingItemIndex]);

  const handleEditRemove = useCallback(() => {
    if (editingItemIndex !== null) {
      removeAtIndex(editingItemIndex);
      setEditingItemIndex(null);
    }
  }, [editingItemIndex, removeAtIndex, setEditingItemIndex]);

  // ── Manual item ───────────────────────────────────────────────────────────
  const handleManualAdd = useCallback((item: CartItemWithInput) => {
    addCustomItem(item);
    setShowManualModal(false);
  }, [addCustomItem]);

  const handleManualQuickPay = useCallback((item: CartItemWithInput) => {
    addCustomItem(item);
    setShowManualModal(false);
    setShowPaymentModal(true);
  }, [addCustomItem]);

  // ── Quick Pay ─────────────────────────────────────────────────────────────
  const handleQuickPay = useCallback(() => {
    if (cartIsEmpty) return;
    setShowCartModal(false);
    setShowPaymentModal(true);
  }, [cartIsEmpty]);

  // ── Checkout flow ─────────────────────────────────────────────────────────
  const handleCheckout = useCallback(() => {
    if (cartIsEmpty) return;
    setShowCartModal(false);
    setShowCheckoutSheet(true);
  }, [cartIsEmpty]);

  const handleProceedPayment = useCallback(() => {
    setShowCheckoutSheet(false);
    setShowPaymentModal(true);
  }, []);

  // ── Edit item from cart ───────────────────────────────────────────────────
  const handleEditItem = useCallback((index: number) => {
    setEditingItemIndex(index);
  }, [setEditingItemIndex]);

  // ══════════════════════════════════════════════════════════════════════════
  // SEARCH BAR
  // ══════════════════════════════════════════════════════════════════════════
  const renderSearchBar = () => (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 16, marginBottom: 10, marginTop: 8,
    }}>
      <View style={{
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: c.bgCard, borderWidth: 2, borderColor: c.borderLight,
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
        maxWidth: isLandscape ? 520 : undefined,
      }}>
        <Search size={16} color={c.textSecondary} strokeWidth={2} />
        <TextInput
          placeholder="Cari menu..."
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, color: c.text, fontSize: 14, fontWeight: '500' }}
        />
      </View>

      {/* Manual item button (portrait) */}
      {!isLandscape && (
        <TouchableOpacity
          onPress={() => setShowManualModal(true)}
          style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <PlusCircle size={18} color={c.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TRENDING + PROMO BAR
  // ══════════════════════════════════════════════════════════════════════════
  const renderTrendingBar = () => (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, marginBottom: 12, marginTop: 4,
    }}>
      {/* Trending selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {TRENDING_PERIODS.map(p => {
          const isActive = bestSellerPeriod === p.value;
          return (
            <TouchableOpacity
              key={p.value}
              onPress={() => setBestSellerPeriod(p.value)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: isActive ? c.accentBg : c.bgCard,
                borderWidth: 1,
                borderColor: isActive
                  ? (isDark ? 'rgba(245,158,11,0.3)' : 'rgba(13,148,136,0.3)')
                  : c.borderLight,
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
              }}
            >
              {isActive && <TrendingUp size={10} color={c.accent} strokeWidth={2} />}
              <Text style={{
                color: isActive ? c.accent : c.textSecondary,
                fontSize: 11, fontWeight: isActive ? '700' : '500',
              }}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Promo + BestSeller badges */}
      <View style={{ flexDirection: 'row', gap: 6, marginLeft: 8 }}>
        {promoProductsCount > 0 && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 3,
            backgroundColor: c.errorBg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
          }}>
            <Flame size={9} color={c.error} strokeWidth={2} />
            <Text style={{ color: c.error, fontSize: 9, fontWeight: '900' }}>{promoProductsCount}</Text>
          </View>
        )}
        {bestSellerCount > 0 && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 3,
            backgroundColor: c.accentBg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
          }}>
            <Award size={9} color={c.accent} strokeWidth={2} />
            <Text style={{ color: c.accent, fontSize: 9, fontWeight: '900' }}>{bestSellerCount}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY PILLS (landscape only)
  // ══════════════════════════════════════════════════════════════════════════
  const renderCategoryPills = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
    >
      {['Semua', ...(categories || [])].map(cat => {
        const isActive = selectedCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={{
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
              backgroundColor: isActive ? c.accent : c.bgCard,
              borderWidth: isActive ? 0 : 1, borderColor: c.borderLight,
            }}
          >
            <Text style={{
              color: isActive ? c.textInverse : c.textSecondary,
              fontSize: 12, fontWeight: isActive ? '900' : '600',
            }}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PORTRAIT CART MODAL (bottom sheet style)
  // ══════════════════════════════════════════════════════════════════════════
  const renderPortraitCartModal = () => (
    <Modal visible={showCartModal} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowCartModal(false)}
        />
        <View style={{
          backgroundColor: c.bgCard,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: '85%',
          borderWidth: 1, borderColor: c.border,
        }}>
          <CartPanel
            onManualItem={() => { setShowCartModal(false); setShowManualModal(true); }}
            onEditItem={(idx) => { setShowCartModal(false); handleEditItem(idx); }}
            onCheckout={() => handleCheckout()}
            onQuickPay={() => handleQuickPay()}
          />
        </View>
      </View>
    </Modal>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PORTRAIT LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  if (!isLandscape) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
        {/* Header with navbar: left menu, title, right logo+shop name */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
        }}>
          <TouchableOpacity
            onPress={() => setShowSidebar(true)}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Menu size={20} color={c.text} strokeWidth={2} />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '900', color: c.text, letterSpacing: -0.5 }}>
            Menu <Text style={{ color: c.accent }}>Explorer</Text>
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {user?.shop?.logo_url ? (
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
                overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: c.accent, fontSize: 14, fontWeight: '900' }}>
                  {user?.shop?.name?.charAt(0) || 'S'}
                </Text>
              </View>
            ) : (
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.borderLight,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: c.accent, fontSize: 14, fontWeight: '900' }}>
                  {user?.shop?.name?.charAt(0) || 'S'}
                </Text>
              </View>
            )}
            <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
              {user?.shop?.name || 'Toko'}
            </Text>
          </View>
        </View>

        {renderSearchBar()}
        {renderTrendingBar()}

        {/* Category carousels */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: cartIsEmpty ? 20 : 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {categoryCarousels.length === 0 ||
            categoryCarousels.every(cr => cr.products.length === 0) ? (
            <View style={{
              alignItems: 'center', justifyContent: 'center',
              paddingVertical: 80, paddingHorizontal: 20,
            }}>
              <Package size={48} color={c.textMuted} strokeWidth={1.5} />
              <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '600', marginTop: 12 }}>
                {search ? 'Tidak ada hasil pencarian' : 'Tidak ada produk'}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                {search ? `Coba kata kunci lain "${search}"` : 'Produk akan muncul di sini'}
              </Text>
            </View>
          ) : (
            categoryCarousels
              .filter(cr => cr.products.length > 0)
              .map(cr => (
                <CategoryCarousel
                  key={cr.categoryName}
                  carousel={cr}
                  onViewAll={(carousel) => setCategoryModal({ title: carousel.categoryName, products: carousel.products })}
                />
              ))
          )}
        </ScrollView>

        {/* Floating cart */}
        <FloatingCart onPress={() => setShowCartModal(true)} />

        <SidebarModal
          visible={showSidebar}
          onClose={() => setShowSidebar(false)}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setShowSidebar(false);
            const found = categoryCarousels.find(cr => cr.categoryName === cat);
            if (found && !isLandscape) setCategoryModal({ title: cat, products: found.products });
          }}
        />

        {/* Category modal shown when user taps Lihat Semua */}
        {categoryModal && (
          <Modal visible animationType="slide">
            <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: c.text }}>{categoryModal.title}</Text>
                <TouchableOpacity onPress={() => setCategoryModal(null)}>
                  <Text style={{ color: c.accent, fontWeight: '800' }}>Tutup</Text>
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 12 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {categoryModal.products.map((p) => (
                    <View key={p.id} style={{ width: '50%' }}>
                      <ProductCard
                        product={p}
                        onAdd={addToCart}
                        onRemove={(id) => removeFromCart(id)}
                        cartQuantity={getCartQty(p.id)}
                        variant="full"
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}

        {/* Portrait cart modal */}
        {renderPortraitCartModal()}

        {/* Modals */}
        <AddManualItemModal
          visible={showManualModal}
          onClose={() => setShowManualModal(false)}
          onAdd={handleManualAdd}
          onQuickPay={handleManualQuickPay}
        />

        {editingItem && (
          <CartItemEditModal
            visible={editingItemIndex !== null}
            item={editingItem}
            onSave={handleEditSave}
            onRemove={handleEditRemove}
            onClose={() => setEditingItemIndex(null)}
          />
        )}

        <CheckoutSheet
          visible={showCheckoutSheet}
          onClose={() => setShowCheckoutSheet(false)}
          onProceedPayment={handleProceedPayment}
        />

        {showPaymentModal && (
          <Modal visible={showPaymentModal} animationType="slide">
            <PaymentScreen
              onClose={() => setShowPaymentModal(false)}
              onSuccess={(tx) => {
                setShowPaymentModal(false);
                setShowCartModal(false);
                setShowCheckoutSheet(false);
                if (tx) {
                  setCompletedTransaction(tx);
                  setShowSuccessModal(true);
                }
              }}
            />
          </Modal>
        )}

        {showSuccessModal && (
          <Modal visible={showSuccessModal} animationType="slide">
            <PaymentSuccessScreen
              transaction={completedTransaction || undefined}
              onClose={() => setShowSuccessModal(false)}
            />
          </Modal>
        )}
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LANDSCAPE LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <View style={{ flex: 1, flexDirection: 'row', gap: 12, padding: 12 }}>
        {/* LEFT — Product Grid */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <Text style={{
            fontSize: 20, fontWeight: '900', color: c.text, letterSpacing: -0.5,
            marginBottom: 8, paddingHorizontal: 4,
          }}>
            Menu <Text style={{ color: c.accent }}>Explorer</Text>
          </Text>

          {renderSearchBar()}
          {renderCategoryPills()}
          {renderTrendingBar()}

          {/* Product grid */}
          <FlatList
            data={sortedProducts}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Package size={40} color={c.textMuted} strokeWidth={1.5} />
                <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 10 }}>
                  {search ? 'Tidak ada hasil' : 'Tidak ada produk'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onAdd={addToCart}
                onRemove={(id) => removeFromCart(id)}
                cartQuantity={getCartQty(item.id)}
                variant="full"
              />
            )}
          />
        </View>

        {/* RIGHT — Cart Panel */}
        <View style={{ width: windowWidth * 0.28, maxWidth: 320, minWidth: 220 }}>
          <CartPanel
            onManualItem={() => setShowManualModal(true)}
            onEditItem={handleEditItem}
            onCheckout={handleCheckout}
            onQuickPay={handleQuickPay}
          />
        </View>
      </View>

      {/* Modals */}
      <AddManualItemModal
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
        onAdd={handleManualAdd}
        onQuickPay={handleManualQuickPay}
      />

      {editingItem && (
        <CartItemEditModal
          visible={editingItemIndex !== null}
          item={editingItem}
          onSave={handleEditSave}
          onRemove={handleEditRemove}
          onClose={() => setEditingItemIndex(null)}
        />
      )}

      <CheckoutSheet
        visible={showCheckoutSheet}
        onClose={() => setShowCheckoutSheet(false)}
        onProceedPayment={handleProceedPayment}
      />

      {showPaymentModal && (
        <Modal visible={showPaymentModal} animationType="slide">
          <PaymentScreen
            onClose={() => setShowPaymentModal(false)}
            onSuccess={(tx) => {
              setShowPaymentModal(false);
              setShowCartModal(false);
              setShowCheckoutSheet(false);
              if (tx) {
                setCompletedTransaction(tx);
                setShowSuccessModal(true);
              }
            }}
          />
        </Modal>
      )}

      {showSuccessModal && (
        <Modal visible={showSuccessModal} animationType="slide">
          <PaymentSuccessScreen
            transaction={completedTransaction || undefined}
            onClose={() => setShowSuccessModal(false)}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}
