require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function seed() {
  try {
    console.log('Seeding database with Super Admin only...');
    
    // Hash admin password
    const salt = await bcrypt.genSalt(10);
    const adminPassHash = await bcrypt.hash('awais0810', salt);

    // 1. Seed Super Admin User
    const usersQuery = `
      INSERT INTO users (full_name, phone_number, email, district, role, password, status, specialization, experience_years, pvmc_number) VALUES
      ('Super Admin', '+92 300 1234567', 'maveshisehatai@gmail.com', 'Lahore', 'admin', $1, 'approved', NULL, NULL, NULL)
      ON CONFLICT (email) DO NOTHING;
    `;
    await pool.query(usersQuery, [adminPassHash]);
    console.log('✅ Seeded super admin');

    console.log('🚀 Database Seeding Completed Successfully (Admin only)!');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  } finally {
    pool.end();
  }
}

seed();
