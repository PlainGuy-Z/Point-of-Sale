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
    if (release)
        release();
});
// Tangani error pada idle clients (mencegah crash/terminal error karena ECONNRESET dari Supabase)
pool.on('error', (err, _client) => {
    if (err.code === 'ECONNRESET') {
        // Supabase sering memutus koneksi idle, cukup log ringan atau abaikan
        console.warn('⚠️ Idle client connection diputus oleh server (ECONNRESET)');
    }
    else {
        console.error('Unexpected error on idle client', err);
    }
});
