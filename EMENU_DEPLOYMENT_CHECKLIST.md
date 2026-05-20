# ✅ E-Menu Public - Complete Implementation Checklist

## 📋 Overview

Ini adalah comprehensive checklist untuk memastikan customer dapat akses menu tanpa login via QR code scanning atau direct URL access.

---

## 🚀 PRE-DEPLOYMENT CHECKLIST

### Backend Setup
- [ ] `Back-End/src/routes/public.ts` sudah ada
- [ ] `Back-End/src/app.ts` import public router: `import { publicRouter } from './routes/public.js'`
- [ ] `Back-End/src/app.ts` register router: `app.use('/api/public', publicRouter)`
- [ ] CSRF middleware di `app.ts` allow GET `/api/public/*`
- [ ] Backend running: `npm run dev` di Back-End folder
- [ ] Port 3000 accessible

### Frontend Setup
- [ ] `Front-End/src/App.tsx` route: `<Route path="/menu/:shopSlug" element={<CustomerMenu />} />`
- [ ] `Front-End/src/components/pos/QRCodeMenuCard.tsx` import useAuth
- [ ] `Front-End/src/pages/CustomerMenu.tsx` updated dengan fetch logic
- [ ] `Front-End/.env` atau `.env.local` ada dengan `VITE_API_BASE_URL`
- [ ] Frontend running: `npm run dev` di Front-End folder
- [ ] Port 5173 accessible

### Database Setup
- [ ] Shop exists: `SELECT * FROM coffeepos.shops WHERE slug='your-slug' AND is_active=true`
- [ ] Shop punya products: `SELECT COUNT(*) FROM coffeepos.products WHERE shop_id='...' AND is_available=true AND stock>0`
- [ ] Products punya images (optional tapi recommended)
- [ ] Categories setup (optional)

---

## 🧪 TESTING WORKFLOW

### Test 1: Backend API Direct Call

**Step 1.1: Verify Backend Health**
```bash
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET

# Expected: {"ok": true}
```

**Step 1.2: Test Public Endpoint**
```bash
# Replace 'coffee-metro' dengan shop slug Anda
Invoke-RestMethod -Uri "http://localhost:3000/api/public/menu/coffee-metro" -Method GET | ConvertTo-Json

# Expected: 200 status + JSON response dengan shop, products, categories
```

**Step 1.3: Check Response Content**
- [ ] Response includes `shop` object
- [ ] Response includes `products` array (should have items)
- [ ] Response includes `categories` array
- [ ] Products have `is_available: true`
- [ ] Products have `stock > 0`

### Test 2: Database Verification

**Step 2.1: Check Shop Table**
```sql
SELECT id, name, slug, is_active 
FROM coffeepos.shops 
WHERE slug = 'coffee-metro';
```
- [ ] Result: 1 row
- [ ] `is_active` should be `true`

**Step 2.2: Check Products Table**
```sql
SELECT COUNT(*) 
FROM coffeepos.products 
WHERE shop_id = '{shop-id}' 
  AND is_available = true 
  AND stock > 0;
```
- [ ] Result: > 0

**Step 2.3: Check Categories**
```sql
SELECT COUNT(*) 
FROM coffeepos.categories 
WHERE shop_id = '{shop-id}';
```
- [ ] Result: >= 0 (optional)

### Test 3: Frontend Manual Testing

**Step 3.1: Open URL Directly**

```
http://localhost:5173/menu/coffee-metro
```

- [ ] Page loads (no blank white screen)
- [ ] Loading spinner appears briefly
- [ ] Menu displays with products
- [ ] No error message

**Step 3.2: Check Browser Console**

Press F12, go to Console tab. Look for:

```
[CustomerMenu] Fetching menu dari: http://localhost:3000/api/public/menu/coffee-metro
[CustomerMenu] Response status: 200
[CustomerMenu] Menu loaded successfully: {...}
```

- [ ] Logs show fetch is working
- [ ] No error messages

**Step 3.3: Check Network Tab**

Press F12, go to Network tab. Find request:

```
Request URL: http://localhost:3000/api/public/menu/coffee-metro
Request Method: GET
Status: 200
```

- [ ] Status is 200
- [ ] Response time < 500ms
- [ ] Response shows JSON with products

**Step 3.4: Test Functionality**

- [ ] Products display in grid
- [ ] Can search products
- [ ] Can filter by category
- [ ] Product details visible (name, price)
- [ ] No login required
- [ ] No auth errors

### Test 4: QR Code Feature

**Step 4.1: Owner Login & Generate QR**

- [ ] Owner login to dashboard
- [ ] Go to Settings → QR Code Menu Digital
- [ ] QR code visible
- [ ] QR code URL shows: `/menu/{shop-slug}`

**Step 4.2: Scan QR Code**

- [ ] Use phone to scan QR code
- [ ] Menu page opens at `/menu/{shop-slug}`
- [ ] Menu displays correctly
- [ ] No error

**Step 4.3: Manual URL Test**

- [ ] Copy shop slug
- [ ] Manually type: `https://app.com/menu/{shop-slug}` (or localhost)
- [ ] Menu page works

---

## 🐛 DEBUGGING TROUBLESHOOTING

### Issue: "Toko tidak ditemukan"

**Checklist:**
```
[ ] Verify shop exists in database
  → SELECT * FROM coffeepos.shops WHERE slug='...';

[ ] Verify shop is_active = true
  → UPDATE coffeepos.shops SET is_active=true WHERE slug='...';

[ ] Verify API endpoint returns data
  → curl http://localhost:3000/api/public/menu/coffee-metro

[ ] Check browser console for error details
  → F12 → Console → Look for [CustomerMenu] logs

[ ] Check Network tab for API response
  → F12 → Network → Check /api/public/menu/{slug}
```

