import pg from 'pg';
import { env } from '../env.js';

const { Pool } = pg;

  export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    ssl: {
      rejectUnauthorized: false
    }
  });

// Tes koneksi sederhana
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Gagal terhubung ke database:', err.stack);
  }
  console.log('✅ PostgreSQL Connected to Supabase');
  if (release) release();
});

