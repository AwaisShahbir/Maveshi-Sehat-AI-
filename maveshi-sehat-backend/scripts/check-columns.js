require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
  .then(res => {
    console.log('USERS COLUMNS:', res.rows.map(r => r.column_name).join(', '));
    return pool.query("SELECT * FROM users WHERE role = 'vet' LIMIT 1");
  })
  .then(vetRes => {
    console.log('SAMPLE VET KEYS:', Object.keys(vetRes.rows[0] || {}));
    pool.end();
  })
  .catch(err => {
    console.error('DB ERROR:', err.message);
    pool.end();
  });
