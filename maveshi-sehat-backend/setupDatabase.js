require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createTableQuery = `
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS detections CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  district VARCHAR(50),
  role VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'approved', -- 'pending', 'verified', 'rejected', 'blocked', 'approved'
  pvmc_number VARCHAR(50),
  specialization VARCHAR(100),
  experience_years INT,
  license_document_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pharmacies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_urdu VARCHAR(255),
  license_number VARCHAR(100) UNIQUE NOT NULL, -- DRAP license number
  license_expiry VARCHAR(100),
  owner_name VARCHAR(100) NOT NULL,
  cnic VARCHAR(50),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  address TEXT,
  province VARCHAR(100),
  city VARCHAR(100),
  business_hours VARCHAR(100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Vaccine', 'Antibiotic', 'Vitamin', etc.
  pharmacy_id INT REFERENCES pharmacies(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'out_of_stock', 'low_stock'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id VARCHAR(20) PRIMARY KEY, -- e.g. 'ORD-1047'
  buyer_name VARCHAR(255) NOT NULL,
  pharmacy_id INT REFERENCES pharmacies(id) ON DELETE SET NULL,
  items_count INT DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'JazzCash', 'Easypaisa', 'COD', etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'dispatched', 'delivered', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detections (
  id VARCHAR(20) PRIMARY KEY, -- e.g. 'HR-1847'
  owner_name VARCHAR(255) NOT NULL,
  animal_type VARCHAR(50) NOT NULL, -- 'Cow', 'Buffalo', 'Goat', etc.
  disease VARCHAR(100) NOT NULL, -- 'LSD', 'FMD', 'Tick', 'Mastitis', 'PPR', etc.
  confidence DECIMAL(5, 2) NOT NULL, -- percentage e.g. 87.00
  risk_level VARCHAR(20) NOT NULL, -- 'High', 'Medium', 'Low'
  vet_id INT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending_vet', -- 'Reviewed', 'Pending Vet', 'Auto-resolved'
  province VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  target_audience VARCHAR(50) NOT NULL, -- 'all', 'owners', 'vets'
  type VARCHAR(50) NOT NULL, -- 'alert', 'outbreak', 'maintenance', 'vaccination'
  title VARCHAR(255) NOT NULL,
  message_en TEXT NOT NULL,
  message_ur TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'vet_application', 'high_risk_case', 'pharmacy_approval', etc.
  message_en TEXT NOT NULL,
  message_ur TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function setup() {
  try {
    console.log('Connecting to database...');
    await pool.query(createTableQuery);
    console.log('✅ Users table created successfully!');
  } catch (err) {
    console.error('❌ Error creating table:', err);
  } finally {
    pool.end();
  }
}

setup();
