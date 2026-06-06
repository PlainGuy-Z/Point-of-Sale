import React, { useState, useCallback, useContext, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, FlatList, useWindowDimensions, Modal, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, TrendingUp, Flame, Award, PlusCircle, Package, Menu, ChevronDown, SlidersHorizontal, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useProducts, useTransactions, useSettings } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { SidebarContext } from '../../contexts/SidebarContext';
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
import type { CartItemWithInput, Transaction, Product } from '../../types';

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

  const { products, categories } = useProducts();
  const { transactions, checkout: appCheckout } = useTransactions();
  const { serviceError, refreshState, isServiceLoading } = useSettings();
  const { user, isCashier } = useAuth();
  const { activeShift } = useShift();
  const { openSidebar } = useContext(SidebarContext);
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
  const [showTrendingDropdown, setShowTrendingDropdown] = useState(false);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showShiftValidationModal, setShowShiftValidationModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState<null | { title: string; products: any[] }>(null);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [landscapeGridWidth, setLandscapeGridWidth] = useState(0);

  // ── Product catalog (with sorting and analytics) ──────────────────────────
  const { sortedProducts, promoProductsCount, bestSellerCount } = useProductCatalog(
    products, transactions, search, selectedCategory, bestSellerPeriod
  );
  const categoryCarousels = useCategoryCarousels(
    products, transactions, bestSellerPeriod, search
  );

  // ── Cart quantity lookup ──────────────────────────────────────────────────
  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach(item => {
      map[item.productId] = (map[item.productId] || 0) + item.quantity;
    });
    return map;
  }, [cart]);

  const getCartQty = useCallback((productId: string) =>
    cartQuantities[productId] || 0,
    [cartQuantities]
  );

  const handleAddToCart = useCallback((product: Product) => {
    addToCart(product);
  }, [addToCart]);

  const handleRemoveFromCart = useCallback((productId: string) => {
    removeFromCart(productId);
  }, [removeFromCart]);

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

    if (isCashier && !activeShift) {
      setShowShiftValidationModal(true);
      return;
    }

    setShowPaymentModal(true);
  }, [addCustomItem, isCashier, activeShift]);

  // ── Quick Pay ─────────────────────────────────────────────────────────────
  const handleQuickPay = useCallback(() => {
    if (cartIsEmpty) return;

    if (isCashier && !activeShift) {
      setShowShiftValidationModal(true);
      return;
    }

    setShowCartModal(false);
    setShowPaymentModal(true);
  }, [cartIsEmpty, isCashier, activeShift]);

  // ── Checkout flow ─────────────────────────────────────────────────────────
  const handleCheckout = useCallback(() => {
    if (cartIsEmpty) return;

    // Validate shift for cashier
    if (isCashier && !activeShift) {
      setShowShiftValidationModal(true);
      return;
    }

    setShowCartModal(false);
    setShowCheckoutSheet(true);
  }, [cartIsEmpty, isCashier, activeShift]);

  const handleProceedPayment = useCallback(() => {
    setShowCheckoutSheet(false);
    setShowPaymentModal(true);
  }, []);

  // ── Edit item from cart ───────────────────────────────────────────────────
  const handleEditItem = useCallback((index: number) => {
    setEditingItemIndex(index);
  }, [setEditingItemIndex]);

  // ── Initial Loading State ──────────────────────────────────────────────────
  if (products.length === 0 && isServiceLoading && !serviceError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={c.accent} />
        <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 16 }}>
          Memuat menu dan data POS...
        </Text>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── Network Error UI ──────────────────────────────────────────────────────
  const renderNetworkError = () => (
    <View style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: c.bg,
    }}>
      <View style={{
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fca5a5',
      }}>
        <AlertCircle size={40} color={c.error} strokeWidth={2} />
      </View>
      
      <Text style={{ fontSize: 20, fontWeight: '900', color: c.text, marginBottom: 8, textAlign: 'center' }}>
        Koneksi Server Gagal
      </Text>
      
      <Text style={{ fontSize: 13, color: c.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 300 }}>
        Aplikasi tidak dapat menghubungi server backend. Pastikan server menyala dan terhubung ke jaringan yang sama.
      </Text>
      
      {serviceError && (
        <View style={{
          backgroundColor: c.bgCard,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          padding: 12,
          marginBottom: 24,
          width: '100%',
          maxWidth: 320,
        }}>
          <Text style={{ fontSize: 10, color: c.textMuted, fontFamily: 'monospace', textAlign: 'center' }}>
            {serviceError}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => refreshState()}
        disabled={isServiceLoading}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: c.accent,
          paddingVertical: 14,
          paddingHorizontal: 32,
          borderRadius: 14,
          width: '100%',
          maxWidth: 240,
          shadowColor: c.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {isServiceLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Coba Hubungkan Kembali</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // SEARCH BAR
  // ══════════════════════════════════════════════════════════════════════════
  const renderSearchBar = () => (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: isLandscape ? 8 : 16, marginBottom: isLandscape ? 4 : 6, marginTop: isLandscape ? 0 : 2,
    }}>
      <View style={{
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: c.bgCard, borderWidth: 2, borderColor: c.borderLight,
        borderRadius: 20, paddingHorizontal: isLandscape ? 10 : 14, paddingVertical: isLandscape ? 7 : 10, gap: 8,
        maxWidth: isLandscape ? 320 : undefined,
      }}>
        <Search size={isLandscape ? 14 : 16} color={c.textSecondary} strokeWidth={2} />
        <TextInput
          placeholder="Cari menu..."
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, color: c.text, fontSize: isLandscape ? 12 : 14, fontWeight: '500' }}
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

      {/* Category filter button (portrait) */}
      {!isLandscape && (
        <TouchableOpacity
          onPress={() => setShowSidebar(true)}
          style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <SlidersHorizontal size={18} color={c.textSecondary} strokeWidth={2} />
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
      paddingHorizontal: isLandscape ? 8 : 16, marginBottom: isLandscape ? 4 : 6, marginTop: isLandscape ? 0 : 2,
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
      contentContainerStyle={{ paddingHorizontal: 8, gap: 6, paddingTop: 8, paddingBottom: 8, alignItems: 'center' }}
      style={{ height: 46, marginBottom: 6, flexGrow: 0, flexShrink: 0 }}
    >
      {['Semua', ...(categories || [])].map(cat => {
        const isActive = selectedCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={{
              height: 28,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: isActive ? c.accent : c.bgCard,
              borderWidth: isActive ? 0 : 1,
              borderColor: c.borderLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: isActive ? c.textInverse : c.textSecondary,
                fontSize: 11,
                fontWeight: isActive ? '900' : '600',
                includeFontPadding: false,
                textAlignVertical: 'center',
              }}
            >
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowCartModal(false)}
          />
          <View style={{
            backgroundColor: c.bgCard,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            height: '75%',
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
      </GestureHandlerRootView>
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
          paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4,
        }}>
          {!isCashier ? (
            <TouchableOpacity
              onPress={openSidebar}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={20} color={c.text} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}

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
                <Image
                  source={{ uri: user.shop.logo_url.startsWith('http') ? user.shop.logo_url : `${process.env.EXPO_PUBLIC_API_URL}${user.shop.logo_url}` }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
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

        {products.length === 0 && serviceError ? (
          renderNetworkError()
        ) : (
          /* Category carousels */
          <View style={{ flex: 1 }}>
            {categoryCarousels.length === 0 ||
              categoryCarousels.every(cr => cr.products.length === 0) ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingTop: 10,
                  paddingBottom: cartIsEmpty ? 20 : 100,
                }}
                showsVerticalScrollIndicator={true}
              >
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
              </ScrollView>
            ) : (
              <FlashList
                data={categoryCarousels.filter(cr => cr.products.length > 0)}
                // @ts-ignore
                estimatedItemSize={220}
                renderItem={({ item }) => (
                  <CategoryCarousel
                    carousel={item}
                    cartQuantities={cartQuantities}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    onViewAll={(carousel) => setCategoryModal({ title: carousel.categoryName, products: carousel.products })}
                  />
                )}
                keyExtractor={item => item.categoryName}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingTop: 10,
                  paddingBottom: cartIsEmpty ? 20 : 100,
                }}
              />
            )}
          </View>
        )}

        {/* Floating cart */}
        <FloatingCart onPress={() => setShowCartModal(true)} />

        <SidebarModal
          visible={showSidebar}
          onClose={() => setShowSidebar(false)}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setShowSidebar(false);
            
            // Filter all available products for the selected category
            const filtered = products.filter(p => {
              const isAvailable = p.isAvailable !== false && p.stock !== 0;
              if (!isAvailable) return false;
              
              const matchesCategory = cat === 'Semua' || p.category === cat;
              const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
              
              return matchesCategory && matchesSearch;
            });

            // Sort products (Promo first, then alphabetical)
            const sorted = [...filtered].sort((a, b) => {
              const aPromo = a.isPromo && a.promoPrice ? 1 : 0;
              const bPromo = b.isPromo && b.promoPrice ? 1 : 0;
              if (bPromo !== aPromo) return bPromo - aPromo;
              return a.name.localeCompare(b.name);
            });

            if (!isLandscape) {
              setCategoryModal({ title: cat, products: sorted });
            }
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
              <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {categoryModal.products.map((p) => (
                    <View key={p.id} style={{ width: '50%' }}>
                      <ProductCard
                        product={p}
                        onAdd={addToCart}
                        onRemove={removeFromCart}
                        cartQuantity={getCartQty(p.id)}
                        variant="full"
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>
              {/* FloatingCart inside category modal so user can access cart */}
              <FloatingCart onPress={() => { setCategoryModal(null); setShowCartModal(true); }} />
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
          <Modal visible={showPaymentModal} animationType="fade" transparent={true}>
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
          <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
            <PaymentSuccessScreen
              transaction={completedTransaction || undefined}
              onClose={() => setShowSuccessModal(false)}
            />
          </Modal>
        )}

        {showShiftValidationModal && (
          <Modal visible={showShiftValidationModal} transparent animationType="fade">
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: 16,
            }}>
              <View style={{
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 16,
                padding: 24,
                maxWidth: 320,
                alignItems: 'center',
              }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <AlertCircle size={28} color={c.error} strokeWidth={1.5} />
                </View>

                <Text style={{
                  color: c.text,
                  fontSize: 16,
                  fontWeight: '900',
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                  Buka Shift Terlebih Dahulu
                </Text>

                <Text style={{
                  color: c.textSecondary,
                  fontSize: 13,
                  textAlign: 'center',
                  lineHeight: 20,
                  marginBottom: 20,
                }}>
                  Anda harus membuka shift sebelum melakukan transaksi. Catat modal awal kas di laci.
                </Text>

                <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                  <TouchableOpacity
                    onPress={() => setShowShiftValidationModal(false)}
                    style={{
                      flex: 1,
                      backgroundColor: c.bgInput,
                      borderWidth: 1,
                      borderColor: c.border,
                      borderRadius: 8,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      color: c.text,
                      fontWeight: '600',
                      fontSize: 13,
                    }}>
                      Batalkan
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowShiftValidationModal(false);
                      router.push('/shift');
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: c.accent,
                      borderRadius: 8,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      color: c.textInverse,
                      fontWeight: '800',
                      fontSize: 13,
                    }}>
                      Buka Shift
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LANDSCAPE LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top > 0 ? Math.max(insets.top - 10, 6) : 8}}>
      <View style={{ flex: 1, flexDirection: 'row', gap: 14, paddingHorizontal: 6, paddingVertical: 2 }}>
        {/* LEFT — Product Grid */}
        <View 
          style={{ flex: 2, minWidth: 0 }}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - landscapeGridWidth) > 5) {
              setLandscapeGridWidth(w);
            }
          }}
        >
          {/* Header Row */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
            marginBottom: 4,
            marginTop: 0,
          }}>
            <Text style={{
              fontSize: 16, fontWeight: '900', color: c.text, letterSpacing: -0.5,
            }}>
              Menu <Text style={{ color: c.accent }}>Explorer</Text>
            </Text>

            {/* Small Compact Search Bar */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
              borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, gap: 6,
              width: 180,
            }}>
              <Search size={12} color={c.textSecondary} strokeWidth={2} />
              <TextInput
                placeholder="Cari menu..."
                placeholderTextColor={c.textMuted}
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, color: c.text, fontSize: 11, fontWeight: '500', padding: 0 }}
              />
            </View>
          </View>

          {/* Categories Carousel */}
          {renderCategoryPills()}

          {/* Trending Bar with single Border selector & Promo Badge */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
            marginBottom: 6,
            marginTop: 0,
            position: 'relative',
            zIndex: 50,
          }}>
            {/* Single Border Trending Dropdown */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                onPress={() => setShowTrendingDropdown(!showTrendingDropdown)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: c.bgCard,
                  borderWidth: 1,
                  borderColor: c.border,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
              >
                <TrendingUp size={11} color={c.accent} strokeWidth={2} />
                <Text style={{
                  color: c.textSecondary,
                  fontSize: 11,
                  fontWeight: '700',
                }}>
                  Trend: {bestSellerPeriod} Hari (Estimasi Lokal)
                </Text>
                <ChevronDown size={11} color={c.textSecondary} />
              </TouchableOpacity>

              {showTrendingDropdown && (
                <View style={{
                  position: 'absolute',
                  top: 28,
                  left: 0,
                  backgroundColor: c.bgCard,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 10,
                  padding: 4,
                  width: 120,
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 5,
                  zIndex: 100,
                }}>
                  {TRENDING_PERIODS.map(p => (
                    <TouchableOpacity
                      key={p.value}
                      onPress={() => {
                        setBestSellerPeriod(p.value);
                        setShowTrendingDropdown(false);
                      }}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        backgroundColor: bestSellerPeriod === p.value ? c.accentBg : 'transparent',
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{
                        color: bestSellerPeriod === p.value ? c.accent : c.textSecondary,
                        fontSize: 11,
                        fontWeight: '600',
                      }}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Promo Text Badge (Shown if and only if promo products count > 0) */}
            {promoProductsCount > 0 && (
              <View style={{
                backgroundColor: c.errorBg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: c.error,
              }}>
                <Text style={{
                  color: c.error,
                  fontSize: 9,
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  promo
                </Text>
              </View>
            )}
          </View>

          {/* Product grid - 4 Columns in Landscape */}
          {products.length === 0 && serviceError ? (
            renderNetworkError()
          ) : (
            <FlatList
              data={sortedProducts}
              style={{ flex: 1 }}
              refreshControl={<RefreshControl refreshing={isServiceLoading} onRefresh={refreshState} />}
              keyExtractor={item => item.id}
              numColumns={4}
              key={`landscape-grid-4-cols-${Math.floor(landscapeGridWidth)}`}
              contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 12 }}
              columnWrapperStyle={{ justifyContent: 'flex-start' }}
              showsVerticalScrollIndicator={true}
              initialNumToRender={8}
              maxToRenderPerBatch={4}
              windowSize={3}
              removeClippedSubviews={true}
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
                  onRemove={removeFromCart}
                  cartQuantity={getCartQty(item.id)}
                  variant="full"
                />
              )}
            />
          )}
        </View>

        {/* RIGHT — Cart Panel with fixed 1:3 screen width & Inline Modals */}
        <View style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderLeftWidth: 1,
          borderLeftColor: c.borderLight,
        }}>
          <CartPanel
            onManualItem={() => setShowManualModal(true)}
            onEditItem={handleEditItem}
            onCheckout={handleCheckout}
            onQuickPay={handleQuickPay}
          />

          {/* Inline Modals for Landscape (rendered overlaying the Cart area) */}
          <AddManualItemModal
            visible={showManualModal}
            onClose={() => setShowManualModal(false)}
            onAdd={handleManualAdd}
            onQuickPay={handleManualQuickPay}
            inline={true}
          />

          {editingItem && (
            <CartItemEditModal
              visible={editingItemIndex !== null}
              item={editingItem}
              onSave={handleEditSave}
              onRemove={handleEditRemove}
              onClose={() => setEditingItemIndex(null)}
              inline={true}
            />
          )}

          <CheckoutSheet
            visible={showCheckoutSheet}
            onClose={() => setShowCheckoutSheet(false)}
            onProceedPayment={handleProceedPayment}
            inline={true}
          />
        </View>
      </View>

      {/* Payment Modals (always modal sheets) */}
      {showPaymentModal && (
        <Modal visible={showPaymentModal} animationType="fade" transparent={true}>
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
        <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
          <PaymentSuccessScreen
            transaction={completedTransaction || undefined}
            onClose={() => setShowSuccessModal(false)}
          />
        </Modal>
      )}

      {/* Shift Validation Modal */}
      {showShiftValidationModal && (
        <Modal visible={showShiftValidationModal} transparent animationType="fade">
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 16,
          }}>
            <View style={{
              backgroundColor: c.bgCard,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 16,
              padding: 24,
              maxWidth: 320,
              alignItems: 'center',
            }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <AlertCircle size={28} color={c.error} strokeWidth={1.5} />
              </View>

              <Text style={{
                color: c.text,
                fontSize: 16,
                fontWeight: '900',
                textAlign: 'center',
                marginBottom: 8,
              }}>
                Buka Shift Terlebih Dahulu
              </Text>

              <Text style={{
                color: c.textSecondary,
                fontSize: 13,
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 20,
              }}>
                Anda harus membuka shift sebelum melakukan transaksi. Catat modal awal kas di laci.
              </Text>

              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity
                  onPress={() => setShowShiftValidationModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: c.bgInput,
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: c.text,
                    fontWeight: '600',
                    fontSize: 13,
                  }}>
                    Batalkan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowShiftValidationModal(false);
                    router.push('/shift');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: c.accent,
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: c.textInverse,
                    fontWeight: '800',
                    fontSize: 13,
                  }}>
                    Buka Shift
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
