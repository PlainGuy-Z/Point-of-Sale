import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ShoppingCart, TrendingUp, Percent, Award, Menu } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';
import ProductCard from './ProductCard';
import { useSidebar } from '../../app/(owner)/_layout';
import type { CartItemWithInput, Product } from '../../types';

export default function POSScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { products, categories } = useApp();
  const { openSidebar } = useSidebar();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  
  const items: CartItemWithInput[] = (global as any).__posCart || [];
  const setItems = (global as any).__posSetCart || (() => {});
  
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const addToCart = (product: Product) => {
    setItems((prev: CartItemWithInput[]) => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      const newItem: CartItemWithInput = {
        productId: product.id,
        name: product.name,
        price: product.isPromo && product.promoPrice ? product.promoPrice : product.price,
        quantity: 1,
        isPromo: product.isPromo || false,
        image: product.image ?? undefined
      };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev: CartItemWithInput[]) => {
      const existing = prev.find(i => i.productId === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.productId !== productId);
    });
  };

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const promoCount = (products || []).filter(p => p.isPromo && p.stock !== 0).length;
  const bestSellerCount = (products || []).filter(p => p.bestSellerRank && p.bestSellerRank <= 3).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={openSidebar} style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Menu size={18} color={c.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900', color: c.text, letterSpacing: -0.5 }}>
            Menu <Text style={{ color: c.accent }}>Explorer</Text>
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/pos/cart')} style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
          alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <ShoppingCart size={18} color={c.text} strokeWidth={2} />
          {items.length > 0 && (
            <View style={{
              position: 'absolute', top: -4, right: -4,
              backgroundColor: c.accent, width: 18, height: 18, borderRadius: 9,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: c.textInverse, fontSize: 10, fontWeight: '900' }}>{items.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: c.bgCard, borderWidth: 2, borderColor: c.borderLight,
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
        marginHorizontal: 16, marginBottom: 10, marginTop: 8, gap: 8,
      }}>
        <Search size={16} color={c.textSecondary} strokeWidth={2} />
        <TextInput placeholder="Cari menu..." placeholderTextColor={c.textMuted}
          value={search} onChangeText={setSearch}
          style={{ flex: 1, color: c.text, fontSize: 14, fontWeight: '500' }}
        />
      </View>

      {/* Categories */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}>
          {['Semua', ...(categories || [])].map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: isActive ? c.accent : c.bgCard,
                  borderWidth: isActive ? 0 : 1, borderColor: c.borderLight,
                }}>
                <Text style={{
                  color: isActive ? c.textInverse : c.textSecondary,
                  fontSize: 12, fontWeight: isActive ? '900' : '600',
                }}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Trending bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, marginBottom: 12, marginTop: 4,
      }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: c.accentBg, borderWidth: 1,
          borderColor: isDark ? 'rgba(245,158,11,0.25)' : 'rgba(13,148,136,0.25)',
          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
        }}>
          <TrendingUp size={11} color={c.accent} strokeWidth={2} />
          <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>Trending: 3 Hari</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {promoCount > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              backgroundColor: c.errorBg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
            }}>
              <Percent size={9} color={c.error} strokeWidth={2} />
              <Text style={{ color: c.error, fontSize: 9, fontWeight: '900' }}>{promoCount} PROMO</Text>
            </View>
          )}
          {bestSellerCount > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              backgroundColor: c.accentBg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
            }}>
              <Award size={9} color={c.accent} strokeWidth={2} />
              <Text style={{ color: c.accent, fontSize: 9, fontWeight: '900' }}>{bestSellerCount} BEST</Text>
            </View>
          )}
        </View>
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: items.length > 0 ? 100 : 20 }}
        renderItem={({ item }) => (
          <ProductCard product={item} onAdd={addToCart} onRemove={removeFromCart}
            cartQuantity={items.find(i => i.productId === item.id)?.quantity || 0} />
        )}
      />

      {/* Cart FAB */}
      {items.length > 0 && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
          <TouchableOpacity onPress={() => router.push('/pos/cart')}
            style={{
              backgroundColor: c.accent, borderRadius: 20,
              paddingHorizontal: 20, paddingVertical: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              elevation: 8,
              shadowColor: c.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
            }}
            activeOpacity={0.9}>
            <Text style={{ color: c.textInverse, fontSize: 14, fontWeight: '700' }}>
              {items.length} item{items.length > 1 ? 's' : ''} {' • '} {formatRupiahShort(total)}
            </Text>
            <Text style={{ color: c.textInverse, fontSize: 14, fontWeight: '900' }}>Lihat Keranjang →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
