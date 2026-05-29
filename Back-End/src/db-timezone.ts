import 'dotenv/config';
import { pool } from './db/pool.js';

async function checkTimezone() {
  try {
    const { rows: tz } = await pool.query('SHOW TIMEZONE');
    console.log('PostgreSQL Server Timezone:', tz[0].TimeZone);

    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'coffeepos' AND table_name = 'transactions' AND column_name = 'created_at'
    `);
    console.log('created_at data type:', columns[0]?.data_type);

    const { rows: times } = await pool.query(`
      SELECT 
        NOW() as pg_now,
        NOW()::timestamptz as pg_now_tz,
        CURRENT_TIMESTAMP as pg_current_timestamp
    `);
    console.log('PostgreSQL current time:', times[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkTimezone();
