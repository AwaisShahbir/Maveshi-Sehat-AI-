const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('Connecting to Neon DB...');
  const client = await pool.connect();
  try {
    console.log('Running consultation & commission migrations...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10, 2) DEFAULT 300.00;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_wallet_type VARCHAR(50) DEFAULT 'JazzCash';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_account_title VARCHAR(150);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_account_number VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_due DECIMAL(10, 2) DEFAULT 0.00;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_paid DECIMAL(10, 2) DEFAULT 0.00;

      ALTER TABLE consultations ADD COLUMN IF NOT EXISTS fee DECIMAL(10, 2) DEFAULT 300.00;
      ALTER TABLE consultations ADD COLUMN IF NOT EXISTS admin_commission DECIMAL(10, 2) DEFAULT 30.00;
      ALTER TABLE consultations ADD COLUMN IF NOT EXISTS vet_earnings DECIMAL(10, 2) DEFAULT 270.00;
      ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'JazzCash';
      ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
      ALTER TABLE consultations ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(50);
      ALTER TABLE consultations ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
      ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS consultation_id INT REFERENCES consultations(id) ON DELETE CASCADE;

      CREATE TABLE IF NOT EXISTS vet_commission_settlements (
        id SERIAL PRIMARY KEY,
        vet_id INT REFERENCES users(id) ON DELETE CASCADE,
        vet_name VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'JazzCash',
        account_number VARCHAR(50) DEFAULT '03054758667',
        sender_phone VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(100) NOT NULL,
        proof_image_url TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP
      );
    `);
    console.log('✅ Migrations successfully applied to PostgreSQL database!');

    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'consultations'");
    console.log('Updated consultations columns:', res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
