const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const mailService = require('../config/mail');
const { getOtpEmailHtml, getVetWelcomeEmailHtml } = require('../utils/emailTemplates');
const { persistUploadedFile } = require('../utils/fileStore');

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
  router.post('/upload', upload.single('license'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please select a file to upload.' });
      }
      const host = req.get('host');
      const protocol = (host && host.includes('onrender.com')) || req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

      await persistUploadedFile(pool, req.file.filename, req.file.path, req.file.mimetype);

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

          try {
            const mailInfo = await mailService.sendMail({
              to: cleanEmail,
              subject: `${otp} is your Maveshi Sehat AI verification code`,
              html: getOtpEmailHtml(cleanName, otp),
              text: `Welcome to Maveshi Sehat AI! Your verification code is: ${otp}`
            });
            console.log(`[OTP] Sent updated OTP ${otp} to unverified user ${cleanEmail}: ${mailInfo.response}`);
          } catch (mailErr) {
            console.error(`[OTP] Mail send error for ${cleanEmail}:`, mailErr.message);
          }

          return res.status(200).json({
            message: 'Verification OTP sent to your email.',
            email: existing.email,
            role: 'farmer',
            otp
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
          await mailService.sendMail({
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

        try {
          const mailInfo = await mailService.sendMail({
            to: cleanEmail,
            subject: `${otp} is your Maveshi Sehat AI verification code`,
            html: getOtpEmailHtml(cleanName, otp),
            text: `Welcome to Maveshi Sehat AI! Your verification code is: ${otp}`
          });
          console.log(`[OTP] Sent OTP ${otp} to new user ${cleanEmail}: ${mailInfo.response}`);
        } catch (mailErr) {
          console.error(`[OTP] Mail send error for ${cleanEmail}:`, mailErr.message);
        }

        return res.status(201).json({
          message: 'User registered successfully! OTP sent.',
          email: newUser.rows[0].email,
          role: 'farmer',
          otp
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

      try {
        const mailInfo = await mailService.sendMail({
          to: cleanEmail,
          subject: `${otp} is your Maveshi Sehat AI verification code`,
          html: getOtpEmailHtml(user.full_name, otp),
          text: `Your Maveshi Sehat verification code is: ${otp}. It expires in 10 minutes.`
        });
        console.log(`[OTP] Resent OTP ${otp} to ${cleanEmail}: ${mailInfo.response}`);
      } catch (mailErr) {
        console.error(`[OTP] Resend mail error for ${cleanEmail}:`, mailErr.message);
      }

      res.status(200).json({ 
        message: 'A new verification code has been sent to your email.',
        otp
      });
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
        const otpRecord = await pool.query(
          'SELECT otp FROM otps WHERE LOWER(email) = $1 ORDER BY created_at DESC LIMIT 1',
          [user.email.toLowerCase()]
        );
        const existingOtp = otpRecord.rows.length > 0 ? otpRecord.rows[0].otp : null;

        return res.status(403).json({ 
          error: 'Please verify your account with the OTP sent to your email.',
          unverified: true,
          email: user.email,
          otp: existingOtp
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

  // Diagnostic Test Email Endpoint (Resend HTTPS REST API)
  router.get('/test-mail', async (req, res) => {
    try {
      const targetEmail = req.query.email || 'codersxcareer@gmail.com';
      const testOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const mailInfo = await mailService.sendMail({
        to: targetEmail,
        subject: `${testOtp} is your Maveshi Sehat AI verification code`,
        html: getOtpEmailHtml('Tester', testOtp),
        text: `Your Maveshi Sehat AI verification code is: ${testOtp}`
      });
      res.status(200).json({
        success: true,
        provider: 'Resend (HTTPS REST API / Port 443)',
        response: mailInfo.response,
        messageId: mailInfo.messageId,
        sentTo: targetEmail,
        sender: mailService.emailUser
      });
    } catch (err) {
      console.error('Test mail error:', err);
      res.status(500).json({
        success: false,
        provider: 'Resend (HTTPS REST API / Port 443)',
        error: err.message,
        hint: 'Make sure RESEND_API_KEY is configured in your Render Dashboard / .env file.'
      });
    }
  });

  return router;
};
