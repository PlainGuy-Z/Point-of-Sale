import 'dotenv/config';
import { pool } from './db/pool.js';

async function findUser() {
  try {
    const { rows: users } = await pool.query("SELECT id, name, email, shop_id, role FROM coffeepos.users WHERE name ILIKE '%Azlan%' OR email ILIKE '%azlan%'");
    console.log('--- Matching Users ---');
    console.table(users);

    if (users.length > 0) {
      const shopId = users[0].shop_id;
      const { rows: shop } = await pool.query("SELECT name FROM coffeepos.shops WHERE id = $1", [shopId]);
      console.log(`\nShop details for ${users[0].name}:`);
      console.table(shop);

      const { rows: txCount } = await pool.query("SELECT COUNT(*) FROM coffeepos.transactions WHERE shop_id = $1", [shopId]);
      console.log(`\nTotal transactions for shop ${shopId}: ${txCount[0].count}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

findUser();
