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
import { authenticateToken } from './middleware/auth.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // Helmet dengan crossOriginResourcePolicy dinonaktifkan
  // agar tidak memblok cross-domain requests dari Vercel
  app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  }));

  app.use(cookieParser());

  // CORS options — support exact match + Vercel preview domains
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (Postman, Railway health check, server-to-server)
      if (!origin) return callback(null, true);

      // Cek exact match dari env variable
      if (env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Izinkan semua Vercel preview domain milik project ini
      if (
        origin.endsWith('.vercel.app') &&
        origin.includes('smartpos-cafe') // ganti dengan nama project Vercel kamu
      ) {
        return callback(null, true);
      }

      // Izinkan localhost untuk development
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

  // Handle preflight OPTIONS SEBELUM semua route — wajib untuk CORS
  // ✅ Ganti jadi ini
  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));

  // Header untuk Chrome Private Network Access policy
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
  });

  

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/app', authenticateToken, appRouter);
  app.use('/pos', authenticateToken, posRouter);
  app.use('/users', authenticateToken, usersRouter);
  app.use('/shifts', authenticateToken, shiftsRouter);
  app.use('/transactions', authenticateToken, transactionsRouter);
  app.use('/settings', authenticateToken, settingsRouter);
  app.use('/api/ai', authenticateToken, aiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
