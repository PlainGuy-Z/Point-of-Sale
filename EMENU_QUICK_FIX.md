# 🚀 E-Menu Public - Quick Reference Card

## ⚡ Quick Troubleshooting (2-Minute Fix)

### Problem: Customer gets "Toko tidak ditemukan"

**Run FAST Check:**

```typescript
// 1. Is backend running?
curl http://localhost:3000/health
// Should return: {"ok":true}

// 2. Does shop exist?
curl http://localhost:3000/api/public/menu/coffee-metro
// Should return: 200 + JSON with products

// 3. Check environment
echo $VITE_API_BASE_URL  // Should show: http://localhost:3000

// 4. Check database
SELECT COUNT(*) FROM coffeepos.shops WHERE slug='coffee-metro' AND is_active=true;
// Should return: 1
```

**If all pass:** Restart browser, clear cache  
**If any fails:** Go to detailed troubleshooting below

---

## 📋 Files Modified (Reference)

| File | What Changed | Why |
|------|--------------|-----|
| `App.tsx` | Route `/menu` → `/menu/:shopSlug` | Make URL dynamic |
| `QRCodeMenuCard.tsx` | Add `useAuth()` hook | Get shop slug for QR |
| `CustomerMenu.tsx` | Complete rewrite | Fetch API instead of AppContext |
| `app.ts` | Add public router | Register new endpoint |
| `public.ts` | **NEW FILE** | Public API endpoint |

---

## ✅ Pre-Check Checklist (Do This First!)

```bash
# 1. Backend running?
cd Back-End && npm run dev

# 2. Frontend running?
cd Front-End && npm run dev  

# 3. Both accessible?
curl http://localhost:3000/health  → Should say {"ok":true}
# Open browser: http://localhost:5173/menu/coffee-metro

# 4. Database accessible?
# Login to Supabase → Run: SELECT COUNT(*) FROM coffeepos.shops;
```

---

## 🔧 Fix One By One

### Fix #1: Backend Not Responding

```bash
# Windows
cd Back-End
npm install
npm run dev

# Should see: "Server running on port 3000"
```

### Fix #2: Frontend Environment

```bash
# Create .env file
cd Front-End
echo "VITE_API_BASE_URL=http://localhost:3000" > .env

# Restart
npm run dev
```

### Fix #3: Database Missing Data

```sql
-- Is shop there?
SELECT * FROM coffeepos.shops WHERE slug='coffee-metro';

-- If not, create it:
INSERT INTO coffeepos.shops (name, slug, is_active)
VALUES ('Coffee Metro', 'coffee-metro', true);

-- Are products there?
SELECT COUNT(*) FROM coffeepos.products 
WHERE shop_id='xxx' AND is_available=true AND stock>0;

-- If not, create test data:
INSERT INTO coffeepos.products (name, price, category, stock, shop_id, is_available)
VALUES ('Espresso', 25000, 'Coffee', 100, 'xxx', true);
```

### Fix #4: API Returning 404

**Means:** Shop not found

```bash
# Test endpoint
curl "http://localhost:3000/api/public/menu/coffee-metro"

# If 404: Shop doesn't exist in DB
# Solution: Create shop in database first
```

---

## 🧪 Test API (Copy-Paste Ready)

### Windows (PowerShell)

```powershell
# Test 1: Health
Invoke-RestMethod -Uri "http://localhost:3000/health"

# Test 2: Menu endpoint
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/public/menu/coffee-metro"
$response | ConvertTo-Json | Out-File response.json
notepad response.json  # View result
```

### Mac/Linux (bash)

```bash
# Test 1: Health
curl http://localhost:3000/health

# Test 2: Menu endpoint
curl http://localhost:3000/api/public/menu/coffee-metro | jq .

# Test 3: Pretty print
curl http://localhost:3000/api/public/menu/coffee-metro | jq '{
  shop: .shop.name,
  productCount: (.products | length),
  categoryCount: (.categories | length)
}'
```

---

## 🔍 Debugging Tools

### Browser Console (F12)

Look for these logs:

```javascript
// ✅ Good signs
[CustomerMenu] Fetching menu dari: http://localhost:3000/api/public/menu/coffee-metro
[CustomerMenu] Response status: 200
[CustomerMenu] Menu loaded successfully: {...}

// ❌ Bad signs
[CustomerMenu] API Error: {error: {message: "Shop not found"}}
// OR
Fetch failed: Network error
// OR
CORS error: Access-Control-Allow-Origin
```

### Browser Network Tab (F12)

Check these:

```
Request: GET /api/public/menu/coffee-metro
Status: ✅ 200 (good) or ❌ 404/500 (bad)
URL: Should match http://localhost:3000/api/public/menu/...
Response: Should show JSON with products
```

---

## 🎯 Common Errors & Quick Fixes

| Error | Fix |
|-------|-----|
| "Toko tidak ditemukan" | Check DB: `SELECT * FROM coffeepos.shops;` |
| API 404 | Create shop: `INSERT INTO shops...` |
| API 500 | Check backend logs for query error |
| Network error | Backend not running: `npm run dev` |
| CORS error | Add frontend URL to corsOrigins in app.ts |
| Menu shows blank | Products missing: Check `COUNT(products)` |
| QR URL wrong | Clear cache, verify `user?.shop?.slug` |
| Loading forever | API not responding: Check Network tab |

---

## 📱 Test URL

```
http://localhost:5173/menu/coffee-metro
```

**Expected result:**
- ✅ No error message
- ✅ Menu loads with products
- ✅ Shop info visible
- ✅ No login required

---

## 🎁 Full Documentation

| Document | Purpose |
|----------|---------|
| `EMENU_TROUBLESHOOTING.md` | Detailed troubleshooting guide |
| `EMENU_DEPLOYMENT_CHECKLIST.md` | Pre-deployment checklist |
| `EMENU_CUSTOMER_ACCESS.md` | Customer user flow |
| `database-setup-emenu.sql` | Database setup & queries |
| `.env.example` | Environment config template |

---

## 🚀 Deploy When:

- [ ] Backend API responds 200
- [ ] Frontend loads without error
- [ ] Products display correctly
- [ ] Search & filter work
- [ ] QR code URL is correct
- [ ] No login required
- [ ] Tested on mobile browser

---

## ⚡ 10-Second Test

```bash
# 1. Terminal 1 (Backend)
cd Back-End && npm run dev

# 2. Terminal 2 (Frontend)  
cd Front-End && npm run dev

# 3. Browser
Open: http://localhost:5173/menu/coffee-metro
Press F12 → Console tab
# Should see: [CustomerMenu] Menu loaded successfully

✅ If yes → Working!
❌ If error → Check logs above
```

---

## 📞 Still Stuck?

**Last Resort - Complete Debug:**

```bash
# 1. Backend health
curl http://localhost:3000/health

# 2. Database test
# (Use Supabase query editor)
SELECT COUNT(*) FROM coffeepos.shops;

# 3. API test
curl http://localhost:3000/api/public/menu/test-slug

# 4. Frontend .env
cat Front-End/.env

# 5. Browser console
# Open DevTools → Console tab
# Copy-paste any errors
```

Then check:
- `EMENU_TROUBLESHOOTING.md` for detailed solution
- Backend logs for error details
- Database query results

---

**✨ You got this! 🔥**

---

*Last Updated: May 20, 2026*  
*Print & Keep Handy!*
