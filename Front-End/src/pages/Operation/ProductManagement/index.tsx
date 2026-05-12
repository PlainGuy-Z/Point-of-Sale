import { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { Plus, Edit2, Trash2, Camera, Eye, X, Package, Tag, AlertTriangle, Check, Search, ChevronRight, TrendingUp, Filter, DollarSign, Trophy, Percent, Lock } from 'lucide-react';
import type { Product } from '../../../types';
import { getBestSellersByPeriod } from '../../../utils/analytics';
import { useCurrencyFormatter } from '../../../hooks/useCurrencyFormatter';
import { getEffectivePrice } from '../../../utils/priceUtils';
import { isLowStock, isStockTracked, getStockStatus, getStockDisplay } from '../../../utils/stockUtils';

// Array of gradient colors for categories
const CATEGORY_GRADIENTS = [
    'bg-gradient-to-r from-amber-500 to-orange-500',
    'bg-gradient-to-r from-emerald-500 to-teal-500',
    'bg-gradient-to-r from-rose-500 to-pink-500',
    'bg-gradient-to-r from-amber-500 to-cyan-500',
    'bg-gradient-to-r from-purple-500 to-violet-500',
    'bg-gradient-to-r from-lime-500 to-green-500',
    'bg-gradient-to-r from-red-500 to-rose-500',
    'bg-gradient-to-r from-indigo-500 to-purple-500',
];

export default function ProductManagement() {
    const createProductId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `product-${Date.now()}`);

    const { products, addProduct, updateProduct, deleteProduct, categories, categoriesWithId, addCategory, deleteCategory, transactions } = useApp();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isModalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [newCatName, setNewCatName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

    // State untuk sales period - SAMA DENGAN POS (default 3 hari)
    const [salesPeriod, setSalesPeriod] = useState<number>(3);

    // State untuk promo
    const [isPromo, setIsPromo] = useState(false);
    const [promoPrice, setPromoPrice] = useState('');
    const [promoLabel, setPromoLabel] = useState('');
    const [promoStart, setPromoStart] = useState('');
    const [promoEnd, setPromoEnd] = useState('');

    // State untuk stock tracking
    const [trackStock, setTrackStock] = useState(false);

    // State untuk availability
    const [isAvailable, setIsAvailable] = useState(true);

    // State untuk best seller (akan dihitung dari analytics)
    const [bestSellers, setBestSellers] = useState<Array<{
        product: Product;
        quantity: number;
        revenue: number;
        periodDays: number;
        rank: number;
    }>>([]);

    // State untuk editing kategori
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    // Gunakan currency formatter
    const { format } = useCurrencyFormatter();

    // ==================== EVENT LISTENER ====================
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModalOpen) {
                handleCloseModal();
            }
            if (e.key === 'Enter' && isModalOpen && e.target instanceof HTMLInputElement) {
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

    // ==================== RESET FORM EFFECT ====================
    useEffect(() => {
        if (isModalOpen && editingProduct) {
            setIsPromo(editingProduct.isPromo || false);
            setPromoPrice(editingProduct.promoPrice?.toString() || '');
            setPromoLabel(editingProduct.promoLabel || '');
            setPromoStart(editingProduct.promoStart || '');
            setPromoEnd(editingProduct.promoEnd || '');
            setTrackStock(editingProduct.stock !== -1);
            setIsAvailable(editingProduct.isAvailable !== false);
        } else if (!isModalOpen) {
            resetForm();
        }
    }, [isModalOpen, editingProduct]);

    // ==================== HITUNG BEST SELLERS ====================
    useEffect(() => {
        if (transactions.length > 0 && products.length > 0) {
            const calculatedBestSellers = getBestSellersByPeriod(
                transactions,
                products,
                salesPeriod,
                3, // Ambil semua untuk ranking
                0    // Tidak ada batas minimal
            );

            setBestSellers(calculatedBestSellers);
        }
    }, [transactions, products, salesPeriod]);

    // ==================== FORMATTING FUNCTIONS ====================
    const formatCategoryName = (name: string): string => {
        return name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
    };

    const formatProductName = (name: string): string => {
        return name
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const checkProductExists = (name: string, category: string): boolean => {
        const formattedName = formatProductName(name);
        const formattedCategory = formatCategoryName(category);

        return products.some(product =>
            product.name.toLowerCase() === formattedName.toLowerCase() &&
            product.category.toLowerCase() === formattedCategory.toLowerCase()
        );
    };

    // ==================== CATEGORY FUNCTIONS ====================
    const handleAddCategory = () => {
        if (newCatName.trim()) {
            const formattedName = formatCategoryName(newCatName);
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

    const handleDeleteCategory = (categoryName: string) => {
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

    const handleEditCategory = (categoryName: string) => {
        setEditingCategory(categoryName);
        setEditingCategoryName(categoryName);
    };

    const handleSaveCategoryEdit = (originalName: string) => {
        if (editingCategoryName.trim() && editingCategoryName !== originalName) {
            const formattedName = formatCategoryName(editingCategoryName);

            // Check if new name already exists
            const categoryExists = categories.some(
                cat => cat.toLowerCase() === formattedName.toLowerCase() && cat !== originalName
            );

            if (categoryExists) {
                alert(`Category "${formattedName}" already exists!`);
                return;
            }

            // Update category name in all products
            const updatedProducts = products.map(product => {
                if (product.category === originalName) {
                    return {
                        ...product,
                        category: formattedName
                    };
                }
                return product;
            });

            // Update all products with new category name
            updatedProducts.forEach(product => {
                updateProduct(product);
            });

            // Hapus kategori lama dan tambahkan yang baru
            // Ini akan membuat urutan berubah, tapi kita tidak punya pilihan lain
            // karena tidak ada fungsi updateCategories
            deleteCategory(originalName);
            addCategory(formattedName);

            // Update active category if needed
            if (activeCategory === originalName) {
                setActiveCategory(formattedName);
            }

            // Reset editing state
            setEditingCategory(null);
            setEditingCategoryName('');
        }
    };

    const handleCancelCategoryEdit = () => {
        setEditingCategory(null);
        setEditingCategoryName('');
    };

    const handleCategoryNameChange = (value: string) => {
        setEditingCategoryName(value);
    };

    // ==================== IMAGE HANDLING ====================
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const compressImage = (base64Str: string, originalSizeKB: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');

                let targetWidth = img.width;
                let targetHeight = img.height;

                let maxDimension = 800;
                if (originalSizeKB > 8000) {
                    maxDimension = 500;
                } else if (originalSizeKB > 5000) {
                    maxDimension = 600;
                } else if (originalSizeKB > 2000) {
                    maxDimension = 700;
                }

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
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    let quality = 0.7;
                    if (originalSizeKB > 8000) {
                        quality = 0.4;
                    } else if (originalSizeKB > 5000) {
                        quality = 0.5;
                    } else if (originalSizeKB > 2000) {
                        quality = 0.6;
                    }

                    const mimeType = canvas.toDataURL('image/webp', quality).startsWith('data:image/webp')
                        ? 'image/webp'
                        : 'image/jpeg';

                    const compressedDataUrl = canvas.toDataURL(mimeType, quality);
                    const compressedSizeKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

                    if (compressedSizeKB > 500) {
                        const finalQuality = Math.max(0.2, quality * 0.7);
                        const finalCompressed = canvas.toDataURL(mimeType, finalQuality);
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

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert('Hanya file gambar yang diperbolehkan (JPEG, PNG, WebP, GIF)');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert(`File terlalu besar (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksimal 10MB.`);
            return;
        }

        const fileSizeKB = Math.round(file.size / 1024);

        if (fileSizeKB > 8000) {
            if (!confirm(`File besar (${(fileSizeKB / 1024).toFixed(1)}MB). Proses kompresi mungkin membutuhkan waktu. Lanjutkan?`)) {
                return;
            }
        }

        const reader = new FileReader();

        reader.onloadend = async () => {
            try {
                const result = reader.result as string;
                const compressed = await compressImage(result, fileSizeKB);
                const compressedSizeKB = Math.round((compressed.length * 3) / 4 / 1024);

                if (compressedSizeKB > 300) {
                    alert(`Gambar masih terlalu besar setelah kompresi (${compressedSizeKB}KB). Silakan pilih gambar dengan resolusi lebih kecil.`);
                    return;
                }

                setPreviewImage(compressed);
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

    const resetForm = () => {
        setIsPromo(false);
        setPromoPrice('');
        setPromoLabel('');
        setPromoStart('');
        setPromoEnd('');
        setTrackStock(false);
        setIsAvailable(true);
    };

    const handleOpenEditModal = (product: Product) => {
        setEditingProduct(product);
        setPreviewImage(product.image || null);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
        setPreviewImage(null);
        resetForm();
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const productName = formData.get('name') as string;
        const category = formData.get('category') as string;
        const formattedProductName = formatProductName(productName);
        const formattedCategory = formatCategoryName(category);

        if (!editingProduct && checkProductExists(productName, category)) {
            alert(`Product "${formattedProductName}" already exists in category "${formattedCategory}"!`);
            return;
        }

        // Dapatkan sales data dari bestSellers
        const salesData = bestSellers.find(bs => bs.product.id === editingProduct?.id);

        const currentPrice = Number(formData.get('price'));
        const promoPriceNum = isPromo && promoPrice ? Number(promoPrice) : 0;

        // Validation: promo price must be less than normal price
        if (isPromo && promoPriceNum > 0 && promoPriceNum >= currentPrice) {
            alert('Harga promo harus lebih kecil dari harga normal!');
            return;
        }

        const productData = {
            name: formattedProductName,
            description: '', // Opsional di backend
            price: currentPrice,
            category: formattedCategory,
            stock: trackStock ? Number(formData.get('stock')) : -1,
            minStock: trackStock ? Number(formData.get('minStock')) || 0 : 0,
            cost: Number(formData.get('cost')) || 0,
            image: previewImage || undefined,

            // Availability
            isAvailable: isAvailable,

            // Promo fields
            isPromo: isPromo,
            promoPrice: isPromo && promoPriceNum > 0 ? promoPriceNum : undefined,
            promoLabel: isPromo && promoLabel ? promoLabel : undefined,
            promoStart: isPromo && promoStart ? promoStart : undefined,
            promoEnd: isPromo && promoEnd ? promoEnd : undefined,

            // discount: auto-derive percentage from promoPrice for backend storage
            discount: isPromo && promoPriceNum > 0 && promoPriceNum < currentPrice
                ? Math.round(((currentPrice - promoPriceNum) / currentPrice) * 100)
                : 0,
        };

        editingProduct ? updateProduct({ ...productData, id: editingProduct.id } as any) : addProduct(productData as any);
        handleCloseModal();
    };

    // ==================== CALCULATION FUNCTIONS ====================
    const getPeriodLabel = (days: number) => {
        if (days === 1) return 'Today';
        if (days === 3) return '3 Days';
        if (days === 7) return '7 Days';
        if (days === 14) return '14 Days';
        return `${days} Days`;
    };

    // Calculate category stats
    const categoryStats = useMemo(() => {
        return categories.map(cat => {
            const catProducts = products.filter(p => p.category === cat);
            const totalItems = catProducts.length;
            const trackedProducts = catProducts.filter(p => isStockTracked(p));
            const totalStock = trackedProducts.reduce((sum, p) => sum + p.stock, 0);
            const totalValue = trackedProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
            const lowStockItems = trackedProducts.filter(p => isLowStock(p)).length;

            // Hitung sales per category dari best sellers
            let categorySales = 0;
            catProducts.forEach(product => {
                const bestSellerData = bestSellers.find(bs => bs.product.id === product.id);
                if (bestSellerData) {
                    categorySales += bestSellerData.quantity;
                }
            });

            return {
                name: cat,
                totalItems,
                totalStock,
                totalValue,
                lowStockItems,
                categorySales,
                gradient: CATEGORY_GRADIENTS[categories.indexOf(cat) % CATEGORY_GRADIENTS.length],
                canDelete: catProducts.length === 0,
                isEditing: editingCategory === cat,
                editingName: editingCategoryName
            };
        });
    }, [categories, products, bestSellers, editingCategory, editingCategoryName]);

    // Add "All" category stat
    const allCategoryStat = useMemo(() => {
        const totalSales = bestSellers.reduce((sum, bs) => sum + bs.quantity, 0);

        const trackedAll = products.filter(p => isStockTracked(p));
        return {
            name: 'all',
            totalItems: products.length,
            totalStock: trackedAll.reduce((sum, p) => sum + p.stock, 0),
            totalValue: trackedAll.reduce((sum, p) => sum + (p.price * p.stock), 0),
            lowStockItems: trackedAll.filter(p => isLowStock(p)).length,
            totalSales,
            gradient: 'bg-gradient-to-r from-gray-600 to-gray-800',
            canDelete: false
        };
    }, [products, bestSellers]);

    // Sort products dengan urutan prioritas
    const sortedProducts = useMemo(() => {
        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
            return matchesSearch && matchesCategory;
        });

        // Buat map untuk best seller data
        const bestSellerMap = new Map(bestSellers.map(bs => [bs.product.id, bs]));

        // Urutkan berdasarkan prioritas:
        // 1. Promo products di atas
        // 2. Best sellers (berdasarkan rank/quantity) di bawah promo
        // 3. Lainnya diurutkan berdasarkan total penjualan
        return filtered.sort((a, b) => {
            // Check promo status
            const aIsPromo = a.isPromo && a.promoPrice && a.promoPrice > 0;
            const bIsPromo = b.isPromo && b.promoPrice && b.promoPrice > 0;

            // Jika satu promo dan yang lain tidak, promo di atas
            if (aIsPromo && !bIsPromo) return -1;
            if (!aIsPromo && bIsPromo) return 1;

            // Jika keduanya promo atau keduanya tidak promo
            // Cek best seller status
            const aBestSeller = bestSellerMap.get(a.id);
            const bBestSeller = bestSellerMap.get(b.id);

            // Jika satu best seller dan yang lain tidak
            if (aBestSeller && !bBestSeller) return -1;
            if (!aBestSeller && bBestSeller) return 1;

            // Jika keduanya best seller, urutkan berdasarkan rank
            if (aBestSeller && bBestSeller) {
                return aBestSeller.rank - bBestSeller.rank;
            }

            // Jika keduanya bukan best seller, urutkan berdasarkan total penjualan
            const aSales = aBestSeller?.quantity || 0;
            const bSales = bBestSeller?.quantity || 0;

            if (bSales !== aSales) {
                return bSales - aSales; // Descending
            }

            // Jika penjualan sama, urutkan berdasarkan nama
            return a.name.localeCompare(b.name);
        });
    }, [products, searchTerm, activeCategory, bestSellers]);

    // Calculate inventory summary
    const totalInventoryValue = useMemo(() =>
        products.filter(p => isStockTracked(p)).reduce((sum, p) => sum + (p.price * p.stock), 0),
        [products]
    );

    const totalProducts = products.length;
    const lowStockCount = products.filter(p => isLowStock(p)).length;

    // Hitung promo aktif
    const activePromoProducts = products.filter(p => getEffectivePrice(p).isPromoActive);
    const promoCount = activePromoProducts.length;

    // Hitung best seller count
    const bestSellerCount = bestSellers.length;

    // ==================== RENDER FUNCTIONS ====================
    const renderProductsTab = () => (
        <div className={`rounded-3xl border ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
            {/* Product List Header */}
            <div className={`p-5 border-b ${isDark ? 'border-stone-800' : 'border-gray-100'}`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Left: Search and Filter */}
                    <div className="flex-1 max-w-lg">
                        <div className="flex items-center gap-3">
                            {/* New Product Button */}
                            <button
                                onClick={() => setModalOpen(true)}
                                className="group flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-amber-500/25 active:scale-95 flex-shrink-0"
                            >
                                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                                <span className="text-sm">New Product</span>
                            </button>

                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search products by name or category..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 text-sm outline-none transition-all ${isDark
                                            ? 'bg-stone-950 border-stone-800 text-white focus:border-amber-500'
                                            : 'bg-gray-50 border-gray-200 focus:border-amber-500'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Active Filters */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${isDark ? 'bg-stone-800 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                <Filter size={10} />
                                {activeCategory === 'all' ? 'All Categories' : activeCategory}
                            </div>
                            {searchTerm && (
                                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${isDark ? 'bg-stone-800 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                    <Search size={10} />
                                    Search: "{searchTerm}"
                                </div>
                            )}
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-700'}`}>
                                {sortedProducts.length} Products
                            </div>
                            {promoCount > 0 && (
                                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${isDark ? 'bg-red-700 text-red-200' : 'bg-red-100 text-red-700'}`}>
                                    <Percent size={10} />
                                    {promoCount} Promo Active
                                </div>
                            )}
                            {bestSellerCount > 0 && (
                                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${isDark ? 'bg-amber-700 text-amber-200' : 'bg-amber-100 text-amber-700'}`}>
                                    <Trophy size={10} />
                                    {bestSellerCount} Best Sellers
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Sales Period Filter - SAMA DENGAN POS */}
                    <div className="flex items-center gap-3">
                        <div className={`text-xs font-bold ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
                            Sales Period:
                        </div>
                        <div className={`flex items-center gap-1 p-1 rounded-2xl ${isDark ? 'bg-stone-800' : 'bg-gray-100'}`}>
                            {[1, 3, 7, 30].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => setSalesPeriod(days)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${salesPeriod === days
                                            ? isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'
                                            : isDark ? 'text-stone-400 hover:text-white hover:bg-stone-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                        }`}
                                    title={`Sales data for ${days} day${days > 1 ? 's' : ''}`}
                                >
                                    {getPeriodLabel(days)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Table */}
            <div className="p-5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className={`${isDark ? 'bg-stone-950/50' : 'bg-gray-50'}`}>
                            <tr className={`text-xs uppercase font-bold tracking-tight ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                <th className="p-4">Product</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Price</th>
                                <th className="p-4 text-center">Disc</th>
                                <th className="p-4 text-right">Stock</th>
                                <th className="p-4 text-right">Sales ({getPeriodLabel(salesPeriod)})</th>
                                <th className="p-4 text-right">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-stone-800' : 'divide-gray-100'}`}>
                            {sortedProducts.map((product) => {
                                const { price: effectivePrice, isPromoActive, discountPercent } = getEffectivePrice(product);
                                const margin = product.price - (product.cost || 0);
                                const marginPercent = ((margin / product.price) * 100).toFixed(1);
                                const status = getStockStatus(product);

                                // Get sales data dari bestSellers
                                const bestSellerData = bestSellers.find(bs => bs.product.id === product.id);
                                const productSales = bestSellerData?.quantity || 0;
                                const productRank = bestSellerData?.rank;

                                return (
                                    <tr key={product.id} className={`group transition-colors ${isDark ? 'hover:bg-stone-800/30' : 'hover:bg-gray-50/50'} ${product.isAvailable === false ? 'opacity-60' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 ${isDark ? 'bg-stone-950' : 'bg-gray-100'}`}>
                                                    {product.image ? (
                                                        <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className={`w-5 h-5 ${isDark ? 'text-stone-800' : 'text-stone-400'}`} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {product.name}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {/* PRIORITAS: PROMO DIATAS BEST SELLER */}
                                                        {isPromoActive && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white whitespace-nowrap">
                                                                {product.promoLabel || `-${discountPercent}%`}
                                                            </span>
                                                        )}
                                                        {/* BEST SELLER DI BAWAH PROMO */}
                                                        {bestSellerData && productRank && productRank <= 10 && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white whitespace-nowrap">
                                                                <Trophy size={8} className="inline mr-1" />
                                                                #{productRank} Best Seller
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-600'}`}>
                                                            Margin: {marginPercent}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-xl text-xs font-bold ${isDark ? 'bg-stone-800 text-stone-300' : 'bg-gray-100 text-gray-700'}`}>
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                {isPromoActive ? (
                                                    <>
                                                        <p className={`font-bold text-red-500 dark:text-red-400`}>
                                                            {format(effectivePrice)}
                                                        </p>
                                                        <p className={`text-[10px] line-through ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                                            {format(product.price)}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {format(product.price)}
                                                    </p>
                                                )}
                                                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                                    Cost: {format(product.cost || 0)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {discountPercent > 0 ? (
                                                <span className="px-2 py-1 rounded-xl text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    {discountPercent}%
                                                </span>
                                            ) : (
                                                <span className="text-stone-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-bold text-lg ${status === 'unlimited' ? (isDark ? 'text-green-400' : 'text-green-600') : status === 'low_stock' ? 'text-red-600 dark:text-red-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {getStockDisplay(product)}
                                                </span>
                                                <span className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                                    {status === 'unlimited' ? 'unlimited' : product.unit}
                                                </span>
                                                {status !== 'unlimited' && product.minStock > 0 && (
                                                    <span className={`text-[10px] ${isDark ? 'text-stone-700' : 'text-stone-500'}`}>
                                                        Min: {product.minStock}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1">
                                                    <span className={`font-bold ${productSales > 0 ? 'text-green-600 dark:text-green-400' : 'text-stone-500'}`}>
                                                        {productSales}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                                    last {salesPeriod} day{salesPeriod > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            {status === 'unavailable' ? (
                                                <span className={`px-2 py-1 rounded-xl text-xs font-bold ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-200 text-gray-600'}`}>
                                                    Unavailable
                                                </span>
                                            ) : status === 'unlimited' ? (
                                                <span className={`px-2 py-1 rounded-xl text-xs font-bold ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                                                    Available
                                                </span>
                                            ) : status === 'out_of_stock' ? (
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap leading-tight text-center ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
                                                    Out of Stock
                                                </span>

                                            ) : status === 'low_stock' ? (
                                                <span className={`px-2 py-1 rounded-xl text-xs font-bold ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className={`px-2 py-1 rounded-xl text-xs font-bold ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                                                    In Stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(product)}
                                                    className={`p-2 rounded-xl transition-all ${isDark ? 'bg-stone-800 text-amber-400 hover:bg-amber-500/20' : 'bg-gray-100 text-amber-600 hover:bg-amber-600 hover:text-white'}`}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(`Delete ${product.name}?`)) deleteProduct(product.id); }}
                                                    className={`p-2 rounded-xl transition-all ${isDark ? 'bg-stone-800 text-red-400 hover:bg-red-500/20' : 'bg-gray-100 text-red-600 hover:bg-red-600 hover:text-white'}`}
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

                    {/* Empty State */}
                    {sortedProducts.length === 0 && (
                        <div className="text-center py-12">
                            <Package className={`w-16 h-16 mx-auto mb-3 ${isDark ? 'text-stone-800' : 'text-stone-300'}`} />
                            <h3 className={`font-bold ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>No products found</h3>
                            <p className={`text-sm mt-1 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                                {searchTerm ? `No products match "${searchTerm}"` : 'No products available'}
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className={`mt-3 px-4 py-2 text-sm font-medium rounded-xl transition-all ${isDark
                                            ? 'bg-stone-800 hover:bg-stone-700 text-white'
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
        </div>
    );

    const renderCategoriesTab = () => (
        <div className={`p-6 rounded-3xl ${isDark ? 'bg-stone-950' : 'bg-white'} shadow-lg border ${isDark ? 'border-stone-900' : 'border-gray-200'}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div className="flex items-center gap-3 mb-4 md:mb-0">
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-stone-900' : 'bg-amber-50'}`}>
                        <Tag className={isDark ? 'text-amber-400' : 'text-amber-600'} size={24} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Category Management</h2>
                        <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Organize and monitor your inventory categories</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-full ${isDark ? 'bg-stone-900 text-amber-400' : 'bg-amber-100 text-amber-700'} text-sm font-semibold flex items-center gap-2`}>
                        <Filter size={14} />
                        <span>{categories.length} Categories</span>
                    </div>
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium ${activeCategory === 'all' ? (isDark ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white') : (isDark ? 'bg-stone-900 text-stone-300' : 'bg-gray-100 text-gray-700')}`}
                    >
                        View All
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div
                className={`mb-8 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-xl ${allCategoryStat.gradient} ${activeCategory === 'all' ? 'ring-2 ring-amber-400' : ''}`}
                onClick={() => setActiveCategory('all')}
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 text-white">
                            <h3 className="text-xl font-bold">All Products Summary</h3>
                            <ChevronRight size={18} className={`transition-transform ${activeCategory === 'all' ? 'rotate-90' : ''}`} />
                        </div>
                        <p className="text-white/80 text-sm">Complete inventory overview across all categories</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${isDark ? 'bg-white/20' : 'bg-white/30'} text-white text-sm font-bold`}>
                        {format(allCategoryStat.totalValue)} Total Value
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                        <div className="text-2xl font-black text-white mb-1">{allCategoryStat.totalItems}</div>
                        <div className="text-xs text-white/80">Total Items</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                        <div className="text-2xl font-black text-white mb-1">{allCategoryStat.totalStock}</div>
                        <div className="text-xs text-white/80">In Stock</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                        <div className="text-2xl font-black text-white mb-1">{allCategoryStat.lowStockItems}</div>
                        <div className="text-xs text-white/80">Low Stock</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                        <div className="text-2xl font-black text-white mb-1">{allCategoryStat.totalSales}</div>
                        <div className="text-xs text-white/80">Recent Sales</div>
                    </div>
                </div>
            </div>

            {/* Categories Table */}
            <div className={`rounded-2xl overflow-hidden border ${isDark ? 'border-stone-900' : 'border-gray-200'}`}>
                {/* Table Header */}
                <div className={`grid grid-cols-12 gap-4 p-4 ${isDark ? 'bg-stone-900' : 'bg-gray-50'} border-b ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
                    <div className="col-span-4 font-semibold text-sm">CATEGORY</div>
                    <div className="col-span-2 font-semibold text-sm text-center">ITEMS</div>
                    <div className="col-span-2 font-semibold text-sm text-center">STOCK VALUE</div>
                    <div className="col-span-2 font-semibold text-sm text-center">SALES</div>
                    <div className="col-span-2 font-semibold text-sm text-center">ACTIONS</div>
                </div>

                {/* Table Body */}
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide horizontal-scrollbar-thin">
                    {categoryStats.map((stat) => (
                        <div
                            key={stat.name}
                            className={`grid grid-cols-12 gap-4 p-4 items-center border-b ${isDark ? 'border-stone-900 hover:bg-stone-900/50' : 'border-gray-100 hover:bg-gray-50'} transition-colors ${activeCategory === stat.name ? (isDark ? 'bg-stone-900' : 'bg-amber-50/50') : ''}`}
                        >
                            {/* Category Name - Editable */}
                            <div className="col-span-4">
                                {stat.isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={stat.editingName || stat.name}
                                            onChange={(e) => handleCategoryNameChange(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveCategoryEdit(stat.name);
                                                }
                                                if (e.key === 'Escape') {
                                                    handleCancelCategoryEdit();
                                                }
                                            }}
                                            autoFocus
                                            className={`flex-1 p-2 rounded-xl text-sm font-medium ${isDark
                                                ? 'bg-stone-800 border-stone-700 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'}`}
                                        />
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleSaveCategoryEdit(stat.name)}
                                                className="p-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white"
                                                title="Save changes"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={handleCancelCategoryEdit}
                                                className="p-1.5 rounded-xl bg-gray-500 hover:bg-gray-600 text-white"
                                                title="Cancel"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="flex items-center gap-3 cursor-pointer"
                                        onClick={() => {
                                            setActiveCategory(stat.name);
                                            setActiveTab('products');
                                        }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.gradient}`}>
                                            <Tag size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                <span className={isDark ? 'text-white' : 'text-gray-900'}>{stat.name}</span>
                                                {stat.lowStockItems > 0 && (
                                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                                        {stat.lowStockItems} low
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                                {stat.totalItems} product{stat.totalItems !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Items Count */}
                            <div className="col-span-2">
                                <div className="text-center">
                                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.totalItems}</div>
                                    <div className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                        {stat.totalStock} in stock
                                    </div>
                                </div>
                            </div>

                            {/* Stock Value */}
                            <div className="col-span-2">
                                <div className="text-center">
                                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{format(stat.totalValue)}</div>
                                    <div className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                        {Math.round((stat.totalStock / stat.totalItems) * 100) || 0}% stocked
                                    </div>
                                </div>
                            </div>

                            {/* Sales */}
                            <div className="col-span-2">
                                <div className="text-center">
                                    <div className={`text-lg font-bold flex items-center justify-center gap-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stat.categorySales}
                                        <TrendingUp size={14} className="text-green-500" />
                                    </div>
                                    <div className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                        {getPeriodLabel(salesPeriod)}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2">
                                <div className="flex items-center justify-center gap-2">
                                    {!stat.isEditing && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveCategory(stat.name);
                                                    setActiveTab('products');
                                                }}
                                                className={`p-2 rounded-xl ${isDark ? 'hover:bg-stone-800' : 'hover:bg-gray-100'} transition-colors`}
                                                title="View products"
                                            >
                                                <Eye size={16} className={isDark ? 'text-stone-400' : 'text-gray-600'} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditCategory(stat.name);
                                                }}
                                                className={`p-2 rounded-xl ${isDark ? 'hover:bg-amber-500/20 text-amber-400' : 'hover:bg-amber-100 text-amber-600'} transition-colors`}
                                                title={`Edit "${stat.name}" category`}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCategory(stat.name);
                                                }}
                                                disabled={!stat.canDelete}
                                                className={`p-2 rounded-xl transition-colors ${stat.canDelete
                                                    ? (isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600')
                                                    : (isDark ? 'text-stone-700 cursor-not-allowed' : 'text-stone-400 cursor-not-allowed')}`}
                                                title={stat.canDelete ? `Delete "${stat.name}" category` : "Category has products"}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                    {stat.isEditing && (
                                        <div className="text-xs text-stone-500 italic">
                                            Editing...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add New Category Row */}
                <div className={`p-4 ${isDark ? 'bg-stone-950/50' : 'bg-gray-50/50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-stone-900' : 'bg-gray-200'}`}>
                            <Plus size={20} className={isDark ? 'text-stone-400' : 'text-stone-500'} />
                        </div>
                        <div className="flex-1">
                            <input
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                                onBlur={(e) => {
                                    if (e.target.value) {
                                        setNewCatName(formatCategoryName(e.target.value));
                                    }
                                }}
                                className={`w-full p-3 rounded-2xl text-sm ${isDark
                                    ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                placeholder="Enter new category name..."
                            />
                        </div>
                        <button
                            onClick={handleAddCategory}
                            disabled={!newCatName.trim()}
                            className={`px-6 py-3 rounded-2xl font-medium transition-all ${newCatName.trim()
                                ? (isDark ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white')
                                : (isDark ? 'bg-stone-900 text-stone-500 cursor-not-allowed' : 'bg-gray-200 text-stone-400 cursor-not-allowed')}`}
                        >
                            Add Category
                        </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <div className={`px-2 py-1 rounded ${isDark ? 'bg-stone-900 text-stone-400' : 'bg-gray-100 text-stone-500'}`}>
                            First letter auto-capitalized
                        </div>
                        <div className={`px-2 py-1 rounded ${isDark ? 'bg-stone-900 text-stone-400' : 'bg-gray-100 text-stone-500'}`}>
                            Press Enter to save
                        </div>
                        <div className={`px-2 py-1 rounded ${isDark ? 'bg-stone-900 text-stone-400' : 'bg-gray-100 text-stone-500'}`}>
                            Click edit icon to rename
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Footer */}
            <div className={`mt-6 p-4 rounded-2xl ${isDark ? 'bg-stone-900' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className={`text-sm font-semibold ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Total Categories</div>
                        <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{categories.length}</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-sm font-semibold ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Total Products</div>
                        <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{allCategoryStat.totalItems}</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-sm font-semibold ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Low Stock Alerts</div>
                        <div className={`text-xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{allCategoryStat.lowStockItems}</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-sm font-semibold ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Active Category</div>
                        <div className={`text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            {activeCategory === 'all' ? 'All Products' : activeCategory}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        if (activeTab === 'products') {
            return renderProductsTab();
        } else {
            return renderCategoriesTab();
        }
    };

    return (
        <div className={`space-y-6 animate-in fade-in duration-500`}>
            {/* Header Section with Tabs */}
            <div className={`rounded-3xl border ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Inventory <span className="text-amber-500">Hub</span>
                            </h1>
                            <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                Manage your digital menu and stock availability
                            </p>
                        </div>

                        {/* Inventory Stats */}
                        <div className="flex flex-wrap gap-3">
                            <div className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-stone-800/50' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                    <DollarSign className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Total Value</p>
                                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {format(totalInventoryValue)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-stone-800/50' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                    <Package className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Total Items</p>
                                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalProducts}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`px-4 py-3 rounded-2xl ${lowStockCount > 0 ? (isDark ? 'bg-red-900/30' : 'bg-red-50') : (isDark ? 'bg-stone-800/50' : 'bg-gray-50')}`}>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className={`w-5 h-5 ${lowStockCount > 0 ? 'text-red-500' : isDark ? 'text-stone-400' : 'text-stone-500'}`} />
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Low Stock</p>
                                        <p className={`font-bold ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {lowStockCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`px-4 py-3 rounded-2xl ${bestSellerCount > 0 ? (isDark ? 'bg-amber-900/30' : 'bg-amber-50') : (isDark ? 'bg-stone-800/50' : 'bg-gray-50')}`}>
                                <div className="flex items-center gap-2">
                                    <Trophy className={`w-5 h-5 ${bestSellerCount > 0 ? 'text-amber-500' : isDark ? 'text-stone-400' : 'text-stone-500'}`} />
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Best Sellers</p>
                                        <p className={`font-bold ${bestSellerCount > 0 ? 'text-amber-600 dark:text-amber-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {bestSellerCount}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mt-6">
                        <div className={`flex border-b ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-6 py-3 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'products'
                                        ? isDark ? 'text-amber-400' : 'text-amber-600'
                                        : isDark ? 'text-stone-400 hover:text-stone-300' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Package size={16} />
                                Products
                                {activeTab === 'products' && (
                                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-amber-400' : 'bg-amber-600'}`} />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('categories')}
                                className={`px-6 py-3 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'categories'
                                        ? isDark ? 'text-amber-400' : 'text-amber-600'
                                        : isDark ? 'text-stone-400 hover:text-stone-300' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Tag size={16} />
                                Categories
                                {activeTab === 'categories' && (
                                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-amber-400' : 'bg-amber-600'}`} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {renderContent()}

            {/* Modern Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-gray-100'}`}
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col h-full"
                        >
                            {/* Header Modal */}
                            <div className={`p-5 border-b ${isDark ? 'border-stone-800' : 'border-gray-100'} flex-shrink-0`}>
                                <div className="flex justify-between items-center">
                                    <h2 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {editingProduct ? 'Edit Item' : 'New Product'}
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
                            <div className="flex-1 overflow-y-auto max-h-[60vh] p-5 horizontal-scrollbar-thin">
                                <div className="space-y-4">
                                    {/* Profile Image Upload */}
                                    <div className="flex justify-center relative group">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${isDark ? 'bg-stone-950 border-stone-800 hover:border-amber-500' : 'bg-gray-50 border-gray-200 hover:border-amber-500'
                                                }`}
                                        >
                                            {previewImage ? (
                                                <img src={previewImage} className="w-full h-full object-cover" alt="Product preview" />
                                            ) : (
                                                <div className="text-center text-stone-400">
                                                    <Camera size={20} className="mx-auto" />
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                                    </div>

                                    {/* Availability Toggle */}
                                    <div className={`p-4 rounded-2xl transition-all duration-300 ${isAvailable ? (isDark ? 'bg-green-900/20 border border-green-800/50' : 'bg-green-50 border border-green-200') : (isDark ? 'bg-stone-800/50 border border-stone-700' : 'bg-gray-100 border border-gray-300')}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                <label className="text-sm font-bold">Product Available</label>
                                            </div>
                                            <div className="relative">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAvailable}
                                                        onChange={(e) => setIsAvailable(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className={`relative w-10 h-6 rounded-full peer ${isDark ? 'bg-stone-700 peer-checked:bg-green-500' : 'bg-gray-300 peer-checked:bg-green-500'} peer-focus:ring-2 peer-focus:ring-green-300 transition-colors`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isAvailable ? 'translate-x-4' : ''}`}></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                        {!isAvailable && (
                                            <p className={`text-xs mt-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                ⚠️ Produk tidak akan muncul sebagai tersedia di kasir
                                            </p>
                                        )}
                                        {isAvailable && (
                                            <p className={`text-xs mt-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                                Nonaktifkan jika produk tidak tersedia sementara
                                            </p>
                                        )}
                                    </div>

                                    {/* Basic Information Section */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-amber-500 ml-1 tracking-widest">Name</label>
                                            <input
                                                name="name"
                                                defaultValue={editingProduct?.name}
                                                className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm transition-all mt-1 ${isDark ? 'border-stone-800 focus:border-amber-500 text-white' : 'border-gray-100 focus:border-amber-500 text-gray-900'}`}
                                                required
                                                placeholder="Product Name"
                                                onBlur={(e) => {
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
                                                className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-stone-800 text-white' : 'border-gray-100 text-gray-900'}`}
                                            >
                                                {categories.map(cat => <option key={cat} value={cat} className={isDark ? "bg-stone-900 text-white" : "bg-white text-gray-900"}>{cat}</option>)}
                                            </select>
                                        </div>

                                        {/* Price & Stock Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-stone-500 ml-1">Cost</label>
                                                <input
                                                    name="cost"
                                                    type="number"
                                                    defaultValue={editingProduct?.cost}
                                                    className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-stone-800 text-white' : 'border-gray-100'}`}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-stone-500 ml-1">Price</label>
                                                <input
                                                    name="price"
                                                    type="number"
                                                    defaultValue={editingProduct?.price}
                                                    className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-stone-800 text-white' : 'border-gray-100'}`}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Track Stock Toggle */}
                                        <div className={`p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-stone-800/50 border border-stone-700' : 'bg-amber-50 border border-amber-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Package className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                                                    <label className="text-sm font-bold">Track Stock</label>
                                                </div>
                                                <div className="relative">
                                                    <label className="inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={trackStock}
                                                            onChange={(e) => setTrackStock(e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className={`relative w-10 h-6 rounded-full peer ${isDark ? 'bg-stone-700 peer-checked:bg-amber-500' : 'bg-gray-300 peer-checked:bg-amber-500'} peer-focus:ring-2 peer-focus:ring-amber-300 transition-colors`}>
                                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${trackStock ? 'translate-x-4' : ''}`}></div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>

                                            {trackStock && (
                                                <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div>
                                                        <label className="text-[9px] font-black uppercase text-stone-500 ml-1">Stock</label>
                                                        <input
                                                            name="stock"
                                                            type="number"
                                                            defaultValue={editingProduct?.stock !== -1 ? editingProduct?.stock : ''}
                                                            className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-stone-700 focus:border-amber-500 text-white' : 'border-amber-200 focus:border-amber-500 text-gray-900'}`}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black uppercase text-stone-500 ml-1">Min Alert</label>
                                                        <input
                                                            name="minStock"
                                                            type="number"
                                                            defaultValue={editingProduct?.minStock}
                                                            className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-stone-700 focus:border-amber-500 text-white' : 'border-amber-200 focus:border-amber-500 text-gray-900'}`}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>


                                    </div>

                                    {/* PROMO SECTION */}
                                    <div className={`p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-stone-800/50 border border-stone-700' : 'bg-amber-50 border border-amber-200'}`}>
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
                                                    <div className={`relative w-10 h-6 rounded-full peer ${isDark ? 'bg-stone-700 peer-checked:bg-amber-500' : 'bg-gray-300 peer-checked:bg-amber-500'} peer-focus:ring-2 peer-focus:ring-amber-300 transition-colors`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isPromo ? 'translate-x-4' : ''}`}></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {isPromo && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-stone-500 ml-1">Harga Promo</label>
                                                    <input
                                                        type="number"
                                                        value={promoPrice}
                                                        onChange={(e) => setPromoPrice(e.target.value)}
                                                        className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-stone-700 focus:border-red-500 text-white' : 'border-amber-200 focus:border-red-500 text-gray-900'}`}
                                                        placeholder="Masukkan harga promo"
                                                        min="0"
                                                    />
                                                    {/* Auto-calculated info line */}
                                                    {(() => {
                                                        const currentPrice = editingProduct?.price || Number((document.querySelector('input[name="price"]') as HTMLInputElement)?.value || 0);
                                                        const pp = Number(promoPrice);
                                                        if (!promoPrice || pp <= 0) return null;
                                                        if (pp >= currentPrice && currentPrice > 0) {
                                                            return (
                                                                <p className={`text-xs mt-1.5 ml-1 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                                                                    ⚠️ Harga promo harus lebih kecil dari harga normal
                                                                </p>
                                                            );
                                                        }
                                                        if (currentPrice > 0) {
                                                            const savings = currentPrice - pp;
                                                            const percent = Math.round((savings / currentPrice) * 100);
                                                            return (
                                                                <p className={`text-xs mt-1.5 ml-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                                                    💡 Hemat {format(savings)} dari {format(currentPrice)} ({percent}% off)
                                                                </p>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-stone-500 ml-1">Promo Label</label>
                                                    <input
                                                        type="text"
                                                        value={promoLabel}
                                                        onChange={(e) => setPromoLabel(e.target.value)}
                                                        className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-stone-700 focus:border-red-500 text-white' : 'border-amber-200 focus:border-red-500 text-gray-900'}`}
                                                        placeholder="e.g., Flash Sale"
                                                        maxLength={20}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-black uppercase text-stone-500 ml-1">Start Date</label>
                                                        <input
                                                            type="date"
                                                            value={promoStart}
                                                            onChange={(e) => setPromoStart(e.target.value)}
                                                            className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-stone-700 focus:border-red-500 text-white' : 'border-amber-200 focus:border-red-500 text-gray-900'}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black uppercase text-stone-500 ml-1">End Date</label>
                                                        <input
                                                            type="date"
                                                            value={promoEnd}
                                                            onChange={(e) => setPromoEnd(e.target.value)}
                                                            className={`w-full p-3 rounded-2xl border-2 bg-transparent outline-none text-sm mt-1 ${isDark ? 'border-stone-700 focus:border-red-500 text-white' : 'border-amber-200 focus:border-red-500 text-gray-900'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className={`p-5 border-t ${isDark ? 'border-stone-800' : 'border-gray-100'} flex-shrink-0`}>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-gray-100 text-stone-500 hover:bg-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase"
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