import 'dotenv/config';
import { pool } from './db/pool.js';
import { buildAppState } from './routes/app.js';
async function test() {
    try {
        const { rows: shops } = await pool.query('SELECT id FROM coffeepos.shops LIMIT 1');
        if (shops.length === 0) {
            console.log('No shops found');
            return;
        }
        const shopId = shops[0].id;
        console.log(`Testing with shopId: ${shopId}`);
        const state = await buildAppState(shopId);
        console.log('Success! Products:', state.products.length);
    }
    catch (err) {
        console.error('ERROR IN BUILD_APP_STATE:', err);
    }
    finally {
        await pool.end();
    }
}
test();
