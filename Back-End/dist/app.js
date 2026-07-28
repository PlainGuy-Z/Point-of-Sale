import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { errorHandler, notFoundHandler } from './http/errors.js';
import { posRouter } from './routes/pos.js';
import { appRouter } from './routes/app.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { shiftsRouter } from './routes/shifts.js';
import { transactionsRouter } from './routes/transactions.js';
import { settingsRouter } from './routes/settings.js';
import { aiRouter } from './routes/ai.js';
import { reportsRouter } from './routes/reports.js';
import { printerRouter } from './routes/printer.js';
import { publicRouter } from './routes/public.js';
import { branchesRouter } from './routes/branches.js';
import { syncRouter } from './routes/sync.js';
import { authenticateToken } from './middleware/auth.js';
export function createApp() {
    const app = express();
    // Set trust proxy to trust the first proxy (e.g. Nginx, Cloudflare)
    // This resolves ERR_ERL_UNEXPECTED_X_FORWARDED_FOR from express-rate-limit
    app.set('trust proxy', 1);
    app.disable('x-powered-by');
    app.use(helmet({
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false,
    }));
    app.use(cookieParser());
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (env.corsOrigins.includes(origin)) {
                return callback(null, true);
            }
            // ✅ Fix: nama project yang benar
            if (origin.endsWith('.vercel.app') &&
                origin.includes('point-of-sale')) {
                return callback(null, true);
            }
            if (origin.startsWith('http://localhost:') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.') || origin.startsWith('http://172.')) {
                return callback(null, true);
            }
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 200,
    };
    app.options(/.*/, cors(corsOptions));
    app.use(cors(corsOptions));
    app.use((_req, res, next) => {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
        next();
    });
    // CSRF mitigation via custom header check
    app.use((req, res, next) => {
        // [FIX-2] Apply CSRF check to all state-changing methods on all routes except public endpoints
        const publicEndpoints = [
            'POST /auth/login',
            'POST /auth/register',
            'POST /auth/verify-token',
            'POST /auth/forgot-password',
            'POST /auth/reset-password',
        ];
        // GET requests to /api/public/* are always public (no CSRF check needed)
        if (req.method === 'GET' && req.path.startsWith('/api/public/')) {
            return next();
        }
        const requestKey = `${req.method} ${req.path}`;
        const isPublic = publicEndpoints.some(e => requestKey.startsWith(e));
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && !isPublic) {
            const origin = req.headers.origin || '';
            const allowed = env.corsOrigins;
            // Allow requests with no origin (mobile apps, server-to-server)
            if (origin &&
                !allowed.includes(origin) &&
                !origin.endsWith('.vercel.app') &&
                !origin.startsWith('http://localhost:') &&
                !origin.startsWith('http://192.168.') &&
                !origin.startsWith('http://10.') &&
                !origin.startsWith('http://172.')) {
                return res.status(403).json({
                    error: { code: 'CSRF_BLOCKED', message: 'Invalid origin' },
                });
            }
        }
        next();
    });
    app.use(express.json({ limit: '1mb' }));
    app.use('/uploads', express.static('public/uploads'));
    app.get('/health', (_req, res) => res.json({ ok: true }));
    // 🔓 Public routes (no authentication required)
    app.use('/api/public', publicRouter);
    // 🔐 Protected routes (authentication required)
    app.use('/auth', authRouter);
    app.use('/app', authenticateToken, appRouter);
    // ⚠️ syncRouter MUST be registered before posRouter!
    // Express matches routes in registration order — if posRouter (/pos) is first,
    // it captures /pos/sync requests and returns 404 since posRouter has no /sync handler.
    app.use('/pos/sync', authenticateToken, syncRouter);
    app.use('/pos', authenticateToken, posRouter);
    app.use('/users', authenticateToken, usersRouter);
    app.use('/shifts', authenticateToken, shiftsRouter);
    app.use('/transactions', authenticateToken, transactionsRouter);
    app.use('/reports', authenticateToken, reportsRouter);
    app.use('/settings', authenticateToken, settingsRouter);
    app.use('/api/ai', authenticateToken, aiRouter);
    app.use('/printer', authenticateToken, printerRouter);
    app.use('/api/branches', authenticateToken, branchesRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
