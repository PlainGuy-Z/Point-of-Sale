import jwt from 'jsonwebtoken';
import pg from 'pg';
const { Pool } = pg;

const JWT_SECRET = 'your-super-secret-key-min-32-chars-change-me';
const DB_URL = 'postgresql://postgres.xojdeqcptcuenmagrcnp:mazlanevp140205@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?search_path=coffeepos';
const API_URL = 'http://localhost:4000';

async function run() {
  const pool = new Pool({ connectionString: DB_URL });
  
  try {
    const res = await pool.query('SELECT id, shop_id, role FROM coffeepos.users WHERE role = $1 LIMIT 1', ['owner']);
    if (res.rows.length === 0) throw new Error('No owner found in DB');
    
    const user = res.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role, shop_id: user.shop_id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const now = new Date();
    
    // Hari Ini
    let start = new Date(now); start.setHours(0,0,0,0);
    let prevStart = new Date(start.getTime() - 24*60*60*1000);
    let prevEnd = new Date(start.getTime() - 1);
    
    const qs = new URLSearchParams({
      from: start.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
      prev_from: prevStart.toISOString().slice(0, 10),
      prev_to: prevEnd.toISOString().slice(0, 10),
      granularity: 'hour'
    });
    
    console.log(`Testing Hari Ini: ${API_URL}/reports/dashboard?${qs.toString()}`);
    const fetchRes = await fetch(`${API_URL}/reports/dashboard?${qs.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!fetchRes.ok) {
      console.error('Failed:', fetchRes.status, await fetchRes.text());
    } else {
      const data = await fetchRes.json();
      console.log('Metrics:', data.metrics);
      console.log('Top Products Count:', data.topProductsToday.length);
      console.log('Chart Data Points:', data.chartData.length);
      console.log('SuccessRate:', data.metrics.successRate);
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
