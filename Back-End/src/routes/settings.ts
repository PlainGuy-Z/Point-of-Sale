import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';

export const settingsRouter = Router();

settingsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.user?.shop_id;
    if (!shopId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Any authenticated user in the shop (owner or cashier) can read settings

    // Get shop name
    const shopResult = await pool.query('SELECT name, slug FROM coffeepos.shops WHERE id = $1', [shopId]);
    if (shopResult.rows.length === 0) {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }
    const shop = shopResult.rows[0];

    // Get settings
    let settingsResult = await pool.query('SELECT * FROM coffeepos.shop_settings WHERE shop_id = $1', [shopId]);
    
    // Create default settings if not exists
    if (settingsResult.rows.length === 0) {
      await pool.query('INSERT INTO coffeepos.shop_settings (shop_id) VALUES ($1)', [shopId]);
      settingsResult = await pool.query('SELECT * FROM coffeepos.shop_settings WHERE shop_id = $1', [shopId]);
    }

    const settings = settingsResult.rows[0];

    res.json({
      shop_name: shop.name,
      shop_slug: shop.slug,
      ...settings,
      tax_rate: Number(settings.tax_rate),
      service_charge_rate: Number(settings.service_charge_rate)
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const updateSettingsSchema = z.object({
  shop_name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  open_time: z.string().optional(),
  close_time: z.string().optional(),
  tax_enabled: z.boolean().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  tax_label: z.string().optional(),
  tax_inclusive: z.boolean().optional(),
  service_charge_enabled: z.boolean().optional(),
  service_charge_rate: z.number().min(0).max(100).optional(),
  service_charge_label: z.string().optional(),
  receipt_footer: z.string().optional().nullable(),
  receipt_show_logo: z.boolean().optional(),
  receipt_paper_size: z.enum(['58mm', '80mm']).optional(),
  receipt_auto_print: z.boolean().optional(),
  receipt_show_tax: z.boolean().optional(),
  print_method: z.enum(['browser', 'rawbt', 'network', 'rawbt_intent']).optional(),
  rawbt_ip: z.string().optional().nullable(),
  default_order_type: z.enum(['dine_in', 'takeaway']).optional(),
  require_customer_name: z.boolean().optional(),
  require_table_number: z.boolean().optional(),
  payment_cash: z.boolean().optional(),
  payment_qris: z.boolean().optional(),
  payment_transfer: z.boolean().optional(),
  low_stock_threshold: z.number().min(0).optional(),
  auto_disable_zero_stock: z.boolean().optional(),
  currency_format: z.enum(['Rp', 'IDR']).optional(),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  language: z.enum(['id', 'en']).optional()
});

settingsRouter.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.user?.shop_id;
    if (!shopId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (req.user?.role !== 'owner') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const body = updateSettingsSchema.parse(req.body);

    await pool.query('BEGIN');

    // Update shop name and slug if provided
    if (body.shop_name) {
      let slug = body.shop_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      let isUnique = false;
      let count = 0;
      while (!isUnique) {
        const currentSlug = count === 0 ? slug : `${slug}-${count}`;
        const check = await pool.query(
          'SELECT id FROM coffeepos.shops WHERE slug = $1 AND id != $2::uuid',
          [currentSlug, shopId]
        );
        if (check.rowCount === 0) {
          slug = currentSlug;
          isUnique = true;
        } else {
          count++;
        }
      }
      await pool.query('UPDATE coffeepos.shops SET name = $1, slug = $2 WHERE id = $3', [body.shop_name, slug, shopId]);
    }

    // Build UPDATE query for shop_settings dynamically based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(body)) {
      if (key !== 'shop_name' && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      const query = `
        INSERT INTO coffeepos.shop_settings (shop_id) 
        VALUES ($${paramIndex}) 
        ON CONFLICT (shop_id) DO UPDATE SET 
        ${updateFields.join(', ')}
        RETURNING *
      `;
      values.push(shopId);
      await pool.query(query, values);
    }

    await pool.query('COMMIT');
    
    // Fetch updated settings to return
    const shopResult = await pool.query('SELECT name, slug FROM coffeepos.shops WHERE id = $1', [shopId]);
    const settingsResult = await pool.query('SELECT * FROM coffeepos.shop_settings WHERE shop_id = $1', [shopId]);
    
    res.json({
      shop_name: shopResult.rows[0].name,
      shop_slug: shopResult.rows[0].slug,
      ...settingsResult.rows[0],
      tax_rate: Number(settingsResult.rows[0].tax_rate),
      service_charge_rate: Number(settingsResult.rows[0].service_charge_rate)
    });
  } catch (error) {
    await pool.query('ROLLBACK');
      if (error instanceof z.ZodError) {
        // Gunakan .issues sebagai pengganti .errors
        res.status(400).json({ 
          message: 'Invalid data', 
          errors: error.issues 
        });
        return;
      }
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


