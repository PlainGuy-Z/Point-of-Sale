# 🔓 E-Menu Public - Customer Access Flow (No Login Required)

## 🎯 Overview

Customer dapat akses menu digital **tanpa login** dengan 2 cara:
1. **Scan QR Code** yang ditampilkan di meja/dinding
2. **Direct URL** jika diketahui slug toko

---

## 📊 Complete Alur Akses

```
┌─────────────────────────────────────────────────────────────┐
│ TOKO OWNER                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Login ke aplikasi POS                                  │
│  2. Go to: Settings → QR Code Menu Digital                 │
│  3. QR Code otomatis generate dengan URL:                  │
│     → https://app.com/menu/{shop-slug}                     │
│     Contoh: https://app.com/menu/coffee-metro             │
│  4. Print QR Code & letakkan di meja/dinding              │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CUSTOMER (Tanpa Login)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Option A: SCAN QR CODE                                    │
│  ├─ Ambil smartphone                                       │
│  ├─ Buka camera/QR scanner                                 │
│  ├─ Scan QR Code di meja                                   │
│  └─ Browser auto-buka URL                                  │
│                                                             │
│  Option B: AKSES LANGSUNG                                  │
│  ├─ Jika tahu slug/nama toko                              │
│  ├─ Ketik di browser: https://app.com/menu/coffee-metro   │
│  └─ Menu page terbuka                                      │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React App)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  URL: /menu/coffee-metro                                   │
│       ↓                                                     │
│  App.tsx Route Matching                                    │
│  ├─ Pattern: /menu/:shopSlug                               │
│  ├─ Extract: shopSlug = "coffee-metro"                     │
│  └─ Load: CustomerMenu component                           │
│       ↓                                                     │
│  CustomerMenu.tsx                                          │
│  ├─ useParams() extract shopSlug                           │
│  ├─ Show loading spinner                                   │
│  ├─ Call: fetch('/api/public/menu/coffee-metro')           │
│  └─ Wait for response...                                   │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND API (Node.js + Express)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Endpoint: GET /api/public/menu/coffee-metro               │
│  ├─ ✅ Public (No authentication required)                 │
│  ├─ ✅ CORS allowed                                        │
│  ├─ ✅ No CSRF check (GET request)                         │
│       ↓                                                     │
│  Query Shop:                                               │
│  ├─ SELECT * FROM shops WHERE slug='coffee-metro'          │
│  ├─ Check: is_active = true ✓                              │
│  ├─ If not found → Return 404 error                        │
│       ↓                                                     │
│  Query Products:                                           │
│  ├─ SELECT * FROM products WHERE:                          │
│  │  • shop_id = {shop-id}                                  │
│  │  • is_available = true ✓ (Must show only available)     │
│  │  • stock > 0 ✓ (Must have items)                        │
│       ↓                                                     │
│  Query Categories:                                         │
│  ├─ SELECT * FROM categories WHERE shop_id = {shop-id}     │
│       ↓                                                     │
│  Return JSON Response:                                     │
│  {                                                         │
│    success: true,                                          │
│    shop: {id, name, slug, address, phone, logo_url},       │
│    products: [...],                                        │
│    categories: [...]                                       │
│  }                                                         │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Render Menu)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  After response received:                                  │
│  ├─ Hide loading spinner                                   │
│  ├─ Display shop info:                                     │
│  │  • Logo (optional)                                      │
│  │  • Shop name                                            │
│  │  • Address                                              │
│  │  • Phone number                                         │
│  │       ↓                                                  │
│  ├─ Display products grid:                                 │
│  │  • Product image                                        │
│  │  • Product name                                         │
│  │  • Price                                                │
│  │  • Category badge                                       │
│  │  • Promo badge (if applicable)                          │
│  │       ↓                                                  │
│  ├─ Enable features:                                       │
│  │  • Search by name                                       │
│  │  • Filter by category                                   │
│  │       ↓                                                  │
│  └─ UI ready for customer viewing                          │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CUSTOMER ACTIONS (Read-Only)                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ View all available products                             │
│  ✓ Search menu items                                       │
│  ✓ Filter by category                                      │
│  ✓ See prices & descriptions                               │
│  ✓ See promotions/promo items                              │
│  ✓ See product availability                                │
│  ✗ Cannot order (Read-only menu)                           │
│  ✗ Cannot add to cart                                      │
│  ✗ Cannot checkout                                         │
│                                                             │
│  → Customer harus ke kasir untuk pesan!                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Requirements Check

| Component | Requirement | Status | Check |
|-----------|-------------|--------|-------|
| **Frontend Route** | `/menu/:shopSlug` dynamic | ✅ Done | [App.tsx](Front-End/src/App.tsx#L155) |
| **QR Generator** | Use `user?.shop?.slug` | ✅ Done | [QRCodeMenuCard.tsx](Front-End/src/components/pos/QRCodeMenuCard.tsx#L12) |
| **Menu Page** | Fetch from API dynamically | ✅ Done | [CustomerMenu.tsx](Front-End/src/pages/CustomerMenu.tsx#L19) |
| **Backend API** | GET `/api/public/menu/:slug` | ✅ Done | [public.ts](Back-End/src/routes/public.ts) |
| **CORS** | Allow public access | ✅ Done | [app.ts](Back-End/src/app.ts#L70) |
| **Database** | Query shops + products | ✅ Done | Uses Supabase |
| **Environment** | VITE_API_BASE_URL set | ⚠️ Check | [.env.example](Front-End/.env.example) |

---

## 💾 What Happens Behind The Scenes

### Frontend Side
```javascript
// 1. URL Detected
/menu/coffee-metro

