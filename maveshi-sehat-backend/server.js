require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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
    const { 
      fullName, phoneNumber, email, district, role, password,
      pvmcNumber, specialization, experienceYears, licenseDocumentUrl 
    } = req.body;

    // 1. Check if user already exists (by phone or email)
    const userExists = await pool.query('SELECT * FROM users WHERE phone_number = $1 OR email = $2', [phoneNumber, email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User with this phone or email already exists!' });
    }

    // 2. Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set initial status: Vets are pending; farmers/admins are approved by default
    const status = role === 'vet' ? 'pending' : 'approved';

    // 3. Insert into PostgreSQL
    const newUser = await pool.query(
      `INSERT INTO users (
        full_name, phone_number, email, district, role, password, status, 
        pvmc_number, specialization, experience_years, license_document_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, full_name, email, role`,
      [
        fullName, phoneNumber, email, district, role, hashedPassword, status,
        pvmcNumber || null, specialization || null, experienceYears ? parseInt(experienceYears) : null, licenseDocumentUrl || null
      ]
    );

    // 4. Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await pool.query('INSERT INTO otps (email, otp) VALUES ($1, $2)', [email, otp]);

    // 5. Send Admin Notification if a new Vet signs up
    if (role === 'vet') {
      await pool.query(
        `INSERT INTO admin_notifications (type, message_en, message_ur) 
         VALUES ('vet_application', $1, $2)`,
        [`New vet application submitted - ${fullName}`, `${fullName} نے تصدیق جمع کرائی — ${district}`]
      );
    }

    // 6. Send Email
    try {
      await transporter.sendMail({
        from: `"Maveshi Sehat AI" <${process.env.EMAIL_USER}>`,
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

    // Delete OTP after success
    await pool.query('DELETE FROM otps WHERE email = $1', [email]);

    res.status(200).json({ message: 'OTP verified successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during verification.' });
  }
});

// --- LOGIN API ---
app.post('/login', async (req, res) => {
  try {
    const { phoneNumber, email, password, role } = req.body;

    // 1. Check if user exists (by email if provided, otherwise by phone number)
    let userResult;
    if (email) {
      userResult = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
    } else {
      userResult = await pool.query('SELECT * FROM users WHERE phone_number = $1 AND role = $2', [phoneNumber, role]);
    }
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid phone number or role.' });
    }

    const user = userResult.rows[0];

    // Check account approval status
    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Your vet account is pending admin approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Your vet registration request was rejected by admin.' });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked by the administrator.' });
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password.' });
    }

    // 3. Login successful
    res.status(200).json({ 
      message: 'Login successful!',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phoneNumber: user.phone_number,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ==========================================
// --- WEB ADMIN API ENDPOINTS ---
// ==========================================

// --- 1. DASHBOARD STATS ---
app.get('/api/admin/dashboard-stats', async (req, res) => {
  try {
    // A. Fetch Counts
    const totalUsersRes = await pool.query("SELECT COUNT(*) FROM users WHERE role != 'admin'");
    const activeVetsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'vet' AND status = 'verified'");
    const pendingVetsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'vet' AND status = 'pending'");
    const scansRes = await pool.query("SELECT COUNT(*) FROM detections");
    const activeOrdersRes = await pool.query("SELECT COUNT(*) FROM orders WHERE status NOT IN ('delivered', 'cancelled')");

    // B. Fetch Recent Detections
    const recentDetectionsRes = await pool.query(`
      SELECT d.*, u.full_name as vet_name 
      FROM detections d 
      LEFT JOIN users u ON d.vet_id = u.id 
      ORDER BY d.created_at DESC LIMIT 5
    `);

    // C. Fetch Pending Actions (vets and pharmacies)
    const pendingVetsList = await pool.query("SELECT id, full_name, pvmc_number, status, role FROM users WHERE role = 'vet' AND status = 'pending' LIMIT 3");
    const pendingPharmaciesList = await pool.query("SELECT id, name, license_number, status FROM pharmacies WHERE status = 'pending' LIMIT 3");

    // D. Fetch System Health (mocked status)
    const systemStatus = [
      { name: 'Backend API', status: 'Operational', uptime: '99.8%' },
      { name: 'AI Server', status: 'Operational', uptime: '99.7%' },
      { name: 'Database', status: 'Operational', uptime: '100%' },
      { name: 'Payment Gateway', status: 'Degraded', uptime: '94.2%' },
    ];

    res.status(200).json({
      totalUsers: parseInt(totalUsersRes.rows[0].count) || 248,
      activeVets: parseInt(activeVetsRes.rows[0].count) || 34,
      pendingVetsCount: parseInt(pendingVetsRes.rows[0].count) || 6,
      scansCount: parseInt(scansRes.rows[0].count) || 127,
      activeOrders: parseInt(activeOrdersRes.rows[0].count) || 12,
      recentDetections: recentDetectionsRes.rows,
      pendingActions: {
        vets: pendingVetsList.rows,
        pharmacies: pendingPharmaciesList.rows
      },
      systemStatus
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// --- 2. USERS MANAGEMENT ---
app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, full_name, email, phone_number, district, role, status, created_at FROM users WHERE role != 'admin' ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users/action', async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'approve', 'reject', 'block', 'unblock'
    let newStatus = 'approved';
    if (action === 'approve') newStatus = 'verified';
    else if (action === 'reject') newStatus = 'rejected';
    else if (action === 'block') newStatus = 'blocked';
    else if (action === 'unblock') newStatus = 'active';

    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [newStatus, userId]);
    res.status(200).json({ message: `User status updated to ${newStatus} successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// --- 3. PHARMACIES ---
app.get('/api/admin/pharmacies', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pharmacies ORDER BY created_at DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pharmacies' });
  }
});

app.post('/api/admin/pharmacies/approve', async (req, res) => {
  try {
    const { pharmacyId, action } = req.body; // action: 'approve', 'reject'
    const status = action === 'approve' ? 'approved' : 'rejected';
    await pool.query("UPDATE pharmacies SET status = $1 WHERE id = $2", [status, pharmacyId]);
    res.status(200).json({ message: `Pharmacy ${status} successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pharmacy status' });
  }
});

// --- 4. MEDICINES ---
app.get('/api/admin/medicines', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, p.name as pharmacy_name 
      FROM medicines m 
      LEFT JOIN pharmacies p ON m.pharmacy_id = p.id 
      ORDER BY m.id ASC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

app.post('/api/admin/medicines', async (req, res) => {
  try {
    const { name, category, pharmacyId, price, stock } = req.body;
    const status = stock === 0 ? 'out_of_stock' : (stock < 15 ? 'low_stock' : 'active');
    const result = await pool.query(
      "INSERT INTO medicines (name, category, pharmacy_id, price, stock, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, category, pharmacyId || null, price, stock, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add medicine' });
  }
});

app.delete('/api/admin/medicines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM medicines WHERE id = $1", [id]);
    res.status(200).json({ message: 'Medicine deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete medicine' });
  }
});

// --- 5. ORDERS ---
app.get('/api/admin/orders', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// --- 6. HEALTH RECORDS / DETECTIONS ---
app.get('/api/admin/health-records', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.full_name as vet_name 
      FROM detections d 
      LEFT JOIN users u ON d.vet_id = u.id 
      ORDER BY d.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch health records' });
  }
});

// --- 7. NOTIFICATIONS & ANNOUNCEMENTS ---
app.get('/api/admin/notifications', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM admin_notifications ORDER BY created_at DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin notifications' });
  }
});

app.post('/api/admin/announcements', async (req, res) => {
  try {
    const { targetAudience, type, title, messageEn, messageUr } = req.body;
    const result = await pool.query(
      "INSERT INTO announcements (target_audience, type, title, message_en, message_ur) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [targetAudience, type, title, messageEn, messageUr]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post announcement' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
