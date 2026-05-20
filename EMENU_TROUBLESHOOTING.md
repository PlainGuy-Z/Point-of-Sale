# E-Menu Public API - Troubleshooting Guide 🔧

## ❌ Problem: "Toko tidak ditemukan" meski berusaha scan QR

Customer ingin akses menu tanpa login, tapi melihat error "Toko tidak ditemukan".

---

## 🔍 Diagnosis: Checklist Step-by-Step

### **STEP 1: Verifikasi Backend Running**

```bash
# Test health endpoint
curl http://localhost:3000/health
# Expected: {"ok":true}
```

**Jika error:**
- ❌ Backend tidak running → Start backend terlebih dahulu
- ❌ Port salah → Check .env BACKEND_PORT

---

### **STEP 2: Verifikasi Shop Exists di Database**

```sql
-- Connect ke database Supabase dan run:
SELECT id, name, slug, is_active, created_at 
FROM coffeepos.shops 
WHERE slug = 'coffee-metro';  -- Replace dengan shop slug Anda
```

**Expected result:**
```
 id                   | name           | slug           | is_active | created_at
 xxxxxxxx-xxxx-xxxx   | Coffee Metro   | coffee-metro   | true      | 2024-01-01
```

**Jika tidak ada hasil:**
- ❌ Shop belum dibuat
- ❌ Slug berbeda dari yang digunakan
- ❌ Shop `is_active = false` → Update menjadi `true`

```sql
-- Untuk membuat shop test (jika belum ada):
INSERT INTO coffeepos.shops (name, slug, is_active)
VALUES ('Coffee Metro', 'coffee-metro', true);

-- Atau update existing shop jadi active:
UPDATE coffeepos.shops 
SET is_active = true 
WHERE slug = 'coffee-metro';
```

---

### **STEP 3: Verifikasi Products Exist untuk Shop Tersebut**

```sql
-- Get shop ID dulu
SELECT id FROM coffeepos.shops WHERE slug = 'coffee-metro';

-- Lalu check products
SELECT COUNT(*) as product_count
FROM coffeepos.products
WHERE shop_id = 'xxxxxxxx-xxxx-xxxx'  -- Ganti dengan ID dari query di atas
  AND is_available = true
  AND stock > 0;
```

**Expected result:**
```
 product_count
 15
```

**Jika 0:**
- ❌ Tidak ada produk untuk toko ini
- ❌ Semua produk `is_available = false`
- ❌ Semua produk `stock = 0`

```sql
-- Tambah produk test (jika perlu):
INSERT INTO coffeepos.products (name, price, category, stock, shop_id, is_available)
VALUES ('Espresso', 25000, 'Coffee', 50, 'xxxxxxxx-xxxx-xxxx', true);
```

---

### **STEP 4: Test API Endpoint Langsung**

```bash
# Windows (PowerShell):
$url = "http://localhost:3000/api/public/menu/coffee-metro"
(Invoke-RestMethod -Uri $url -Method GET) | ConvertTo-Json

# Mac/Linux (curl):
curl "http://localhost:3000/api/public/menu/coffee-metro" | jq
```

**Expected response:**
```json
{
  "success": true,
  "shop": {
    "id": "xxxxxxxx-xxxx-xxxx",
    "name": "Coffee Metro",
    "slug": "coffee-metro",
    "address": "Jl. Sudirman 123",
    "phone": "081234567890",
    "logo_url": null
  },
  "products": [
    {
      "id": "xxxxxxxx-xxxx-xxxx",
      "name": "Espresso",
      "price": 25000,
      "stock": 50,
      "isAvailable": true,
      ...
    }
  ],
  "categories": [
    {
      "id": "xxxxxxxx-xxxx-xxxx",
      "name": "Coffee"
    }
  ]
}
```

**Status codes & meanings:**

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | ✅ Success | API working! |
| 404 | ❌ Shop not found | Check Step 2 |
| 400 | ❌ Invalid slug | Slug harus non-empty string |
| 500 | ❌ Server error | Check backend logs |

---

### **STEP 5: Verifikasi Frontend Configuration**

#### 5a. Check `.env` file

**File:** `Front-End/.env` atau `Front-End/.env.local`

```env
VITE_API_BASE_URL=http://localhost:3000
# atau untuk production:
VITE_API_BASE_URL=https://api.point-of-sale.com
```

**Jika .env tidak ada:**
```bash
cd Front-End
# Create .env file
echo "VITE_API_BASE_URL=http://localhost:3000" > .env
```

**Jika masih tidak jalan:**
```bash
# Hapus cache dan rebuild
rm -rf Front-End/node_modules/.vite
npm run build
npm run dev
```

#### 5b. Check `App.tsx` route

**File:** `Front-End/src/App.tsx` (line ~155)

```tsx
// ✅ HARUS ADA (dynamic route)
<Route path="/menu/:shopSlug" element={
  <Suspense fallback={<LoadingSpinner text="Memuat menu..." />}>
    <CustomerMenu />
  </Suspense>
} />

// ❌ JANGAN ADA (static route)
<Route path="/menu" element={...} />
```

#### 5c. Check `CustomerMenu.tsx` implementation

**File:** `Front-End/src/pages/CustomerMenu.tsx` (line ~20)