// 2. Route Matching
useParams() → { shopSlug: "coffee-metro" }

// 3. API Call
fetch("http://api.com/api/public/menu/coffee-metro")

// 4. Response Received
{
  shop: { name: "Coffee Metro", address: "...", ... },
  products: [ { id, name, price, ... }, ... ],
  categories: [ { name: "Coffee" }, ... ]
}

// 5. State Updated
setProducts(data.products)
setShopName(data.shop.name)

// 6. UI Rendered
<div>
  <h1>{shopName}</h1>
  <ProductGrid products={products} />
</div>
```

### Backend Side
```javascript
// 1. Request Received
GET /api/public/menu/coffee-metro

// 2. Validate Input
shopSlug = "coffee-metro" ✓ valid

// 3. Query Database
SELECT * FROM shops WHERE slug = ?
 → Found: Shop ID = "xxx-yyy-zzz"

// 4. Query Products
SELECT * FROM products 
WHERE shop_id = "xxx-yyy-zzz"
  AND is_available = true
  AND stock > 0
 → Found: 15 products

// 5. Query Categories
SELECT * FROM categories
WHERE shop_id = "xxx-yyy-zzz"
 → Found: 3 categories

// 6. Build Response
{
  success: true,
  shop: {...},
  products: [{...}, {...}, ...],
  categories: [{...}, {...}, {...}]
}

