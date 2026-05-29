import bcrypt from 'bcryptjs';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.xojdeqcptcuenmagrcnp:mazlanevp140205@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?search_path=coffeepos',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query('SELECT name, email, role, password_hash FROM coffeepos.users');
    console.log(`Found ${res.rows.length} users.`);
    for (const row of res.rows) {
      const match = await bcrypt.compare('password123', row.password_hash);
      if (match) {
        console.log(`- ${row.name} (${row.email}) [${row.role}]: Matches 'password123'`);
      } else {
        console.log(`- ${row.name} (${row.email}) [${row.role}]: Does NOT match 'password123'`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

check();
