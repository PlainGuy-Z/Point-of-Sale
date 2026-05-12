import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const email = 'testowner@example.com';
    const query = `
      SELECT u.id::text, u.name, u.email, u.role, u.password_hash, u.is_active,
              u.is_verified,
              u.shop_id::text,
              (u.pin IS NOT NULL AND btrim(u.pin) <> '') AS pin,
              s.id::text AS shop_id_ref, s.name AS shop_name, s.slug AS shop_slug
       FROM coffeepos.users u
       JOIN coffeepos.shops s ON s.id = u.shop_id
       WHERE u.email = $1
    `;
    const res = await pool.query(query, [email]);
    console.log('Result:', res.rows);
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

main();
