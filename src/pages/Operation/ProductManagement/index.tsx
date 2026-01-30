import { useState, useRef } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { Plus, Edit2, Trash2, Camera, X, Package, Tag, AlertTriangle, Search, ChevronRight, Star, TrendingUp, Filter, MoreVertical } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
}

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

  // Format category name: capitalize first letter
  const formatCategoryName = (name: string): string => {
    return name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
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
    gradient: 'bg-gradient-to-r from-slate-600 to-slate-800',
    canDelete: false
  };

  // Handle adding category with auto-capitalize
  const handleAddCategory = () => {
    if (newCatName.trim()) {
      const formattedName = formatCategoryName(newCatName);
      // Check if category already exists
      if (categories.includes(formattedName)) {
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

// ... kode sebelumnya tetap ...

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

// ... kode setelahnya tetap ...

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: Product = {
      id: editingProduct?.id || `P${Date.now()}`,
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: Number(formData.get('price')),
      cost: Number(formData.get('cost')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      unit: 'pcs',
      image: previewImage || ''
    };
    editingProduct ? updateProduct(productData) : addProduct(productData);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setPreviewImage(null);
  };



  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`space-y-6 animate-in fade-in duration-500`}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Inventory <span className="text-amber-500">Hub</span>
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Manage your digital menu and stock availability
          </p>
        </div>
        <button 
          onClick={() => setModalOpen(true)} 
          className="group flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-amber-500/25 active:scale-95"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>New Product</span>
        </button>
      </div>

      {/* Search and Product List Section - DIPINDAHKAN KE ATAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Card */}
        <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className="text-xs font-black uppercase text-amber-500 mb-4 tracking-widest flex items-center gap-2">
            <Search size={14} /> Quick Search
          </h2>
          <input 
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full p-3 rounded-xl border-2 text-sm outline-none transition-all ${
              isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-100 focus:border-amber-500'
            }`}
          />
          <div className="mt-4">
            <div className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Filter:</div>
            <div className="flex flex-wrap gap-2">
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-slate-700 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                {activeCategory === 'all' ? 'All Categories' : activeCategory}
              </div>
              {searchTerm && (
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                  Search: "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product List Table */}
        <div className="lg:col-span-2">
          <div className={`overflow-hidden rounded-3xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className={`${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                  <tr className={`text-[10px] uppercase font-black tracking-tighter ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <th className="p-5">Product Info</th>
                    <th className="p-5">Financials</th>
                    <th className="p-5">Stock Status</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className={`group transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                            {p.image ? (
                              <img src={p.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-amber-500/50">
                                <Package size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                            <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">{p.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <p className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Rp {p.price.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">Margin: Rp {(p.price - p.cost).toLocaleString()}</p>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${p.stock <= p.minStock ? 'text-red-500' : isDark ? 'text-green-400' : 'text-green-600'}`}>
                              {p.stock} {p.unit}
                            </span>
                            {p.stock <= p.minStock && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                          </div>
                          <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${p.stock <= p.minStock ? 'bg-red-500' : 'bg-green-500'}`} 
                              style={{ width: `${Math.min((p.stock / (p.minStock * 3)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingProduct(p); setPreviewImage(p.image || null); setModalOpen(true); }}
                            className={`p-2 rounded-xl transition-all ${isDark ? 'bg-slate-900 text-blue-400 hover:bg-blue-500/20' : 'bg-slate-100 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => { if(confirm(`Delete ${p.name}?`)) deleteProduct(p.id); }}
                            className={`p-2 rounded-xl transition-all ${isDark ? 'bg-slate-900 text-red-400 hover:bg-red-500/20' : 'bg-slate-100 text-red-600 hover:bg-red-600 hover:text-white'}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Category Dashboard Section - DIPINDAHKAN KE BAWAH */}
      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'} shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-amber-50'}`}>
              <Tag className={isDark ? 'text-amber-400' : 'text-amber-600'} size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Categories Overview</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Track inventory by category</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-slate-700 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
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
          <div className={`p-4 rounded-2xl border-2 border-dashed ${isDark ? 'border-slate-700 hover:border-amber-500 bg-slate-800/50' : 'border-slate-200 hover:border-amber-500 bg-slate-50/50'} transition-all hover:scale-[1.03] cursor-pointer`}>
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <Plus size={20} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
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
                className={`w-full p-2 text-sm rounded-xl mb-2 text-center ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
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
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Add Category
              </button>
              <p className="text-[10px] text-slate-500 mt-2">
                First letter will auto-capitalize
              </p>
            </div>
          </div>
        </div>

        {/* Delete Category Instructions */}
        {showDeleteConfirm && (
          <div className={`mt-4 p-3 rounded-xl ${isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Are you sure you want to delete "{showDeleteConfirm}"?
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm) {
                      handleDeleteCategory(showDeleteConfirm);
                      setShowDeleteConfirm(null);
                    }
                  }}
                  className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <form 
            onSubmit={handleSubmit} 
            className={`w-full max-w-xs p-5 rounded-[1.5rem] shadow-2xl ${
              isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'
            }`}
          >
            {/* Header Modal */}
            <div className="flex justify-between items-center mb-3">
              <h2 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingProduct ? 'Edit Item' : 'New Creation'}
              </h2>
              <button type="button" onClick={handleCloseModal} className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Profile Image Upload */}
              <div className="flex justify-center relative group">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${
                    isDark ? 'bg-slate-900 border-slate-700 hover:border-amber-500' : 'bg-slate-50 border-slate-200 hover:border-amber-500'
                  }`}
                >
                  {previewImage ? (
                    <img src={previewImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Camera size={20} className="mx-auto" />
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              </div>

              {/* Input Fields */}
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-amber-500 ml-1 tracking-widest">Name</label>
                  <input 
                    name="name" 
                    defaultValue={editingProduct?.name} 
                    className={`w-full p-2 rounded-xl border-2 bg-transparent outline-none text-xs transition-all ${isDark ? 'border-slate-700 focus:border-amber-500 text-white' : 'border-slate-100 focus:border-amber-500 text-slate-900'}`} 
                    required 
                    placeholder="Arabica Gold" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-amber-500 ml-1 tracking-widest">Category</label>
                  <select 
                    name="category" 
                    defaultValue={editingProduct?.category} 
                    className={`w-full p-2 rounded-xl border-2 bg-transparent outline-none text-xs ${isDark ? 'border-slate-700 text-white' : 'border-slate-100 text-slate-900'}`}
                  >
                    {categories.map(cat => <option key={cat} value={cat} className="bg-slate-800 text-white">{cat}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Cost</label>
                    <input name="cost" type="number" defaultValue={editingProduct?.cost} className={`w-full p-2 rounded-xl border-2 bg-transparent outline-none text-xs ${isDark ? 'border-slate-700 text-white' : 'border-slate-100'}`} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Price</label>
                    <input name="price" type="number" defaultValue={editingProduct?.price} className={`w-full p-2 rounded-xl border-2 bg-transparent outline-none text-xs ${isDark ? 'border-slate-700 text-white' : 'border-slate-100'}`} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Stock</label>
                    <input name="stock" type="number" defaultValue={editingProduct?.stock} className={`w-full p-2 rounded-xl border-2 bg-transparent outline-none text-xs ${isDark ? 'border-slate-700 text-white' : 'border-slate-100'}`} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Min Alert</label>
                    <input name="minStock" type="number" defaultValue={editingProduct?.minStock} className={`w-full p-2 rounded-xl border-2 bg-transparent outline-none text-xs ${isDark ? 'border-slate-700 text-white' : 'border-slate-100'}`} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-5">
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 uppercase"
              >
                {editingProduct ? 'Update' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}