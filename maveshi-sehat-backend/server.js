require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com', // TODO: Update this
    pass: 'your_app_password'
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test DB connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
  } else {
    console.log('✅ Successfully connected to PostgreSQL Database!');
    release();
  }
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Maveshi Sehat AI API is running!');
});

// --- REGISTRATION API ---
app.post('/register', async (req, res) => {
  try {
    const { fullName, phoneNumber, email, district, role, password } = req.body;

    // 1. Check if user already exists (by phone or email)
    const userExists = await pool.query('SELECT * FROM users WHERE phone_number = $1 OR email = $2', [phoneNumber, email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User with this phone or email already exists!' });
    }

    // 2. Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert into PostgreSQL
    const newUser = await pool.query(
      'INSERT INTO users (full_name, phone_number, email, district, role, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, email, role',
      [fullName, phoneNumber, email, district, role, hashedPassword]
    );

    // 4. Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await pool.query('INSERT INTO otps (email, otp) VALUES ($1, $2)', [email, otp]);

    // 5. Send Email
    try {
      await transporter.sendMail({
        from: '"Maveshi Sehat AI" <your_email@gmail.com>',
        to: email,
        subject: 'Your OTP Code - Maveshi Sehat AI',
        text: `Welcome to Maveshi Sehat AI! Your verification code is: ${otp}`
      });
      console.log(`OTP ${otp} sent to ${email}`);
    } catch (mailErr) {
      console.error('Email failed to send. Check your Gmail credentials.');
      console.log(`[DEV MODE] Your OTP for ${email} is: ${otp}`); // Fallback for dev
    }

    res.status(201).json({ 
      message: 'User registered successfully! OTP sent.', 
      email: newUser.rows[0].email 
    });

  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// --- OTP VERIFICATION API ---
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await pool.query('SELECT * FROM otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [email]);
    
    if (record.rows.length === 0) return res.status(400).json({ error: 'No OTP found for this email.' });
    if (record.rows[0].otp !== otp) return res.status(400).json({ error: 'Invalid OTP!' });

    // Optional: Delete OTP after success to prevent reuse
    await pool.query('DELETE FROM otps WHERE email = $1', [email]);

    res.status(200).json({ message: 'OTP verified successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during verification.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
