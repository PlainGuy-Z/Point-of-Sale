/*
 * SQL Migration (run once):
 *
 * -- Allow stock = -1 for unlimited/untracked products
 * ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_check;
 * ALTER TABLE products ADD CONSTRAINT products_stock_check CHECK (stock >= -1);
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0
 *   CHECK (discount >= 0 AND discount <= 100);
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS is_promo BOOLEAN NOT NULL DEFAULT false;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS promo_price INTEGER;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS promo_label TEXT;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS promo_start DATE;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS promo_end DATE;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;
 */
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { z } from 'zod';
import { env } from '../env.js';
async function createCompletion(messages) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.GROK_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: env.GROK_MODEL, messages, stream: false }),
        signal: AbortSignal.timeout(60_000),
    });
    const payload = await response.json();
    if (!response.ok) {
        throw new Error(`Grok API error (${response.status}): ${payload.error?.message ?? response.statusText}`);
    }
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content)
        throw new Error('Grok API returned an empty response');
    return content;
}
export async function generateChatResponse(messages, context) {
    if (messages.length === 0) {
        throw new Error('Messages array cannot be empty');
    }
    const systemPrompt = `
Kamu adalah AI Business Advisor untuk SmartPOS — platform POS untuk kedai kopi dan restoran Indonesia.

IDENTITAS:
Kamu adalah konsultan bisnis yang cerdas, ramah, dan selalu berbasis data. 
Kamu berbicara dalam Bahasa Indonesia yang profesional namun hangat — 
seperti mentor bisnis yang berpengalaman, bukan robot formal.

CARA MENJAWAB:
1. Selalu gunakan data dari konteks bisnis yang diberikan
2. Jawab maksimal 3 paragraf — singkat, padat, langsung ke inti
3. Berikan rekomendasi yang konkret dan bisa langsung dijalankan owner
4. Jika data tidak cukup untuk menjawab, katakan dengan jujur
5. Ketika relevan, sebutkan menu atau fitur spesifik 
   di SmartPOS yang bisa membantu user menyelesaikan masalah.
   Contoh: "Kamu bisa cek detail ini di menu Laporan Penjualan."

FORMAT OUTPUT (WAJIB DIIKUTI):
- Tulis dalam paragraf biasa tanpa format Markdown
- Tidak boleh menggunakan ** * # atau simbol formatting lainnya
- Tidak boleh menggunakan bullet points dengan simbol (- atau *)
- Jika perlu list, gunakan angka: 1. 2. 3.
- Pisahkan paragraf dengan baris kosong

ATURAN ANALISIS DATA:
1. Perbandingan mingguan menggunakan minggu kalender (Senin-Minggu)
   Contoh salah: bandingkan akumulasi Senin-Selasa minggu ini (2 hari) 
                 dengan total minggu lalu (7 hari penuh)
   Contoh benar: bandingkan minggu ini sampai hari ini 
                 dengan periode yang sama minggu lalu
                 (misal: Senin-Selasa minggu ini vs Senin-Selasa minggu lalu)

2. Jika baru awal minggu (Senin atau Selasa), sampaikan:
   "Baru awal minggu, data perbandingan belum representatif. 
   Pantau hingga pertengahan minggu untuk tren yang lebih akurat."

3. Selalu sebutkan angka spesifik dari data, jangan perkiraan

4. Untuk analisis profitabilitas produk, gunakan data HPP (cost) 
   yang tersedia di konteks

FITUR APLIKASI SMARTPOS:
Kamu tahu persis fitur-fitur yang tersedia di SmartPOS. 
Ketika memberi saran, selalu arahkan user ke fitur yang relevan.

Menu yang tersedia untuk Owner:

HARIAN:
- Point of Sale (/pos) 
  → Untuk input transaksi baru, proses pembayaran

- Laporan Penjualan (/sales-report)
  → Lihat penjualan per tanggal, grafik per jam, 
    produk terlaris, breakdown metode pembayaran, export CSV

LAPORAN & ANALITIK:
- Business Intelligence (/insights) — halaman ini
  → Prediksi 7 hari, BCG matrix produk, analisis waste,
    performa shift, chat AI (kamu sendiri)

- Riwayat Transaksi (/transactions)
  → Semua transaksi dengan filter tanggal dan kasir,
    ajukan void/pembatalan transaksi, cetak struk ulang

- Laporan Shift (/shifts)
  → Riwayat semua shift semua kasir, selisih kas,
    detail transaksi per shift

PRODUK & STOK:
- Manajemen Produk (/operation/products)
  → Tambah/edit/hapus produk, atur harga, stok, 
    promo, diskon, foto produk

- Inventory & Biaya (/operation/inventory-usage)
  → Laporan penggunaan stok, HPP, biaya operasional

- Waste Log (/operation/waste-log)
  → Catat bahan baku terbuang, lihat total kerugian waste

PELANGGAN:
- Members (/customers/members)
  → Daftar member, tambah member baru, edit data

- Loyalty & Kunjungan (/customers/loyalty-insight)
  → Analisis kunjungan pelanggan, program loyalti

MANAJEMEN:
- Manajemen Kasir (/users)
  → Buat akun kasir baru, reset password, 
    aktifkan/nonaktifkan kasir

- Settings (/settings)
  → Pengaturan toko, pajak, service charge, 
    pengaturan struk, ganti password

CARA MENGGUNAKAN PENGETAHUAN INI:
Ketika user bertanya sesuatu, arahkan ke fitur yang tepat.
Contoh:
  User: "Bagaimana cara lihat transaksi kemarin?"
  Kamu: "Buka menu Riwayat Transaksi, lalu filter 
         tanggal ke kemarin untuk melihat semua transaksi."

  User: "Kenapa stok Thai Tea habis?"  
  Kamu: "Cek di Waste Log untuk lihat apakah ada 
         pencatatan waste untuk Thai Tea. Atau buka 
         Manajemen Produk untuk update stok secara manual."

  User: "Kasir saya lupa password"
  Kamu: "Buka Manajemen Kasir, cari nama kasir tersebut,
         klik Reset Password. Sistem akan generate 
         password sementara yang bisa diberikan ke kasir."

KONTEKS BISNIS SAAT INI:
Tanggal: ${new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Jakarta'
    })}

Data toko:
- Omzet hari ini: Rp ${context.today_revenue.toLocaleString('id-ID')}
- Omzet kemarin: Rp ${context.yesterday_revenue.toLocaleString('id-ID')}
- Omzet minggu ini (Senin s/d hari ini): Rp ${context.this_week_revenue.toLocaleString('id-ID')}
- Omzet minggu lalu (Senin s/d hari yang sama): Rp ${context.last_week_revenue.toLocaleString('id-ID')}
- Perubahan minggu ini vs periode sama minggu lalu: ${context.week_over_week_change_percent}%
- Perubahan hari ini vs kemarin: ${context.day_over_day_change_percent}%
- Produk terlaris hari ini: ${context.top_products_today || 'Belum ada data'}
- Produk stok rendah: ${context.low_stock_count} produk
- Shift aktif: ${context.active_shifts_count} shift

Gunakan data di atas untuk menjawab pertanyaan dengan akurat dan relevan.
`.trim();
    return createCompletion([
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({
            role: message.role === 'model' ? 'assistant' : 'user',
            content: message.content,
        })),
    ]);
}
export async function generateBusinessInsights(dataPayload, from, to) {
    const prompt = `Kamu adalah Konsultan Bisnis Profesional. 
Tugasmu adalah menganalisis data performa kedai kopi/restoran berikut untuk periode ${from} hingga ${to}:

${JSON.stringify(dataPayload, null, 2)}

Berikan 3 paragraf analisis ringkas dan konkret (tanpa format khusus seperti ** atau bullet points):
Paragraf 1: Ringkasan tren pendapatan dan transaksi secara umum.
Paragraf 2: Sorotan pada produk terlaris dan kategori terkuat.
Paragraf 3: Peringatan mengenai stok menipis dan waste, beserta rekomendasi langkah nyata.`;
    return createCompletion([
        { role: 'system', content: 'Berikan insight bisnis tanpa formatting khusus.' },
        { role: 'user', content: prompt },
    ]);
}
export const appRouter = Router();
const CreateWasteLogSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    reason: z.enum(['expired', 'damaged', 'spilled', 'other']),
    notes: z.string().trim().max(500).optional()
});
const ProductSchema = z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().nullish(),
    price: z.coerce.number().int().nonnegative(),
    category: z.string().trim().min(1),
    stock: z.coerce.number().int().min(-1),
    minStock: z.coerce.number().int().nonnegative().nullish(),
    cost: z.coerce.number().int().nonnegative().nullish(),
    image: z.string().trim().nullish(),
    discount: z.coerce.number().int().min(0).max(100).default(0),
    isPromo: z.boolean().default(false),
    promoPrice: z.coerce.number().int().nonnegative().nullish(),
    promoLabel: z.string().trim().nullish(),
    promoStart: z.string().trim().nullish(),
    promoEnd: z.string().trim().nullish(),
    isAvailable: z.boolean().default(true),
});
const CategorySchema = z.object({
    name: z.string().trim().min(1)
});
/* ─── Helper: ensure category exists, filtered by shop ──────── */
async function ensureCategory(categoryName, shopId, client) {
    const queryRunner = client ?? pool;
    const existing = await queryRunner.query(`SELECT id::text FROM coffeepos.categories WHERE name = $1 AND shop_id = $2::uuid LIMIT 1`, [categoryName, shopId]);
    if (existing.rowCount > 0)
        return existing.rows[0].id;
    const inserted = await queryRunner.query(`INSERT INTO coffeepos.categories (name, shop_id) VALUES ($1, $2::uuid)
     ON CONFLICT (name, shop_id) DO UPDATE SET name = EXCLUDED.name
     RETURNING id::text`, [categoryName, shopId]);
    return inserted.rows[0].id;
}
/* ─── buildAppState ─────────────────────────────────────────── */
export async function buildAppState(shopId, user) {
    const [products, txs, wastes, cats] = await Promise.all([
        pool.query(`SELECT p.id::text, p.name, p.description, p.price,
              c.name as category, p.stock, p.min_stock, p.cost,
              p.image, p.discount, p.is_promo, p.promo_price,
              p.promo_label, p.promo_start, p.promo_end, p.is_available
       FROM coffeepos.products p
       LEFT JOIN coffeepos.categories c ON p.category_id = c.id
       WHERE p.shop_id = $1::uuid
         AND p.is_available = true
       ORDER BY p.name ASC`, [shopId]),
        pool.query(`SELECT
         t.id::text AS id,
         t.created_at AS date,
         t.grand_total AS total,
         (SELECT COALESCE(SUM(p.cost * i.quantity), 0)
            FROM coffeepos.transaction_items i
            LEFT JOIN coffeepos.products p ON p.id = i.product_id
           WHERE i.transaction_id = t.id) AS cost,
         (t.subtotal - (SELECT COALESCE(SUM(p.cost * i.quantity), 0)
            FROM coffeepos.transaction_items i
            LEFT JOIN coffeepos.products p ON p.id = i.product_id
           WHERE i.transaction_id = t.id)) AS profit,
         t.payment_method,
         t.customer_name,
         t.table_number,
         t.cashier_name,
         ss.tax_rate AS tax_rate,
         'dine-in'::text AS order_type,
         t.notes::text AS order_note,
         (
           SELECT COALESCE(
             json_agg(
               json_build_object(
                 'productId', COALESCE(i.product_id::text, 'manual'),
                 'quantity', i.quantity,
                 'price', i.price,
                 'note', i.name,
                 'modifiers', '[]'::json
               )
             ),
             '[]'::json
           )
           FROM coffeepos.transaction_items i
           WHERE i.transaction_id = t.id
         ) AS items
       FROM coffeepos.transactions t
       LEFT JOIN coffeepos.shop_settings ss ON ss.shop_id = t.shop_id
       WHERE t.shop_id = $1::uuid
         AND COALESCE(t.status::text, 'completed') <> 'voided'
         ${user && user.role === 'cashier' ? `AND t.cashier_id = '${user.id}'::uuid` : ''}
       ORDER BY t.created_at DESC
       LIMIT 200`, [shopId]),
        pool.query(`SELECT
         w.id::text AS id,
         w.product_id::text AS product_id,
         p.name AS product_name,
         w.quantity,
         w.reason,
         w.loss_amount AS cost_loss,
         w.created_at AS date
       FROM coffeepos.waste_logs w
       JOIN coffeepos.products p ON p.id = w.product_id
       WHERE w.shop_id = $1::uuid
       ORDER BY w.created_at DESC
       LIMIT 500`, [shopId]),
        pool.query(`SELECT id::text, name FROM coffeepos.categories WHERE shop_id = $1::uuid ORDER BY name ASC`, [shopId])
    ]);
    const categories = cats.rows.map(r => r.name);
    return {
        products: products.rows.map((p) => ({
            ...p,
            category: p.category || 'Uncategorized',
            stock: Number(p.stock),
            minStock: Number(p.min_stock ?? 5),
            price: Number(p.price),
            cost: p.cost === null ? undefined : Number(p.cost),
            discount: Number(p.discount ?? 0),
            isPromo: Boolean(p.is_promo),
            promoPrice: p.promo_price ? Number(p.promo_price) : undefined,
            promoLabel: p.promo_label ?? undefined,
            promoStart: p.promo_start ?? undefined,
            promoEnd: p.promo_end ?? undefined,
            isAvailable: p.is_available !== false,
            unit: 'pcs',
            image: p.image || null
        })),
        transactions: txs.rows.map((t) => ({
            id: t.id,
            date: new Date(t.date).toISOString(),
            items: t.items,
            total: Number(t.total),
            cost: Number(t.cost),
            profit: Number(t.profit),
            paymentMethod: t.payment_method,
            customerName: t.customer_name ?? undefined,
            tableNumber: t.table_number ?? undefined,
            cashierName: t.cashier_name,
            taxRate: Number(t.tax_rate ?? 11),
            orderType: t.order_type,
            orderNote: t.order_note ?? undefined,
        })),
        wasteLogs: wastes.rows.map((w) => ({
            id: w.id,
            productId: w.product_id,
            productName: w.product_name,
            quantity: Number(w.quantity),
            reason: w.reason,
            date: new Date(w.date).toISOString(),
            costLoss: Number(w.cost_loss),
            notes: undefined
        })),
        customers: [],
        settings: {
            storeName: 'Coffee Shop',
            address: 'Jl. Utama No. 123',
            taxRate: 11,
            currency: 'IDR',
            currencyPosition: 'before',
            decimalPlaces: 0,
            thousandsSeparator: 'comma',
            receiptFooter: 'Terima kasih telah berbelanja!'
        },
        categories,
        categoriesWithId: cats.rows.map(r => ({ id: r.id, name: r.name }))
    };
}
// GET /app/state
appRouter.get('/state', async (req, res, next) => {
    try {
        console.log('[DB] GET /app/state - Mengambil snapshot data dengan tabel categories...');
        res.json(await buildAppState(req.user.shop_id, req.user));
    }
    catch (err) {
        next(err);
    }
});
// POST /app/waste-logs
appRouter.post('/waste-logs', validateBody(CreateWasteLogSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const shopId = req.user.shop_id;
        await withTransaction(async (client) => {
            const product = await client.query(`SELECT id::text, name, stock, cost FROM coffeepos.products WHERE id = $1::uuid AND shop_id = $2::uuid FOR UPDATE`, [body.productId, shopId]);
            if (product.rowCount === 0)
                throw new HttpError(400, 'UNKNOWN_PRODUCT', 'productId not found');
            const p = product.rows[0];
            const stock = Number(p.stock);
            const cost = Number(p.cost ?? 0);
            if (stock < body.quantity)
                throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock');
            await client.query(`UPDATE coffeepos.products SET stock = stock - $2::int, updated_at = now() WHERE id = $1::uuid AND shop_id = $3::uuid`, [body.productId, body.quantity, shopId]);
            await client.query(`INSERT INTO coffeepos.waste_logs (product_id, quantity, reason, loss_amount, shop_id) VALUES ($1::uuid, $2::int, $3::text, $4::int, $5::uuid)`, [body.productId, body.quantity, body.reason, cost * body.quantity, shopId]);
        });
        res.status(201).json(await buildAppState(shopId, req.user));
    }
    catch (err) {
        next(err);
    }
});
// POST /app/products
appRouter.post('/products', validateBody(ProductSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const shopId = req.user.shop_id;
        const categoryId = await ensureCategory(body.category, shopId);
        await pool.query(`INSERT INTO coffeepos.products
        (name, description, price, category, category_id, stock, min_stock, cost, image,
         discount, is_promo, promo_price, promo_label, promo_start, promo_end, is_available, shop_id)
       VALUES ($1, $2, $3, $4, $5::uuid,
               $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::uuid)`, [body.name, body.description || '', body.price, body.category, categoryId,
            body.stock, body.minStock || 5, body.cost || 0, body.image || null,
            body.discount || 0, body.isPromo || false, body.promoPrice || null,
            body.promoLabel || null, body.promoStart || null, body.promoEnd || null,
            body.isAvailable !== false, shopId]);
        res.status(201).json(await buildAppState(shopId, req.user));
    }
    catch (err) {
        console.error('[DB] Error inserting product:', err);
        if (err.code === '23502') { // NOT NULL violation
            return next(new HttpError(400, 'INVALID_CATEGORY', 'Kategori tidak ditemukan di database'));
        }
        next(err);
    }
});
// PUT /app/products/:id
appRouter.put('/products/:id', validateBody(ProductSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const shopId = req.user.shop_id;
        const categoryId = await ensureCategory(body.category, shopId);
        const result = await pool.query(`UPDATE coffeepos.products
       SET name = $1, description = $2, price = $3, category = $4,
           category_id = $5::uuid,
           stock = $6, min_stock = $7, cost = $8, image = $9,
           discount = $10, is_promo = $11, promo_price = $12,
           promo_label = $13, promo_start = $14, promo_end = $15,
           is_available = $16,
           updated_at = now()
       WHERE id = $17::uuid AND shop_id = $18::uuid`, [body.name, body.description || '', body.price, body.category, categoryId,
            body.stock, body.minStock || 5, body.cost || 0, body.image || null,
            body.discount || 0, body.isPromo || false, body.promoPrice || null,
            body.promoLabel || null, body.promoStart || null, body.promoEnd || null,
            body.isAvailable !== false, id, shopId]);
        if (result.rowCount === 0)
            throw new HttpError(404, 'NOT_FOUND', 'Product not found');
        res.json(await buildAppState(shopId, req.user));
    }
    catch (err) {
        console.error('[DB] Error updating product:', err);
        if (err.code === '23502') { // NOT NULL violation
            return next(new HttpError(400, 'INVALID_CATEGORY', 'Kategori tidak ditemukan di database'));
        }
        next(err);
    }
});
// DELETE /app/products/:id
appRouter.delete('/products/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const shopId = req.user.shop_id;
        const result = await pool.query(`DELETE FROM coffeepos.products WHERE id = $1::uuid AND shop_id = $2::uuid`, [id, shopId]);
        if (result.rowCount === 0)
            throw new HttpError(404, 'NOT_FOUND', 'Product not found');
        res.json(await buildAppState(shopId, req.user));
    }
    catch (err) {
        next(err);
    }
});
// POST /app/categories
appRouter.post('/categories', validateBody(CategorySchema), async (req, res, next) => {
    try {
        const shopId = req.user.shop_id;
        await pool.query(`INSERT INTO coffeepos.categories (name, shop_id) VALUES ($1, $2::uuid) ON CONFLICT (name, shop_id) DO NOTHING`, [req.body.name, shopId]);
        res.json(await buildAppState(shopId, req.user));
    }
    catch (err) {
        next(err);
    }
});
// DELETE /app/categories/:name
appRouter.delete('/categories/:name', async (req, res, next) => {
    try {
        const shopId = req.user.shop_id;
        // Note: User should handle product reassignment before deleting category in UI
        await pool.query(`DELETE FROM coffeepos.categories WHERE name = $1 AND shop_id = $2::uuid`, [req.params.name, shopId]);
        res.json(await buildAppState(shopId, req.user));
    }
    catch (err) {
        next(err);
    }
});
