# E-Menu Public Dinamis - Panduan Implementasi ✅

## 📋 Ringkasan Perubahan

Fitur E-Menu Public kini **dinamis berdasarkan shop slug**, sehingga setiap toko dapat memiliki URL menu uniknya sendiri.

---

## 🔄 Perubahan yang Telah Dibuat

### 1️⃣ **Frontend - App.tsx**
**File:** `Front-End/src/App.tsx`

```tsx
// ❌ SEBELUMNYA (Static)
<Route path="/menu" element={<CustomerMenu />} />

// ✅ SESUDAH (Dynamic dengan shop slug)
<Route path="/menu/:shopSlug" element={<CustomerMenu />} />
```

**Manfaat:**
- Route kini menerima parameter `shopSlug` dari URL
- Setiap toko punya URL uniknya: `/menu/coffee-metro`, `/menu/kopi-jaya`, dll
- Route tetap publik (tanpa autentikasi)

---

### 2️⃣ **Frontend - QRCodeMenuCard.tsx**
**File:** `Front-End/src/components/pos/QRCodeMenuCard.tsx`

```tsx
import { useAuth } from '../../contexts/AuthContext';

export default function QRCodeMenuCard() {
  const { user } = useAuth();  // ✨ Ambil user data

  // ✅ Generate URL dinamis dengan shop slug
  const shopSlug = user?.shop?.slug || 'unknown';
  const menuUrl = `${window.location.origin}/menu/${shopSlug}`;
  
  return (
    // ... QR Code di-generate dengan URL yang benar
  );
}
```

**Fitur:**
- QR Code otomatis menggunakan slug toko dari user yang login
- QR Code yang dicetak akan mengarahkan ke halaman menu yang benar
- Tidak perlu input manual slug

---

### 3️⃣ **Frontend - CustomerMenu.tsx**
**File:** `Front-End/src/pages/CustomerMenu.tsx`

**Perubahan besar:**
```tsx
import { useParams } from 'react-router-dom';

export default function CustomerMenu() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  
  // ✨ States untuk loading, error, dan data
  const [products, setProducts] = useState<Product[]>([]);
  const [shopName, setShopName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch data dari API publik berdasarkan shopSlug
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/public/menu/${shopSlug}`
        );
        
        if (!response.ok) {
          throw new Error('Toko tidak ditemukan');
        }
        
        const data = await response.json();
        setProducts(data.products);
        setShopName(data.shop.name);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [shopSlug]);

  // ✨ Handle loading state dengan Loader2 icon
  if (isLoading) { return <LoadingState /> }
  
  // ✨ Handle error state dengan AlertCircle icon
  if (error && !isLoading) { return <ErrorState /> }
  
  // ✨ Display menu dengan filter category dan search
  return <MenuUI />;
}
```

**Fitur:**
- ✅ Fetch products & categories dinamis dari Supabase via API
- ✅ Loading state dengan spinner
- ✅ Error state dengan pesan yang jelas
- ✅ Empty state untuk menu kosong
- ✅ Display shop info (logo, nama, alamat, telepon)
- ✅ Filter by category dan search
- ✅ Responsive design (mobile & desktop)

---

### 4️⃣ **Backend - Public Router** ✨ (BARU)
**File:** `Back-End/src/routes/public.ts`

```typescript
// GET /api/public/menu/:shopSlug
// - Fetch shop info by slug
// - Fetch available products (is_available = true, stock > 0)
// - Fetch categories untuk shop tersebut
// - Return data yang siap digunakan frontend

