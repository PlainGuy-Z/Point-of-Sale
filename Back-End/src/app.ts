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

const stateChangingMethods = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
  );
}

function isLocalDevelopmentOrigin(url: URL): boolean {
  if (env.NODE_ENV === 'production' || url.protocol !== 'http:') return false;

  return (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname === '[::1]' ||
    isPrivateIpv4(url.hostname)
  );
}

function isAllowedOrigin(origin?: string): boolean {
  // Requests without Origin include native mobile apps and server-to-server calls.
  if (!origin) return true;
  if (env.corsOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) return false;

    // Backward compatibility for the existing SmartPOS Vercel deployments.
    const isSmartPosVercel =
      url.protocol === 'https:' &&
      url.hostname.endsWith('.vercel.app') &&
      url.hostname.includes('point-of-sale');

    return isSmartPosVercel || isLocalDevelopmentOrigin(url);
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();
  
  // Set trust proxy to trust the first proxy (e.g. Nginx, Cloudflare)
  // This resolves ERR_ERL_UNEXPECTED_X_FORWARDED_FOR from express-rate-limit
  // Production runs one hop behind the configured reverse proxy. Localhost does not.
  app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);

  app.disable('x-powered-by');

  app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  }));

  app.use(cookieParser());

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);

      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  };

  app.options(/.*/, cors(corsOptions));
  app.use(cors(corsOptions));

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      try {
        if (isLocalDevelopmentOrigin(new URL(origin))) {
          res.setHeader('Access-Control-Allow-Private-Network', 'true');
        }
      } catch {
        // Invalid origins are rejected by CORS/CSRF; do not emit the PNA header.
      }
    }
    next();
  });

  // CSRF mitigation via custom header check
  app.use((req, res, next) => {
    // Validate Origin for every state-changing browser request.
    // Native mobile and server-to-server requests normally omit Origin and remain supported.
    // GET requests to /api/public/* are always public (no CSRF check needed)
    if (req.method === 'GET' && req.path.startsWith('/api/public/')) {
      return next();
    }
    
    if (stateChangingMethods.has(req.method)) {
      if (!isAllowedOrigin(req.headers.origin)) {
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
