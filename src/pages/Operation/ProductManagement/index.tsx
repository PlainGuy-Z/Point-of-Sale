import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { Plus, Edit2, Trash2, Camera, X, Package, Tag, AlertTriangle, Search, ChevronRight, Star, TrendingUp, Filter, MoreVertical, DollarSign, BarChart3, TrendingDown, Box, Clock, Percent, Calendar, Award, Trophy, Flame } from 'lucide-react';
import type { Product } from '../../../types';

// Array of gradient colors for categories
const CATEGORY_GRADIENTS = [
  'bg-gradient-to-r from-amber-500 to-orange-500',
  'bg-gradient-to-r from-emerald-500 to-teal-500',
  'bg-gradient-to-r from-rose-500 to-pink-500',
  'bg-gradient-to-r from-blue-500 to-cyan-500',
  'bg-gradient-to-r from-purple-500 to-violet-500',
  'bg-gradient-to-r from-lime-500 to-green-500',
  'bg-gradient-to-r from-red-500 to-rose-500',
  'bg-gradient-to-r from-indigo-500 to-purple-500',
];

export default function ProductManagement() {
  const { products, addProduct, updateProduct, deleteProduct, categories, addCategory, deleteCategory } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // State untuk promo
  const [isPromo, setIsPromo] = useState(false);
  const [promoPrice, setPromoPrice] = useState('');
  const [promoLabel, setPromoLabel] = useState('');
  const [promoStart, setPromoStart] = useState('');
  const [promoEnd, setPromoEnd] = useState('');
  
  // State untuk best seller
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [salesCount, setSalesCount] = useState('');

  // Event listener untuk keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
      // Enter untuk submit form (kecuali di textarea atau input date)
      if (e.key === 'Enter' && isModalOpen && e.target instanceof HTMLInputElement) {
        // Cek jika bukan textarea dan bukan date picker
        if (e.target.type !== 'textarea' && e.target.type !== 'date') {
          e.preventDefault();
          const form = document.querySelector('form');
          if (form) {
            const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton) {
              submitButton.click();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Reset form ketika modal dibuka/tutup
  useEffect(() => {
    if (isModalOpen && editingProduct) {
      setIsPromo(editingProduct.isPromo || false);
      setPromoPrice(editingProduct.promoPrice?.toString() || '');
      setPromoLabel(editingProduct.promoLabel || '');
      setPromoStart(editingProduct.promoStart || '');
      setPromoEnd(editingProduct.promoEnd || '');
      setIsBestSeller(editingProduct.isBestSeller || false);
      setSalesCount(editingProduct.salesCount?.toString() || '');
    } else if (!isModalOpen) {
      resetForm();
    }
  }, [isModalOpen, editingProduct]);

  // Format category name: capitalize first letter
  const formatCategoryName = (name: string): string => {
    return name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
  };

  // Format product name: capitalize first letter of each word
  const formatProductName = (name: string): string => {
    return name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Check if product already exists
  const checkProductExists = (name: string, category: string): boolean => {
    const formattedName = formatProductName(name);
    const formattedCategory = formatCategoryName(category);
    
    return products.some(product => 
      product.name.toLowerCase() === formattedName.toLowerCase() && 
      product.category.toLowerCase() === formattedCategory.toLowerCase()
    );
  };

  // Calculate category stats
  const categoryStats = categories.map(cat => {
    const catProducts = products.filter(p => p.category === cat);
    const totalItems = catProducts.length;
    const totalStock = catProducts.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = catProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStockItems = catProducts.filter(p => p.stock <= p.minStock).length;
    
    return {
      name: cat,
      totalItems,
      totalStock,
      totalValue,
      lowStockItems,
      gradient: CATEGORY_GRADIENTS[categories.indexOf(cat) % CATEGORY_GRADIENTS.length],
      canDelete: catProducts.length === 0 // Can delete if no products in this category
    };
  });

  // Add "All" category stat
  const allCategoryStat = {
    name: 'all',
    totalItems: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
    lowStockItems: products.filter(p => p.stock <= p.minStock).length,
    gradient: 'bg-gradient-to-r from-gray-600 to-gray-800',
    canDelete: false
  };

  // Handle adding category with auto-capitalize
  const handleAddCategory = () => {
    if (newCatName.trim()) {
      const formattedName = formatCategoryName(newCatName);
      // Check if category already exists (case-insensitive)
      const categoryExists = categories.some(
        cat => cat.toLowerCase() === formattedName.toLowerCase()
      );
      
      if (categoryExists) {
        alert(`Category "${formattedName}" already exists!`);
        return;
      }
      addCategory(formattedName);
      setNewCatName('');
    }
  };

  // Handle deleting category with confirmation
  const handleDeleteCategory = (categoryName: string) => {
    // Check if there are products in this category
    const productsInCategory = products.filter(p => p.category === categoryName);
    
    if (productsInCategory.length > 0) {
      alert(`Cannot delete "${categoryName}" category because it contains ${productsInCategory.length} product(s). Please reassign or delete those products first.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the "${categoryName}" category?`)) {
      deleteCategory(categoryName);
      if (activeCategory === categoryName) {
        setActiveCategory('all');
      }
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Optimasi kompresi untuk 10MB
  const compressImage = (base64Str: string, originalSizeKB: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Hitung ukuran target berdasarkan ukuran asli
        let targetWidth = img.width;
        let targetHeight = img.height;
        
        // Tentukan ukuran maksimum berdasarkan ukuran file asli
        let maxDimension = 800; // default
        if (originalSizeKB > 8000) { // > 8MB
          maxDimension = 500;
        } else if (originalSizeKB > 5000) { // > 5MB
          maxDimension = 600;
        } else if (originalSizeKB > 2000) { // > 2MB
          maxDimension = 700;
        }
        
        // Skala rasio aspek
        if (targetWidth > targetHeight) {
          if (targetWidth > maxDimension) {
            targetHeight = (targetHeight * maxDimension) / targetWidth;
            targetWidth = maxDimension;
          }
        } else {
          if (targetHeight > maxDimension) {
            targetWidth = (targetWidth * maxDimension) / targetHeight;
            targetHeight = maxDimension;
          }
        }
        
        canvas.width = Math.round(targetWidth);
        canvas.height = Math.round(targetHeight);
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Optimasi rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Tentukan kualitas berdasarkan ukuran file
          let quality = 0.7; // default
          if (originalSizeKB > 8000) {
            quality = 0.4;
          } else if (originalSizeKB > 5000) {
            quality = 0.5;
          } else if (originalSizeKB > 2000) {
            quality = 0.6;
          }
          
          // Kompres ke WebP jika browser support (lebih kecil dari JPEG)
          const mimeType = canvas.toDataURL('image/webp', quality).startsWith('data:image/webp') 
            ? 'image/webp' 
            : 'image/jpeg';
          
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          const compressedSizeKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
          
          console.log(`Compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${quality} quality, ${mimeType})`);
          
          // Jika masih > 500KB, kompres lebih lanjut
          if (compressedSizeKB > 500) {
            const finalQuality = Math.max(0.2, quality * 0.7); // Jangan kurang dari 0.2
            const finalCompressed = canvas.toDataURL(mimeType, finalQuality);
            console.log(`Re-compressed to: ${Math.round((finalCompressed.length * 3) / 4 / 1024)}KB`);
            resolve(finalCompressed);
          } else {
            resolve(compressedDataUrl);
          }
        } else {
          reject(new Error('Canvas context error'));
        }
      };
      img.onerror = () => reject(new Error('Image load error'));
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Hanya file gambar yang diperbolehkan (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validasi ukuran file - 10MB
    if (file.size > MAX_FILE_SIZE) {
      alert(`File terlalu besar (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksimal 10MB.`);
      return;
    }

    // Tampilkan ukuran file
    const fileSizeKB = Math.round(file.size / 1024);
    console.log(`Original file: ${fileSizeKB}KB`);
    
    // Jika file > 8MB, beri peringatan performa
    if (fileSizeKB > 8000) {
      if (!confirm(`File besar (${(fileSizeKB / 1024).toFixed(1)}MB). Proses kompresi mungkin membutuhkan waktu. Lanjutkan?`)) {
        return;
      }
    }

    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const result = reader.result as string;
        const originalBase64SizeKB = Math.round((result.length * 3) / 4 / 1024);
        
        // Kompres gambar dengan informasi ukuran asli
        const compressed = await compressImage(result, fileSizeKB);
        const compressedSizeKB = Math.round((compressed.length * 3) / 4 / 1024);
        
        console.log(`Final size: ${compressedSizeKB}KB`);
        
        // Validasi ukuran akhir (max 300KB untuk penyimpanan)
        if (compressedSizeKB > 300) {
          alert(`Gambar masih terlalu besar setelah kompresi (${compressedSizeKB}KB). Silakan pilih gambar dengan resolusi lebih kecil.`);
          return;
        }
        
        setPreviewImage(compressed);
        
        // Tampilkan info kompresi
        const compressionRatio = Math.round((fileSizeKB / compressedSizeKB) * 10) / 10;
        console.log(`Compression ratio: ${compressionRatio}x`);
        
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Gagal mengkompres gambar. Silakan coba gambar lain atau kurangi ukurannya.');
      }
    };

    reader.onerror = () => {
      alert('Error membaca file. Silakan coba file lain.');
    };

    reader.readAsDataURL(file);
  };

  // Reset form
  const resetForm = () => {
    setIsPromo(false);
    setPromoPrice('');
    setPromoLabel('');
    setPromoStart('');
    setPromoEnd('');
    setIsBestSeller(false);
    setSalesCount('');
  };

  // Handle open modal untuk edit
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setPreviewImage(product.image || null);
    setModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setPreviewImage(null);
    resetForm();
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productName = formData.get('name') as string;
    const category = formData.get('category') as string;
    const formattedProductName = formatProductName(productName);
    const formattedCategory = formatCategoryName(category);
    
    // Periksa apakah produk sudah ada (hanya untuk produk baru, bukan edit)
    if (!editingProduct && checkProductExists(productName, category)) {
      alert(`Product "${formattedProductName}" already exists in category "${formattedCategory}"!`);
      return;
    }
    
    // Buat productData dengan tipe yang sesuai
    const productData: Product = {
      id: editingProduct?.id || `P${Date.now()}`,
      name: formattedProductName,
      category: formattedCategory,
      price: Number(formData.get('price')),
      cost: Number(formData.get('cost')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      unit: 'pcs',
      image: previewImage || null,
      
      // Promo data
      isPromo: isPromo,
      promoPrice: isPromo && promoPrice ? Number(promoPrice) : undefined,
      promoLabel: isPromo && promoLabel ? promoLabel : undefined,
      promoStart: isPromo && promoStart ? promoStart : undefined,
      promoEnd: isPromo && promoEnd ? promoEnd : undefined,
      
      // Best seller data
      isBestSeller: isBestSeller,
      salesCount: isBestSeller && salesCount ? Number(salesCount) : (editingProduct?.salesCount || 0)
    };
    
    editingProduct ? updateProduct(productData) : addProduct(productData);
    handleCloseModal();
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate inventory summary
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const avgMargin = products.length > 0 
    ? (products.reduce((sum, p) => sum + ((p.price - p.cost) / p.price * 100), 0) / products.length).toFixed(1)
    : '0';

  // Hitung promo aktif
  const activePromoProducts = products.filter(p => p.isPromo && p.promoPrice && p.promoPrice > 0);
  const promoCount = activePromoProducts.length;

  // Hitung best seller
  const bestSellerProducts = products.filter(p => p.isBestSeller).sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  const bestSellerCount = bestSellerProducts.length;

  // Format price untuk preview
  const formatPrice = (price: number) => {
    return price.toLocaleString('id-ID');
  };

  return (
    <div className={`space-y-6 animate-in fade-in duration-500`}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Inventory <span className="text-amber-500">Hub</span>
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage your digital menu and stock availability
          </p>
        </div>
      </div>

      {/* Integrated Search and Product List Section */}
      <div className={`rounded-3xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
        {/* Unified Header */}
        <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left: Search and Filter */}
            <div className="flex-1 max-w-lg">
              <div className="flex items-center gap-3">
                {/* New Product Button */}
                <button 
                  onClick={() => setModalOpen(true)} 
                  className="group flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/25 active:scale-95 flex-shrink-0"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <span className="text-sm">New Product</span>
                </button>
                
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text"
                    placeholder="Search products by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all ${
                      isDark 
                        ? 'bg-gray-900 border-gray-700 text-white focus:border-amber-500' 
                        : 'bg-gray-50 border-gray-200 focus:border-amber-500'
                    }`}
                  />
                </div>
                
                {/* View Toggle */}
                <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Grid View"
                  >
                    <Box className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'table'
                        ? isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Table View"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Active Filters */}
              <div className="flex flex-wrap gap-2 mt-3">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${isDark ? 'bg-gray-700 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                  <Filter size={10} />
                  {activeCategory === 'all' ? 'All Categories' : activeCategory}
                </div>
                {searchTerm && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${isDark ? 'bg-gray-700 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                    <Search size={10} />
                    Search: "{searchTerm}"
                  </div>
                )}
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-700'}`}>
                  {filteredProducts.length} Products
                </div>
                {promoCount > 0 && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${isDark ? 'bg-red-700 text-red-200' : 'bg-red-100 text-red-700'}`}>
                    <Percent size={10} />
                    {promoCount} Promo Active
                  </div>
                )}
                {bestSellerCount > 0 && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${isDark ? 'bg-amber-700 text-amber-200' : 'bg-amber-100 text-amber-700'}`}>
                    <Trophy size={10} />
                    {bestSellerCount} Best Sellers
                  </div>
                )}
              </div>
            </div>

            {/* Right: Inventory Summary */}
            <div className="flex flex-wrap gap-3">
              <div className={`px-3 py-2 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <DollarSign className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Value</p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rp {totalInventoryValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`px-3 py-2 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <Package className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Items</p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalProducts}</p>
                  </div>
                </div>
              </div>
              
              <div className={`px-3 py-2 rounded-xl ${lowStockCount > 0 ? (isDark ? 'bg-red-900/30' : 'bg-red-50') : (isDark ? 'bg-gray-700/50' : 'bg-gray-50')}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Low Stock</p>
                    <p className={`font-bold ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
                      {lowStockCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product List Content */}
        <div className="p-5">
          {viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                  <tr className={`text-xs uppercase font-bold tracking-tight ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <th className="p-4">Product Info</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4 text-right">Promo</th>
                    <th className="p-4 text-right">Sales</th>
                    <th className="p-4 text-right">Stock</th>
                    <th className="p-4 text-right">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {filteredProducts.map((p) => {
                    const margin = p.price - p.cost;
                    const marginPercent = ((margin / p.price) * 100).toFixed(1);
                    const isLowStock = p.stock <= p.minStock;
                    const isOutOfStock = p.stock === 0;
                    const isPromoActive = p.isPromo && p.promoPrice && p.promoPrice > 0;
                    const discountPercent = isPromoActive 
                      ? Math.round(((p.price - p.promoPrice!) / p.price) * 100)
                      : 0;
                    const isBestSellerActive = p.isBestSeller;
                    
                    return (
                      <tr key={p.id} className={`group transition-colors ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                              {p.image ? (
                                <img src={p.image} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className={`w-5 h-5 ${isDark ? 'text-gray-700' : 'text-gray-400'}`} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {isPromoActive && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white">
                                      {p.promoLabel || `-${discountPercent}%`}
                                    </span>
                                    {p.promoStart && p.promoEnd && (
                                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                        <Clock size={8} />
                                        {p.promoStart} - {p.promoEnd}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {isBestSellerActive && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                    <Trophy size={8} className="inline mr-1" />
                                    Best Seller
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {p.category}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end">
                            {isPromoActive ? (
                              <>
                                <p className={`font-bold line-through text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  Rp {p.price.toLocaleString()}
                                </p>
                                <p className={`font-bold text-red-500 dark:text-red-400`}>
                                  Rp {p.promoPrice!.toLocaleString()}
                                </p>
                              </>
                            ) : (
                              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Rp {p.price.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {isPromoActive ? (
                            <div className="flex flex-col items-end">
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white">
                                {discountPercent}% OFF
                              </span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Save: Rp {(p.price - p.promoPrice!).toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-bold ${isBestSellerActive ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                              {p.salesCount || 0} sold
                            </span>
                            {isBestSellerActive && p.salesCount && p.salesCount > 100 && (
                              <span className="text-[10px] text-green-500 dark:text-green-400">
                                Hot Item
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
                              {p.stock} {p.unit}
                            </span>
                            {p.minStock > 0 && (
                              <span className="text-xs text-gray-500">Min: {p.minStock}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {isOutOfStock ? (
                            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenEditModal(p)}
                              className={`p-2 rounded-lg transition-all ${isDark ? 'bg-gray-700 text-blue-400 hover:bg-blue-500/20' : 'bg-gray-100 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => { if(confirm(`Delete ${p.name}?`)) deleteProduct(p.id); }}
                              className={`p-2 rounded-lg transition-all ${isDark ? 'bg-gray-700 text-red-400 hover:bg-red-500/20' : 'bg-gray-100 text-red-600 hover:bg-red-600 hover:text-white'}`}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const margin = p.price - p.cost;
                const marginPercent = ((margin / p.price) * 100).toFixed(1);
                const isLowStock = p.stock <= p.minStock;
                const isOutOfStock = p.stock === 0;
                const isPromoActive = p.isPromo && p.promoPrice && p.promoPrice > 0;
                const discountPercent = isPromoActive 
                  ? Math.round(((p.price - p.promoPrice!) / p.price) * 100)
                  : 0;
                const isBestSellerActive = p.isBestSeller;
                
                return (
                  <div key={p.id} className={`rounded-xl border p-4 transition-all relative ${isDark ? 'bg-gray-800/50 border-gray-700 hover:border-amber-500/50' : 'bg-white border-gray-200 hover:border-amber-500 hover:shadow-sm'}`}>
                    {/* Promo Badge */}
                    {isPromoActive && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                          {p.promoLabel || `${discountPercent}% OFF`}
                        </div>
                      </div>
                    )}
                    
                    {/* Best Seller Badge */}
                    {isBestSellerActive && !isPromoActive && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                          <Trophy size={10} className="inline mr-1" />
                          Best Seller
                        </div>
                      </div>
                    )}
                    
                    {/* Jika ada promo DAN best seller */}
                    {isPromoActive && isBestSellerActive && (
                      <div className="absolute -top-2 -left-2 z-10">
                        <div className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                          <Trophy size={10} className="inline mr-1" />
                          Best Seller
                        </div>
                      </div>
                    )}
                    
                    {/* Product Image */}
                    <div className={`w-full h-32 rounded-lg mb-3 overflow-hidden flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                      {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover" />
                      ) : (
                        <Package className={`w-12 h-12 ${isDark ? 'text-gray-700' : 'text-gray-400'}`} />
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="space-y-2">
                      <div>
                        <h3 className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {p.category}
                          </span>
                          <span className={`text-xs font-bold ${
                            parseFloat(marginPercent) >= 50 ? 'text-green-600 dark:text-green-400' :
                            parseFloat(marginPercent) >= 30 ? 'text-amber-600 dark:text-amber-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {marginPercent}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Price and Stock */}
                      <div className="space-y-1">
                        {isPromoActive ? (
                          <>
                            <div className="flex items-center gap-2">
                              <p className={`font-bold line-through text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Rp {p.price.toLocaleString()}
                              </p>
                              <p className={`font-bold text-red-500 dark:text-red-400`}>
                                Rp {p.promoPrice!.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white">
                                Save {discountPercent}%
                              </span>
                              <span className="text-[10px] text-gray-500">
                                Save Rp {(p.price - p.promoPrice!).toLocaleString()}
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Rp {p.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">Cost: Rp {p.cost.toLocaleString()}</div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className={`font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
                              {p.stock}
                            </span>
                            {isLowStock && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          </div>
                          <p className="text-xs text-gray-500">{p.unit}</p>
                        </div>
                      </div>
                      
                      {/* Sales Count */}
                      {isBestSellerActive && (
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Trophy className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                              <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                Best Seller
                              </span>
                            </div>
                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {p.salesCount || 0} sold
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Status Bar */}
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full rounded-full ${
                            isOutOfStock ? 'bg-red-500' :
                            isLowStock ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min((p.stock / (p.minStock * 3 || 10)) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      
                      {/* Actions */}
                      <div className="flex justify-between pt-2">
                        <div>
                          {isOutOfStock ? (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Low Stock
                            </span>
                          ) : null}
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenEditModal(p)}
                            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Edit"
                          >
                            <Edit2 size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                          </button>
                          <button 
                            onClick={() => { if(confirm(`Delete ${p.name}?`)) deleteProduct(p.id); }}
                            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Delete"
                          >
                            <Trash2 size={14} className={isDark ? 'text-red-400' : 'text-red-600'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className={`w-16 h-16 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
              <h3 className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No products found</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {searchTerm ? `No products match "${searchTerm}"` : 'No products available'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`mt-3 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Dashboard Section */}
      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-amber-50'}`}>
              <Tag className={isDark ? 'text-amber-400' : 'text-amber-600'} size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Categories Overview</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Track inventory by category</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-gray-700 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
            <Filter size={12} />
            <span>{categories.length} Categories</span>
          </div>
        </div>

        {/* All Categories Card */}
        <div 
          className={`p-4 rounded-2xl mb-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${allCategoryStat.gradient} ${activeCategory === 'all' ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                All Products
                <ChevronRight size={16} className={`transition-transform ${activeCategory === 'all' ? 'rotate-90' : ''}`} />
              </h3>
              <p className="text-sm opacity-90">Complete inventory overview</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-white">{allCategoryStat.totalItems}</div>
              <div className="text-xs opacity-90">Total Items</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-white">
            <div className="text-center">
              <div className="text-lg font-bold">Rp {allCategoryStat.totalValue.toLocaleString()}</div>
              <div className="text-xs opacity-80">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{allCategoryStat.totalStock}</div>
              <div className="text-xs opacity-80">In Stock</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${allCategoryStat.lowStockItems > 0 ? 'text-red-300' : 'text-green-300'}`}>
                {allCategoryStat.lowStockItems}
              </div>
              <div className="text-xs opacity-80">Low Stock</div>
            </div>
          </div>
        </div>

        {/* Individual Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryStats.map((stat) => (
            <div 
              key={stat.name}
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] relative group ${stat.gradient} ${activeCategory === stat.name ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
              onClick={() => setActiveCategory(stat.name)}
            >
              {/* Delete button - top right corner */}
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(stat.name);
                  }}
                  className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'bg-white/20 hover:bg-white/30' : 'bg-black/10 hover:bg-black/20'}`}
                  title={`Delete "${stat.name}" category`}
                >
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="font-bold text-sm truncate pr-6">{stat.name}</h3>
                  <p className="text-xs opacity-90 mt-1">{stat.totalItems} item{stat.totalItems !== 1 ? 's' : ''}</p>
                </div>
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/20' : 'bg-white/30'}`}>
                    <TrendingUp size={14} className="text-white" />
                  </div>
                  {stat.lowStockItems > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">{stat.lowStockItems}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 text-white">
                <div className="flex items-center justify-between text-xs">
                  <span>Stock Value</span>
                  <span className="font-bold">Rp {stat.totalValue.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-white/50 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stat.totalStock / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
              {/* Cannot delete warning */}
              {!stat.canDelete && (
                <div className="mt-2 text-xs text-white/70 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Contains {stat.totalItems} product{stat.totalItems !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}

          {/* Add New Category Card */}
          <div className={`p-4 rounded-2xl border-2 border-dashed ${isDark ? 'border-gray-700 hover:border-amber-500 bg-gray-800/50' : 'border-gray-200 hover:border-amber-500 bg-gray-50/50'} transition-all hover:scale-[1.03] cursor-pointer`}>
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <Plus size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              </div>
              <input 
                value={newCatName} 
                onChange={(e) => setNewCatName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  }
                }}
                className={`w-full p-2 text-sm rounded-xl mb-2 text-center ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                placeholder="New category..."
                onBlur={(e) => {
                  // Auto-capitalize on blur
                  if (e.target.value) {
                    setNewCatName(formatCategoryName(e.target.value));
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddCategory();
                }}
                disabled={!newCatName.trim()}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${newCatName.trim() 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : isDark 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Add Category
              </button>
              <p className="text-[10px] text-gray-500 mt-2">
                First letter will auto-capitalize
              </p>
            </div>
          </div>
        </div>
      </div>

 {/* Modern Modal Form - DENGAN BEST SELLER */}
{isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div 
      className={`w-full max-w-md rounded-[1.5rem] shadow-2xl overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}
    >
      <form 
        onSubmit={handleSubmit} 
        className="flex flex-col h-full"
      >
        {/* Header Modal - STICKY */}
        <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} flex-shrink-0`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingProduct ? 'Edit Item' : 'New Creation'}
            </h2>
            <button 
              type="button" 
              onClick={handleCloseModal} 
              className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto horizontal-scrollbar-thin  max-h-[60vh] p-5 ">
          <div className="space-y-4">
            {/* Profile Image Upload */}
            <div className="flex justify-center relative group">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${
                  isDark ? 'bg-gray-900 border-gray-700 hover:border-amber-500' : 'bg-gray-50 border-gray-200 hover:border-amber-500'
                }`}
              >
                {previewImage ? (
                  <img src={previewImage} className="w-full h-full object-cover" alt="Product preview" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Camera size={20} className="mx-auto" />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            </div>

            {/* Basic Information Section */}
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase text-amber-500 ml-1 tracking-widest">Name</label>
                <input 
                  name="name" 
                  defaultValue={editingProduct?.name} 
                  className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm transition-all mt-1 ${isDark ? 'border-gray-700 focus:border-amber-500 text-white' : 'border-gray-100 focus:border-amber-500 text-gray-900'}`} 
                  required 
                  placeholder="Arabica Gold" 
                  onBlur={(e) => {
                    // Auto-capitalize product name on blur
                    if (e.target.value) {
                      e.target.value = formatProductName(e.target.value);
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-amber-500 ml-1 tracking-widest">Category</label>
                <select 
                  name="category" 
                  defaultValue={editingProduct?.category} 
                  className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-700 text-white' : 'border-gray-100 text-gray-900'}`}
                >
                  {categories.map(cat => <option key={cat} value={cat} className={isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>{cat}</option>)}
                </select>
              </div>

              {/* Price & Stock Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Cost</label>
                  <input 
                    name="cost" 
                    type="number" 
                    defaultValue={editingProduct?.cost} 
                    className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-700 text-white' : 'border-gray-100'}`} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Price</label>
                  <input 
                    name="price" 
                    type="number" 
                    defaultValue={editingProduct?.price} 
                    className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-700 text-white' : 'border-gray-100'}`} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Stock</label>
                  <input 
                    name="stock" 
                    type="number" 
                    defaultValue={editingProduct?.stock} 
                    className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-700 text-white' : 'border-gray-100'}`} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Min Alert</label>
                  <input 
                    name="minStock" 
                    type="number" 
                    defaultValue={editingProduct?.minStock} 
                    className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-700 text-white' : 'border-gray-100'}`} 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* BEST SELLER SECTION */}
            <div className={`p-4 rounded-xl transition-all duration-300 ${isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <label className="text-sm font-bold">Best Seller Settings</label>
                </div>
                <div className="relative">
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className={`relative w-10 h-6 rounded-full peer ${isDark ? 'bg-gray-600 peer-checked:bg-amber-500' : 'bg-gray-300 peer-checked:bg-amber-500'} peer-focus:ring-2 peer-focus:ring-amber-300 transition-colors`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isBestSeller ? 'translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                </div>
              </div>

              {isBestSeller && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Sales Count</label>
                    <input 
                      type="number" 
                      value={salesCount}
                      onChange={(e) => setSalesCount(e.target.value)}
                      className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-600 focus:border-amber-500 text-white' : 'border-blue-200 focus:border-amber-500 text-gray-900'}`}
                      placeholder="Number of sales"
                      min="0"
                    />
                  </div>
                  
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/70' : 'bg-blue-100/70'}`}>
                    <div className="flex items-start gap-2">
                      <Trophy className={`w-4 h-4 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      <div className="text-xs">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          This product will appear at the top of POS (below promo items) with a "Best Seller" badge.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PROMO SECTION */}
            <div className={`p-4 rounded-xl transition-all duration-300 ${isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Percent className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <label className="text-sm font-bold">Promo Settings</label>
                </div>
                <div className="relative">
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPromo}
                      onChange={(e) => setIsPromo(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className={`relative w-10 h-6 rounded-full peer ${isDark ? 'bg-gray-600 peer-checked:bg-amber-500' : 'bg-gray-300 peer-checked:bg-amber-500'} peer-focus:ring-2 peer-focus:ring-amber-300 transition-colors`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isPromo ? 'translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                </div>
              </div>

              {isPromo && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Promo Price</label>
                      <input 
                        type="number" 
                        value={promoPrice}
                        onChange={(e) => setPromoPrice(e.target.value)}
                        className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-600 focus:border-red-500 text-white' : 'border-amber-200 focus:border-red-500 text-gray-900'}`}
                        placeholder="Discount price"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Promo Label</label>
                      <input 
                        type="text" 
                        value={promoLabel}
                        onChange={(e) => setPromoLabel(e.target.value)}
                        className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-600 focus:border-red-500 text-white' : 'border-amber-200 focus:border-red-500 text-gray-900'}`}
                        placeholder="e.g., Flash Sale"
                        maxLength={20}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Start Date</label>
                      <input 
                        type="date" 
                        value={promoStart}
                        onChange={(e) => setPromoStart(e.target.value)}
                        className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-600 focus:border-red-500 text-white' : 'border-amber-200 focus:border-red-500 text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-500 ml-1">End Date</label>
                      <input 
                        type="date" 
                        value={promoEnd}
                        onChange={(e) => setPromoEnd(e.target.value)}
                        className={`w-full p-3 rounded-xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-gray-600 focus:border-red-500 text-white' : 'border-amber-200 focus:border-red-500 text-gray-900'}`}
                      />
                    </div>
                  </div>

                  {/* Preview Promo */}
                  {promoPrice && editingProduct?.price && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/70' : 'bg-amber-100/70'}`}>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Original:</span>
                          <span className={`line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Rp {formatPrice(editingProduct.price)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Promo:</span>
                          <span className="font-bold text-red-500">
                            Rp {formatPrice(Number(promoPrice))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Savings:</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white`}>
                              -{Math.round(((editingProduct.price - Number(promoPrice)) / editingProduct.price) * 100)}%
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                              Rp {formatPrice(editingProduct.price - Number(promoPrice))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Modal - STICKY */}
        <div className={`p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} flex-shrink-0`}>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={handleCloseModal} 
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl shadow-lg transition-all active:scale-95 uppercase"
            >
              {editingProduct ? 'Update' : 'Confirm'}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}