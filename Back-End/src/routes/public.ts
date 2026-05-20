import { Router } from 'express';
import { pool } from '../db/pool.js';
import { HttpError } from '../http/errors.js';

export const publicRouter = Router();

/**
 * GET /api/public/menu/:shopSlug
 * 
 * Fetch public menu data for a specific shop
 * - No authentication required (public endpoint)
 * - Returns shop info, products, and categories
 * - Filters for available products only (is_available = true)
 * 
 * @param shopSlug - The slug of the shop (from URL parameter)
 * @returns {Object} Shop info, products array, and categories array
 */
publicRouter.get('/menu/:shopSlug', async (req, res, next) => {
  try {
    const { shopSlug } = req.params;

    if (!shopSlug || typeof shopSlug !== 'string') {
      throw new HttpError(400, 'INVALID_SLUG', 'Shop slug is required and must be a string');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1️⃣ Query shop by slug
    // ─────────────────────────────────────────────────────────────────────────
    const shopResult = await pool.query(
      `SELECT id, name, slug, address, phone, logo_url, plan, is_active
       FROM coffeepos.shops
       WHERE slug = $1 AND is_active = true`,
      [shopSlug]
    );

    if (shopResult.rows.length === 0) {
      throw new HttpError(404, 'SHOP_NOT_FOUND', `Shop with slug "${shopSlug}" not found`);
    }

    const shop = shopResult.rows[0];

    // ─────────────────────────────────────────────────────────────────────────
    // 2️⃣ Query products for this shop (only available items)
    // ─────────────────────────────────────────────────────────────────────────
    const productsResult = await pool.query(
      `SELECT 
         id::text as id,
         name,
         description,
         price,
         category,
         stock,
         cost,
         min_stock,
         image,
         category_id::text as category_id,
         discount,
         is_promo,
         promo_price,
         promo_label,
         promo_start,
         promo_end,
         is_available,
         created_at,
         updated_at
       FROM coffeepos.products
       WHERE shop_id = $1::uuid
         AND is_available = true
       ORDER BY name ASC`,
      [shop.id]
    );

    const products = productsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      category: row.category,
      stock: Number(row.stock),
      cost: Number(row.cost ?? 0),
      minStock: Number(row.min_stock ?? 0),
      image: row.image,
      categoryId: row.category_id,
      discount: Number(row.discount ?? 0),
      isPromo: row.is_promo,
      promoPrice: row.promo_price ? Number(row.promo_price) : undefined,
      promoLabel: row.promo_label,
      promoStart: row.promo_start,
      promoEnd: row.promo_end,
      isAvailable: row.is_available,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // 3️⃣ Query categories for this shop
    // ─────────────────────────────────────────────────────────────────────────
    const categoriesResult = await pool.query(
      `SELECT id::text as id, name
       FROM coffeepos.categories
       WHERE shop_id = $1::uuid
       ORDER BY name ASC`,
      [shop.id]
    );

    const categories = categoriesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // 4️⃣ Return response
    // ─────────────────────────────────────────────────────────────────────────
    res.json({
      success: true,
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        address: shop.address,
        phone: shop.phone,
        logo_url: shop.logo_url,
        plan: shop.plan,
      },
      products,
      categories,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/shop/:shopSlug
 * 
 * Fetch only shop info (not products)
 * Useful for loading shop metadata before displaying products
 * 
 * @param shopSlug - The slug of the shop
 * @returns {Object} Shop info object
 */
publicRouter.get('/shop/:shopSlug', async (req, res, next) => {
  try {
    const { shopSlug } = req.params;

    if (!shopSlug || typeof shopSlug !== 'string') {
      throw new HttpError(400, 'INVALID_SLUG', 'Shop slug is required');
    }

    const result = await pool.query(
      `SELECT id, name, slug, address, phone, logo_url, plan, is_active, created_at
       FROM coffeepos.shops
       WHERE slug = $1 AND is_active = true`,
      [shopSlug]
    );

    if (result.rows.length === 0) {
      throw new HttpError(404, 'SHOP_NOT_FOUND', `Shop "${shopSlug}" not found`);
    }

    const shop = result.rows[0];

    res.json({
      success: true,
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        address: shop.address,
        phone: shop.phone,
        logo_url: shop.logo_url,
        plan: shop.plan,
        created_at: shop.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});
