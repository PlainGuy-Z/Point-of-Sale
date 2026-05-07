import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './env.js';
import { errorHandler, notFoundHandler } from './http/errors.js';
import { posRouter } from './routes/pos.js';
import { appRouter } from './routes/app.js';
export function createApp() {
    const app = express();
    app.disable('x-powered-by');
    app.use(helmet());
    app.use(cors({
        origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
        credentials: true
    }));
    app.use(express.json({ limit: '1mb' }));
    app.get('/health', (_req, res) => res.json({ ok: true }));
    app.use('/pos', posRouter);
    app.use('/app', appRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
