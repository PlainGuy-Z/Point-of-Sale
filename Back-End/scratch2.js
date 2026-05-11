import { pool } from './dist/db/pool.js';
import { getBusinessSummary } from './dist/utils/aiCalculations.js';
import { generateChatResponse } from './dist/services/gemini.js';

async function main() {
  try {
    const shopRes = await pool.query('SELECT id FROM coffeepos.shops LIMIT 1');
    if (shopRes.rows.length === 0) {
      console.log('No shops found');
      return;
    }
    const shopId = shopRes.rows[0].id;
    console.log('Using shop ID:', shopId);
    
    const summary = await getBusinessSummary(pool, shopId);
    console.log('Summary:', summary);

    const messages = [{ role: 'user', content: 'Halo, penjualan hari ini gimana?' }];
    console.log('Testing Gemini 2.5-flash...');
    const reply = await generateChatResponse(messages, summary);
    console.log('Gemini Reply:', reply);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
