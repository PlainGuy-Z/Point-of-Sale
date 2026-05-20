-- ============================================================
-- E-Menu Public - Database Setup & Verification Script
-- ============================================================
-- Run ini di Supabase Query Editor untuk setup test data
-- dan verify database state
-- ============================================================

-- ============================================================
-- 1. VERIFY SCHEMA EXISTS
-- ============================================================
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'coffeepos';
-- Expected: 1 row dengan "coffeepos"


-- ============================================================
-- 2. VERIFY CORE TABLES EXIST
-- ============================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'coffeepos' 
AND table_name IN ('shops', 'products', 'categories');
-- Expected: 3 rows (shops, products, categories)


-- ============================================================
-- 3. LIST EXISTING SHOPS
-- ============================================================
SELECT id, name, slug, is_active, created_at
FROM coffeepos.shops
ORDER BY created_at DESC;
-- Check: Does your shop exist? Is is_active = true?


-- ============================================================
-- 4. CREATE TEST SHOP (if not exists)
-- ============================================================
-- ⚠️ Run this only if you need to create a test shop
-- Change the values as needed

INSERT INTO coffeepos.shops (name, slug, address, phone, is_active)
VALUES (
  'Coffee Metro',              -- Change this
  'coffee-metro',              -- Change this (must be unique, lowercase, no spaces)
  'Jl. Sudirman No. 123',
  '+62812345678',
  true
)
ON CONFLICT (slug) DO UPDATE SET is_active = true;
-- This will create if not exists, or update is_active if exists


-- ============================================================
-- 5. GET YOUR SHOP ID (for next steps)
-- ============================================================
SELECT id, name, slug FROM coffeepos.shops 
WHERE slug = 'coffee-metro';  -- Change to your shop slug
-- Copy the ID - you'll need it below!


-- ============================================================
-- 6. CHECK PRODUCTS FOR YOUR SHOP
-- ============================================================
-- Change 'your-shop-id-here' with the ID from step 5
SELECT 
  id, 
  name, 
  price, 
  stock, 
  is_available,
  category
FROM coffeepos.products
WHERE shop_id = 'your-shop-id-here'  -- Replace this
ORDER BY name;
-- Expected: At least 1 product


-- ============================================================
-- 7. COUNT AVAILABLE PRODUCTS
-- ============================================================
-- These are products that WILL show in the public menu
SELECT COUNT(*) as available_products_count
FROM coffeepos.products
WHERE shop_id = 'your-shop-id-here'  -- Replace this
  AND is_available = true
  AND stock > 0;
-- Expected: > 0


-- ============================================================
-- 8. CREATE TEST PRODUCTS (if needed)
-- ============================================================
-- Run these to add test products to your shop
-- Warning: Only run if you have empty shop

INSERT INTO coffeepos.products 
(name, price, category, description, stock, cost, is_available, shop_id)
VALUES
('Espresso', 25000, 'Coffee', 'Classic single shot espresso', 100, 5000, true, 'your-shop-id-here'),
('Cappuccino', 35000, 'Coffee', 'Espresso with steamed milk', 100, 7000, true, 'your-shop-id-here'),
('Latte', 35000, 'Coffee', 'Espresso with more milk', 100, 7000, true, 'your-shop-id-here'),
('Green Tea', 20000, 'Tea', 'Hot green tea', 100, 3000, true, 'your-shop-id-here'),
('Iced Coffee', 28000, 'Coffee', 'Cold brew coffee', 100, 6000, true, 'your-shop-id-here'),
('Croissant', 18000, 'Pastry', 'French croissant', 50, 5000, true, 'your-shop-id-here');

-- Replace 'your-shop-id-here' with your actual shop ID!


-- ============================================================
-- 9. CREATE TEST CATEGORIES (if needed)
-- ============================================================
INSERT INTO coffeepos.categories (name, shop_id)
VALUES
('Coffee', 'your-shop-id-here'),
('Tea', 'your-shop-id-here'),
('Pastry', 'your-shop-id-here')
ON CONFLICT DO NOTHING;

-- Replace 'your-shop-id-here' with your actual shop ID!


