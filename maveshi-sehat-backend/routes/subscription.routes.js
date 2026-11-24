const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { persistUploadedFile } = require('../utils/fileStore');

const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'payment-proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const proofUpload = multer({
  storage: proofStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = (pool, io) => {
  // 1. Get User's Subscription & Scan Allowance Status
  router.get('/api/subscriptions/status/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const userRes = await pool.query(
        'SELECT id, full_name, phone_number, scans_used, subscription_status, subscription_plan, subscription_expires_at FROM users WHERE id = $1',
        [userId]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userRes.rows[0];
      let currentStatus = user.subscription_status || 'free';
      let expiresAt = user.subscription_expires_at;

      // Auto-expire monthly subscription if validity passed
      if (currentStatus === 'active' && expiresAt && new Date(expiresAt) < new Date()) {
        currentStatus = 'expired';
        await pool.query('UPDATE users SET subscription_status = $1 WHERE id = $2', ['expired', userId]);
      }

      // Check for pending request
      const pendingRes = await pool.query(
        'SELECT * FROM subscription_requests WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, 'pending']
      );

      const maxFreeScans = 10;
      const scansUsed = parseInt(user.scans_used, 10) || 0;
      const scansRemaining = Math.max(0, maxFreeScans - scansUsed);
      const isUnlimited = currentStatus === 'active' || currentStatus === 'lifetime';

      res.status(200).json({
        userId: user.id,
        userName: user.full_name,
        userPhone: user.phone_number,
        scansUsed,
        maxFreeScans,
        scansRemaining,
        isUnlimited,
        subscriptionStatus: currentStatus,
        subscriptionPlan: user.subscription_plan,
        expiresAt,
        hasPendingProof: pendingRes.rows.length > 0,
        pendingRequest: pendingRes.rows[0] || null
      });
    } catch (err) {
      console.error('Error fetching subscription status:', err.message);
      res.status(500).json({ error: 'Failed to retrieve subscription status.' });
    }
  });

  // 2. Submit JazzCash Payment Proof for Subscription
  router.post('/api/subscriptions/submit-proof', proofUpload.single('proofImage'), async (req, res) => {
    try {
      const {
        userId,
        planType = 'monthly_300',
        senderPhone,
        transactionId
      } = req.body;

      if (!userId || !senderPhone) {
        return res.status(400).json({ error: 'User ID and Sender Phone number are required.' });
      }

      let proofUrl = null;
      const host = req.get('host');
      const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      if (req.file) {
        proofUrl = `${baseUrl}/uploads/${req.file.filename}`;
        await persistUploadedFile(pool, req.file.filename, req.file.path, req.file.mimetype);
      } else if (req.body.proofImageBase64) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileName = `payment-proof-${uniqueSuffix}.jpg`;
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, fileName);
        const cleanBase64 = req.body.proofImageBase64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
        proofUrl = `${baseUrl}/uploads/${fileName}`;
        await persistUploadedFile(pool, fileName, filePath, 'image/jpeg');
      } else {
        return res.status(400).json({ error: 'Payment receipt image or screenshot is required as proof.' });
      }

      // Fetch user info
      const userRes = await pool.query('SELECT full_name, phone_number FROM users WHERE id = $1', [userId]);
      const userName = userRes.rows[0]?.full_name || 'Farmer';
      const userPhone = userRes.rows[0]?.phone_number || senderPhone;

      const amount = planType === 'monthly_300' ? 300.00 : 0.00;

      // Insert subscription request
      const insertRes = await pool.query(
        `INSERT INTO subscription_requests (
          user_id, user_name, user_phone, plan_type, amount,
          payment_method, account_number, sender_phone, transaction_id, proof_image_url, status
        ) VALUES ($1, $2, $3, $4, $5, 'JazzCash', '03054758667', $6, $7, $8, 'pending')
        RETURNING *`,
        [userId, userName, userPhone, planType, amount, senderPhone, transactionId || null, proofUrl]
      );

      // Update user status to pending_approval
      await pool.query(
        'UPDATE users SET subscription_status = $1 WHERE id = $2',
        ['pending_approval', userId]
      );

      // Insert Admin notification
      await pool.query(
        `INSERT INTO admin_notifications (type, message_en, message_ur)
         VALUES ($1, $2, $3)`,
        [
          'subscription_payment',
          `New JazzCash Rs. 300 Subscription Proof from ${userName} (${senderPhone}) - TID: ${transactionId || 'N/A'}`,
          `${userName} (${senderPhone}) نے 300 روپے کی ماہانہ رکنیت کا جاز کیش ثبوت جمع کرایا ہے — جانچ درکار ہے`
        ]
      );

      // Realtime notification
      if (io) {
        io.emit('new_subscription_request', insertRes.rows[0]);
      }

      res.status(201).json({
        success: true,
        message: 'Payment proof submitted successfully! The administrator will review and grant access shortly.',
        request: insertRes.rows[0]
      });
    } catch (err) {
      console.error('Error submitting subscription proof:', err.message);
      res.status(500).json({ error: 'Server error submitting subscription proof.' });
    }
  });

  // 3. Admin: List All Subscription Requests
  router.get('/api/admin/subscriptions', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT sr.*, u.email as user_email
        FROM subscription_requests sr
        LEFT JOIN users u ON sr.user_id = u.id
        ORDER BY sr.created_at DESC
      `);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Admin Subscriptions Error:', err.message);
      res.status(500).json({ error: 'Failed to fetch subscription requests.' });
    }
  });

  // 4. Admin: Approve Subscription Request
  router.put('/api/admin/subscriptions/:id/approve', async (req, res) => {
    try {
      const { id } = req.params;

      const subRes = await pool.query('SELECT * FROM subscription_requests WHERE id = $1', [id]);
      if (subRes.rows.length === 0) {
        return res.status(404).json({ error: 'Subscription request not found.' });
      }

      const request = subRes.rows[0];
      const isLifetime = request.plan_type === 'lifetime';

      // Expiry calculation: 30 days from now for monthly_300
      let expiresAt = null;
      let newStatus = 'active';

      if (isLifetime) {
        newStatus = 'lifetime';
      } else {
        const exp = new Date();
        exp.setDate(exp.getDate() + 30);
        expiresAt = exp.toISOString();
      }

      // Update subscription request
      await pool.query(
        'UPDATE subscription_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['approved', id]
      );

      // Update user subscription state
      await pool.query(
        `UPDATE users 
         SET subscription_status = $1, subscription_plan = $2, subscription_expires_at = $3
         WHERE id = $4`,
        [newStatus, request.plan_type, expiresAt, request.user_id]
      );

      // Send in-app notification to user
      await pool.query(
        `INSERT INTO user_notifications (user_id, type, title_en, title_ur, message_en, message_ur)
         VALUES ($1, 'subscription_approved', $2, $3, $4, $5)`,
        [
          request.user_id,
          'Subscription Activated!',
          'رکنیت فعال ہو گئی!',
          isLifetime
            ? 'Congratulations! Your Lifetime Maveshi Sehat Pro subscription has been approved.'
            : 'Your Rs. 300 Monthly Subscription has been verified! You now have unlimited AI disease scans for 30 days.',
          isLifetime
            ? 'مبارک ہو! آپ کی تاحیات مواشی صحت پرو رکنیت کی تصدیق کر دی گئی ہے۔'
            : 'آپ کی 300 روپے کی ماہانہ رکنیت منظور ہو گئی ہے! اب آپ 30 دن کے لیے لامحدود AI اسکین کر سکتے ہیں۔'
        ]
      );

      if (io) {
        io.emit('subscription_status_updated', {
          userId: request.user_id,
          status: newStatus,
          expiresAt
        });
      }

      res.status(200).json({
        success: true,
        message: `Subscription successfully approved and activated as ${newStatus}!`
      });
    } catch (err) {
      console.error('Approve Subscription Error:', err.message);
      res.status(500).json({ error: 'Failed to approve subscription.' });
    }
  });

  // 5. Admin: Reject Subscription Request
  router.put('/api/admin/subscriptions/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = 'Payment verification failed' } = req.body;

      const subRes = await pool.query('SELECT * FROM subscription_requests WHERE id = $1', [id]);
      if (subRes.rows.length === 0) {
        return res.status(404).json({ error: 'Subscription request not found.' });
      }

      const request = subRes.rows[0];

      await pool.query(
        'UPDATE subscription_requests SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['rejected', reason, id]
      );

      // Revert user to free
      await pool.query(
        'UPDATE users SET subscription_status = $1 WHERE id = $2 AND subscription_status = $3',
        ['free', request.user_id, 'pending_approval']
      );

      // Send in-app notification to user
      await pool.query(
        `INSERT INTO user_notifications (user_id, type, title_en, title_ur, message_en, message_ur)
         VALUES ($1, 'subscription_rejected', $2, $3, $4, $5)`,
        [
          request.user_id,
          'Subscription Payment Rejected',
          'رکنیت کی ادائیگی مسترد',
          `Your subscription payment proof could not be verified: ${reason}. Please re-upload with a valid JazzCash receipt.`,
          `آپ کے ادائیگی کے ثبوت کی تصدیق نہیں ہو سکی: ${reason}۔ براہ کرم درست جاز کیش رسید کے ساتھ دوبارہ اپ لوڈ کریں۔`
        ]
      );

      if (io) {
        io.emit('subscription_status_updated', {
          userId: request.user_id,
          status: 'free'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Subscription request has been rejected.'
      });
    } catch (err) {
      console.error('Reject Subscription Error:', err.message);
      res.status(500).json({ error: 'Failed to reject subscription.' });
    }
  });

  return router;
};
