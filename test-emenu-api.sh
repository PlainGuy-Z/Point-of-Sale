#!/bin/bash
# ============================================================
# E-Menu Public API - Debug & Testing Script
# ============================================================
# Gunakan script ini untuk debug masalah customer tidak bisa 
# akses menu tanpa login
# ============================================================

echo "🔍 E-Menu Public API - Debug Testing"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${1:-http://localhost:3000}"
SHOP_SLUG="${2:-coffee-metro}"

echo "Backend URL: $BACKEND_URL"
echo "Shop Slug:   $SHOP_SLUG"
echo ""

# ============================================================
# 1. Test Health Check
# ============================================================
echo -e "${YELLOW}[1/5] Testing Backend Health...${NC}"
HEALTH=$(curl -s "$BACKEND_URL/health")
if [[ $HEALTH == *"ok"* ]]; then
  echo -e "${GREEN}✓ Backend is running${NC}"
else
  echo -e "${RED}✗ Backend not responding${NC}"
  exit 1
fi
echo ""

# ============================================================
# 2. Test CORS
# ============================================================
echo -e "${YELLOW}[2/5] Testing CORS Policy...${NC}"
CORS_RESPONSE=$(curl -s -i "$BACKEND_URL/api/public/menu/$SHOP_SLUG" 2>&1 | grep -i "access-control-allow-origin")
if [[ ! -z $CORS_RESPONSE ]]; then
  echo -e "${GREEN}✓ CORS headers present${NC}"
  echo "  $CORS_RESPONSE"
else
  echo -e "${YELLOW}⚠ CORS header not found (might be ok)${NC}"
fi
echo ""

# ============================================================
# 3. Test Public API Endpoint
# ============================================================
echo -e "${YELLOW}[3/5] Testing GET /api/public/menu/$SHOP_SLUG...${NC}"
API_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/public/menu/$SHOP_SLUG")
HTTP_CODE=$(echo "$API_RESPONSE" | tail -n1)
BODY=$(echo "$API_RESPONSE" | head -n-1)

echo "HTTP Status Code: $HTTP_CODE"

if [[ $HTTP_CODE == "200" ]]; then
  echo -e "${GREEN}✓ API endpoint responds with 200${NC}"
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [[ $HTTP_CODE == "404" ]]; then
  echo -e "${RED}✗ Shop not found (404)${NC}"
  echo "Response:"
  echo "$BODY" | jq '.error' 2>/dev/null || echo "$BODY"
  echo ""
  echo "Mungkin masalah:"
  echo "  - Shop slug tidak ada di database"
  echo "  - Shop status tidak active (is_active = false)"
  echo "  - Slug tidak match (case-sensitive)"
else
  echo -e "${RED}✗ API error (HTTP $HTTP_CODE)${NC}"
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi
echo ""

# ============================================================
# 4. Test Database Connection (if psql available)
# ============================================================
echo -e "${YELLOW}[4/5] Checking Database...${NC}"
if command -v psql &> /dev/null; then
  # Try to connect to database (requires connection string in .env)
  echo "  Skipping (manual DB check required)"
  echo "  Run manually:"
  echo "  SELECT id, name, slug, is_active FROM coffeepos.shops WHERE slug = '$SHOP_SLUG';"
else
  echo "  psql not installed, skipping"
fi
echo ""

# ============================================================
# 5. Test Frontend Configuration
# ============================================================
echo -e "${YELLOW}[5/5] Frontend Configuration Checklist${NC}"
echo "  Check these files:"
echo "    1. Front-End/.env atau .env.local"
echo "       Must have: VITE_API_BASE_URL=$BACKEND_URL"
echo "    2. Front-End/src/pages/CustomerMenu.tsx"
echo "       Must import useParams from 'react-router-dom'"
echo "       Must use: const { shopSlug } = useParams()"
echo "    3. Front-End/index.html"
echo "       Check console for fetch errors"
echo ""

# ============================================================
# Summary
# ============================================================
echo -e "${YELLOW}Summary:${NC}"
if [[ $HTTP_CODE == "200" ]]; then
  echo -e "${GREEN}✓ Public API is working correctly!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Test frontend: http://localhost:5173/menu/$SHOP_SLUG"
  echo "  2. Open DevTools → Network tab"
  echo "  3. Look for GET /api/public/menu/$SHOP_SLUG request"
  echo "  4. Check response in Response tab"
else
  echo -e "${RED}✗ There's an issue with the API${NC}"
  echo ""
  echo "Debug steps:"
  echo "  1. Check Backend logs for errors"
  echo "  2. Verify shop exists in database:"
  echo "     SELECT * FROM coffeepos.shops WHERE slug='$SHOP_SLUG';"
  echo "  3. Check if shop is_active = true"
  echo "  4. Verify products exist:"
  echo "     SELECT COUNT(*) FROM coffeepos.products WHERE shop_id='...' AND is_available=true AND stock>0;"
fi
echo ""
