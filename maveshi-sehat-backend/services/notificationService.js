const fs = require('fs');
const path = require('path');
let admin = null;
let firebaseInitialized = false;

try {
  const firebaseAdmin = require('firebase-admin');
  
  // Look for Firebase service account configuration
  let serviceAccount = null;
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const defaultPath1 = path.join(__dirname, '../config/firebase-service-account.json');
  const defaultPath2 = path.join(__dirname, '../config/serviceAccountKey.json');

  if (envPath && fs.existsSync(envPath)) {
    serviceAccount = require(path.resolve(envPath));
  } else if (fs.existsSync(defaultPath1)) {
    serviceAccount = require(defaultPath1);
  } else if (fs.existsSync(defaultPath2)) {
    serviceAccount = require(defaultPath2);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  }

  if (serviceAccount) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount)
    });
    admin = firebaseAdmin;
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin initialized successfully for push notifications!');
  } else {
    console.log('ℹ️ Firebase Admin service account key not found yet. Notifications will be stored in PostgreSQL and delivered live via Socket.IO.');
  }
} catch (err) {
  console.warn('⚠️ Error initializing Firebase Admin:', err.message);
}

/**
 * Send an in-app and push notification to a specific user
 */
async function sendNotification({ pool, io, userId, type, title_en, title_ur, message_en, message_ur, data = {} }) {
  if (!userId) return null;

  try {
    // 1. Check user notification preferences
    const prefRes = await pool.query(
      'SELECT * FROM user_notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (prefRes.rows.length > 0) {
      const prefs = prefRes.rows[0];
      if (prefs.enabled === false) {
        return null; // Notifications globally muted for this user
      }
      if (type === 'chat' && prefs.messages === false) {
        return null;
      }
      if (type === 'consultation' && prefs.consultations === false) {
        return null;
      }
      if (type === 'prescription' && prefs.prescriptions === false) {
        return null;
      }
      if (type === 'announcement' && prefs.announcements === false) {
        return null;
      }
    }

    // 2. Insert notification into PostgreSQL
    const sanitizedData = typeof data === 'object' && data !== null ? data : {};
    const insertRes = await pool.query(
      `INSERT INTO user_notifications (user_id, type, title_en, title_ur, message_en, message_ur, data, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING *`,
      [
        userId,
        type || 'system',
        title_en || 'Maveshi Sehat Notification',
        title_ur || title_en || 'مویشی صحت نوٹیفکیشن',
        message_en || '',
        message_ur || message_en || '',
        JSON.stringify(sanitizedData)
      ]
    );

    const notification = insertRes.rows[0];

    // 3. Real-time broadcast via Socket.IO
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);

      // Also push live unread count
      try {
        const countRes = await pool.query(
          'SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false',
          [userId]
        );
        const unreadCount = parseInt(countRes.rows[0].count, 10) || 0;
        io.to(`user_${userId}`).emit('notification_unread_count', { count: unreadCount });
      } catch (countErr) {
        console.error('Error broadcasting unread count:', countErr.message);
      }
    }

    // 4. Send Firebase Cloud Messaging push notification if configured
    if (firebaseInitialized && admin) {
      try {
        const tokensRes = await pool.query(
          'SELECT fcm_token FROM user_push_tokens WHERE user_id = $1',
          [userId]
        );

        const tokens = tokensRes.rows.map(r => r.fcm_token).filter(Boolean);

        if (tokens.length > 0) {
          // Prepare FCM payload strings
          const stringifiedData = {};
          Object.keys(sanitizedData).forEach(key => {
            stringifiedData[key] = String(sanitizedData[key]);
          });

          stringifiedData.notificationId = String(notification.id);
          stringifiedData.type = String(type || 'system');
          stringifiedData.title_ur = String(title_ur || '');
          stringifiedData.message_ur = String(message_ur || '');

          const fcmMessage = {
            tokens,
            notification: {
              title: title_en || 'Maveshi Sehat',
              body: message_en || ''
            },
            data: stringifiedData,
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channelId: type === 'chat' ? 'maveshi_messages' : 'maveshi_consultations',
                priority: 'max'
              }
            }
          };

          const response = await admin.messaging().sendEachForMulticast(fcmMessage);

          // Clean up invalid or expired tokens
          if (response.failureCount > 0) {
            const tokensToRemove = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errCode = resp.error?.code;
                if (
                  errCode === 'messaging/registration-token-not-registered' ||
                  errCode === 'messaging/invalid-registration-token'
                ) {
                  tokensToRemove.push(tokens[idx]);
                }
              }
            });

            if (tokensToRemove.length > 0) {
              await pool.query(
                'DELETE FROM user_push_tokens WHERE fcm_token = ANY($1)',
                [tokensToRemove]
              );
            }
          }
        }
      } catch (fcmErr) {
        console.error('FCM push send error:', fcmErr.message);
      }
    }

    return notification;
  } catch (err) {
    console.error('Error sending notification:', err.message);
    return null;
  }
}

/**
 * Broadcast notification to a specific group of users
 */
async function broadcastNotification({ pool, io, targetAudience, type, title_en, title_ur, message_en, message_ur, data = {} }) {
  try {
    let query = 'SELECT id FROM users';
    let params = [];

    if (targetAudience === 'farmers' || targetAudience === 'owners') {
      query = 'SELECT id FROM users WHERE role IN ($1, $2)';
      params = ['farmer', 'user'];
    } else if (targetAudience === 'vets' || targetAudience === 'veterinarians') {
      query = 'SELECT id FROM users WHERE role IN ($1, $2)';
      params = ['vet', 'veterinarian'];
    }

    const usersRes = await pool.query(query, params);
    const users = usersRes.rows;

    for (const u of users) {
      await sendNotification({
        pool,
        io,
        userId: u.id,
        type: type || 'announcement',
        title_en,
        title_ur,
        message_en,
        message_ur,
        data
      });
    }

    return { success: true, count: users.length };
  } catch (err) {
    console.error('Error broadcasting notification:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendNotification,
  broadcastNotification
};
