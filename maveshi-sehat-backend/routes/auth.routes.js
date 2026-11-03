const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const transporter = require('../config/mail');
const { getOtpEmailHtml, getVetWelcomeEmailHtml } = require('../utils/emailTemplates');

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

module.exports = (pool) => {
  // Upload license or document
  router.post('/upload', upload.single('license'), (req, res) => {
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

  // User Registration (Farmer or Vet)
  router.post('/register', async (req, res) => {
    try {
      const {
        fullName, phoneNumber, email, district, role, password,
        pvmcNumber, specialization, experienceYears, licenseDocumentUrl
      } = req.body;

      if (!fullName || !phoneNumber || !email || !password) {
        return res.status(400).json({ error: 'Please provide all required fields.' });
      }

      const cleanPhone = String(phoneNumber).trim();
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanName = String(fullName).trim();

      const userExists = await pool.query(
        'SELECT * FROM users WHERE phone_number = $1 OR LOWER(email) = $2',
        [cleanPhone, cleanEmail]
      );

      if (userExists.rows.length > 0) {
        const existing = userExists.rows[0];

        // If the user previously registered but never verified OTP, allow updating credentials and re-sending OTP
        if (existing.status === 'unverified') {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          await pool.query(
            `UPDATE users 
             SET full_name = $1, phone_number = $2, password = $3, district = $4
             WHERE id = $5`,
            [cleanName, cleanPhone, hashedPassword, district || 'Islamabad', existing.id]
          );

          const otp = Math.floor(1000 + Math.random() * 9000).toString();
          await pool.query('DELETE FROM otps WHERE LOWER(email) = $1', [cleanEmail]);
          await pool.query('INSERT INTO otps (email, otp) VALUES ($1, $2)', [cleanEmail, otp]);

          const mailPromise = transporter.sendMail({
            from: `"Maveshi Sehat AI" <${transporter.emailUser || process.env.EMAIL_USER}>`,
            to: cleanEmail,
            subject: `${otp} is your Maveshi Sehat AI verification code`,
            html: getOtpEmailHtml(cleanName, otp),
            text: `Welcome to Maveshi Sehat AI! Your verification code is: ${otp}`
          });

          try {
            await Promise.race([
              mailPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 5000))
            ]);
            console.log(`[OTP] Sent updated OTP ${otp} to unverified user ${cleanEmail}`);
          } catch (mailErr) {
            console.warn(`[OTP] Mail send notice for ${cleanEmail}: ${mailErr.message} (OTP: ${otp})`);
          }

          return res.status(200).json({
            message: 'Verification OTP sent to your email.',
            email: existing.email,
            role: 'farmer'
          });
        }

        if (existing.status === 'blocked') {
          return res.status(403).json({ error: 'This account has been blocked by the administrator.' });
        }

        if (existing.role === 'vet' && existing.status === 'pending') {
          return res.status(400).json({ error: 'A veterinarian application has already been submitted with this phone or email.' });
        }

        return res.status(400).json({ error: 'User with this phone or email already exists! Please log in.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const status = role === 'vet' ? 'pending' : 'unverified';

      const newUser = await pool.query(
        `INSERT INTO users (
          full_name, phone_number, email, district, role, password, status, 
          pvmc_number, specialization, experience_years, license_document_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, full_name, email, role`,
        [
          cleanName, cleanPhone, cleanEmail, district || 'Islamabad', role, hashedPassword, status,
          pvmcNumber || null, specialization || null, experienceYears ? parseInt(experienceYears) : null, licenseDocumentUrl || null
        ]
      );

      if (role === 'vet') {
        await pool.query(
          `INSERT INTO admin_notifications (type, message_en, message_ur) 
           VALUES ('vet_application', $1, $2)`,
          [`New vet application submitted - ${cleanName}`, `${cleanName} نے تصدیق جمع کرائی — ${district || 'Islamabad'}`]
        );

        try {
          await transporter.sendMail({
            from: `"Maveshi Sehat AI" <${transporter.emailUser || process.env.EMAIL_USER}>`,
            to: cleanEmail,
            subject: 'Vet Application Received - Maveshi Sehat AI',
            html: getVetWelcomeEmailHtml(cleanName),
            text: `Welcome to Maveshi Sehat AI, Dr. ${cleanName}! We have received your vet application and license details. Our admin team will review it shortly. Once approved, you will be able to log in.`
          });
          console.log(`Vet pending review email sent to ${cleanEmail}`);
        } catch (mailErr) {
          console.error('Vet email send error:', mailErr.message);
        }

        return res.status(201).json({
          message: 'Registration successful! Pending admin approval.',
          email: newUser.rows[0].email,
          role: 'vet'
        });
      } else {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        await pool.query('DELETE FROM otps WHERE LOWER(email) = $1', [cleanEmail]);
        await pool.query('INSERT INTO otps (email, otp) VALUES ($1, $2)', [cleanEmail, otp]);

        const mailPromise = transporter.sendMail({
          from: `"Maveshi Sehat AI" <${transporter.emailUser || process.env.EMAIL_USER}>`,
          to: cleanEmail,
          subject: `${otp} is your Maveshi Sehat AI verification code`,
          html: getOtpEmailHtml(cleanName, otp),
          text: `Welcome to Maveshi Sehat AI! Your verification code is: ${otp}`
        });

        try {
          await Promise.race([
            mailPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 5000))
          ]);
          console.log(`[OTP] Sent OTP ${otp} to new user ${cleanEmail}`);
        } catch (mailErr) {
          console.warn(`[OTP] Mail send notice for ${cleanEmail}: ${mailErr.message} (OTP: ${otp})`);
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

  // OTP Verification
  router.post('/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      const record = await pool.query(
        'SELECT * FROM otps WHERE LOWER(email) = $1 ORDER BY created_at DESC LIMIT 1',
        [cleanEmail]
      );

      if (record.rows.length === 0) {
        return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
      }
      if (record.rows[0].otp !== cleanOtp) {
        return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
      }

      await pool.query('DELETE FROM otps WHERE LOWER(email) = $1', [cleanEmail]);
      await pool.query("UPDATE users SET status = 'approved' WHERE LOWER(email) = $1", [cleanEmail]);

      res.status(200).json({ message: 'OTP verified successfully! Account is active.' });
    } catch (err) {
      console.error('Verification Error:', err.message);
      res.status(500).json({ error: 'Server error during verification.' });
    }
  });

  // Resend OTP
  router.post('/resend-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const userRes = await pool.query('SELECT full_name, email FROM users WHERE LOWER(email) = $1', [cleanEmail]);

      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'No account found with this email.' });
      }

      const user = userRes.rows[0];
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      await pool.query('DELETE FROM otps WHERE LOWER(email) = $1', [cleanEmail]);
      await pool.query('INSERT INTO otps (email, otp) VALUES ($1, $2)', [cleanEmail, otp]);

      const mailPromise = transporter.sendMail({
        from: `"Maveshi Sehat AI" <${transporter.emailUser || process.env.EMAIL_USER}>`,
        to: cleanEmail,
        subject: `${otp} is your Maveshi Sehat AI verification code`,
        html: getOtpEmailHtml(user.full_name, otp),
        text: `Your Maveshi Sehat verification code is: ${otp}. It expires in 10 minutes.`
      });

      try {
        await Promise.race([
          mailPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 5000))
        ]);
        console.log(`[OTP] Resent OTP ${otp} to ${cleanEmail}`);
      } catch (mailErr) {
        console.warn(`[OTP] Resend mail notice: ${mailErr.message} (OTP: ${otp})`);
      }

      res.status(200).json({ message: 'A new verification code has been sent to your email.' });
    } catch (err) {
      console.error('Resend OTP Error:', err);
      res.status(500).json({ error: 'Server error while resending OTP.' });
    }
  });

  // User Login (Farmer or Vet)
  router.post('/login', async (req, res) => {
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

      if (user.status === 'unverified') {
        return res.status(403).json({ 
          error: 'Please verify your account with the OTP sent to your email.',
          unverified: true,
          email: user.email
        });
      }
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
          full_name: user.full_name,
          email: user.email,
          phoneNumber: user.phone_number,
          phone: user.phone_number,
          district: user.district,
          role: user.role,
          specialization: user.specialization || null,
          experienceYears: user.experience_years || null,
          pvmcNumber: user.pvmc_number || null,
          licenseDocumentUrl: user.license_document_url || null,
          status: user.status
        }
      });
    } catch (err) {
      console.error('Login Error:', err.message);
      res.status(500).json({ error: 'Server error during login.' });
    }
  });

  // Admin Auth Login
  router.post(['/api/auth/login', '/api/admin/login'], async (req, res) => {
    try {
      const { email, phoneNumber, password } = req.body;

      if ((!email && !phoneNumber) || !password) {
        return res.status(400).json({ error: 'Email/phone and password are required.' });
      }

      let userResult;
      if (email) {
        userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      } else {
        userResult = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
      }

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = userResult.rows[0];

      if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. You do not have administrator permissions.' });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ error: 'Your account has been blocked by the administrator.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password.' });
      }

      res.status(200).json({
        message: 'Login successful!',
        user: {
          id: user.id,
          fullName: user.full_name,
          full_name: user.full_name,
          email: user.email,
          phoneNumber: user.phone_number,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Admin Auth Login Error:', err.message);
      res.status(500).json({ error: 'Server error during administrator login.' });
    }
  });

  return router;
};