-- ============================================================
-- 10. FULL MENU PREVIEW (what customer will see)
-- ============================================================
-- This query shows EXACTLY what will be returned by the API

SELECT 
  sp.id as shop_id,
  sp.name as shop_name,
  sp.slug,
  sp.address,
  sp.phone,
  sp.logo_url,
  COUNT(DISTINCT p.id) as product_count,
  COUNT(DISTINCT c.id) as category_count
FROM coffeepos.shops sp
LEFT JOIN coffeepos.products p ON sp.id = p.shop_id 
  AND p.is_available = true 
  AND p.stock > 0
LEFT JOIN coffeepos.categories c ON sp.id = c.shop_id
WHERE sp.slug = 'coffee-metro'  -- Change to your shop slug
GROUP BY sp.id, sp.name, sp.slug, sp.address, sp.phone, sp.logo_url;

-- Expected: 1 row showing your shop with product_count > 0


-- ============================================================
-- 11. DEBUG: Products that WON'T show
-- ============================================================
-- These products will NOT show in public menu (unavailable or no stock)
SELECT 
  name, 
  is_available, 
  stock,
  CASE 
    WHEN is_available = false THEN 'Unavailable (is_available=false)'
    WHEN stock = 0 THEN 'Out of stock (stock=0)'
    ELSE 'Should show'
  END as reason
FROM coffeepos.products
WHERE shop_id = 'your-shop-id-here'  -- Replace this
  AND (is_available = false OR stock = 0);

-- Replace 'your-shop-id-here' with your actual shop ID!


-- ============================================================
-- 12. ENABLE SHOP (if showing as inactive)
-- ============================================================
UPDATE coffeepos.shops
SET is_active = true
WHERE slug = 'coffee-metro';  -- Change to your shop slug


-- ============================================================
-- 13. FIX PRODUCTS: Make all available and in stock
-- ============================================================
-- Use this to quickly fix products for testing
UPDATE coffeepos.products
SET is_available = true, stock = 100
WHERE shop_id = 'your-shop-id-here'  -- Replace this
  AND (is_available = false OR stock = 0);

-- Replace 'your-shop-id-here' with your actual shop ID!


-- ============================================================
-- 14. VERIFY FOREIGN KEYS
-- ============================================================
-- Make sure all products reference valid shops
SELECT COUNT(*) as invalid_products
FROM coffeepos.products p
LEFT JOIN coffeepos.shops s ON p.shop_id = s.id
WHERE p.shop_id IS NOT NULL AND s.id IS NULL;
-- Expected: 0 rows


-- ============================================================
-- 15. FINAL: API RESPONSE PREVIEW
-- ============================================================
-- This mimics what the public API will return

WITH shop_data AS (
  SELECT id, name, slug, address, phone, logo_url, plan
  FROM coffeepos.shops
  WHERE slug = 'coffee-metro'  -- Change to your shop slug
),
products_data AS (
  SELECT 
    p.id::text,
    p.name,
    p.description,
    p.price,
    p.category,
    p.stock,
    p.cost,
    p.min_stock,
    p.image,
    p.category_id::text,
    p.discount,
    p.is_promo,
    p.promo_price,
    p.promo_label,
    p.is_available
  FROM coffeepos.products p
  WHERE p.shop_id = (SELECT id FROM shop_data)
    AND p.is_available = true
    AND p.stock > 0
  ORDER BY p.name ASC
),
categories_data AS (
  SELECT id::text, name
  FROM coffeepos.categories
  WHERE shop_id = (SELECT id FROM shop_data)
  ORDER BY name ASC
)
SELECT 
  row_to_json((SELECT * FROM shop_data)) as shop,
  (SELECT json_agg(row_to_json(t)) FROM products_data t) as products,
  (SELECT json_agg(row_to_json(t)) FROM categories_data t) as categories;

-- This should return the same structure as /api/public/menu/{shopSlug}


-- ============================================================
-- Notes & Tips
-- ============================================================
-- 
-- 1. Replace 'your-shop-id-here' with actual UUID from step 5
-- 2. Replace 'coffee-metro' with your actual shop slug
-- 3. Run queries one by one, not all at once
-- 4. Check results after each query
-- 5. If stuck, take screenshot and share the results
--
-- ============================================================
