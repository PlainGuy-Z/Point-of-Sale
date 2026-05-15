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
import { printerRouter } from './routes/printer.js';
import { authenticateToken } from './middleware/auth.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  }));

  app.use(cookieParser());

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      // ✅ Fix: nama project yang benar
      if (
        origin.endsWith('.vercel.app') &&
        origin.includes('point-of-sale')
      ) {
        return callback(null, true);
      }

      if (origin.startsWith('http://localhost:')) {
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
  app.use(['/app', '/pos', '/users', '/shifts', '/settings', '/printer'], (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.headers.origin || '';
      const allowed = env.corsOrigins;
      if (
        !allowed.includes(origin) &&
        !origin.endsWith('.vercel.app') &&
        !origin.startsWith('http://localhost:')
      ) {
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

  app.use('/auth', authRouter);
  app.use('/app', authenticateToken, appRouter);
  app.use('/pos', authenticateToken, posRouter);
  app.use('/users', authenticateToken, usersRouter);
  app.use('/shifts', authenticateToken, shiftsRouter);
  app.use('/transactions', authenticateToken, transactionsRouter);
  app.use('/settings', authenticateToken, settingsRouter);
  app.use('/api/ai', authenticateToken, aiRouter);
  app.use('/printer', authenticateToken, printerRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
