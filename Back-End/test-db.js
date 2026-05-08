import 'dotenv/config';
import pg from 'pg';

console.log('Testing connection with DATABASE_URL from .env...');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('CONNECTION ERROR:', err.message);
  } else {
    console.log('✅ SUCCESS');
    release();
  }
  pool.end();
});
