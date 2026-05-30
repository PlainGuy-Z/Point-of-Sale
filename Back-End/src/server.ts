import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './env.js';
import { pool } from './db/pool.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
   
  console.log(`API listening on :${env.PORT}`);
});

async function shutdown(signal: string) {
   
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await pool.end().catch(() => undefined);
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

