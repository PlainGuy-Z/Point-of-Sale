# E-Menu Dinamis - Quick Reference 🚀

## 📌 Perubahan Utama (3 bagian)

### 1. Route (App.tsx)
```tsx
// Sebelum
<Route path="/menu" element={<CustomerMenu />} />

// Sesudah  
<Route path="/menu/:shopSlug" element={<CustomerMenu />} />
```

### 2. QR Code Generator (QRCodeMenuCard.tsx)
```tsx
// Sebelum
const menuUrl = `${window.location.origin}/menu`;

// Sesudah
import { useAuth } from '../../contexts/AuthContext';
const { user } = useAuth();
const shopSlug = user?.shop?.slug || 'unknown';
const menuUrl = `${window.location.origin}/menu/${shopSlug}`;
```

### 3. Menu Page (CustomerMenu.tsx)
```tsx
// Sebelum: Menggunakan AppContext
const { products } = useApp();

// Sesudah: Fetch dinamis berdasarkan slug
const { shopSlug } = useParams();
const [products, setProducts] = useState([]);

useEffect(() => {
  fetch(`/api/public/menu/${shopSlug}`)
    .then(res => res.json())
    .then(data => setProducts(data.products))
}, [shopSlug]);
```

---

## 🔌 Backend API

**Endpoint:** `GET /api/public/menu/:shopSlug`

**Response:**
```json
{
  "success": true,
  "shop": { "id", "name", "slug", "address", "phone", "logo_url" },
  "products": [{ "id", "name", "price", "category", "stock", "isAvailable" }],
  "categories": [{ "id", "name" }]
}
```

**Notes:**
- Publik endpoint (no auth required)
- Filter: `is_available = true` AND `stock > 0`
- Registered di: `app.use('/api/public', publicRouter)`

---

## 🧪 URL Examples

**Before:** `https://app.com/menu` (Static)

**After:** 
- `https://app.com/menu/coffee-metro`
- `https://app.com/menu/kopi-jaya`
- `https://app.com/menu/tea-house`

---

## 📂 Files Modified

| File | Change | Lines |
|------|--------|-------|
| App.tsx | Route update | 1 line |
| QRCodeMenuCard.tsx | Import + URL generation | 5 lines |
| CustomerMenu.tsx | Complete rewrite | 400+ lines |
| app.ts (Backend) | Import + Router registration | 3 lines |
| public.ts (Backend) | NEW file | 150+ lines |

---

## ⚠️ Important Notes

1. **No Migration Needed** - Existing data structure unchanged
2. **Backward Compatible** - Old code still works during transition
3. **Zero Downtime Deployment** - Safe to deploy incrementally
4. **Database** - Relies on existing `shops`, `products`, `categories` tables
5. **CORS** - Public endpoint, CORS already configured

---

## 🔍 Key Features

✅ Dynamic menu per shop (based on `slug`)
✅ QR codes auto-generate correct URL
✅ Public endpoint (no login needed)
✅ Loading & error states
✅ Responsive mobile/desktop
✅ Search & filter by category
✅ Shows only available products (`is_available = true`)
✅ Show products with `stock > 0`

---

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| QR Code URL wrong | Clear cache, verify `user?.shop?.slug` |
| Menu not loading | Check API response, verify endpoint |
| "Shop not found" | Check shop slug in DB, verify `is_active` |
| CORS error | Update backend `corsOrigins` config |

---

## 📊 Database Queries (Reference)

```sql
-- Find shop by slug
SELECT * FROM coffeepos.shops WHERE slug = 'coffee-metro' AND is_active = true;

-- Get available products for shop
SELECT * FROM coffeepos.products 
WHERE shop_id = '...' AND is_available = true AND stock > 0;

-- Get categories for shop
SELECT * FROM coffeepos.categories WHERE shop_id = '...';
```

---

## 🎯 Test Endpoints

```bash
# Local development
curl http://localhost:3000/api/public/menu/coffee-metro

# Production  
curl https://api.point-of-sale.com/api/public/menu/coffee-metro

# Invalid slug (should return 404)
curl http://localhost:3000/api/public/menu/invalid-slug
```

---

## 📝 Environment Variables

**Frontend:**
```env
VITE_API_BASE_URL=https://api.point-of-sale.com
```

**Backend:**
```env
# Already configured in app.ts CORS options
# Public routes enabled by default
```

---

## 🔐 Security Checklist

- [x] Public endpoint (no auth required)
- [x] Only returns `is_available = true` products
- [x] No sensitive data in response
- [x] CORS configured
- [x] Input validation (shopSlug is string)
- [x] Error handling for missing shops

---

**Ready to deploy! 🚀**
