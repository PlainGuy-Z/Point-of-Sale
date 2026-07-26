import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  useWindowDimensions,
  TextInput,
  Modal,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  Camera,
  X,
  Check,
  Tag,
  AlertTriangle,
  FolderPlus,
  Calendar,
  Layers,
  Info,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { useLayout } from '../../hooks/useLayout';
import { formatRupiah } from '../../utils/currency';
import type { Product } from '../../types';
import { resolveImageUrl } from '../../utils/image';

// Array of background colors for categories
const CATEGORY_COLORS = [
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6366f1', // indigo
  '#84cc16', // lime
];

export default function ProductManagementScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isLandscape: layoutIsLandscape, isTablet } = useLayout();
  const isLandscape = windowWidth > windowHeight;
  const isSmallLandscape = isLandscape && windowHeight <= 400;
  const insets = useSafeAreaInsets();

  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    isServiceLoading,
    refreshState,
  } = useApp();

  // Screen State
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Category Tab State
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Product Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formStockTracking, setFormStockTracking] = useState(false);
  const [formStock, setFormStock] = useState('0');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formIsPromo, setFormIsPromo] = useState(false);
  const [formPromoPrice, setFormPromoPrice] = useState('');
  const [formPromoLabel, setFormPromoLabel] = useState('');
  const [formPromoStart, setFormPromoStart] = useState('');
  const [formPromoEnd, setFormPromoEnd] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: { text: string; style?: 'cancel' | 'default' | 'destructive'; onPress?: () => void }[];
  }>({ visible: false, title: '', message: '' });

  const showCustomAlert = (
    title: string,
    message: string,
    buttons?: { text: string; style?: 'cancel' | 'default' | 'destructive'; onPress?: () => void }[]
  ) => {
    setCustomAlert({ visible: true, title, message, buttons });
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCat !== 'all') {
      list = list.filter((p) => p.category.toLowerCase() === selectedCat.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Sort: Promo products first, then in-stock, then alphabetical
    return [...list].sort((a, b) => {
      const aPromo = a.isPromo && a.promoPrice ? 1 : 0;
      const bPromo = b.isPromo && b.promoPrice ? 1 : 0;
      if (bPromo !== aPromo) return bPromo - aPromo;

      const aOutOfStock = a.stock === 0 ? 1 : 0;
      const bOutOfStock = b.stock === 0 ? 1 : 0;
      if (aOutOfStock !== bOutOfStock) return aOutOfStock - bOutOfStock;

      return a.name.localeCompare(b.name);
    });
  }, [products, selectedCat, searchQuery]);

  // Categories Stats
  const categoriesStats = useMemo(() => {
    return categories.map((cat, idx) => {
      const count = products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
      return {
        name: cat,
        count,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      };
    });
  }, [categories, products]);

  // Formatting helpers
  const formatCategoryName = (name: string): string => {
    return name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
  };

  const formatProductName = (name: string): string => {
    return name
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Category CRUD Handlers
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const formattedName = formatCategoryName(newCatName);
    if (categories.some((c) => c.toLowerCase() === formattedName.toLowerCase())) {
      showCustomAlert('Gagal', 'Kategori ini sudah terdaftar.');
      return;
    }
    try {
      await addCategory(formattedName);
      setNewCatName('');
      showCustomAlert('Sukses', `Kategori "${formattedName}" berhasil dibuat.`);
    } catch (err: any) {
      showCustomAlert('Error', err.message || 'Gagal menambahkan kategori.');
    }
  };

  const handleStartEditCategory = (catName: string) => {
    setEditingCat(catName);
    setEditingCatName(catName);
  };

  const handleSaveCategoryEdit = async (originalName: string) => {
    if (!editingCatName.trim() || editingCatName === originalName) {
      setEditingCat(null);
      return;
    }
    const formattedName = formatCategoryName(editingCatName);
    if (categories.some((c) => c.toLowerCase() === formattedName.toLowerCase() && c !== originalName)) {
      showCustomAlert('Gagal', 'Kategori dengan nama ini sudah terdaftar.');
      return;
    }

    try {
      // 1. Update category name on all products using old category
      const productsToUpdate = products.filter((p) => p.category === originalName);
      for (const prod of productsToUpdate) {
        await updateProduct({ ...prod, category: formattedName });
      }
      // 2. Delete old category
      await deleteCategory(originalName);
      // 3. Add new category
      await addCategory(formattedName);

      if (selectedCat === originalName) {
        setSelectedCat(formattedName);
      }

      setEditingCat(null);
      setEditingCatName('');
      showCustomAlert('Sukses', 'Nama kategori berhasil diubah.');
    } catch (err: any) {
      showCustomAlert('Error', err.message || 'Gagal mengubah kategori.');
    }
  };

  const handleDeleteCategoryPress = (catName: string) => {
    const count = products.filter((p) => p.category.toLowerCase() === catName.toLowerCase()).length;
    if (count > 0) {
      showCustomAlert(
        'Tidak Dapat Menghapus',
        `Kategori "${catName}" masih memiliki ${count} produk. Harap pindahkan atau hapus produk tersebut terlebih dahulu.`
      );
      return;
    }

    showCustomAlert(
      'Hapus Kategori',
      `Apakah Anda yakin ingin menghapus kategori "${catName}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(catName);
              if (selectedCat === catName) {
                setSelectedCat('all');
              }
              showCustomAlert('Sukses', `Kategori "${catName}" berhasil dihapus.`);
            } catch (err: any) {
              showCustomAlert('Error', err.message || 'Gagal menghapus kategori.');
            }
          },
        },
      ]
    );
  };

  const uploadFile = async (uri: string): Promise<{ url: string }> => {
    const token = await SecureStore.getItemAsync('auth_token');
    let filename = uri.split('/').pop() || 'product.jpg';
    if (!filename.includes('.')) {
      filename = `${filename}.jpg`;
    }
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);

    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/app/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Upload gagal dengan status HTTP ${res.status}`);
    }

    return await res.json();
  };

  // Image Selection Handler
  const handleSelectImage = async (mode: 'library' | 'camera') => {
    try {
      let result;
      if (mode === 'library') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showCustomAlert('Izin Ditolak', 'Izin galeri diperlukan untuk memilih foto.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showCustomAlert('Izin Ditolak', 'Izin kamera diperlukan untuk mengambil foto.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        setIsUploading(true);
        try {
          const { url } = await uploadFile(uri);
          setPreviewImage(url);
        } catch (err: any) {
          showCustomAlert('Upload Gagal', err.message || 'Gagal mengupload gambar.');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (e) {
      console.error(e);
      showCustomAlert('Error', 'Gagal memproses gambar.');
    }
  };

  // Product Add/Edit Modal Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory(categories[0] || '');
    setFormPrice('');
    setFormCost('');
    setFormUnit('pcs');
    setFormStockTracking(false);
    setFormStock('0');
    setFormMinStock('5');
    setFormIsAvailable(true);
    setFormIsPromo(false);
    setFormPromoPrice('');
    setFormPromoLabel('');
    setFormPromoStart('');
    setFormPromoEnd('');
    setPreviewImage(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(product.price.toString());
    setFormCost(product.cost?.toString() || '');
    setFormUnit(product.unit || 'pcs');
    setFormStockTracking(product.stock !== -1);
    setFormStock(product.stock === -1 ? '0' : product.stock.toString());
    setFormMinStock(product.minStock?.toString() || '5');
    setFormIsAvailable(product.isAvailable !== false);
    setFormIsPromo(product.isPromo || false);
    setFormPromoPrice(product.promoPrice?.toString() || '');
    setFormPromoLabel(product.promoLabel || '');
    setFormPromoStart(product.promoStart || '');
    setFormPromoEnd(product.promoEnd || '');
    setPreviewImage(product.image || null);
    setModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      showCustomAlert('Gagal', 'Nama produk tidak boleh kosong.');
      return;
    }
    if (!formCategory) {
      showCustomAlert('Gagal', 'Kategori produk harus dipilih.');
      return;
    }
    if (!formPrice.trim() || Number(formPrice) <= 0) {
      showCustomAlert('Gagal', 'Harga produk harus diisi dengan angka valid.');
      return;
    }

    const formattedName = formatProductName(formName);
    const formattedCategory = formatCategoryName(formCategory);

    // Duplicate check for new products
    if (!editingProduct) {
      const exists = products.some(
        (p) =>
          p.name.toLowerCase() === formattedName.toLowerCase() &&
          p.category.toLowerCase() === formattedCategory.toLowerCase()
      );
      if (exists) {
        showCustomAlert('Gagal', `Produk "${formattedName}" sudah ada di kategori "${formattedCategory}".`);
        return;
      }
    }

    const priceNum = Number(formPrice);
    const costNum = Number(formCost) || 0;
    const promoPriceNum = formIsPromo && formPromoPrice ? Number(formPromoPrice) : 0;

    if (formIsPromo) {
      if (promoPriceNum <= 0) {
        showCustomAlert('Gagal', 'Harga promo harus lebih besar dari 0.');
        return;
      }
      if (promoPriceNum >= priceNum) {
        showCustomAlert('Gagal', 'Harga promo harus lebih rendah dari harga normal.');
        return;
      }
    }

    const productPayload = {
      name: formattedName,
      category: formattedCategory,
      price: priceNum,
      cost: costNum,
      unit: formUnit,
      stock: formStockTracking ? Math.max(0, parseInt(formStock, 10) || 0) : -1,
      minStock: formStockTracking ? Math.max(0, parseInt(formMinStock, 10) || 0) : 0,
      isAvailable: formIsAvailable,
      isPromo: formIsPromo,
      promoPrice: formIsPromo && promoPriceNum > 0 ? promoPriceNum : undefined,
      promoLabel: formIsPromo && formPromoLabel ? formPromoLabel : undefined,
      promoStart: formIsPromo && formPromoStart ? formPromoStart : undefined,
      promoEnd: formIsPromo && formPromoEnd ? formPromoEnd : undefined,
      image: previewImage,
      discount: formIsPromo && promoPriceNum > 0 && promoPriceNum < priceNum
        ? Math.round(((priceNum - promoPriceNum) / priceNum) * 100)
        : 0,
    };

    try {
      if (editingProduct) {
        await updateProduct({ ...productPayload, id: editingProduct.id } as any);
        showCustomAlert('Sukses', `Produk "${formattedName}" berhasil diperbarui.`);
      } else {
        await addProduct(productPayload as any);
        showCustomAlert('Sukses', `Produk "${formattedName}" berhasil ditambahkan.`);
      }
      setModalOpen(false);
    } catch (err: any) {
      showCustomAlert('Error', err.message || 'Gagal menyimpan produk.');
    }
  };

  const handleDeleteProductPress = (product: Product) => {
    showCustomAlert(
      'Hapus Produk',
      `Apakah Anda yakin ingin menghapus produk "${product.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              showCustomAlert('Sukses', `Produk "${product.name}" berhasil dihapus.`);
            } catch (err: any) {
              showCustomAlert('Error', err.message || 'Gagal menghapus produk.');
            }
          },
        },
      ]
    );
  };

  const getStockStatus = (p: Product) => {
    if (p.stock === -1) return { text: 'Stok: ∞', color: c.textMuted, badgeColor: c.bgInput };
    if (p.stock === 0) return { text: 'HABIS', color: '#ffffff', badgeColor: c.error };
    if (p.stock <= p.minStock) return { text: `MINIMAL (${p.stock})`, color: '#ffffff', badgeColor: '#f97316' };
    return { text: `Stok: ${p.stock} ${p.unit || 'pcs'}`, color: c.success, badgeColor: c.successBg };
  };

  // Render Functions
  const renderProductCard = ({ item }: { item: Product }) => {
    const ss = getStockStatus(item);
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.bgCard,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: isSmallLandscape ? 12 : 18,
          padding: isSmallLandscape ? 8 : 14,
          margin: isSmallLandscape ? 4 : 6,
        }}
      >
        <View style={{ flexDirection: 'row', gap: isSmallLandscape ? 8 : 12 }}>
          {/* Product Image */}
          <View
            style={{
              width: isSmallLandscape ? 48 : 64,
              height: isSmallLandscape ? 48 : 64,
              borderRadius: isSmallLandscape ? 8 : 12,
              backgroundColor: isDark ? '#222' : '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            {item.image ? (
              <Image source={{ uri: resolveImageUrl(item.image) }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Package size={isSmallLandscape ? 18 : 28} color={c.textMuted} strokeWidth={1.5} />
            )}
          </View>

          {/* Product Details */}
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ color: c.text, fontSize: isSmallLandscape ? 13 : 15, fontWeight: '700', flex: 1, marginRight: 4 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <View
                  style={{
                    backgroundColor: item.isAvailable !== false ? c.successBg : c.bgInput,
                    paddingHorizontal: isSmallLandscape ? 6 : 8,
                    paddingVertical: 2,
                    borderRadius: isSmallLandscape ? 6 : 8,
                  }}
                >
                  <Text style={{ color: item.isAvailable !== false ? c.success : c.textMuted, fontSize: isSmallLandscape ? 8 : 10, fontWeight: '700' }}>
                    {item.isAvailable !== false ? 'Aktif' : 'Nonaktif'}
                  </Text>
                </View>
              </View>
              <Text style={{ color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 12, marginTop: 2 }}>{item.category}</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isSmallLandscape ? 4 : 6, marginTop: isSmallLandscape ? 4 : 6 }}>
              {/* Stock Badge */}
              <View style={{ backgroundColor: ss.badgeColor, paddingHorizontal: isSmallLandscape ? 6 : 8, paddingVertical: 2, borderRadius: isSmallLandscape ? 6 : 8 }}>
                <Text style={{ color: ss.color, fontSize: isSmallLandscape ? 8 : 10, fontWeight: '700' }}>{ss.text}</Text>
              </View>

              {/* Promo Badge */}
              {item.isPromo && item.promoPrice && (
                <View style={{ backgroundColor: c.errorBg, paddingHorizontal: isSmallLandscape ? 6 : 8, paddingVertical: 2, borderRadius: isSmallLandscape ? 6 : 8, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Tag size={isSmallLandscape ? 8 : 10} color={c.error} />
                  <Text style={{ color: c.error, fontSize: isSmallLandscape ? 8 : 10, fontWeight: '700' }}>
                    {item.promoLabel || 'PROMO'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: c.border, marginVertical: isSmallLandscape ? 8 : 12 }} />

        {/* Price & Actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            {item.isPromo && item.promoPrice ? (
              <View>
                <Text style={{ color: c.textMuted, fontSize: isSmallLandscape ? 9 : 11, textDecorationLine: 'line-through' }}>
                  {formatRupiah(item.price)}
                </Text>
                <Text style={{ color: c.error, fontSize: isSmallLandscape ? 13 : 16, fontWeight: '800' }}>
                  {formatRupiah(item.promoPrice)}
                </Text>
              </View>
            ) : (
              <Text style={{ color: c.accent, fontSize: isSmallLandscape ? 13 : 16, fontWeight: '800' }}>
                {formatRupiah(item.price)}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: isSmallLandscape ? 6 : 8 }}>
            <TouchableOpacity
              onPress={() => handleOpenEditModal(item)}
              style={{
                width: isSmallLandscape ? 32 : 36,
                height: isSmallLandscape ? 32 : 36,
                borderRadius: isSmallLandscape ? 8 : 10,
                backgroundColor: c.bgInput,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <Pencil size={isSmallLandscape ? 14 : 16} color={c.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteProductPress(item)}
              style={{
                width: isSmallLandscape ? 32 : 36,
                height: isSmallLandscape ? 32 : 36,
                borderRadius: isSmallLandscape ? 8 : 10,
                backgroundColor: c.errorBg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.1)',
              }}
            >
              <Trash2 size={isSmallLandscape ? 14 : 16} color={c.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryCard = ({ item }: { item: { name: string; count: number; color: string } }) => {
    const isEditingThis = editingCat === item.name;
    return (
      <View
        style={{
          flex: isTablet && isLandscape ? 1 : undefined,
          marginHorizontal: isTablet && isLandscape ? 6 : 0,
          backgroundColor: c.bgCard,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: isSmallLandscape ? 12 : 18,
          padding: isSmallLandscape ? 10 : 16,
          marginBottom: 10,
        }}
      >
        {isEditingThis ? (
          <View style={{ flexDirection: 'row', gap: isSmallLandscape ? 6 : 10, alignItems: 'center' }}>
            <TextInput
              value={editingCatName}
              onChangeText={setEditingCatName}
              style={{
                flex: 1,
                backgroundColor: c.bgInput,
                color: c.text,
                borderRadius: isSmallLandscape ? 8 : 12,
                paddingHorizontal: isSmallLandscape ? 8 : 12,
                paddingVertical: isSmallLandscape ? 4 : 8,
                fontSize: isSmallLandscape ? 12 : 14,
                borderWidth: 1,
                borderColor: c.border,
              }}
              placeholder="Nama Kategori"
              placeholderTextColor={c.textMuted}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => handleSaveCategoryEdit(item.name)}
              style={{
                width: isSmallLandscape ? 32 : 38,
                height: isSmallLandscape ? 32 : 38,
                borderRadius: isSmallLandscape ? 8 : 12,
                backgroundColor: c.successBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={isSmallLandscape ? 14 : 18} color={c.success} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditingCat(null)}
              style={{
                width: isSmallLandscape ? 32 : 38,
                height: isSmallLandscape ? 32 : 38,
                borderRadius: isSmallLandscape ? 8 : 12,
                backgroundColor: c.bgInput,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <X size={isSmallLandscape ? 14 : 18} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: isSmallLandscape ? 8 : 12 }}>
              <View style={{ width: isSmallLandscape ? 8 : 12, height: isSmallLandscape ? 8 : 12, borderRadius: isSmallLandscape ? 4 : 6, backgroundColor: item.color, marginTop: isSmallLandscape ? 2 : 4 }} />
              <View>
                <Text style={{ color: c.text, fontSize: isSmallLandscape ? 14 : 16, fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 12, marginTop: isSmallLandscape ? 0 : 2 }}>
                  {item.count} produk
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: isSmallLandscape ? 6 : 8 }}>
              <TouchableOpacity
                onPress={() => handleStartEditCategory(item.name)}
                style={{
                  width: isSmallLandscape ? 32 : 36,
                  height: isSmallLandscape ? 32 : 36,
                  borderRadius: isSmallLandscape ? 8 : 10,
                  backgroundColor: c.bgInput,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Pencil size={isSmallLandscape ? 14 : 16} color={c.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteCategoryPress(item.name)}
                style={{
                  width: isSmallLandscape ? 32 : 36,
                  height: isSmallLandscape ? 32 : 36,
                  borderRadius: isSmallLandscape ? 8 : 10,
                  backgroundColor: c.errorBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.1)',
                }}
              >
                <Trash2 size={isSmallLandscape ? 14 : 16} color={c.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderImageSection = () => (
    <View style={{ alignItems: 'center', marginBottom: isSmallLandscape ? 8 : 18 }}>
      <View
        style={{
          width: isSmallLandscape ? 60 : 100,
          height: isSmallLandscape ? 60 : 100,
          borderRadius: isSmallLandscape ? 12 : 18,
          backgroundColor: c.bgInput,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: c.border,
          marginBottom: isSmallLandscape ? 6 : 10,
        }}
      >
        {previewImage ? (
          <Image source={{ uri: resolveImageUrl(previewImage) }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Package size={isSmallLandscape ? 24 : 44} color={c.textMuted} strokeWidth={1.2} />
        )}
        {isUploading && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: isSmallLandscape ? 6 : 10 }}>
        <TouchableOpacity
          onPress={() => handleSelectImage('library')}
          style={[styles.imageActionBtn, { backgroundColor: c.bgInput, borderColor: c.border, paddingVertical: isSmallLandscape ? 4 : 6, paddingHorizontal: isSmallLandscape ? 8 : 12 }]}
        >
          <Text style={{ color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 11, fontWeight: '700' }}>Galeri</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSelectImage('camera')}
          style={[styles.imageActionBtn, { backgroundColor: c.bgInput, borderColor: c.border, paddingVertical: isSmallLandscape ? 4 : 6, paddingHorizontal: isSmallLandscape ? 8 : 12 }]}
        >
          <Camera size={isSmallLandscape ? 10 : 12} color={c.textSecondary} />
          <Text style={{ color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 11, fontWeight: '700', marginLeft: 4 }}>Kamera</Text>
        </TouchableOpacity>
        {previewImage && (
          <TouchableOpacity
            onPress={() => setPreviewImage(null)}
            style={[styles.imageActionBtn, { backgroundColor: c.errorBg, borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.1)', paddingVertical: isSmallLandscape ? 4 : 6, paddingHorizontal: isSmallLandscape ? 8 : 12 }]}
          >
            <Text style={{ color: c.error, fontSize: isSmallLandscape ? 10 : 11, fontWeight: '700' }}>Hapus</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderBasicFields = () => (
    <View style={{ gap: isSmallLandscape ? 8 : 12 }}>
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 11 : 12 }]}>Nama Produk *</Text>
        <TextInput
          value={formName}
          onChangeText={setFormName}
          placeholder="Contoh: Kopi Susu Aren"
          placeholderTextColor={c.textMuted}
          style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 11 : 12 }]}>Kategori *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFormCategory(cat)}
              style={{
                backgroundColor: formCategory === cat ? c.accentBg : c.bgInput,
                borderWidth: 1,
                borderColor: formCategory === cat ? c.accent : c.border,
                borderRadius: 10,
                paddingHorizontal: isSmallLandscape ? 10 : 12,
                paddingVertical: isSmallLandscape ? 6 : 8,
              }}
            >
              <Text
                style={{
                  color: formCategory === cat ? c.accent : c.textSecondary,
                  fontSize: isSmallLandscape ? 11 : 12,
                  fontWeight: '700',
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 11 : 12 }]}>Harga Jual *</Text>
          <TextInput
            value={formPrice}
            onChangeText={setFormPrice}
            placeholder="0"
            placeholderTextColor={c.textMuted}
            keyboardType="numeric"
            style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 11 : 12 }]}>Harga Modal (Cost)</Text>
          <TextInput
            value={formCost}
            onChangeText={setFormCost}
            placeholder="0"
            placeholderTextColor={c.textMuted}
            keyboardType="numeric"
            style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
          />
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 11 : 12 }]}>Satuan Unit</Text>
          <TextInput
            value={formUnit}
            onChangeText={setFormUnit}
            placeholder="pcs, cup, porsi..."
            placeholderTextColor={c.textMuted}
            style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
          />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 10, paddingTop: isSmallLandscape ? 4 : 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text, fontSize: isSmallLandscape ? 12 : 13, fontWeight: '700' }}>Tersedia / Aktif</Text>
            <Switch
              value={formIsAvailable}
              onValueChange={setFormIsAvailable}
              trackColor={{ false: c.border, true: c.success }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
              style={isSmallLandscape ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : undefined}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderStockAndPromoFields = () => (
    <View style={{ gap: isSmallLandscape ? 8 : 12 }}>
      {/* Stock Tracking Toggle */}
      <View style={[styles.toggleSection, { borderColor: c.border, padding: isSmallLandscape ? 8 : 14, marginVertical: isSmallLandscape ? 2 : 4 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: c.text, fontSize: isSmallLandscape ? 12 : 14, fontWeight: '700' }}>Kelola Stok Barang</Text>
            <Text style={{ color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 11, marginTop: 2 }}>
              Pantau tingkat persediaan stok dan dapatkan peringatan stok rendah.
            </Text>
          </View>
          <Switch
            value={formStockTracking}
            onValueChange={setFormStockTracking}
            trackColor={{ false: c.border, true: c.accent }}
            style={isSmallLandscape ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : undefined}
          />
        </View>

        {formStockTracking && (
          <View style={[styles.rowInputs, { marginTop: isSmallLandscape ? 8 : 12 }]}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 12 }]}>Jumlah Stok saat ini</Text>
              <TextInput
                value={formStock}
                onChangeText={setFormStock}
                placeholder="0"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 12 }]}>Batas Minimal Stok</Text>
              <TextInput
                value={formMinStock}
                onChangeText={setFormMinStock}
                placeholder="5"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Promo Section */}
      <View style={[styles.toggleSection, { borderColor: c.border, padding: isSmallLandscape ? 8 : 14, marginVertical: isSmallLandscape ? 2 : 4 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: c.text, fontSize: isSmallLandscape ? 12 : 14, fontWeight: '700' }}>Aktifkan Harga Promo / Diskon</Text>
            <Text style={{ color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 11, marginTop: 2 }}>
              Tawarkan harga khusus atau potongan harga dalam periode tertentu.
            </Text>
          </View>
          <Switch
            value={formIsPromo}
            onValueChange={setFormIsPromo}
            trackColor={{ false: c.border, true: '#ef4444' }}
            style={isSmallLandscape ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : undefined}
          />
        </View>

        {formIsPromo && (
          <View style={{ marginTop: isSmallLandscape ? 8 : 12, gap: isSmallLandscape ? 6 : 10 }}>
            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 12 }]}>Harga Promo *</Text>
                <TextInput
                  value={formPromoPrice}
                  onChangeText={setFormPromoPrice}
                  placeholder="0"
                  placeholderTextColor={c.textMuted}
                  keyboardType="numeric"
                  style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 12 }]}>Label Promo (Diskon)</Text>
                <TextInput
                  value={formPromoLabel}
                  onChangeText={setFormPromoLabel}
                  placeholder="Contoh: PROMO WEEKEND"
                  placeholderTextColor={c.textMuted}
                  style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 12 }]}>Mulai Promo (Optional)</Text>
                <TextInput
                  value={formPromoStart}
                  onChangeText={setFormPromoStart}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={c.textMuted}
                  style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.formLabel, { color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 12 }]}>Akhir Promo (Optional)</Text>
                <TextInput
                  value={formPromoEnd}
                  onChangeText={setFormPromoEnd}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={c.textMuted}
                  style={[styles.formInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border, paddingVertical: isSmallLandscape ? 6 : 10, fontSize: isSmallLandscape ? 12 : 14 }]}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            backgroundColor: c.bgCard,
            marginHorizontal: 32,
            width: Math.min(layoutIsLandscape ? 400 : 320, 400),
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: c.border,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>
              {customAlert.title}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
              {customAlert.message}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              {customAlert.buttons ? customAlert.buttons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setCustomAlert(prev => ({ ...prev, visible: false }));
                    if (btn.onPress) btn.onPress();
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: btn.style === 'cancel' ? 1 : 0,
                    borderColor: c.border,
                    backgroundColor: btn.style === 'destructive' ? '#ef4444' : btn.style === 'cancel' ? 'transparent' : c.accent,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: btn.style === 'cancel' ? c.textSecondary : '#fff', fontSize: 15, fontWeight: '600' }}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              )) : (
                <TouchableOpacity
                  onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Header section */}
      <View
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingVertical: isSmallLandscape ? 6 : 12,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ color: c.text, fontSize: isSmallLandscape ? 16 : 22, fontWeight: '900' }}>
            Manajemen <Text style={{ color: c.accent }}>Menu</Text>
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: isSmallLandscape ? 10 : 12, marginTop: isSmallLandscape ? 0 : 4 }}>
            {products.length} produk • {categories.length} kategori
          </Text>
        </View>

        {activeTab === 'products' && (
          <TouchableOpacity
            onPress={handleOpenAddModal}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: c.accent,
              paddingHorizontal: isSmallLandscape ? 12 : 14,
              paddingVertical: isSmallLandscape ? 6 : 8,
              borderRadius: 12,
            }}
          >
            <Plus size={isSmallLandscape ? 14 : 16} color={c.textInverse} strokeWidth={2.5} />
            <Text style={{ color: c.textInverse, fontSize: isSmallLandscape ? 11 : 13, fontWeight: '700' }}>Produk Baru</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Screen Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.bgCard }}>
        <TouchableOpacity
          onPress={() => setActiveTab('products')}
          style={{
            flex: 1,
            paddingVertical: isSmallLandscape ? 8 : 14,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'products' ? c.accent : 'transparent',
          }}
        >
          <Text
            style={{
              color: activeTab === 'products' ? c.accent : c.textSecondary,
              fontSize: isSmallLandscape ? 12 : 14,
              fontWeight: '700',
            }}
          >
            Produk
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('categories')}
          style={{
            flex: 1,
            paddingVertical: isSmallLandscape ? 8 : 14,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'categories' ? c.accent : 'transparent',
          }}
        >
          <Text
            style={{
              color: activeTab === 'categories' ? c.accent : c.textSecondary,
              fontSize: isSmallLandscape ? 12 : 14,
              fontWeight: '700',
            }}
          >
            Kategori ({categories.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {activeTab === 'products' ? (
        <View style={{ flex: 1 }}>
          {/* Toolbar: Search + Horizontal Categories */}
          <View style={{ padding: isSmallLandscape ? 6 : 12, gap: isSmallLandscape ? 6 : 10, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.bgCard }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: c.bgInput,
                borderRadius: 12,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: c.border,
                height: isSmallLandscape ? 34 : 40,
              }}
            >
              <Search size={16} color={c.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Cari nama produk atau kategori..."
                placeholderTextColor={c.textMuted}
                style={{ flex: 1, color: c.text, fontSize: isSmallLandscape ? 12 : 13, padding: 0 }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={c.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: isSmallLandscape ? 0 : 2 }}>
              <TouchableOpacity
                onPress={() => setSelectedCat('all')}
                style={{
                  backgroundColor: selectedCat === 'all' ? c.accentBg : c.bgInput,
                  borderWidth: 1,
                  borderColor: selectedCat === 'all' ? c.accent : c.border,
                  borderRadius: 10,
                  paddingHorizontal: isSmallLandscape ? 10 : 12,
                  paddingVertical: isSmallLandscape ? 4 : 6,
                }}
              >
                <Text
                  style={{
                    color: selectedCat === 'all' ? c.accent : c.textSecondary,
                    fontSize: isSmallLandscape ? 11 : 12,
                    fontWeight: '700',
                  }}
                >
                  Semua Kategori
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCat(cat)}
                  style={{
                    backgroundColor: selectedCat === cat ? c.accentBg : c.bgInput,
                    borderWidth: 1,
                    borderColor: selectedCat === cat ? c.accent : c.border,
                    borderRadius: 10,
                    paddingHorizontal: isSmallLandscape ? 10 : 12,
                    paddingVertical: isSmallLandscape ? 4 : 6,
                  }}
                >
                  <Text
                    style={{
                      color: selectedCat === cat ? c.accent : c.textSecondary,
                      fontSize: isSmallLandscape ? 11 : 12,
                      fontWeight: '700',
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Products List */}
          <FlatList
            key={isTablet ? (isLandscape ? 'grid-3' : 'grid-2') : (isLandscape ? 'grid-2' : 'list')}
            data={filteredProducts}
            refreshControl={<RefreshControl refreshing={isServiceLoading} onRefresh={refreshState} />}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id}
            numColumns={isTablet ? (isLandscape ? 3 : 2) : (isLandscape ? 2 : 1)}
            contentContainerStyle={{ padding: 8, paddingBottom: isSmallLandscape ? 20 : 64 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 }}>
                <Package size={54} color={c.textMuted} strokeWidth={1.2} />
                <Text style={{ color: c.textSecondary, fontSize: 15, fontWeight: '600' }}>
                  Tidak ada produk ditemukan
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>
                  Silakan buat produk baru atau bersihkan pencarian Anda.
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        <View style={{ flex: 1, padding: isSmallLandscape ? 8 : 16 }}>
          {/* Quick Create Category */}
          <View
            style={{
              backgroundColor: c.bgCard,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 18,
              padding: isSmallLandscape ? 8 : 14,
              marginBottom: isSmallLandscape ? 8 : 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: isSmallLandscape ? 8 : 10,
            }}
          >
            <TextInput
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="Nama Kategori Baru..."
              placeholderTextColor={c.textMuted}
              style={{
                flex: 1,
                backgroundColor: c.bgInput,
                color: c.text,
                fontSize: isSmallLandscape ? 12 : 14,
                fontWeight: '600',
                borderRadius: 12,
                paddingHorizontal: isSmallLandscape ? 10 : 14,
                paddingVertical: isSmallLandscape ? 6 : 10,
                borderWidth: 1,
                borderColor: c.border,
              }}
            />
            <TouchableOpacity
              onPress={handleAddCategory}
              style={{
                backgroundColor: c.accent,
                borderRadius: 12,
                paddingHorizontal: isSmallLandscape ? 12 : 16,
                paddingVertical: isSmallLandscape ? 8 : 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FolderPlus size={16} color={c.textInverse} />
              <Text style={{ color: c.textInverse, fontSize: isSmallLandscape ? 11 : 13, fontWeight: '700' }}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {/* Categories List */}
          <FlatList
            key={isTablet && isLandscape ? 'cat-grid' : 'cat-list'}
            data={categoriesStats}
            refreshControl={<RefreshControl refreshing={isServiceLoading} onRefresh={refreshState} />}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item.name}
            numColumns={isTablet && isLandscape ? 2 : 1}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 }}>
                <Layers size={54} color={c.textMuted} strokeWidth={1.2} />
                <Text style={{ color: c.textSecondary, fontSize: 15, fontWeight: '600' }}>
                  Belum ada kategori
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* Add / Edit Product Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[
              styles.modalContainer,
              {
                backgroundColor: c.bgCard,
                borderColor: c.border,
                maxHeight: isSmallLandscape ? '98%' : '90%',
                paddingLeft: Math.max(16, insets.left),
                paddingRight: Math.max(16, insets.right),
              }
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: c.border, padding: isSmallLandscape ? 10 : 16 }]}>
              <Text style={{ color: c.text, fontSize: isSmallLandscape ? 15 : 18, fontWeight: '800' }}>
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.closeBtn}>
                <X size={isSmallLandscape ? 16 : 20} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Form */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.formContainer, { padding: isSmallLandscape ? 10 : 16 }]} keyboardShouldPersistTaps="handled">
              {isTablet && isLandscape ? (
                <View style={{ flexDirection: 'row', gap: 20 }}>
                  {/* Left Column: Image & Basic Info */}
                  <View style={{ flex: 1, gap: 12 }}>
                    {renderImageSection()}
                    {renderBasicFields()}
                  </View>
                  {/* Right Column: Stock & Promo Settings */}
                  <View style={{ flex: 1, gap: 12 }}>
                    {renderStockAndPromoFields()}
                  </View>
                </View>
              ) : (
                <View style={{ gap: isSmallLandscape ? 8 : 12 }}>
                  {renderImageSection()}
                  {renderBasicFields()}
                  {renderStockAndPromoFields()}
                </View>
              )}
            </ScrollView>

            {/* Modal Footer Actions */}
            <View
              style={[
                styles.modalFooter,
                {
                  borderTopColor: c.border,
                  padding: isSmallLandscape ? 10 : 16,
                  paddingBottom: Math.max(isSmallLandscape ? 10 : 16, insets.bottom),
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => setModalOpen(false)}
                style={[
                  styles.actionBtn,
                  styles.cancelBtn,
                  { borderColor: c.border, height: isSmallLandscape ? 38 : 48 }
                ]}
              >
                <Text style={{ color: c.textSecondary, fontSize: isSmallLandscape ? 12 : 14, fontWeight: '700' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProduct}
                style={[
                  styles.actionBtn,
                  styles.saveBtn,
                  { backgroundColor: c.accent, height: isSmallLandscape ? 38 : 48 }
                ]}
              >
                <Text style={{ color: c.textInverse, fontSize: isSmallLandscape ? 12 : 14, fontWeight: '700' }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
    gap: 12,
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  formInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginVertical: 4,
  },
  imageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  saveBtn: {},
});
