import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import type { Product } from '../../types';

export default function ProductManagementScreen() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { products, categories } = useApp();

  const [selectedCat, setSelectedCat] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCat !== 'all') list = list.filter(p => p.category === selectedCat);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedCat, searchQuery]);

  const stockLabel = (p: Product) => {
    if (p.stock === -1) return { text: '∞', color: c.textMuted };
    if (p.stock === 0) return { text: 'Habis', color: c.error };
    if (p.stock <= p.minStock) return { text: `${p.stock} ${p.unit}`, color: c.warning };
    return { text: `${p.stock} ${p.unit}`, color: c.success };
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const sl = stockLabel(item);
    return (
      <View style={{
        backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
        borderRadius: 14, padding: 14, marginBottom: 10,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{item.name}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>{item.category}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: c.accent, fontSize: 14, fontWeight: '800' }}>{formatRupiah(item.price)}</Text>
            <Text style={{ color: sl.color, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{sl.text}</Text>
          </View>
        </View>
        {item.isPromo && (
          <View style={{
            alignSelf: 'flex-start', marginTop: 8,
            backgroundColor: c.warningBg, borderRadius: 8,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <Text style={{ color: c.warning, fontSize: 10, fontWeight: '700' }}>
              {item.promoLabel || 'PROMO'} • {formatRupiah(item.promoPrice || 0)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
          Manajemen <Text style={{ color: c.accent }}>Produk</Text>
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
          {products.length} produk • {categories.length} kategori
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 8 }}>
        <TouchableOpacity onPress={() => setSelectedCat('all')}
          style={{
            backgroundColor: selectedCat === 'all' ? c.accent : c.bgCard,
            borderWidth: selectedCat === 'all' ? 0 : 1, borderColor: c.border,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
          }}>
          <Text style={{
            color: selectedCat === 'all' ? c.textInverse : c.textSecondary,
            fontSize: 13, fontWeight: '600',
          }}>Semua</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setSelectedCat(cat)}
            style={{
              backgroundColor: selectedCat === cat ? c.accent : c.bgCard,
              borderWidth: selectedCat === cat ? 0 : 1, borderColor: c.border,
              borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
            }}>
            <Text style={{
              color: selectedCat === cat ? c.textInverse : c.textSecondary,
              fontSize: 13, fontWeight: '600',
            }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Package size={48} color={c.textMuted} strokeWidth={1.5} />
            <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 12 }}>Belum ada produk</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
