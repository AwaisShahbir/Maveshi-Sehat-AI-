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


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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


app.get('/', (req, res) => {
  res.send('Maveshi Sehat AI API is running!');
});


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


app.post('/register', async (req, res) => {
  try {
    const { 
      fullName, phoneNumber, email, district, role, password,
      pvmcNumber, specialization, experienceYears, licenseDocumentUrl 
    } = req.body;

    
    const userExists = await pool.query('SELECT * FROM users WHERE phone_number = $1 OR email = $2', [phoneNumber, email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User with this phone or email already exists!' });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const status = role === 'vet' ? 'pending' : 'approved';

    
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

    
    if (role === 'vet') {
      
      await pool.query(
        `INSERT INTO admin_notifications (type, message_en, message_ur) 
         VALUES ('vet_application', $1, $2)`,
        [`New vet application submitted - ${fullName}`, `${fullName} نے تصدیق جمع کرائی — ${district}`]
      );

      
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
      
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      await pool.query('INSERT INTO otps (email, otp) VALUES ($1, $2)', [email, otp]);

      
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
        console.log(`[DEV MODE] Your OTP for ${email} is: ${otp}`); 
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


app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await pool.query('SELECT * FROM otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [email]);
    
    if (record.rows.length === 0) return res.status(400).json({ error: 'No OTP found for this email.' });
    if (record.rows[0].otp !== otp) return res.status(400).json({ error: 'Invalid OTP!' });

    
    await pool.query('DELETE FROM otps WHERE email = $1', [email]);

    res.status(200).json({ message: 'OTP verified successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during verification.' });
  }
});


app.post('/login', async (req, res) => {
  try {
    const { phoneNumber, email, password, role } = req.body;

    
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

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password.' });
    }

    
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

    
    const totalScansRes = await pool.query(
      'SELECT COUNT(*) FROM detections WHERE owner_name ILIKE $1',
      [ownerName]
    );
    const aiScans = parseInt(totalScansRes.rows[0].count) || 0;

    
    const healthyScansRes = await pool.query(
      "SELECT COUNT(*) FROM detections WHERE owner_name ILIKE $1 AND disease IN ('Healthy', 'BCS Normal')",
      [ownerName]
    );
    const healthyCount = parseInt(healthyScansRes.rows[0].count) || 0;

    
    const healthyPercentage = aiScans > 0 ? Math.round((healthyCount / aiScans) * 100) : 0;

    
    const distinctAnimalsRes = await pool.query(
      'SELECT COUNT(DISTINCT animal_type) FROM detections WHERE owner_name ILIKE $1',
      [ownerName]
    );
    const livestock = parseInt(distinctAnimalsRes.rows[0].count) || 0;

    
    const recentScansRes = await pool.query(
      'SELECT * FROM detections WHERE owner_name ILIKE $1 ORDER BY created_at DESC LIMIT 5',
      [ownerName]
    );

    
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






app.get('/api/admin/dashboard-stats', async (req, res) => {
  try {
    
    const totalUsersRes = await pool.query("SELECT COUNT(*) FROM users WHERE role != 'admin'");
    const activeVetsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'vet' AND status = 'verified'");
    const pendingVetsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'vet' AND status = 'pending'");
    const scansRes = await pool.query("SELECT COUNT(*) FROM detections");
    const activeOrdersRes = await pool.query("SELECT COUNT(*) FROM orders WHERE status NOT IN ('delivered', 'cancelled')");
    
    
    const unreadNotifsRes = await pool.query("SELECT COUNT(*) FROM admin_notifications WHERE read = FALSE");
    const unreadNotificationsCount = parseInt(unreadNotifsRes.rows[0].count) || 0;

    
    const recentDetectionsRes = await pool.query(`
      SELECT d.*, u.full_name as vet_name 
      FROM detections d 
      LEFT JOIN users u ON d.vet_id = u.id 
      ORDER BY d.created_at DESC LIMIT 5
    `);

    
    const pendingVetsList = await pool.query("SELECT id, full_name, pvmc_number, status, role FROM users WHERE role = 'vet' AND status = 'pending' LIMIT 3");
    const pendingPharmaciesList = await pool.query("SELECT id, name, license_number, status FROM pharmacies WHERE status = 'pending' LIMIT 3");

    
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
    const { userId, action, message } = req.body; 
    let newStatus = 'approved';
    if (action === 'approve') newStatus = 'verified';
    else if (action === 'reject') newStatus = 'rejected';
    else if (action === 'block') newStatus = 'blocked';
    else if (action === 'unblock') newStatus = 'active';
    else if (action === 'request_info') newStatus = 'info_requested';

    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [newStatus, userId]);

    
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


app.get('/api/admin/pharmacies', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
        (SELECT COUNT(*)::int FROM medicines WHERE pharmacy_id = p.id) AS medicines_count,
        (SELECT COUNT(*)::int FROM orders WHERE pharmacy_id = p.id) AS orders_count
      FROM pharmacies p 
      ORDER BY p.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pharmacies' });
  }
});

app.post('/api/admin/pharmacies/approve', async (req, res) => {
  try {
    const { pharmacyId, action } = req.body; 
    const status = action === 'approve' ? 'approved' : 'rejected';
    await pool.query("UPDATE pharmacies SET status = $1 WHERE id = $2", [status, pharmacyId]);
    res.status(200).json({ message: `Pharmacy ${status} successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pharmacy status' });
  }
});


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


app.get('/api/admin/orders', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});


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


app.get('/api/detections', async (req, res) => {
  try {
    const { ownerName } = req.query;
    if (!ownerName) {
      return res.status(400).json({ error: 'ownerName parameter is required' });
    }
    const result = await pool.query(
      'SELECT * FROM detections WHERE owner_name ILIKE $1 ORDER BY created_at DESC',
      [ownerName]
    );
    
    
    const records = result.rows.map(row => {
      const isHealthy = row.disease === 'Healthy' || row.disease === 'BCS Normal';
      let severityColor = '#4CB85C';
      let severityBg = '#E8F8EA';
      if (row.risk_level === 'High') {
        severityColor = '#FF4D4D';
        severityBg = '#FFEBEB';
      } else if (row.risk_level === 'Medium') {
        severityColor = '#FFB020';
        severityBg = '#FFF5E5';
      }

      return {
        id: row.id,
        animalId: row.id,
        animalType: row.animal_type,
        disease: row.disease,
        diseaseUrdu: row.disease_urdu || (isHealthy ? 'صحت مند' : row.disease),
        confidence: row.confidence ? `${parseFloat(row.confidence).toFixed(1)}%` : '0%',
        timeAgo: 'Just now',
        date: new Date(row.created_at).toLocaleString(),
        risk: row.risk_level === 'High' ? 'High Risk' : (row.risk_level === 'Medium' ? 'Medium Risk' : 'Low Risk'),
        status: row.status || (isHealthy ? 'Healthy' : 'Active'),
        icon: isHealthy ? 'check-circle' : (row.risk_level === 'High' ? 'alert-circle' : 'trending-up'),
        color: severityColor,
        bg: severityBg,
        uri: row.image_url || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=400&auto=format&fit=crop',
        description: row.description || '',
        firstAid: row.first_aid || []
      };
    });

    res.status(200).json(records);
  } catch (err) {
    console.error('Error fetching detections:', err.message);
    res.status(500).json({ error: 'Server error fetching detections' });
  }
});

app.post('/api/detections', async (req, res) => {
  try {
    const { 
      id, ownerName, animalType, disease, diseaseUrdu, confidence, 
      riskLevel, imageUrl, description, firstAid, province 
    } = req.body;

    if (!id || !ownerName || !animalType || !disease) {
      return res.status(400).json({ error: 'Missing required parameters (id, ownerName, animalType, disease)' });
    }

    
    const existing = await pool.query('SELECT * FROM detections WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return res.status(200).json({ message: 'Record already exists', record: existing.rows[0] });
    }

    const result = await pool.query(
      `INSERT INTO detections (
        id, owner_name, animal_type, disease, confidence, risk_level, 
        image_url, description, first_aid, disease_urdu, province, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        id,
        ownerName,
        animalType,
        disease,
        confidence || 0,
        riskLevel || 'Low',
        imageUrl || null,
        description || null,
        firstAid || [],
        diseaseUrdu || null,
        province || 'Punjab',
        disease === 'Healthy' ? 'Healthy' : 'Active'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving detection:', err.message);
    res.status(500).json({ error: 'Server error saving detection' });
  }
});


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






app.post('/api/pharmacy/register', async (req, res) => {
  try {
    const {
      name, nameUrdu, licenseNumber, licenseExpiry, ownerName,
      cnic, phone, whatsapp, email, password, address,
      province, city, businessHours, description
    } = req.body;

    
    const exists = await pool.query(
      'SELECT * FROM pharmacies WHERE email = $1 OR license_number = $2 OR phone = $3',
      [email, licenseNumber, phone]
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Pharmacy with this email, phone, or license number already exists!' });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const result = await pool.query(
      `INSERT INTO pharmacies (
        name, name_urdu, license_number, license_expiry, owner_name,
        cnic, phone, whatsapp, email, password, address,
        province, city, business_hours, description, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending') RETURNING id, name, email`,
      [
        name, nameUrdu || null, licenseNumber, licenseExpiry || null, ownerName,
        cnic || null, phone, whatsapp || null, email, hashedPassword, address || null,
        province || null, city || null, businessHours || null, description || null
      ]
    );

    
    await pool.query(
      `INSERT INTO admin_notifications (type, message_en, message_ur) 
       VALUES ('pharmacy_approval', $1, $2)`,
      [`New pharmacy application submitted - ${name}`, `${name} نے رجسٹریشن کی درخواست جمع کرائی — ${city || ''}`]
    );

    res.status(201).json({
      message: 'Registration successful! Pending admin approval.',
      pharmacy: result.rows[0]
    });
  } catch (err) {
    console.error('Pharmacy Registration Error:', err.message);
    res.status(500).json({ error: 'Server error during pharmacy registration.' });
  }
});


app.post('/api/pharmacy/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    
    const result = await pool.query(
      'SELECT * FROM pharmacies WHERE email = $1 OR phone = $1',
      [emailOrPhone]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email/phone number or pharmacy not registered.' });
    }

    const pharmacy = result.rows[0];

    
    if (pharmacy.status === 'pending') {
      return res.status(403).json({ error: 'Your pharmacy portal account is pending admin approval.' });
    }
    if (pharmacy.status === 'rejected') {
      return res.status(403).json({ error: 'Your pharmacy registration request was rejected by admin.' });
    }

    
    const isMatch = await bcrypt.compare(password, pharmacy.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password.' });
    }

    res.status(200).json({
      message: 'Login successful!',
      pharmacy: {
        id: pharmacy.id,
        name: pharmacy.name,
        nameUrdu: pharmacy.name_urdu,
        email: pharmacy.email,
        phone: pharmacy.phone,
        status: pharmacy.status
      }
    });
  } catch (err) {
    console.error('Pharmacy Login Error:', err.message);
    res.status(500).json({ error: 'Server error during pharmacy login.' });
  }
});


async function simulateOrdersIfEmpty(pharmacyId) {
  try {
    
    const orderCheck = await pool.query("SELECT COUNT(*) FROM orders WHERE pharmacy_id = $1", [pharmacyId]);
    const orderCount = parseInt(orderCheck.rows[0].count);
    if (orderCount > 0) return; 

    
    const medRes = await pool.query("SELECT * FROM medicines WHERE pharmacy_id = $1", [pharmacyId]);
    const medicines = medRes.rows;
    if (medicines.length === 0) {
      console.log(`No medicines found for pharmacy ${pharmacyId}. Seeding initial medicines...`);
      const defaultMeds = [
        { 
          name: 'Tetracycline 500mg', 
          name_urdu: 'ٹیٹراسائیکلین', 
          manufacturer: 'Novartis Pakistan', 
          dosage_form: 'Tablet',
          strength: '500mg',
          category: 'Antibiotic', 
          price: 850, 
          stock: 12, 
          min_stock: 20, 
          max_stock: 100,
          batch_number: 'BAT-2024-001',
          expiry_date: '2026-12-31',
          active_ingredients: 'Tetracycline Hydrochloride',
          description: 'Broad-spectrum antibiotic for bacterial infections.',
          prescription_required: true,
          status: 'active' 
        },
        { 
          name: 'Ivermectin Injection', 
          name_urdu: 'آئیورمیکٹن', 
          manufacturer: 'Ferozsons Laboratories', 
          dosage_form: 'Injection',
          strength: '10ml',
          category: 'Antiparasitic', 
          price: 1200, 
          stock: 5, 
          min_stock: 15, 
          max_stock: 80,
          batch_number: 'BAT-2024-002',
          expiry_date: '2027-06-30',
          active_ingredients: 'Ivermectin',
          description: 'Antiparasitic medication for livestock.',
          prescription_required: true,
          status: 'active' 
        },
        { 
          name: 'Vitamin B-Complex', 
          name_urdu: 'وٹامن بی کمپلیکس', 
          manufacturer: 'Abbott Laboratories', 
          dosage_form: 'Injection',
          strength: '100ml',
          category: 'Vitamin', 
          price: 450, 
          stock: 8, 
          min_stock: 10, 
          max_stock: 80,
          batch_number: 'BAT-2024-003',
          expiry_date: '2027-09-30',
          active_ingredients: 'Thiamine, Riboflavin, Niacinamide',
          description: 'Vitamin B supplement to boost health.',
          prescription_required: false,
          status: 'active' 
        },
        { 
          name: 'Calcium Supplement', 
          name_urdu: 'کیلشیم سپلیمنٹ', 
          manufacturer: 'GlaxoSmithKline', 
          dosage_form: 'Suspension',
          strength: '1 Litre',
          category: 'Vitamin', 
          price: 650, 
          stock: 25, 
          min_stock: 15, 
          max_stock: 70,
          batch_number: 'BAT-2024-004',
          expiry_date: '2026-10-31',
          active_ingredients: 'Calcium Gluconate, Vitamin D3',
          description: 'Liquid calcium for milk fever prevention and bones.',
          prescription_required: false,
          status: 'active' 
        },
        { 
          name: 'Deworming Tablets', 
          name_urdu: 'ڈی ورمونگ ٹیبلٹس', 
          manufacturer: 'Highnoon Laboratories', 
          dosage_form: 'Bolus',
          strength: '1000mg',
          category: 'Antiparasitic', 
          price: 320, 
          stock: 30, 
          min_stock: 20, 
          max_stock: 100,
          batch_number: 'BAT-2024-005',
          expiry_date: '2028-03-31',
          active_ingredients: 'Albendazole',
          description: 'Broad-spectrum dewormer for roundworms and flukes.',
          prescription_required: false,
          status: 'active' 
        },
        { 
          name: 'Multivitamin Injection', 
          name_urdu: 'ملٹی وٹامن انجکشن', 
          manufacturer: 'Bosch Pharmaceuticals', 
          dosage_form: 'Injection',
          strength: '50ml',
          category: 'Vitamin', 
          price: 980, 
          stock: 18, 
          min_stock: 15, 
          max_stock: 90,
          batch_number: 'BAT-2024-006',
          expiry_date: '2027-04-30',
          active_ingredients: 'Vitamin A, D3, E',
          description: 'Essential multivitamin injection.',
          prescription_required: false,
          status: 'active' 
        }
      ];

      for (const m of defaultMeds) {
        await pool.query(
          `INSERT INTO medicines (
            name, name_urdu, manufacturer, dosage_form, strength, category, 
            pharmacy_id, price, stock, min_stock, max_stock, batch_number, 
            expiry_date, active_ingredients, description, prescription_required, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            m.name, m.name_urdu, m.manufacturer, m.dosage_form, m.strength, m.category, 
            pharmacyId, m.price, m.stock, m.min_stock, m.max_stock, m.batch_number, 
            m.expiry_date, m.active_ingredients, m.description, m.prescription_required, m.status
          ]
        );
      }
      
      
      const reMedRes = await pool.query("SELECT * FROM medicines WHERE pharmacy_id = $1", [pharmacyId]);
      medicines.push(...reMedRes.rows);
    }

    console.log(`Simulating realistic historical orders and items for pharmacy ${pharmacyId}...`);

    const buyers = [
      { name: 'Muhammad Akram', name_urdu: 'محمد اکرم' },
      { name: 'Ali Hassan', name_urdu: 'علی حسن' },
      { name: 'Fatima Bibi', name_urdu: 'فاطمہ بی بی' },
      { name: 'Ahmed Khan', name_urdu: 'احمد خان' },
      { name: 'Chaudhary Yasir', name_urdu: 'چوہدری یاسر' },
      { name: 'Muhammad Sajid', name_urdu: 'محمد ساجد' },
      { name: 'Malik Irfan', name_urdu: 'ملک عرفان' },
      { name: 'Amanat Ali', name_urdu: 'امانت علی' },
      { name: 'Zafar Iqbal', name_urdu: 'ظفر اقبال' }
    ];
    
    const payMethods = ['Easypaisa', 'JazzCash', 'COD', 'Bank Transfer'];
    const statuses = ['completed', 'completed', 'completed', 'dispatched', 'processing', 'pending'];

    const now = new Date();
    for (let i = 0; i < 25; i++) {
      const orderId = `ORD-${1000 + i}`;
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      const payMethod = payMethods[Math.floor(Math.random() * payMethods.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const orderDate = new Date();
      orderDate.setMonth(now.getMonth() - Math.floor(Math.random() * 6));
      orderDate.setDate(Math.floor(Math.random() * 28) + 1);
      orderDate.setHours(Math.floor(Math.random() * 12) + 8);
      
      const numItems = Math.floor(Math.random() * 3) + 1;
      let totalPrice = 0;
      let totalQty = 0;
      
      const orderItemsToInsert = [];
      const usedMedIds = new Set();

      for (let j = 0; j < numItems; j++) {
        const med = medicines[Math.floor(Math.random() * medicines.length)];
        if (usedMedIds.has(med.id)) continue;
        usedMedIds.add(med.id);
        
        const qty = Math.floor(Math.random() * 3) + 1;
        const itemPrice = parseFloat(med.price);
        totalPrice += qty * itemPrice;
        totalQty += qty;
        
        orderItemsToInsert.push({
          medicine_id: med.id,
          quantity: qty,
          price: itemPrice
        });
      }

      
      await pool.query(
        `INSERT INTO orders (id, buyer_name, buyer_name_urdu, pharmacy_id, items_count, total_price, payment_method, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [orderId, buyer.name, buyer.name_urdu, pharmacyId, totalQty, totalPrice, payMethod, status, orderDate]
      );

      
      for (const item of orderItemsToInsert) {
        await pool.query(
          `INSERT INTO order_items (order_id, medicine_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.medicine_id, item.quantity, item.price]
        );
      }
    }
    
    console.log(`✅ Simulation completed for pharmacy ${pharmacyId}!`);
  } catch (err) {
    console.error('Error in simulateOrdersIfEmpty:', err.message);
  }
}

app.get('/api/pharmacy/dashboard-stats', async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    if (!pharmacyId) {
      return res.status(400).json({ error: 'pharmacyId parameter is required' });
    }

    const pId = parseInt(pharmacyId);
    
    
    await simulateOrdersIfEmpty(pId);

    
    const revRes = await pool.query(
      "SELECT SUM(total_price) FROM orders WHERE pharmacy_id = $1 AND status IN ('delivered', 'completed')",
      [pId]
    );
    const totalRevenue = parseFloat(revRes.rows[0].sum) || 0.00;

    
    const actRes = await pool.query(
      "SELECT COUNT(*) FROM orders WHERE pharmacy_id = $1 AND status NOT IN ('delivered', 'completed', 'cancelled')",
      [pId]
    );
    const activeOrdersCount = parseInt(actRes.rows[0].count) || 0;

    
    const medRes = await pool.query(
      "SELECT COUNT(*) FROM medicines WHERE pharmacy_id = $1",
      [pId]
    );
    const medicineListingsCount = parseInt(medRes.rows[0].count) || 0;

    
    const alertRes = await pool.query(
      "SELECT COUNT(*) FROM medicines WHERE pharmacy_id = $1 AND (stock < min_stock OR status = 'out_of_stock')",
      [pId]
    );
    const stockAlertsCount = parseInt(alertRes.rows[0].count) || 0;

    
    const recentOrdersRes = await pool.query(
      "SELECT * FROM orders WHERE pharmacy_id = $1 ORDER BY created_at DESC LIMIT 5",
      [pId]
    );

    
    const stockAlertsRes = await pool.query(
      "SELECT * FROM medicines WHERE pharmacy_id = $1 AND stock < min_stock ORDER BY stock ASC LIMIT 5",
      [pId]
    );

    res.status(200).json({
      stats: {
        totalRevenue,
        activeOrders: activeOrdersCount,
        medicineListings: medicineListingsCount,
        stockAlerts: stockAlertsCount
      },
      recentOrders: recentOrdersRes.rows,
      stockAlertsList: stockAlertsRes.rows
    });
  } catch (err) {
    console.error('Pharmacy Stats Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch pharmacy dashboard stats.' });
  }
});


app.get('/api/pharmacy/medicines', async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    if (!pharmacyId) {
      return res.status(400).json({ error: 'pharmacyId parameter is required' });
    }
    const result = await pool.query(
      "SELECT * FROM medicines WHERE pharmacy_id = $1 ORDER BY id ASC",
      [parseInt(pharmacyId)]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch medicines.' });
  }
});

app.post('/api/pharmacy/medicines', async (req, res) => {
  try {
    const { 
      name, nameUrdu, manufacturer, dosageForm, strength, category, 
      price, stock, minStock, maxStock, batchNumber, expiryDate, 
      activeIngredients, description, prescriptionRequired, imageUrl 
    } = req.body;
    
    const pharmacyId = parseInt(req.body.pharmacyId);
    const mStock = minStock !== undefined ? parseInt(minStock) : 10;
    const mxStock = maxStock !== undefined ? parseInt(maxStock) : 100;
    const curStock = parseInt(stock);
    const status = curStock === 0 ? 'out_of_stock' : (curStock < mStock ? 'low_stock' : 'active');
    const rxReq = prescriptionRequired === true || prescriptionRequired === 'true';

    const result = await pool.query(
      `INSERT INTO medicines (
        name, name_urdu, manufacturer, dosage_form, strength, category, 
        pharmacy_id, price, stock, min_stock, max_stock, batch_number, 
        expiry_date, active_ingredients, description, prescription_required, image_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        name, nameUrdu || null, manufacturer || null, dosageForm || null, strength || null, category,
        pharmacyId, parseFloat(price), curStock, mStock, mxStock, batchNumber || null,
        expiryDate || null, activeIngredients || null, description || null, rxReq, imageUrl || null, status
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding medicine:', err.message);
    res.status(500).json({ error: 'Failed to add medicine.' });
  }
});

app.put('/api/pharmacy/medicines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, nameUrdu, manufacturer, dosageForm, strength, category, 
      price, stock, minStock, maxStock, batchNumber, expiryDate, 
      activeIngredients, description, prescriptionRequired, imageUrl, status 
    } = req.body;
    
    
    if (status !== undefined && name === undefined) {
      const result = await pool.query(
        "UPDATE medicines SET status = $1 WHERE id = $2 RETURNING *",
        [status, parseInt(id)]
      );
      return res.status(200).json(result.rows[0]);
    }

    const mStock = minStock !== undefined ? parseInt(minStock) : 10;
    const mxStock = maxStock !== undefined ? parseInt(maxStock) : 100;
    const curStock = parseInt(stock);
    let resolvedStatus = status;
    if (!resolvedStatus) {
      resolvedStatus = curStock === 0 ? 'out_of_stock' : (curStock < mStock ? 'low_stock' : 'active');
    }
    const rxReq = prescriptionRequired === true || prescriptionRequired === 'true';

    const result = await pool.query(
      `UPDATE medicines SET 
        name = $1, name_urdu = $2, manufacturer = $3, dosage_form = $4, strength = $5, 
        category = $6, price = $7, stock = $8, min_stock = $9, max_stock = $10, 
        batch_number = $11, expiry_date = $12, active_ingredients = $13, description = $14, 
        prescription_required = $15, image_url = $16, status = $17, last_restocked = CURRENT_TIMESTAMP
       WHERE id = $18 RETURNING *`,
      [
        name, nameUrdu || null, manufacturer || null, dosageForm || null, strength || null,
        category, parseFloat(price), curStock, mStock, mxStock,
        batchNumber || null, expiryDate || null, activeIngredients || null, description || null,
        rxReq, imageUrl || null, resolvedStatus, parseInt(id)
      ]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating medicine:', err.message);
    res.status(500).json({ error: 'Failed to update medicine.' });
  }
});

app.delete('/api/pharmacy/medicines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM medicines WHERE id = $1", [parseInt(id)]);
    res.status(200).json({ message: 'Medicine deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete medicine.' });
  }
});


app.get('/api/pharmacy/analytics', async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    if (!pharmacyId) {
      return res.status(400).json({ error: 'pharmacyId parameter is required' });
    }
    const pId = parseInt(pharmacyId);
    await simulateOrdersIfEmpty(pId);

    
    const revRes = await pool.query(
      "SELECT SUM(total_price) FROM orders WHERE pharmacy_id = $1 AND status IN ('delivered', 'completed')",
      [pId]
    );
    const totalRevenue = parseFloat(revRes.rows[0].sum) || 0.00;

    const ordRes = await pool.query(
      "SELECT COUNT(*) FROM orders WHERE pharmacy_id = $1",
      [pId]
    );
    const totalOrders = parseInt(ordRes.rows[0].count) || 0;

    const custRes = await pool.query(
      "SELECT COUNT(DISTINCT buyer_name) FROM orders WHERE pharmacy_id = $1",
      [pId]
    );
    const activeCustomers = parseInt(custRes.rows[0].count) || 0;

    const avgRes = await pool.query(
      "SELECT AVG(total_price) FROM orders WHERE pharmacy_id = $1 AND status IN ('delivered', 'completed')",
      [pId]
    );
    const avgOrderValue = parseFloat(avgRes.rows[0].avg) || 0.00;

    
    const monthlyRes = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'Mon') as month_name,
         SUM(total_price)::float as revenue,
         COUNT(*)::int as order_count,
         DATE_TRUNC('month', created_at) as month_date
       FROM orders 
       WHERE pharmacy_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
       ORDER BY month_date ASC`,
      [pId]
    );
    
    let monthlyData = monthlyRes.rows.map(row => ({
      name: row.month_name,
      Revenue: row.revenue,
      Orders: row.order_count
    }));

    if (monthlyData.length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      monthlyData = months.map(m => ({ name: m, Revenue: 0, Orders: 0 }));
    }

    
    const topMedsRes = await pool.query(
      `SELECT 
         m.id,
         m.name,
         m.name_urdu,
         COUNT(oi.id)::int as order_count,
         SUM(oi.quantity * oi.price)::float as total_sales
       FROM order_items oi
       JOIN medicines m ON oi.medicine_id = m.id
       WHERE m.pharmacy_id = $1
       GROUP BY m.id, m.name, m.name_urdu
       ORDER BY order_count DESC, total_sales DESC
       LIMIT 5`,
      [pId]
    );
    
    const topMedicines = topMedsRes.rows.map(row => ({
      name: row.name,
      nameUrdu: row.name_urdu || '',
      orders: row.order_count,
      sales: row.total_sales
    }));

    
    const distRes = await pool.query(
      `SELECT status, COUNT(*)::int as count FROM orders WHERE pharmacy_id = $1 GROUP BY status`,
      [pId]
    );
    
    let completedCount = 0;
    let processingCount = 0;
    let cancelledCount = 0;
    let totalDist = 0;
    
    distRes.rows.forEach(r => {
      const cnt = r.count;
      totalDist += cnt;
      if (r.status.toLowerCase() === 'completed' || r.status.toLowerCase() === 'delivered') {
        completedCount += cnt;
      } else if (r.status.toLowerCase() === 'processing' || r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'dispatched') {
        processingCount += cnt;
      } else if (r.status.toLowerCase() === 'cancelled') {
        cancelledCount += cnt;
      }
    });

    const distribution = {
      completed: totalDist > 0 ? Math.round((completedCount / totalDist) * 100) : 0,
      processing: totalDist > 0 ? Math.round((processingCount / totalDist) * 100) : 0,
      cancelled: totalDist > 0 ? Math.round((cancelledCount / totalDist) * 100) : 0
    };

    
    const repeatBuyersRes = await pool.query(
      `WITH buyer_counts AS (
         SELECT buyer_name, COUNT(*) as ord_cnt FROM orders WHERE pharmacy_id = $1 GROUP BY buyer_name
       )
       SELECT 
         COUNT(*)::float as total_buyers,
         SUM(CASE WHEN ord_cnt > 1 THEN 1 ELSE 0 END)::float as repeat_buyers
       FROM buyer_counts`,
      [pId]
    );
    
    const totalBuyers = parseFloat(repeatBuyersRes.rows[0].total_buyers) || 0;
    const repeatBuyers = parseFloat(repeatBuyersRes.rows[0].repeat_buyers) || 0;
    const customerRetention = totalBuyers > 0 ? Math.round((repeatBuyers / totalBuyers) * 100) : 0;

    res.status(200).json({
      kpis: {
        totalRevenue,
        totalOrders,
        activeCustomers,
        avgOrderValue
      },
      revenueOverview: monthlyData,
      topMedicines,
      distribution,
      customerRetention,
      customerSatisfaction: 4.8
    });
  } catch (err) {
    console.error('Pharmacy Analytics Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch pharmacy analytics.' });
  }
});


app.get('/api/pharmacy/orders', async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    if (!pharmacyId) {
      return res.status(400).json({ error: 'pharmacyId parameter is required' });
    }
    const result = await pool.query(
      "SELECT * FROM orders WHERE pharmacy_id = $1 ORDER BY created_at DESC",
      [parseInt(pharmacyId)]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

app.put('/api/pharmacy/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

app.get('/api/pharmacy/orders/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT oi.quantity, oi.price, m.name, m.name_urdu 
       FROM order_items oi
       JOIN medicines m ON oi.medicine_id = m.id
       WHERE oi.order_id = $1`,
      [id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching order items:', err.message);
    res.status(500).json({ error: 'Failed to fetch order items.' });
  }
});

app.post('/api/pharmacy/orders', async (req, res) => {
  try {
    const { buyerName, buyerNameUrdu, pharmacyId, totalPrice, paymentMethod, items } = req.body;
    if (!buyerName || !pharmacyId || !totalPrice || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required parameters or empty items list.' });
    }

    const pId = parseInt(pharmacyId);
    
    
    const countRes = await pool.query("SELECT COUNT(*) FROM orders");
    const count = parseInt(countRes.rows[0].count) || 0;
    const orderId = `ORD-${1000 + count + Math.floor(Math.random() * 100)}`;

    let totalQty = 0;
    items.forEach(item => {
      totalQty += parseInt(item.quantity);
    });

    
    const orderResult = await pool.query(
      `INSERT INTO orders (id, buyer_name, buyer_name_urdu, pharmacy_id, items_count, total_price, payment_method, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', CURRENT_TIMESTAMP) RETURNING *`,
      [orderId, buyerName, buyerNameUrdu || null, pId, totalQty, parseFloat(totalPrice), paymentMethod]
    );

    
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, medicine_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, parseInt(item.medicineId), parseInt(item.quantity), parseFloat(item.price)]
      );

      
      await pool.query(
        `UPDATE medicines SET 
           stock = GREATEST(0, stock - $1),
           status = CASE 
             WHEN GREATEST(0, stock - $1) = 0 THEN 'out_of_stock' 
             WHEN GREATEST(0, stock - $1) < min_stock THEN 'low_stock' 
             ELSE status 
           END
         WHERE id = $2`,
        [parseInt(item.quantity), parseInt(item.medicineId)]
      );
    }

    res.status(201).json(orderResult.rows[0]);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});


app.get('/api/pharmacy/profile', async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    if (!pharmacyId) {
      return res.status(400).json({ error: 'pharmacyId parameter is required' });
    }
    const result = await pool.query(
      "SELECT id, name, name_urdu, license_number, license_expiry, owner_name, cnic, phone, whatsapp, email, address, province, city, business_hours, description, status FROM pharmacies WHERE id = $1",
      [parseInt(pharmacyId)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pharmacy profile not found.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

app.put('/api/pharmacy/profile', async (req, res) => {
  try {
    const {
      pharmacyId, name, nameUrdu, ownerName, phone, whatsapp,
      address, province, city, businessHours, description
    } = req.body;

    const result = await pool.query(
      `UPDATE pharmacies SET 
        name = $1, name_urdu = $2, owner_name = $3, phone = $4, whatsapp = $5,
        address = $6, province = $7, city = $8, business_hours = $9, description = $10
      WHERE id = $11 RETURNING id, name, name_urdu, owner_name, phone, whatsapp, address, province, city, business_hours, description, status`,
      [
        name, nameUrdu, ownerName, phone, whatsapp,
        address, province, city, businessHours, description, parseInt(pharmacyId)
      ]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});




app.get('/api/vets', async (req, res) => {
  try {
    const { district, ownerName } = req.query;
    let query = "SELECT id, full_name, district, specialization, experience_years, status FROM users WHERE role = 'vet' AND status = 'verified'";
    const params = [];
    
    if (district) {
      query += " AND district ILIKE $1";
      params.push(district);
    } else if (ownerName) {
      
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
    
    
    let convRes = await pool.query(
      'SELECT * FROM conversations WHERE farmer_id = $1 AND vet_id = $2',
      [fId, vetId]
    );
    
    if (convRes.rows.length === 0) {
      
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




app.get('/api/forum/posts', async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT fp.*, u.full_name as author_name, u.role as author_role,
             (SELECT COUNT(*) FROM forum_comments fc WHERE fc.post_id = fp.id) as comments_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
    `;
    const params = [];
    if (category && category !== 'All' && category !== 'All Posts') {
      if (category === 'Trending') {
        query += ` WHERE fp.category = $1 OR fp.likes_count >= 20`;
      } else {
        query += ` WHERE fp.category = $1`;
      }
      params.push(category);
    }
    query += ` ORDER BY fp.created_at DESC`;
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching forum posts:', err.message);
    res.status(500).json({ error: 'Server error fetching forum posts' });
  }
});


app.post('/api/forum/posts', async (req, res) => {
  try {
    const { userName, userId: providedUserId, title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }
    if (!userName && !providedUserId) {
      return res.status(400).json({ error: 'User identification is required' });
    }

    let resolvedUserId = providedUserId ? parseInt(providedUserId) : null;

    if (!resolvedUserId && userName) {
      const userRes = await pool.query(
        'SELECT id FROM users WHERE TRIM(LOWER(full_name)) = TRIM(LOWER($1)) LIMIT 1',
        [userName.trim()]
      );
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found. Please make sure you are logged in.' });
      }
      resolvedUserId = userRes.rows[0].id;
    }

    const result = await pool.query(
      'INSERT INTO forum_posts (user_id, title, description, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [resolvedUserId, title.trim(), description.trim(), category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating forum post:', err.message);
    res.status(500).json({ error: 'Server error creating forum post' });
  }
});


app.get('/api/forum/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const postRes = await pool.query(`
      SELECT fp.*, u.full_name as author_name, u.role as author_role
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.id = $1
    `, [id]);
    if (postRes.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const commentsRes = await pool.query(`
      SELECT fc.*, u.full_name as author_name, u.role as author_role
      FROM forum_comments fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.post_id = $1
      ORDER BY fc.created_at ASC
    `, [id]);
    res.status(200).json({
      post: postRes.rows[0],
      comments: commentsRes.rows
    });
  } catch (err) {
    console.error('Error fetching forum post details:', err.message);
    res.status(500).json({ error: 'Server error fetching post details' });
  }
});


app.post('/api/forum/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, userId: providedUserId, comment, parentCommentId } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    if (!userName && !providedUserId) {
      return res.status(400).json({ error: 'User identification is required' });
    }

    let resolvedUserId = providedUserId ? parseInt(providedUserId) : null;

    if (!resolvedUserId && userName) {
      const userRes = await pool.query(
        'SELECT id FROM users WHERE TRIM(LOWER(full_name)) = TRIM(LOWER($1)) LIMIT 1',
        [userName.trim()]
      );
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found. Please make sure you are logged in.' });
      }
      resolvedUserId = userRes.rows[0].id;
    }

    const parentId = parentCommentId ? parseInt(parentCommentId) : null;

    const result = await pool.query(
      'INSERT INTO forum_comments (post_id, user_id, comment, parent_comment_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, resolvedUserId, comment.trim(), parentId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error posting comment:', err.message);
    res.status(500).json({ error: 'Server error posting comment' });
  }
});


app.post('/api/forum/comments/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE forum_comments SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(200).json({ likesCount: result.rows[0].likes_count });
  } catch (err) {
    console.error('Error liking comment:', err.message);
    res.status(500).json({ error: 'Server error liking comment' });
  }
});


app.post('/api/forum/posts/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json({ likesCount: result.rows[0].likes_count });
  } catch (err) {
    console.error('Error liking post:', err.message);
    res.status(500).json({ error: 'Server error liking post' });
  }
});


io.on('connection', (socket) => {
  console.log('🔌 User connected to WebSocket:', socket.id);

  
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`👤 Socket ${socket.id} joined room: ${room}`);
  });

  
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, message, imageUrl, isPrescription, prescriptionData } = data;
      
      
      const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, message, image_url, is_prescription, prescription_data)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [conversationId, senderId, message || null, imageUrl || null, isPrescription || false, prescriptionData ? JSON.stringify(prescriptionData) : null]
      );
      
      const savedMessage = result.rows[0];
      
      
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
