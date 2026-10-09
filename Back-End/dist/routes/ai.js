import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireRole.js';
import { HttpError } from '../http/errors.js';
import { getSalesForecast, getInventoryAlerts, getWasteAnalysis, getBusinessSummary } from '../utils/aiCalculations.js';
import { generateChatResponse } from '../services/grok.js';
const aiRouter = Router();
// In-memory caches
const forecastCache = new Map();
const inventoryCache = new Map();
const wasteCache = new Map();
const summaryCache = new Map();
// Rate limit state: storeId -> { count, resetAt }
const chatRateLimit = new Map();
// Generic cache getter and setter
function getCache(map, key) {
    const cached = map.get(key);
    if (cached && cached.expires > Date.now()) {
        return cached.data;
    }
    return null;
}
function setCache(map, key, data, ttlMinutes) {
    map.set(key, { data, expires: Date.now() + ttlMinutes * 60 * 1000 });
}
// Ensure all routes in this module are restricted to owners
aiRouter.use(requireRole('owner'));
/**
 * GET /api/ai/forecast
 * Returns a 7-day sales forecast.
 * Cached for 30 minutes.
 */
aiRouter.get('/forecast', async (req, res, next) => {
    try {
        const storeId = req.user.shop_id;
        const cached = getCache(forecastCache, storeId);
        if (cached) {
            res.json({ data: { ...cached, cache_hit: true } });
            return;
        }
        const forecast = await getSalesForecast(pool, storeId);
        const result = { forecast, generated_at: new Date().toISOString() };
        setCache(forecastCache, storeId, result, 30);
        res.json({ data: { ...result, cache_hit: false } });
    }
    catch (error) {
        console.log("ADA ERROR DI SINI ZLAN: ", error);
        next(error);
    }
});
/**
 * GET /api/ai/inventory-alerts
 * Returns low stock alerts based on AI calculated ADU.
 * Cached for 15 minutes.
 */
aiRouter.get('/inventory-alerts', async (req, res, next) => {
    try {
        const storeId = req.user.shop_id;
        const cached = getCache(inventoryCache, storeId);
        if (cached) {
            res.json({ data: cached });
            return;
        }
        const alerts = await getInventoryAlerts(pool, storeId);
        const total_critical = alerts.filter((a) => a.urgency === 'critical').length;
        const total_warning = alerts.filter((a) => a.urgency === 'warning').length;
        const result = { alerts, total_critical, total_warning, generated_at: new Date().toISOString() };
        setCache(inventoryCache, storeId, result, 15);
        res.json({ data: result });
    }
    catch (error) {
        console.log("ADA ERROR DI SINI LAN: ", error);
        next(error);
    }
});
const WasteQuerySchema = z.object({
    days: z.coerce
        .number()
        .refine((val) => [7, 14, 30].includes(val), {
        message: 'Days must be 7, 14, or 30',
    })
        .default(30),
});
/**
 * GET /api/ai/waste-analysis?days=30
 * Analyzes waste against sales to find the most problematic products.
 * Cached for 60 minutes.
 */
aiRouter.get('/waste-analysis', async (req, res, next) => {
    try {
        const storeId = req.user.shop_id;
        const { days } = WasteQuerySchema.parse(req.query);
        const cacheKey = `${storeId}:${days}`;
        const cached = getCache(wasteCache, cacheKey);
        if (cached) {
            res.json({ data: cached });
            return;
        }
        const analysis = await getWasteAnalysis(pool, storeId, days);
        setCache(wasteCache, cacheKey, analysis, 60);
        res.json({ data: analysis });
    }
    catch (error) {
        console.log("ADA ERROR DI SINI LAN: ", error);
        next(error);
    }
});
/**
 * GET /api/ai/summary
 * Provides a current business snapshot.
 * Cached for 10 minutes.
 */
aiRouter.get('/summary', async (req, res, next) => {
    try {
        const storeId = req.user.shop_id;
        const bust = req.query.bust === '1'; // ← tambah ini
        if (!bust) {
            const cached = getCache(summaryCache, storeId);
            if (cached) {
                res.json({ data: cached });
                return;
            }
        }
        const summary = await getBusinessSummary(pool, storeId);
        setCache(summaryCache, storeId, summary, 2);
        res.json({ data: summary });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
const ChatBodySchema = z.object({
    message: z.string().max(500),
    conversation_history: z
        .array(z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
    }))
        .max(10)
        .optional()
        .default([]),
});
/**
 * POST /api/ai/chat
 * Generates an AI chat response bounded by the store's current business context.
 * Rate limited to 20 requests per hour.
 */
aiRouter.post('/chat', async (req, res, next) => {
    try {
        const storeId = req.user.shop_id;
        // Hourly Rate Limiting
        const now = Date.now();
        let rateLimit = chatRateLimit.get(storeId);
        if (!rateLimit || rateLimit.resetAt < now) {
            rateLimit = { count: 0, resetAt: now + 60 * 60 * 1000 };
        }
        if (rateLimit.count >= 20) {
            throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'You have reached the maximum of 20 chat requests per hour. Please try again later.');
        }
        rateLimit.count += 1;
        chatRateLimit.set(storeId, rateLimit);
        const { message, conversation_history } = ChatBodySchema.parse(req.body);
        // Provide context grounding
        const summary = await getBusinessSummary(pool, storeId);
        const messages = [...conversation_history, { role: 'user', content: message }];
        const reply = await generateChatResponse(messages, summary);
        res.json({
            data: {
                reply,
                context_snapshot: {
                    today_revenue: summary.today_revenue,
                    this_week_revenue: summary.this_week_revenue,
                    total_transactions: summary.today_transactions,
                },
            },
        });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
export { aiRouter };
