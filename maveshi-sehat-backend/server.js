require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static upload files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, PNG, and PDF files are allowed!'));
  }
});

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

// --- FILE UPLOAD API ---
app.post('/upload', upload.single('license'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a file to upload.' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({ 
      message: 'File uploaded successfully!', 
      fileUrl: fileUrl,
      filename: req.file.filename
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'File upload failed.' });
  }
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

    // 4. Handle notification/OTP based on role
    if (role === 'vet') {
      // Send Admin Notification if a new Vet signs up
      await pool.query(
        `INSERT INTO admin_notifications (type, message_en, message_ur) 
         VALUES ('vet_application', $1, $2)`,
        [`New vet application submitted - ${fullName}`, `${fullName} نے تصدیق جمع کرائی — ${district}`]
      );

      // Send Email to Vet about registration pending admin review
      try {
        await transporter.sendMail({
          from: `"Maveshi Sehat AI" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Vet Application Received - Maveshi Sehat AI',
          text: `Welcome to Maveshi Sehat AI, Dr. ${fullName}! We have received your vet application and license details. Our admin team will review it shortly. Once approved, you will be able to log in.`
        });
        console.log(`Vet pending review email sent to ${email}`);
      } catch (mailErr) {
        console.error('Email failed to send. Check your Gmail credentials.');
      }

      return res.status(201).json({ 
        message: 'Registration successful! Pending admin approval.', 
        email: newUser.rows[0].email,
        role: 'vet'
      });
    } else {
      // 5. Generate 4-digit OTP for Farmers
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      await pool.query('INSERT INTO otps (email, otp) VALUES ($1, $2)', [email, otp]);

      // 6. Send OTP Email to Farmer
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

      return res.status(201).json({ 
        message: 'User registered successfully! OTP sent.', 
        email: newUser.rows[0].email,
        role: 'farmer'
      });
    }
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
    if (user.status === 'info_requested') {
      return res.status(403).json({ error: 'Additional information is requested by the administrator. Please check your email for details.' });
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

// --- USER DASHBOARD STATS & RECENT SCANS API ---
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000);

  if (interval >= 1) return interval === 1 ? '1 year ago' : `${interval} years ago`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval === 1 ? '1 month ago' : `${interval} months ago`;
  interval = Math.floor(seconds / 604800);
  if (interval >= 1) return interval === 1 ? '1 week ago' : `${interval} weeks ago`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval === 1 ? '1 day ago' : `${interval} days ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  return 'just now';
}

app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const { ownerName } = req.query;
    if (!ownerName) {
      return res.status(400).json({ error: 'ownerName parameter is required' });
    }

    // 1. Fetch total scans for this owner
    const totalScansRes = await pool.query(
      'SELECT COUNT(*) FROM detections WHERE owner_name ILIKE $1',
      [ownerName]
    );
    const aiScans = parseInt(totalScansRes.rows[0].count) || 0;

    // 2. Fetch healthy scans (disease is 'Healthy' or 'BCS Normal')
    const healthyScansRes = await pool.query(
      "SELECT COUNT(*) FROM detections WHERE owner_name ILIKE $1 AND disease IN ('Healthy', 'BCS Normal')",
      [ownerName]
    );
    const healthyCount = parseInt(healthyScansRes.rows[0].count) || 0;

    // Calculate percentage of healthy scans. If no scans, default to 0%
    const healthyPercentage = aiScans > 0 ? Math.round((healthyCount / aiScans) * 100) : 0;

    // 3. For livestock, count unique animal_type scanned by this owner.
    const distinctAnimalsRes = await pool.query(
      'SELECT COUNT(DISTINCT animal_type) FROM detections WHERE owner_name ILIKE $1',
      [ownerName]
    );
    const livestock = parseInt(distinctAnimalsRes.rows[0].count) || 0;

    // 4. Fetch recent scans for this owner
    const recentScansRes = await pool.query(
      'SELECT * FROM detections WHERE owner_name ILIKE $1 ORDER BY created_at DESC LIMIT 5',
      [ownerName]
    );

    // Format the recent scans to match the frontend expectations
    const recentScans = recentScansRes.rows.map((row) => {
      let severity = 'Low';
      let icon = 'check-circle';
      let color = '#4CB85C';
      let bg = '#E8F8EA';

      if (row.risk_level === 'High') {
        severity = 'High';
        icon = 'alert-circle';
        color = '#FF4D4D';
        bg = '#FFEBEB';
      } else if (row.risk_level === 'Medium') {
        severity = 'Medium';
        icon = 'alert-triangle';
        color = '#FFB020';
        bg = '#FFF5E5';
      }

      // Map disease names to a display title
      let displayTitle = row.disease;
      if (row.disease === 'LSD') displayTitle = 'Lumpy Skin Disease';
      else if (row.disease === 'FMD') displayTitle = 'Foot & Mouth Disease';
      else if (row.disease === 'BCS Normal') displayTitle = 'Healthy (BCS Normal)';

      const timeDiff = getTimeAgo(row.created_at);

      return {
        id: row.id,
        title: displayTitle,
        time: timeDiff,
        percentage: Math.round(row.confidence),
        severity,
        icon,
        color,
        bg
      };
    });

    res.status(200).json({
      stats: {
        livestock,
        aiScans,
        healthy: healthyPercentage
      },
      recentScans
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({ error: 'Server error fetching dashboard stats' });
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
    
    // Fetch unread notifications count
    const unreadNotifsRes = await pool.query("SELECT COUNT(*) FROM admin_notifications WHERE read = FALSE");
    const unreadNotificationsCount = parseInt(unreadNotifsRes.rows[0].count) || 0;

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
      totalUsers: parseInt(totalUsersRes.rows[0].count) || 0,
      activeVets: parseInt(activeVetsRes.rows[0].count) || 0,
      pendingVetsCount: parseInt(pendingVetsRes.rows[0].count) || 0,
      scansCount: parseInt(scansRes.rows[0].count) || 0,
      activeOrders: parseInt(activeOrdersRes.rows[0].count) || 0,
      unreadNotificationsCount,
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
    const result = await pool.query("SELECT id, full_name, email, phone_number, district, role, status, pvmc_number, specialization, experience_years, license_document_url, created_at FROM users WHERE role != 'admin' ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users/action', async (req, res) => {
  try {
    const { userId, action, message } = req.body; // action: 'approve', 'reject', 'block', 'unblock', 'request_info'
    let newStatus = 'approved';
    if (action === 'approve') newStatus = 'verified';
    else if (action === 'reject') newStatus = 'rejected';
    else if (action === 'block') newStatus = 'blocked';
    else if (action === 'unblock') newStatus = 'active';
    else if (action === 'request_info') newStatus = 'info_requested';

    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [newStatus, userId]);

    // Send email to Vet if requesting more info
    if (action === 'request_info') {
      const userRes = await pool.query("SELECT full_name, email FROM users WHERE id = $1", [userId]);
      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        try {
          await transporter.sendMail({
            from: `"Maveshi Sehat AI" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Additional Information Requested - Maveshi Sehat AI',
            text: `Dear Dr. ${user.full_name},\n\nThe administrator reviewed your registration application and has requested additional information:\n\n"${message}"\n\nPlease check your profile or contact support to update your information.\n\nBest regards,\nMaveshi Sehat AI Team`
          });
          console.log(`Info Request Email sent to ${user.email}`);
        } catch (mailErr) {
          console.error('Failed to send info request email:', mailErr.message);
        }
      }
    }

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
// --- VET CHAT & CONSULTATION REST API ENDPOINTS ---

// 1. Fetch verified veterinarians (optionally filtered by district)
app.get('/api/vets', async (req, res) => {
  try {
    const { district, ownerName } = req.query;
    let query = "SELECT id, full_name, district, specialization, experience_years, status FROM users WHERE role = 'vet' AND status = 'verified'";
    const params = [];
    
    if (district) {
      query += " AND district ILIKE $1";
      params.push(district);
    } else if (ownerName) {
      // Find owner's district dynamically
      const ownerRes = await pool.query("SELECT district FROM users WHERE full_name ILIKE $1 AND role = 'farmer'", [ownerName]);
      if (ownerRes.rows.length > 0 && ownerRes.rows[0].district) {
        query += " AND district ILIKE $1";
        params.push(ownerRes.rows[0].district);
      }
    }
    
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching vets:', err.message);
    res.status(500).json({ error: 'Failed to fetch veterinarians' });
  }
});

// 2. Find or create a conversation between farmer and vet
app.post('/api/chat/conversation', async (req, res) => {
  try {
    const { farmerId, farmerName, vetId } = req.body;
    if ((!farmerId && !farmerName) || !vetId) {
      return res.status(400).json({ error: 'farmerId/farmerName and vetId are required' });
    }
    
    let fId = farmerId;
    if (!fId) {
      const farmerRes = await pool.query('SELECT id FROM users WHERE full_name ILIKE $1 AND role = \'farmer\'', [farmerName]);
      if (farmerRes.rows.length === 0) {
        return res.status(404).json({ error: 'Farmer user not found' });
      }
      fId = farmerRes.rows[0].id;
    }
    
    // Try to find existing conversation
    let convRes = await pool.query(
      'SELECT * FROM conversations WHERE farmer_id = $1 AND vet_id = $2',
      [fId, vetId]
    );
    
    if (convRes.rows.length === 0) {
      // Create a new one
      convRes = await pool.query(
        'INSERT INTO conversations (farmer_id, vet_id, status) VALUES ($1, $2, \'active\') RETURNING *',
        [fId, vetId]
      );
    }
    
    res.status(200).json(convRes.rows[0]);
  } catch (err) {
    console.error('Error creating conversation:', err.message);
    res.status(500).json({ error: 'Server error handling conversation' });
  }
});

// 3. Fetch all messages in a conversation
app.get('/api/chat/messages', async (req, res) => {
  try {
    const { conversationId } = req.query;
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }
    const messagesRes = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    res.status(200).json(messagesRes.rows);
  } catch (err) {
    console.error('Error fetching messages:', err.message);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// 4. Retrieve all conversations for a specific vet, including farmer profile info
app.get('/api/chat/conversations/vet', async (req, res) => {
  try {
    const { vetId, vetName } = req.query;
    if (!vetId && !vetName) {
      return res.status(400).json({ error: 'vetId or vetName is required' });
    }
    
    let query = `
      SELECT c.*, u.full_name as farmer_name, u.district as farmer_district, u.phone_number as farmer_phone
      FROM conversations c
      JOIN users u ON c.farmer_id = u.id
    `;
    const params = [];
    
    if (vetId) {
      query += ` WHERE c.vet_id = $1`;
      params.push(vetId);
    } else {
      // Find vet ID first by name
      const vetRes = await pool.query('SELECT id FROM users WHERE full_name ILIKE $1 AND role = \'vet\'', [vetName]);
      if (vetRes.rows.length === 0) {
        return res.status(200).json([]);
      }
      query += ` WHERE c.vet_id = $1`;
      params.push(vetRes.rows[0].id);
    }
    
    query += ` ORDER BY c.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching vet conversations:', err.message);
    res.status(500).json({ error: 'Server error fetching conversations' });
  }
});

// 5. Mark a conversation as resolved
app.put('/api/chat/conversation/resolve', async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }
    await pool.query(
      'UPDATE conversations SET status = \'resolved\' WHERE id = $1',
      [conversationId]
    );
    res.status(200).json({ message: 'Conversation marked as resolved' });
  } catch (err) {
    console.error('Error resolving conversation:', err.message);
    res.status(500).json({ error: 'Server error resolving conversation' });
  }
});

// --- Socket.io Real-time Chat Handler ---
io.on('connection', (socket) => {
  console.log('🔌 User connected to WebSocket:', socket.id);

  // Join conversation room
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`👤 Socket ${socket.id} joined room: ${room}`);
  });

  // Handle standard text / image message / prescription
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, message, imageUrl, isPrescription, prescriptionData } = data;
      
      // Save message to PostgreSQL
      const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, message, image_url, is_prescription, prescription_data)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [conversationId, senderId, message || null, imageUrl || null, isPrescription || false, prescriptionData ? JSON.stringify(prescriptionData) : null]
      );
      
      const savedMessage = result.rows[0];
      
      // Broadcast message to room
      io.to(conversationId.toString()).emit('receive_message', savedMessage);
    } catch (err) {
      console.error('Socket error sending message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