// 7. Send Response
HTTP 200 + JSON
```

---

## 🎨 UI/UX Flow

```
┌────────────────────────────────────────┐
│  Customer's Browser View               │
├────────────────────────────────────────┤
│                                        │
│  📋 Coffee Metro Menu                   │
│  📍 Jl. Sudirman No.123                │
│  ☎️  +62812345678                      │
│                                        │
│  [Search "Espresso"................]  │
│                                        │
│  Category: [All] Coffee Tea Pastry     │
│                                        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Espresso │ │ Latte    │ │ Mocha  │ │
│  │ Rp25.000 │ │ Rp35.000 │ │ Rp40.k │ │
│  │  [IMG]   │ │  [IMG]   │ │ [IMG]  │ │
│  └──────────┘ └──────────┘ └────────┘ │
│                                        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Americano│ │Cappuccino│ │Croissnt│ │
│  │ Rp22.000 │ │ Rp35.000 │ │ Rp18.k │ │
│  │  [IMG]   │ │  [IMG]   │ │ [IMG]  │ │
│  └──────────┘ └──────────┘ └────────┘ │
│                                        │
│  💡 Silakan tunjukkan menu ini ke      │
│     petugas kasir untuk pesan          │
│                                        │
└────────────────────────────────────────┘
```

---

## 📱 Mobile Experience

**Optimized for:**
- ✅ Responsive grid (auto-adjust untuk screen size)
- ✅ Touch-friendly buttons & taps
- ✅ Fast loading (lazy image loading)
- ✅ Offline detection (optional PWA)
- ✅ Works on 3G/4G networks
- ✅ No login/auth forms
- ✅ Simple UI (less scrolling)

---

## 🔐 Security Model

| Layer | Control | Effect |
|-------|---------|--------|
| **Route** | Public route (no auth) | ✅ Customer can access |
| **API** | No authentication | ✅ Customer can call |
| **Data** | Only `is_available=true` + `stock>0` | ✅ Safe to show |
| **CORS** | Allow all origins | ✅ QR from anywhere |
| **SQL** | Parameterized queries | ✅ No injection risk |
| **Response** | No sensitive data | ✅ Only menu data |

---

## ✨ Key Features For Customer

1. **No Login Needed** ✓
   - Scan QR → Menu shows immediately
   - No email/password/verification
   
2. **Fast Loading** ✓
   - API response < 500ms
   - Image progressive loading
   
3. **Easy Navigation** ✓
   - Search by product name
   - Filter by category
   - Responsive design
   
4. **Real-time Data** ✓
   - Shows accurate stock status
   - Shows active promotions
   - Shows only available items
   
5. **Clear Call-to-Action** ✓
   - "Show this to the cashier"
   - No checkout confusion
   - Guide directing to order

---

## 🚨 Error Handling For Customer

If something goes wrong:

```
❌ "Toko tidak ditemukan"
   → Customer sees: "Shop dengan slug 'xxx' tidak found"
   → Advise: "Check URL or take different QR code"
   
❌ "Network Error"
   → Customer sees: "Gagal memuat menu, coba lagi"
   → Advise: "Check internet connection"

❌ Menu Loading Forever
   → Customer sees: Loading spinner
   → Solution: Refresh page atau try again

❌ Blank Menu / No Products
   → Customer sees: "Tidak Ada Menu Tersedia"
   → Advise: "Tell staff to contact owner"
```

---

## 🎯 Expected User Journey

**Time: 30 seconds**

```
1. Customer spot QR at table
   ├─ Scanning QR Code (5 seconds)
   │  └─ Browser opens
   │
2. Menu loads & displays (3 seconds)
   ├─ Search/filter products (10 seconds)
   │  └─ Browse menu items
   │
3. Call staff to order (5 seconds)
   ├─ Show phone with menu
   │  └─ Point to desired items
   │
4. Staff takes order (7 seconds)
   └─ Uses POS system to create order
```

---

## 📊 Analytics (Optional Future)

Data that could be collected (non-invasive):

```javascript
// Track menu views
POST /api/analytics/menu-view
payload: {
  shopSlug: "coffee-metro",
  timestamp: "2024-05-20T10:30:00Z",
  // NO: customer info, payment, orders
}

// Results: "Menu View Count" per shop per day
```

---

## 🎁 Future Enhancements

1. **QR Code Customization**
   - Custom colors, logo overlay
   - Different designs per shop

2. **Menu Sharing**
   - Share link via WhatsApp/Email
   - Custom greeting message

3. **Analytics**
   - Track menu views
   - Popular items report

4. **Offline Mode**
   - PWA for offline access
   - Cache menu data

5. **Social Integration**
   - Google Maps embed
   - Reviews/ratings

---

## ✅ Verification Checklist

- [ ] Customer can scan QR without app
- [ ] URL opens in any browser
- [ ] Menu displays immediately
- [ ] All products visible
- [ ] Search works
- [ ] Filter works
- [ ] Mobile responsive
- [ ] No login required
- [ ] No error messages
- [ ] Staff can process order from menu

---

**🎉 Customer Access Complete!**

---

*Last Updated: May 20, 2026*  
*Version: 1.0*
