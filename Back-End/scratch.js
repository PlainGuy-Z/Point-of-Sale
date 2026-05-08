import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:%5B6fj8NQN3c2v%2At%2Cy%5D@db.xojdeqcptcuenmagrcnp.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('ERROR:', err.message);
  } else {
    console.log('SUCCESS');
    release();
  }
  pool.end();
});