```tsx
// ✅ HARUS ADA
import { useParams } from 'react-router-dom';

// ✅ HARUS ADA  
const { shopSlug } = useParams<{ shopSlug: string }>();

// ✅ HARUS ADA
const apiBase = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : window.location.origin;
const apiUrl = `${apiBase}/api/public/menu/${shopSlug}`;

// ✅ HARUS ADA
const response = await fetch(apiUrl, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'omit', // Important: no credentials
});
```

---

### **STEP 6: Test Frontend in Browser**

1. **Buka DevTools** (F12)
2. **Buka Console tab** → Cari log messages dengan `[CustomerMenu]`
3. **Buka Network tab** → Cari request ke `/api/public/menu/{slug}`

#### 6a. Check Network Request

```
Method: GET
URL: http://localhost:3000/api/public/menu/coffee-metro
Status: 200 (jika sukses)

Headers:
  - Request Headers: Content-Type: application/json ✓
  - Response Headers: Access-Control-Allow-Origin: * ✓
```

#### 6b. Check Console Logs

Anda harus melihat:
```
[CustomerMenu] Fetching menu dari: http://localhost:3000/api/public/menu/coffee-metro
[CustomerMenu] Response status: 200
[CustomerMenu] Menu loaded successfully: {...}
```

**Jika melihat error:**
```
[CustomerMenu] API Error: {error: {message: "Shop with slug..."}}
```

Berarti shop not found → Check Step 2

---

### **STEP 7: Check Backend Logs**

Lihat terminal/logs backend untuk pesan error:

```
[DB] SELECT id, name, slug, address... FROM coffeepos.shops
Error: connection refused
```

**Solusi:**
- ❌ Database tidak running → Start database
- ❌ Connection string salah → Check .env di Back-End/

---

## 📋 Complete Checklist

### Backend
- [ ] Backend service running (`npm run dev`)
- [ ] Port 3000 (atau port di .env) accessible
- [ ] Database connected (no error di logs)
- [ ] `public.ts` router registered di `app.ts`
- [ ] GET `/api/public/*` endpoint responsive
- [ ] CORS configured untuk frontend origin

### Database  
- [ ] Shop exists: `SELECT * FROM coffeepos.shops WHERE slug='...'`
- [ ] Shop is_active = true
- [ ] Products exist: `SELECT * FROM coffeepos.products WHERE shop_id='...' LIMIT 1`
- [ ] Products have: `is_available=true AND stock>0`

### Frontend
- [ ] `.env` file exists
- [ ] `VITE_API_BASE_URL` set correctly
- [ ] `App.tsx` has dynamic route `/menu/:shopSlug`
- [ ] `CustomerMenu.tsx` uses `useParams()`
- [ ] No import errors in console

### Network
- [ ] CORS headers present in response
- [ ] No [CORS errors in browser console
- [ ] API endpoint accessible (telnet/ping test)
- [ ] Firewall not blocking port 3000

---

## 🎯 Quick Fix Workflow

**Jika customer masih dapat "Toko tidak ditemukan":**

```bash
# 1. Verify backend responding
curl http://localhost:3000/health

# 2. Verify shop exists
# (Skip this, check database directly)

# 3. Test API endpoint
curl http://localhost:3000/api/public/menu/coffee-metro

# 4. Check frontend .env
cat Front-End/.env  # Should have VITE_API_BASE_URL

# 5. Clear frontend cache
cd Front-End
rm -rf node_modules/.vite
npm run dev  # Fresh build

# 6. Test in browser
# Open: http://localhost:5173/menu/coffee-metro
# Press F12 → Network tab
# Check for GET /api/public/menu/coffee-metro
```

---

## 💡 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Toko tidak ditemukan" | Shop slug wrong in DB | Verify: `SELECT slug FROM coffeepos.shops` |
| API 404 | Shop not found in DB | Insert/create shop first |
| API 400 | Invalid slug parameter | Check URL: `/menu/{slug}` must be non-empty |
| API 500 | Database error | Check backend logs for query errors |
| Network error | Backend not running | `npm run dev` di Back-End/ |
| CORS error | Frontend origin not allowed | Update `corsOrigins` di env .env |
| Menu shows loading forever | fetch() hangs | Check Network tab, endpoint returns? |
| Blank menu page | No products | Verify: `is_available=true AND stock>0` |
| Wrong URL in QR | Shop slug not set | Check: `user?.shop?.slug` not undefined |

---

## 🚀 Testing Endpoints

### Windows PowerShell

```powershell
# Test with debug
.\test-emenu-api.ps1 -BackendUrl http://localhost:3000 -ShopSlug coffee-metro
```

### Linux/Mac

```bash
# Test with debug
bash test-emenu-api.sh http://localhost:3000 coffee-metro
```

---

## 📞 Still Stuck?

Kumpulkan informasi ini:

1. **Error message** dari browser console
2. **Network request details** (URL, status code, response)
3. **Backend logs** saat error happen
4. **Database query result:** `SELECT * FROM coffeepos.shops LIMIT 1`
5. **Environment** (localhost vs production)

---

## ✅ Success Criteria

Customer berhasil akses menu jika:

1. ✅ URL `/menu/{shop-slug}` loaded
2. ✅ No error message displayed
3. ✅ Menu loaded dengan products list
4. ✅ Search & filter berfungsi
5. ✅ Tidak perlu login

---

**Last Updated:** May 20, 2026  
**Status:** Troubleshooting Guide Complete
