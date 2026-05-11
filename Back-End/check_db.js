import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT schema_name FROM information_schema.schemata");
    console.log('Schemas:', res.rows.map(r => r.schema_name));
    
    const tables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')");
    console.log('Tables:', tables.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
