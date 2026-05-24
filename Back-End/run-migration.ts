import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const migrationFile = process.argv[2] || 'migrations/sprint6-settings.sql';
    const filePath = path.join(process.cwd(), migrationFile);
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`Running migration: ${migrationFile}`);
    await pool.query(sql);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

main();
