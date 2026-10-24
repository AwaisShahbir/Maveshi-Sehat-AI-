const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const transporter = require('../config/mail');
const { broadcastNotification } = require('../services/notificationService');

module.exports = (pool, io) => {
  // Ensure admin_settings table exists
  pool.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).catch(err => console.error('admin_settings table check error:', err.message));

  // Ensure system_settings table exists
  pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(50) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).catch(err => console.error('Error creating system_settings table:', err.message));

  // Admin Dashboard Stats
  router.get('/api/admin/dashboard-stats', async (req, res) => {
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

      const trendRes = await pool.query(`
        SELECT 
          TO_CHAR(created_at, 'DD Mon') as day_name,
          SUM(CASE WHEN disease = 'LSD' THEN 1 ELSE 0 END)::int as lsd_count,
          SUM(CASE WHEN disease = 'FMD' THEN 1 ELSE 0 END)::int as fmd_count,
          SUM(CASE WHEN disease IN ('Tick', 'Lice', 'Mites') THEN 1 ELSE 0 END)::int as tick_count,
          DATE_TRUNC('day', created_at) as day_date
        FROM detections
        GROUP BY TO_CHAR(created_at, 'DD Mon'), DATE_TRUNC('day', created_at)
        ORDER BY day_date DESC
        LIMIT 7
      `);
      const trendData = trendRes.rows.reverse().map(row => ({
        name: row.day_name,
        LSD: row.lsd_count,
        FMD: row.fmd_count,
        Tick: row.tick_count
      }));

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
        systemStatus,
        trendData
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Admin Users List (Enriched with activity stats for farmers and vets)
  router.get('/api/admin/users', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT u.id, u.full_name, u.email, u.phone_number, u.district, u.role, u.status, 
               u.pvmc_number, u.specialization, u.experience_years, u.license_document_url, u.created_at,
               (SELECT COUNT(*)::int FROM consultations WHERE farmer_id = u.id) AS farmer_consultations_count,
               (SELECT COUNT(*)::int FROM consultations WHERE vet_id = u.id) AS vet_consultations_count,
               (SELECT COUNT(*)::int FROM consultations WHERE vet_id = u.id AND status = 'completed') AS vet_completed_consultations,
               (SELECT COUNT(*)::int FROM detections WHERE vet_id = u.id) AS vet_reviewed_cases,
               (SELECT COUNT(*)::int FROM detections WHERE TRIM(LOWER(owner_name)) = TRIM(LOWER(u.full_name))) AS farmer_detections_count,
               (SELECT COUNT(*)::int FROM orders WHERE TRIM(LOWER(buyer_name)) = TRIM(LOWER(u.full_name))) AS farmer_orders_count
        FROM users u 
        WHERE u.role != 'admin' 
        ORDER BY u.id ASC
      `);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Admin User Actions (Approve, Reject, Block, Unblock, Request Info)
  router.post('/api/admin/users/action', async (req, res) => {
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

  // Admin Pharmacies List
  router.get('/api/admin/pharmacies', async (req, res) => {
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

  // Admin Pharmacy Approval & Status Action (Approve, Reject, Block, Unblock)
  router.post('/api/admin/pharmacies/approve', async (req, res) => {
    try {
      const { pharmacyId, action } = req.body;
      let status = 'approved';
      if (action === 'approve' || action === 'unblock') status = 'approved';
      else if (action === 'reject') status = 'rejected';
      else if (action === 'block') status = 'blocked';

      await pool.query("UPDATE pharmacies SET status = $1 WHERE id = $2", [status, pharmacyId]);
      res.status(200).json({ message: `Pharmacy ${status} successfully.`, status });
    } catch (err) {
      console.error('Error updating pharmacy status:', err);
      res.status(500).json({ error: 'Failed to update pharmacy status' });
    }
  });

  router.post('/api/admin/pharmacies/action', async (req, res) => {
    try {
      const { pharmacyId, action } = req.body;
      let status = 'approved';
      if (action === 'approve' || action === 'unblock') status = 'approved';
      else if (action === 'reject') status = 'rejected';
      else if (action === 'block') status = 'blocked';

      await pool.query("UPDATE pharmacies SET status = $1 WHERE id = $2", [status, pharmacyId]);
      res.status(200).json({ message: `Pharmacy ${status} successfully.`, status });
    } catch (err) {
      console.error('Error updating pharmacy status:', err);
      res.status(500).json({ error: 'Failed to update pharmacy status' });
    }
  });

  // Admin Medicines List
  router.get('/api/admin/medicines', async (req, res) => {
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

  // Admin Add Medicine
  router.post('/api/admin/medicines', async (req, res) => {
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

  // Admin Delete Medicine
  router.delete('/api/admin/medicines/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM medicines WHERE id = $1", [id]);
      res.status(200).json({ message: 'Medicine deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete medicine' });
    }
  });

  // Admin Orders List
  router.get('/api/admin/orders', async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Admin Health Records
  router.get('/api/admin/health-records', async (req, res) => {
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

  // Admin Health Record Status Update
  router.patch('/api/admin/health-records/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await pool.query(
        'UPDATE detections SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Error updating health record status:', err);
      res.status(500).json({ error: 'Failed to update health record status' });
    }
  });

  // Admin Delete Health Record
  router.delete('/api/admin/health-records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM detections WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.status(200).json({ success: true, message: 'Health record deleted successfully' });
    } catch (err) {
      console.error('Error deleting health record:', err);
      res.status(500).json({ error: 'Failed to delete health record' });
    }
  });

  // Admin Notifications (Unifies broadcasts sent by admin and inbound system alerts)
  router.get('/api/admin/notifications', async (req, res) => {
    try {
      // 1. Fetch announcements broadcasted by admin
      const announcementsRes = await pool.query(
        "SELECT id, 'announcement' AS source, target_audience, type, title, message_en, message_ur, created_at FROM announcements ORDER BY created_at DESC"
      );

      // 2. Fetch inbound admin notifications (system alerts)
      const adminNotifsRes = await pool.query(
        "SELECT id, 'system' AS source, 'admin' AS target_audience, type, type AS title, message_en, message_ur, created_at, read FROM admin_notifications ORDER BY created_at DESC"
      );

      // 3. Format and combine into unified chronological list
      const combined = [
        ...announcementsRes.rows.map(a => ({
          id: `announcement_${a.id}`,
          rawId: a.id,
          source: 'announcement',
          target_audience: a.target_audience || 'all',
          type: a.type || 'general',
          title: a.title || 'Broadcast Announcement',
          message_en: a.message_en,
          message_ur: a.message_ur,
          created_at: a.created_at,
          read: true
        })),
        ...adminNotifsRes.rows.map(n => ({
          id: `system_${n.id}`,
          rawId: n.id,
          source: 'system',
          target_audience: 'admin',
          type: n.type,
          title: n.title ? n.title.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'System Notification',
          message_en: n.message_en,
          message_ur: n.message_ur,
          created_at: n.created_at,
          read: n.read
        }))
      ];

      // Sort by newest first
      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.status(200).json(combined);
    } catch (err) {
      console.error('Error fetching admin notifications:', err.message);
      res.status(500).json({ error: 'Failed to fetch admin notifications' });
    }
  });

  // Admin Announcements
  router.post('/api/admin/announcements', async (req, res) => {
    try {
      const { targetAudience, type, title, messageEn, messageUr } = req.body;
      const audience = targetAudience || 'all';

      const result = await pool.query(
        "INSERT INTO announcements (target_audience, type, title, message_en, message_ur) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [audience, type || 'general', title, messageEn, messageUr || messageEn]
      );

      const announcement = result.rows[0];

      // Broadcast notification to targeted users (Farmers, Vets, Pharmacies)
      try {
        await broadcastNotification({
          pool,
          io,
          targetAudience: audience,
          type: type || 'general',
          title_en: title || 'Admin Announcement',
          title_ur: messageUr || title || 'انتظامیہ کا اعلان',
          message_en: messageEn || '',
          message_ur: messageUr || messageEn || '',
          data: {
            announcementId: announcement.id,
            targetAudience: audience,
            category: type || 'general'
          }
        });
      } catch (broadcastErr) {
        console.error('Failed to broadcast announcement notification:', broadcastErr.message);
      }

      res.status(201).json(announcement);
    } catch (err) {
      console.error('Error posting announcement:', err.message);
      res.status(500).json({ error: 'Failed to post announcement' });
    }
  });

  // GET Admin Profile
  router.get('/api/admin/profile', async (req, res) => {
    try {
      const result = await pool.query("SELECT id, full_name, email, phone_number, role, status FROM users WHERE role = 'admin' LIMIT 1");
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Admin profile not found' });
      }
      const admin = result.rows[0];
      res.status(200).json({
        id: admin.id,
        fullName: admin.full_name,
        full_name: admin.full_name,
        email: admin.email,
        phoneNumber: admin.phone_number,
        phone_number: admin.phone_number,
        role: admin.role,
        status: admin.status
      });
    } catch (err) {
      console.error('Error fetching admin profile:', err.message);
      res.status(500).json({ error: 'Failed to fetch admin profile' });
    }
  });

  // UPDATE Admin Profile
  router.put('/api/admin/profile', async (req, res) => {
    try {
      const { full_name, phone_number, email } = req.body;
      if (!full_name || !phone_number || !email) {
        return res.status(400).json({ error: 'Full name, phone number, and email are required.' });
      }

      const checkPhone = await pool.query("SELECT id FROM users WHERE phone_number = $1 AND role != 'admin'", [phone_number.trim()]);
      if (checkPhone.rows.length > 0) {
        return res.status(400).json({ error: 'Phone number is already associated with another account.' });
      }

      let result = await pool.query(
        "UPDATE users SET full_name = $1, phone_number = $2, email = $3 WHERE role = 'admin' RETURNING id, full_name, email, phone_number, role",
        [full_name.trim(), phone_number.trim(), email.trim()]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Admin account not found to update.' });
      }

      const updated = result.rows[0];
      res.status(200).json({
        message: 'Profile updated successfully.',
        user: {
          id: updated.id,
          fullName: updated.full_name,
          full_name: updated.full_name,
          email: updated.email,
          phoneNumber: updated.phone_number,
          phone_number: updated.phone_number,
          role: updated.role
        }
      });
    } catch (err) {
      console.error('Error updating admin profile:', err.message);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  });

  // CHANGE Admin Password
  router.post('/api/admin/change-password', async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Both current password and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      const adminRes = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
      if (adminRes.rows.length === 0) {
        return res.status(404).json({ error: 'Admin account not found.' });
      }

      const admin = adminRes.rows[0];
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHashed = await bcrypt.hash(newPassword, salt);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [newHashed, admin.id]);

      res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
      console.error('Error changing admin password:', err.message);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  });

  // GET Admin Settings
  router.get('/api/admin/settings', async (req, res) => {
    try {
      const rows = await pool.query("SELECT setting_key, setting_value FROM admin_settings");
      const settingsMap = {};
      rows.rows.forEach(r => {
        const val = typeof r.setting_value === 'string' ? JSON.parse(r.setting_value) : r.setting_value;
        settingsMap[r.setting_key] = val;
      });

      const defaultNotifications = {
        emailNotif: true,
        smsNotif: true,
        outbreakAlerts: true,
        newUserReg: true,
        vetReq: true
      };

      const defaultSystem = {
        threshold: 85,
        language: 'Both',
        timezone: 'utc-5',
        enforceAdminLanguage: true
      };

      const defaultAiAssistant = {
        enabled: true,
        messageEn: 'Sehat Assistant is temporarily paused for scheduled maintenance by administration. Please consult our registered veterinarians directly.',
        messageUr: 'انتظامیہ کی جانب سے صحت اسسٹنٹ سروس عارضی طور پر روک دی گئی ہے۔ برائے مہربانی رجسٹرڈ ویٹرنری ڈاکٹرز سے براہ راست رابطہ کریں۔'
      };

      res.status(200).json({
        notifications: settingsMap.notifications || defaultNotifications,
        system: settingsMap.system || defaultSystem,
        aiAssistant: settingsMap.ai_assistant || defaultAiAssistant
      });
    } catch (err) {
      console.error('Error fetching admin settings:', err.message);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // SAVE Admin Settings
  router.post('/api/admin/settings', async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'Setting key and value are required.' });
      }

      await pool.query(`
        INSERT INTO admin_settings (setting_key, setting_value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key)
        DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP
      `, [key, JSON.stringify(value)]);

      if (io) {
        io.emit('systemSettingsUpdated', { key, value });
      }

      res.status(200).json({ message: 'Settings saved successfully.', key, value });
    } catch (err) {
      console.error('Error saving admin settings:', err.message);
      res.status(500).json({ error: 'Failed to save settings.' });
    }
  });

  // GET Mobile App Settings
  router.get('/api/app/settings', async (req, res) => {
    try {
      const result = await pool.query("SELECT setting_value FROM admin_settings WHERE setting_key = 'system'");
      if (result.rows.length > 0) {
        const val = typeof result.rows[0].setting_value === 'string' 
          ? JSON.parse(result.rows[0].setting_value) 
          : result.rows[0].setting_value;
        return res.status(200).json(val);
      }
      res.status(200).json({ language: 'Both', enforceAdminLanguage: true, timezone: 'utc-5', threshold: 85 });
    } catch (err) {
      res.status(200).json({ language: 'Both', enforceAdminLanguage: true, timezone: 'utc-5', threshold: 85 });
    }
  });

  return router;
};
