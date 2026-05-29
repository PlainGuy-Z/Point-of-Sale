import 'dotenv/config';
import { buildAppState } from './routes/app.js';
import { pool } from './db/pool.js';

async function test() {
  try {
    const shopId = '4f0c118e-dbc3-405b-be1f-e8c56b33fd82';
    console.log('Testing buildAppState for shop:', shopId);
    
    const state = await buildAppState(shopId);
    console.log('State returned successfully!');
    console.log('Products count:', state.products.length);
    console.log('Transactions count:', state.transactions.length);
    
    if (state.transactions.length > 0) {
      console.log('Sample transaction:', JSON.stringify(state.transactions[0], null, 2));
    }
  } catch (err) {
    console.error('Error in buildAppState test:', err);
  } finally {
    await pool.end();
  }
}

test();