// GET /api/public/shop/:shopSlug
// - Hanya fetch shop info (untuk load shop metadata)
```

**Endpoint yang tersedia:**
```bash
GET /api/public/menu/:shopSlug
# Response:
{
  "success": true,
  "shop": {
    "id": "uuid",
    "name": "Coffee Metro",
    "slug": "coffee-metro",
    "address": "Jl. Sudirman No.123",
    "phone": "+62812345678",
    "logo_url": "https://..."
  },
  "products": [
    {
      "id": "uuid",
      "name": "Espresso",
      "price": 25000,
      "stock": 50,
      "isAvailable": true,
      "isPromo": false,
      ...
    }
  ],
  "categories": [
    { "id": "uuid", "name": "Coffee" },
    { "id": "uuid", "name": "Tea" }
  ]
}
```

**Registrasi di app.ts:**
```typescript
// 🔓 Public routes (NO authentication)
app.use('/api/public', publicRouter);
```

---

## 🚀 Cara Menggunakan

### **Untuk Owner/Admin:**

1. **Generate QR Code Menu:**
   - Login ke dashboard
   - Buka Settings → QR Code Menu Digital
   - Klik "Cetak QR Code"
   - QR Code otomatis punya URL yang benar: `/menu/{shop-slug}`

2. **Bagikan ke Pelanggan:**
   - Print & plastik QR Code
   - Letakkan di meja, dinding, atau pintu masuk
   - Pelanggan scan QR → buka menu digital

### **Untuk Pelanggan:**

1. **Akses Menu:**
   - Scan QR Code di toko
   - Atau buka manual: `https://app.com/menu/coffee-metro`
   - Lihat menu yang tersedia (hanya produk available & stock > 0)

2. **Browse Menu:**
   - Cari produk dengan search bar
   - Filter by kategori
   - Lihat harga dan info promosi

3. **Pesan:**
   - Screenshot/foto menu
   - Tunjukkan ke kasir untuk order
   - (Atau cashier bisa lihat menu yang dipesan di dashboard POS)

---

## 🔧 Konfigurasi yang Diperlukan

### **Frontend (.env atau vite config):**
```env
VITE_API_BASE_URL=https://api.point-of-sale.com
# atau untuk local dev:
VITE_API_BASE_URL=http://localhost:3000
```

Pastikan CustomerMenu.tsx menggunakan:
```tsx
const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/public/menu/${shopSlug}`
);
```

### **Backend:**
Tidak perlu konfigurasi tambahan, endpoint publik sudah integrated di app.ts

---

## 📊 Alur Data

```
┌─────────────────────────────────────────────────────────────┐
│ Customer scan QR atau buka /menu/:shopSlug                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌──────────────────────────────┐
         │  React Router Params         │
         │  useParams() → { shopSlug }  │
         └──────────────────┬───────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │  fetch(/api/public/menu/:shopSlug)   │
         │  (CORS enabled, no auth needed)      │
         └──────────────────┬───────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────┐
         │  Backend Route Handler              │
         │  - Query shops by slug              │
         │  - Valid? → Continue                │
         │  - Invalid? → Return 404            │
         └──────────────────┬──────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────┐
         │  Query Products & Categories        │
         │  - WHERE is_available = true        │
         │  - AND stock > 0                    │
         │  - ORDER BY name                    │
         └──────────────────┬──────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────┐
         │  Return JSON Response               │
         │  {                                  │
         │    shop: {...},                     │
         │    products: [...],                 │
         │    categories: [...]                │
         │  }                                  │
         └──────────────────┬──────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────┐
         │  React Frontend                     │
         │  - Parse response                   │
         │  - Set state (products, categories) │
         │  - Render UI                        │
         │  - Handle search & filter           │
         └─────────────────────────────────────┘
```

---

## ✅ Checklist Implementasi

- [x] Route dinamis `/menu/:shopSlug` di App.tsx
- [x] QRCodeMenuCard menggunakan `user?.shop?.slug`
- [x] CustomerMenu fetch data dari API
- [x] Handle loading state
- [x] Handle error state (shop not found, API error)
- [x] Display 404 jika toko tidak ditemukan
- [x] Backend endpoint `/api/public/menu/:shopSlug`
- [x] Filter products active & stock > 0
- [x] Return shop info + products + categories
- [x] CORS configured untuk public access
- [x] Responsive design (mobile + desktop)

---

## 🧪 Testing

### **Manual Testing:**

1. **Login sebagai Owner**
   ```
   - URL: http://localhost:5173/login
   - Email: owner@example.com
   - Password: password123
   ```

2. **Generate QR Code**
   ```
   - Buka Settings → QR Code Menu Digital
   - Check: URL di dalam QR Code correct
   - Print & scan dengan device lain
   ```

3. **Akses Menu dari QR/URL**
   ```
   - Open QR hasil scan
   - Atau: http://localhost:5173/menu/your-shop-slug
   - Should see menu items loading
   - Check: products visible, search works, filter works
   ```

4. **Test Error Handling**
   ```
   - Try invalid slug: http://localhost:5173/menu/invalid-shop-xxx
   - Should: show "Toko tidak ditemukan" error
   ```

### **API Testing dengan cURL:**

```bash
# Get menu data
curl "http://localhost:3000/api/public/menu/coffee-metro"

