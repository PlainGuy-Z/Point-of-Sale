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
import { authenticateToken } from './middleware/auth.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  // Cookie parser must be before routes so req.cookies is populated
  app.use(cookieParser());

  app.use(
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type']
    })
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Auth routes (unprotected — register/login/logout handle their own auth)
  app.use('/auth', authRouter);

  // Protected routes — require valid JWT
  app.use('/app', authenticateToken, appRouter);
  app.use('/pos', authenticateToken, posRouter);
  app.use('/users', authenticateToken, usersRouter);
  app.use('/shifts', authenticateToken, shiftsRouter);
  app.use('/transactions', authenticateToken, transactionsRouter);
  app.use('/settings', authenticateToken, settingsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
