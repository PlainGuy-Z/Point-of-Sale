
const API_URL = 'http://localhost:4000';
let token = '';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@coffeepos.com', password: 'password123' }) // Assuming default credentials
  });
  if (!res.ok) throw new Error('Login failed: ' + await res.text());
  const data = await res.json();
  token = data.token;
  console.log('Logged in successfully');
}

function startOfDay(d) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function getPrevRange(start, end) {
  const durationMs = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - durationMs),
    end: new Date(start.getTime() - 1),
  };
}

async function testRange(label, start, end, granularity) {
  const prev = getPrevRange(start, end);
  const qs = new URLSearchParams({
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    prev_from: prev.start.toISOString().slice(0, 10),
    prev_to: prev.end.toISOString().slice(0, 10),
    granularity
  });

  const res = await fetch(`${API_URL}/reports/dashboard?${qs.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    console.error(`Failed ${label}: ${res.status} - ${await res.text()}`);
    return;
  }

  const data = await res.json();
  console.log(`\n=== Test: ${label} ===`);
  console.log('Metrics:', data.metrics);
  console.log(`Top Products: ${data.topProductsToday.length}`);
  console.log(`Chart Data Points: ${data.chartData.length}`);
}

async function run() {
  try {
    await login();

    const now = new Date();
    
    // Hari Ini
    const todayStart = startOfDay(now);
    await testRange('Hari Ini', todayStart, now, 'hour');

    // 30 Hari
    const thirtyStart = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
    await testRange('30 Hari', thirtyStart, now, 'day');

    // Bulan Ini
    const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    await testRange('Bulan Ini', monthStart, now, 'day');

    // Bulan Tertentu (Bulan Lalu)
    const prevMonthStart = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevMonthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    await testRange('Bulan Lalu (Bulan Tertentu)', prevMonthStart, prevMonthEnd, 'day');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