### Issue: API returns 404

**Means:** Shop slug tidak ditemukan atau tidak active

**Fix:**
```sql
-- Create shop if missing
INSERT INTO coffeepos.shops (name, slug, is_active)
VALUES ('My Shop', 'my-shop', true);

-- Or activate existing shop
UPDATE coffeepos.shops SET is_active=true WHERE slug='my-shop';
```

### Issue: API returns 200 but products empty

**Means:** Products ada tapi tidak tersedia/tidak ada stock

**Fix:**
```sql
UPDATE coffeepos.products
SET is_available=true, stock=100
WHERE shop_id='...' AND (is_available=false OR stock=0);
```

### Issue: Frontend shows loading spinner forever

**Means:** API endpoint not responding

**Checklist:**
- [ ] Backend running? `npm run dev` di Back-End/
- [ ] Port 3000 correct? Check .env
- [ ] VITE_API_BASE_URL correct? Check Front-End/.env
- [ ] Network request blocked? Check browser console

**Fix:**
```bash
# Clear cache and rebuild
cd Front-End
rm -rf node_modules/.vite
npm run dev
```

### Issue: CORS Error

**Means:** Frontend blocked by CORS policy

**Check:**
```
Error: "Access to XMLHttpRequest has been blocked by CORS policy"
```

**Fix:**
- [ ] Backend CORS config: Check `app.ts` corsOrigins
- [ ] Add frontend URL to corsOrigins

```typescript
// In Back-End/src/app.ts or .env
corsOrigins: [..., 'http://localhost:5173', 'https://app.com']
```

### Issue: QR Code URL wrong

**Means:** QR showing `/menu` instead of `/menu/{slug}`

**Fix:**
- [ ] Check `QRCodeMenuCard.tsx` imports `useAuth`
- [ ] Check `user?.shop?.slug` exists
- [ ] Check `useAuth()` hook properly initialized

---

## 📁 File Verification

Run this to verify all files in place:

**Windows (PowerShell):**
```powershell
# Frontend files
Test-Path "Front-End/src/App.tsx"                    # Should be True
Test-Path "Front-End/src/pages/CustomerMenu.tsx"     # Should be True
Test-Path "Front-End/src/components/pos/QRCodeMenuCard.tsx"  # Should be True
Test-Path "Front-End/.env"                           # Should be True
Test-Path "Front-End/.env.example"                   # Should be True

# Backend files  
Test-Path "Back-End/src/routes/public.ts"            # Should be True
Test-Path "Back-End/src/app.ts"                      # Should be True

# Documentation
Test-Path "EMENU_TROUBLESHOOTING.md"                 # Should be True
Test-Path "database-setup-emenu.sql"                 # Should be True
```

**Mac/Linux:**
```bash
# Frontend files
ls Front-End/src/App.tsx
ls Front-End/src/pages/CustomerMenu.tsx
ls Front-End/src/components/pos/QRCodeMenuCard.tsx
ls Front-End/.env
ls Front-End/.env.example

# Backend files
ls Back-End/src/routes/public.ts
ls Back-End/src/app.ts

# Documentation
ls EMENU_TROUBLESHOOTING.md
ls database-setup-emenu.sql
```

---

## 🎯 Success Criteria

✅ **Customer dapat akses menu jika:**

1. ✅ Buka URL: `http://localhost:5173/menu/coffee-metro`
2. ✅ Menu page loads (tidak error)
3. ✅ Products display dengan details
4. ✅ Search & filter berfungsi
5. ✅ Tidak ada login required
6. ✅ QR code scanned membuka menu otomatis

---

## 📊 Performance Targets

- [ ] API response time < 500ms
- [ ] Frontend load time < 2s
- [ ] Search react < 300ms
- [ ] Filter change < 200ms
- [ ] Image load < 1s

---

## 🔒 Security Verification

- [ ] Public endpoint tidak bisa create/update/delete
- [ ] Only GET requests allowed
- [ ] No authentication bypass
- [ ] No sensitive data in response
- [ ] CORS properly configured
- [ ] SQL injection prevention
- [ ] Rate limiting configured (optional)

---

## 📚 Documentation Links

- **Troubleshooting:** [EMENU_TROUBLESHOOTING.md](EMENU_TROUBLESHOOTING.md)
- **Database Setup:** [database-setup-emenu.sql](database-setup-emenu.sql)
- **Environment Config:** [Front-End/.env.example](Front-End/.env.example)
- **Implementation:** [EMENU_IMPLEMENTATION_SUMMARY.md](EMENU_IMPLEMENTATION_SUMMARY.md)

---

## 🚀 Deployment Steps

### Staging/Production

**Backend:**
```bash
cd Back-End
npm run build  # or tsc
# Deploy to server
# Set environment variables
```

**Frontend:**
```bash
cd Front-End
# Set VITE_API_BASE_URL to production API
VITE_API_BASE_URL=https://api.point-of-sale.com npm run build
# Deploy build/ folder to hosting
```

**Database:**
```smql
-- Run migrations if any
-- Verify:
SELECT COUNT(*) FROM coffeepos.shops;
SELECT COUNT(*) FROM coffeepos.products;
```

---

## 📞 Support

If still stuck after following this checklist:

1. **Verify all files are in place** (see File Verification section)
2. **Check database** using `database-setup-emenu.sql`
3. **Read troubleshooting guide:** `EMENU_TROUBLESHOOTING.md`
4. **Test** using testing scripts: `test-emenu-api.ps1` atau `test-emenu-api.sh`
5. **Check logs:**
   - Frontend: Browser Console (F12)
   - Backend: Terminal/logs
   - Database: Query results

---

**✨ Ready for Production! 🚀**

*Last Updated: May 20, 2026*  
*Version: 1.0*
