const express = require('express');

module.exports = (pool, io) => {
  const router = express.Router();
  const { sendNotification } = require('../services/notificationService');

  // 1. Get user notifications
  router.get('/api/notifications', async (req, res) => {
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }

      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const type = req.query.type;

      let query = 'SELECT * FROM user_notifications WHERE user_id = $1';
      const params = [userId];

      if (type && type !== 'all' && type !== 'All') {
        params.push(type);
        query += ` AND type = $${params.length}`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const notifsRes = await pool.query(query, params);

      // Unread count
      const countRes = await pool.query(
        'SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );
      const unreadCount = parseInt(countRes.rows[0].count, 10) || 0;

      res.json({
        success: true,
        notifications: notifsRes.rows,
        unreadCount
      });
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
      res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
  });

  // 2. Get unread notifications count
  router.get('/api/notifications/unread-count', async (req, res) => {
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }

      const countRes = await pool.query(
        'SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );
      const unreadCount = parseInt(countRes.rows[0].count, 10) || 0;

      res.json({ success: true, count: unreadCount });
    } catch (err) {
      console.error('Error fetching unread count:', err.message);
      res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
    }
  });

  // 3. Mark single notification as read
  router.put('/api/notifications/:id/read', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'UPDATE user_notifications SET is_read = true WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }

      const notif = result.rows[0];

      // Broadcast updated unread count to user socket
      if (io && notif.user_id) {
        const countRes = await pool.query(
          'SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false',
          [notif.user_id]
        );
        const unreadCount = parseInt(countRes.rows[0].count, 10) || 0;
        io.to(`user_${notif.user_id}`).emit('notification_unread_count', { count: unreadCount });
      }

      res.json({ success: true, notification: notif });
    } catch (err) {
      console.error('Error marking notification as read:', err.message);
      res.status(500).json({ success: false, error: 'Failed to update notification' });
    }
  });

  // 4. Mark all notifications as read for a user
  router.put('/api/notifications/read-all', async (req, res) => {
    try {
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }

      await pool.query(
        'UPDATE user_notifications SET is_read = true WHERE user_id = $1',
        [userId]
      );

      if (io) {
        io.to(`user_${userId}`).emit('notification_unread_count', { count: 0 });
      }

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      console.error('Error marking all notifications as read:', err.message);
      res.status(500).json({ success: false, error: 'Failed to mark all as read' });
    }
  });

  // 5. Delete a specific notification
  router.delete('/api/notifications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const delRes = await pool.query(
        'DELETE FROM user_notifications WHERE id = $1 RETURNING user_id',
        [id]
      );

      if (delRes.rows.length > 0 && io) {
        const userId = delRes.rows[0].user_id;
        const countRes = await pool.query(
          'SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false',
          [userId]
        );
        const unreadCount = parseInt(countRes.rows[0].count, 10) || 0;
        io.to(`user_${userId}`).emit('notification_unread_count', { count: unreadCount });
      }

      res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
      console.error('Error deleting notification:', err.message);
      res.status(500).json({ success: false, error: 'Failed to delete notification' });
    }
  });

  // 6. Clear all notifications for a user
  router.delete('/api/notifications/clear-all', async (req, res) => {
    try {
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }

      await pool.query('DELETE FROM user_notifications WHERE user_id = $1', [userId]);

      if (io) {
        io.to(`user_${userId}`).emit('notification_unread_count', { count: 0 });
      }

      res.json({ success: true, message: 'All notifications cleared' });
    } catch (err) {
      console.error('Error clearing notifications:', err.message);
      res.status(500).json({ success: false, error: 'Failed to clear notifications' });
    }
  });

  // 7. Register FCM push token
  router.post('/api/notifications/register-token', async (req, res) => {
    try {
      const { userId, fcmToken, platform = 'android' } = req.body;
      if (!userId || !fcmToken) {
        return res.status(400).json({ success: false, error: 'userId and fcmToken are required' });
      }

      await pool.query(
        `INSERT INTO user_push_tokens (user_id, fcm_token, platform, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (fcm_token)
         DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = CURRENT_TIMESTAMP`,
        [userId, fcmToken, platform]
      );

      res.json({ success: true, message: 'Push token registered successfully' });
    } catch (err) {
      console.error('Error registering FCM token:', err.message);
      res.status(500).json({ success: false, error: 'Failed to register token' });
    }
  });

  // 8. Unregister FCM push token (e.g. on logout)
  router.post('/api/notifications/unregister-token', async (req, res) => {
    try {
      const { fcmToken } = req.body;
      if (!fcmToken) {
        return res.status(400).json({ success: false, error: 'fcmToken is required' });
      }

      await pool.query('DELETE FROM user_push_tokens WHERE fcm_token = $1', [fcmToken]);
      res.json({ success: true, message: 'Token unregistered' });
    } catch (err) {
      console.error('Error unregistering FCM token:', err.message);
      res.status(500).json({ success: false, error: 'Failed to unregister token' });
    }
  });

  // 9. Get user notification preferences
  router.get('/api/notifications/preferences', async (req, res) => {
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }

      const prefRes = await pool.query(
        'SELECT * FROM user_notification_preferences WHERE user_id = $1',
        [userId]
      );

      if (prefRes.rows.length === 0) {
        return res.json({
          success: true,
          preferences: {
            enabled: true,
            consultations: true,
            messages: true,
            prescriptions: true,
            announcements: true,
            sound: true
          }
        });
      }

      res.json({ success: true, preferences: prefRes.rows[0] });
    } catch (err) {
      console.error('Error fetching notification preferences:', err.message);
      res.status(500).json({ success: false, error: 'Failed to fetch preferences' });
    }
  });

  // 10. Update user notification preferences
  router.put('/api/notifications/preferences', async (req, res) => {
    try {
      const { userId, enabled, consultations, messages, prescriptions, announcements, sound } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }

      const result = await pool.query(
        `INSERT INTO user_notification_preferences (user_id, enabled, consultations, messages, prescriptions, announcements, sound, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id)
         DO UPDATE SET
           enabled = COALESCE(EXCLUDED.enabled, user_notification_preferences.enabled),
           consultations = COALESCE(EXCLUDED.consultations, user_notification_preferences.consultations),
           messages = COALESCE(EXCLUDED.messages, user_notification_preferences.messages),
           prescriptions = COALESCE(EXCLUDED.prescriptions, user_notification_preferences.prescriptions),
           announcements = COALESCE(EXCLUDED.announcements, user_notification_preferences.announcements),
           sound = COALESCE(EXCLUDED.sound, user_notification_preferences.sound),
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          userId,
          enabled ?? true,
          consultations ?? true,
          messages ?? true,
          prescriptions ?? true,
          announcements ?? true,
          sound ?? true
        ]
      );

      res.json({ success: true, preferences: result.rows[0] });
    } catch (err) {
      console.error('Error updating notification preferences:', err.message);
      res.status(500).json({ success: false, error: 'Failed to update preferences' });
    }
  });

  return router;
};
