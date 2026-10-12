const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
  } else {
    console.log('✅ Successfully connected to PostgreSQL Database!');

    client.query(`
      ALTER TABLE detections ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
      ALTER TABLE detections ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE detections ADD COLUMN IF NOT EXISTS first_aid TEXT[];
      ALTER TABLE detections ADD COLUMN IF NOT EXISTS disease_urdu VARCHAR(100);

      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS name_urdu VARCHAR(255);
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS license_expiry VARCHAR(100);
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS cnic VARCHAR(50);
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS province VARCHAR(100);
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS business_hours VARCHAR(100);
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS description TEXT;

      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS name_urdu VARCHAR(255);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS min_stock INT DEFAULT 10;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS max_stock INT DEFAULT 100;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS dosage_form VARCHAR(100);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS strength VARCHAR(100);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(100);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS active_ingredients TEXT;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN DEFAULT FALSE;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS last_restocked TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name_urdu VARCHAR(255);

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(20) REFERENCES orders(id) ON DELETE CASCADE,
        medicine_id INT REFERENCES medicines(id) ON DELETE CASCADE,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      );

      ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_vaccination BOOLEAN DEFAULT FALSE;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS vaccination_data JSONB;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS consultation_id INT REFERENCES consultations(id) ON DELETE SET NULL;
      
      ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_schedule TEXT DEFAULT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS consultation_mode TEXT DEFAULT 'Chat + Video';
    `, (migrationErr) => {
      release();
      if (migrationErr) {
        console.error('❌ Error executing migrations:', migrationErr.message);
      } else {
        console.log('✅ PostgreSQL tables verified and updated!');
      }
    });
  }
});

module.exports = pool;
