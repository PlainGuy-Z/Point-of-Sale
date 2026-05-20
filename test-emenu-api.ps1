# ============================================================
# E-Menu Public API - Debug & Testing Script (Windows)
# ============================================================
# Gunakan script ini untuk debug masalah customer tidak bisa 
# akses menu tanpa login
#
# Usage: .\test-emenu-api.ps1 -BackendUrl http://localhost:3000 -ShopSlug coffee-metro
# ============================================================

param(
    [string]$BackendUrl = "http://localhost:3000",
    [string]$ShopSlug = "coffee-metro"
)

Write-Host "🔍 E-Menu Public API - Debug Testing" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
Write-Host "Shop Slug:   $ShopSlug" -ForegroundColor Yellow
Write-Host ""

# ============================================================
# 1. Test Health Check
# ============================================================
Write-Host "[1/5] Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/health" -Method GET -ErrorAction Stop
    Write-Host "✓ Backend is running" -ForegroundColor Green
    Write-Host "  Response: $($health | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend not responding" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================================
# 2. Test CORS
# ============================================================
Write-Host "[2/5] Testing CORS Policy..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/public/menu/$ShopSlug" `
                                   -Method GET `
                                   -ErrorAction Stop
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    if ($corsHeader) {
        Write-Host "✓ CORS headers present" -ForegroundColor Green
        Write-Host "  Access-Control-Allow-Origin: $corsHeader" -ForegroundColor Gray
    } else {
        Write-Host "⚠ CORS header not found (might be ok)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not check CORS (continue testing)" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
# 3. Test Public API Endpoint
# ============================================================
Write-Host "[3/5] Testing GET /api/public/menu/$ShopSlug..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/public/menu/$ShopSlug" `
                                   -Method GET `
                                   -ContentType "application/json" `
                                   -ErrorAction Stop
    
    Write-Host "✓ API endpoint responds with 200" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    # Extract info
    $shopName = $response.shop.name
    $productCount = $response.products.Count
    $categoryCount = $response.categories.Count
    
    Write-Host ""
    Write-Host "  Shop Name: $shopName" -ForegroundColor Cyan
    Write-Host "  Products: $productCount" -ForegroundColor Cyan
    Write-Host "  Categories: $categoryCount" -ForegroundColor Cyan
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✗ API Error (HTTP $statusCode)" -ForegroundColor Red
    
    if ($statusCode -eq 404) {
        Write-Host "Shop not found (404)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Mungkin masalah:" -ForegroundColor Yellow
        Write-Host "  - Shop slug tidak ada di database" -ForegroundColor Gray
        Write-Host "  - Shop status tidak active (is_active = false)" -ForegroundColor Gray
        Write-Host "  - Slug tidak match (case-sensitive)" -ForegroundColor Gray
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        $errorBody = $_.Exception.Response.Content.ReadAsStream() | ForEach-Object { [System.IO.StreamReader]::new($_).ReadToEnd() }
        Write-Host "Response: $errorBody" -ForegroundColor Gray
    } catch { }
}
Write-Host ""

# ============================================================
# 4. Database Configuration Check
# ============================================================
Write-Host "[4/5] Database Configuration" -ForegroundColor Yellow
Write-Host "Manual checks needed:" -ForegroundColor Gray
Write-Host "  1. Verify shop exists:" -ForegroundColor Gray
Write-Host "     SELECT id, name, slug, is_active FROM coffeepos.shops WHERE slug = '$ShopSlug';" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Verify products exist:" -ForegroundColor Gray
Write-Host "     SELECT COUNT(*) FROM coffeepos.products" -ForegroundColor Cyan
Write-Host "     WHERE shop_id = '...' AND is_available = true AND stock > 0;" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# 5. Frontend Configuration Checklist
# ============================================================
Write-Host "[5/5] Frontend Configuration Checklist" -ForegroundColor Yellow
Write-Host "Check these settings:" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. Front-End/.env atau .env.local" -ForegroundColor Cyan
Write-Host "     VITE_API_BASE_URL=$BackendUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Front-End/src/pages/CustomerMenu.tsx" -ForegroundColor Cyan
Write-Host "     ✓ Must import useParams from 'react-router-dom'" -ForegroundColor Gray
Write-Host "     ✓ Must use: const { shopSlug } = useParams()" -ForegroundColor Gray
Write-Host "     ✓ Must fetch from /api/public/menu/\$shopSlug" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Front-End/src/App.tsx" -ForegroundColor Cyan
Write-Host "     ✓ Route should be: <Route path=""/menu/:shopSlug"" />" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Browser DevTools" -ForegroundColor Cyan
Write-Host "     ✓ Open http://localhost:5173/menu/$ShopSlug" -ForegroundColor Gray
Write-Host "     ✓ Go to Network tab" -ForegroundColor Gray
Write-Host "     ✓ Look for GET /api/public/menu/$ShopSlug request" -ForegroundColor Gray
Write-Host "     ✓ Check status code and response" -ForegroundColor Gray
Write-Host ""

# ============================================================
# Summary
# ============================================================
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "For detailed logging, run:" -ForegroundColor Yellow
Write-Host "  1. Check if VITE_API_BASE_URL is set correctly" -ForegroundColor Gray
Write-Host "  2. Open browser console (F12) → Console tab" -ForegroundColor Gray
Write-Host "  3. Look for '[CustomerMenu]' log messages" -ForegroundColor Gray
Write-Host "  4. Check Network tab for API requests" -ForegroundColor Gray
Write-Host ""
Write-Host "Complete checklist at:" -ForegroundColor Cyan
Write-Host "  📄 EMENU_TROUBLESHOOTING.md" -ForegroundColor Yellow
Write-Host ""
