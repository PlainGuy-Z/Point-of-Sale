const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/coffeepos' });
async function test() {
  const res = await pool.query('SELECT id, shop_id FROM coffeepos.users LIMIT 1');
  if (res.rowCount === 0) return console.log('No user');
  const user = res.rows[0];
  console.log('User:', user);
  
  // Update settings
  const shopId = user.shop_id;
  const body = {
    shop_name: 'Test Shop Update',
    address: 'Test Address Update',
    phone: '08123456789',
    open_time: '09:00',
    close_time: '21:00'
  };

  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(body)) {
    if (key !== 'shop_name' && value !== undefined) {
      updateFields.push( + "${key} = {paramIndex}" + );
      values.push(value);
      paramIndex++;
    }
  }

  updateFields.push( + "updated_at = NOW()" + );
  const query =  + "" + 
    INSERT INTO coffeepos.shop_settings (shop_id) 
    VALUES ($ + "${paramIndex}" + ) 
    ON CONFLICT (shop_id) DO UPDATE SET 
     + "${updateFields.join(', ')}" + 
    RETURNING *
   + "" + ;
  values.push(shopId);

  console.log('Query:', query);
  console.log('Values:', values);

  try {
    const updateRes = await pool.query(query, values);
    console.log('Update Success:', updateRes.rows[0]);
  } catch (err) {
    console.log('Update Error:', err);
  }
  pool.end();
}
test();