# Get shop info only
curl "http://localhost:3000/api/public/shop/coffee-metro"

# Test invalid shop
curl "http://localhost:3000/api/public/menu/invalid-slug"
# Expected: 404 error
```

---

## 🔒 Security Notes

✅ **Public endpoints** (`/api/public/*`) tidak memerlukan autentikasi
✅ **CORS enabled** untuk cross-origin requests
✅ **Filtering** hanya menampilkan produk dengan `is_available = true`
✅ **No sensitive data** di response (hanya public menu info)
✅ **Shop slug** bersifat unik tapi public (tidak sensitive)

---

## 🎯 Next Steps (Optional)

1. **Add Analytics:**
   - Track menu views per shop
   - Track QR scans

2. **Enhance Menu:**
   - Add customer notes/special requests
   - QR dengan UTM parameters untuk tracking

3. **Mobile App:**
   - Share menu link to WhatsApp/Email
   - Deep linking support

4. **SEO Optimization:**
   - Meta tags untuk menu pages
   - Structured data (schema.org)

---

## 📝 File yang Diubah

| File | Status | Perubahan |
|------|--------|----------|
| `Front-End/src/App.tsx` | ✅ Modified | Route `/menu` → `/menu/:shopSlug` |
| `Front-End/src/pages/CustomerMenu.tsx` | ✅ Modified | Rewrite dengan dynamic data fetching |
| `Front-End/src/components/pos/QRCodeMenuCard.tsx` | ✅ Modified | Use `user?.shop?.slug` |
| `Back-End/src/routes/public.ts` | ✅ Created | New public endpoints |
| `Back-End/src/app.ts` | ✅ Modified | Register public router |

---

## 💡 Tips & Tricks

### **Custom Shop Slug:**
Jika ingin mengubah slug toko melalui admin panel:
```sql
-- Update shop slug (pastikan unique!)
UPDATE coffeepos.shops 
SET slug = 'my-custom-slug'
WHERE id = 'shop-id';
```

### **Test Multiple Shops:**
```bash
# Create test data
INSERT INTO coffeepos.shops (name, slug, is_active) 
VALUES ('Coffee A', 'coffee-a', true);

INSERT INTO coffeepos.shops (name, slug, is_active) 
VALUES ('Coffee B', 'coffee-b', true);

# Access different menus
http://localhost:5173/menu/coffee-a
http://localhost:5173/menu/coffee-b
```

### **Debug Frontend:**
```tsx
// Di CustomerMenu.tsx, tambahkan untuk debugging:
useEffect(() => {
  console.log('Shop Slug:', shopSlug);
  console.log('Products:', products);
  console.log('Categories:', categories);
}, [shopSlug, products, categories]);
```

---

## 🆘 Troubleshooting

**Q: QR Code URL masih menunjuk ke `/menu` (lama)**
A: Clear browser cache, pastikan update QRCodeMenuCard.tsx dengan `user?.shop?.slug`

**Q: Menu tidak load (loading forever)**
A: Check network tab di DevTools, pastikan endpoint `/api/public/menu/:shopSlug` accessible

**Q: "Toko tidak ditemukan" saat scan QR**
A: Verify shop slug di database, pastikan `is_active = true` untuk shop tersebut

**Q: CORS error saat production**
A: Update `env.corsOrigins` di backend untuk include production domain

---

## 📞 Support

Jika ada pertanyaan atau issue, silakan check:
1. Network tab (DevTools → Network)
2. Backend logs (server console)
3. Database query hasil (`coffeepos.shops`)

---

**✨ Selamat! E-Menu Public Dinamis sudah siap digunakan! ✨**
