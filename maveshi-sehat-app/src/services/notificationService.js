import { Platform, PermissionsAndroid } from 'react-native';
let messagingModule = null;
try {
  messagingModule = require('@react-native-firebase/messaging');
} catch (e) {
  console.log('Firebase messaging native module not available in current binary');
}

let notifee = null;
let AndroidImportance = { HIGH: 4, DEFAULT: 3 };
let EventType = { PRESS: 1 };
try {
  const notifeeLib = require('@notifee/react-native');
  notifee = notifeeLib.default || notifeeLib;
  if (notifeeLib.AndroidImportance) AndroidImportance = notifeeLib.AndroidImportance;
  if (notifeeLib.EventType) EventType = notifeeLib.EventType;
} catch (e) {
  console.log('Notifee native module not available in current binary');
}

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

let notificationListeners = [];
let navigationRef = null;

export const setNotificationNavigationRef = (ref) => {
  navigationRef = ref;
};

export const subscribeToNotifications = (listener) => {
  notificationListeners.push(listener);
  return () => {
    notificationListeners = notificationListeners.filter(l => l !== listener);
  };
};

const notifyListeners = (data) => {
  notificationListeners.forEach(listener => {
    try {
      listener(data);
    } catch (e) {
      console.warn('Error in notification listener:', e);
    }
  });
};

/**
 * Safely get Firebase Messaging instance (compatible with v26 modular and legacy exports)
 */
const getMessagingInstance = () => {
  try {
    if (typeof messagingModule.getMessaging === 'function') {
      return messagingModule.getMessaging();
    }
    if (typeof messagingModule.default === 'function') {
      return messagingModule.default();
    }
  } catch (e) {
    console.warn('Firebase Messaging native module not ready:', e.message);
  }
  return null;
};

/**
 * Configure Android notification channels using Notifee
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android' && notifee && typeof notifee.createChannel === 'function') {
    try {
      await notifee.createChannel({
        id: 'maveshi_consultations',
        name: 'Consultations & Cases',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      await notifee.createChannel({
        id: 'maveshi_messages',
        name: 'Chat & Prescriptions',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      await notifee.createChannel({
        id: 'maveshi_general',
        name: 'General Announcements',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
      });
    } catch (err) {
      console.warn('Notifee channel creation error:', err.message);
    }
  }
};

/**
 * Request system notification permissions
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } else {
      const msg = getMessagingInstance();
      if (msg) {
        if (typeof messagingModule.requestPermission === 'function') {
          const authStatus = await messagingModule.requestPermission(msg);
          return authStatus === 1 || authStatus === 2;
        } else if (typeof msg.requestPermission === 'function') {
          const authStatus = await msg.requestPermission();
          return authStatus === 1 || authStatus === 2;
        }
      }
      return false;
    }
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Register FCM push token with the backend
 */
export const registerPushToken = async (userId, fcmToken) => {
  if (!userId || !fcmToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        fcmToken,
        platform: Platform.OS
      })
    });
    const data = await res.json();
    return data.success;
  } catch (e) {
    console.warn('Failed to register FCM token with backend:', e.message);
    return false;
  }
};

/**
 * Unregister FCM push token on logout
 */
export const unregisterPushToken = async (fcmToken) => {
  if (!fcmToken) return false;
  try {
    await fetch(`${BASE_URL}/api/notifications/unregister-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcmToken })
    });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Display a foreground notification using Notifee
 */
export const displayLocalNotification = async (remoteMessage) => {
  if (!notifee || typeof notifee.displayNotification !== 'function') return;
  try {
    const { notification, data } = remoteMessage || {};
    const title = notification?.title || data?.title || 'Maveshi Sehat Alert';
    const body = notification?.body || data?.body || data?.message_en || '';
    const type = data?.type || 'general';

    let channelId = 'maveshi_general';
    if (type === 'consultation') channelId = 'maveshi_consultations';
    else if (type === 'chat' || type === 'prescription') channelId = 'maveshi_messages';

    await notifee.displayNotification({
      title,
      body,
      data: data || {},
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        smallIcon: 'ic_launcher',
      },
    });
  } catch (err) {
    console.warn('Failed to display local notification:', err);
  }
};

/**
 * Initialize FCM listeners and token registration
 */
export const initNotifications = async (userId) => {
  try {
    await setupNotificationChannels();
    await requestNotificationPermission();

    const msg = getMessagingInstance();
    if (!msg) {
      console.log('ℹ️ Firebase Messaging not initialized on device. Running in Socket.IO and REST notification mode.');
      return () => {};
    }

    // Retrieve FCM token
    try {
      let token = null;
      if (typeof messagingModule.getToken === 'function') {
        token = await messagingModule.getToken(msg);
      } else if (typeof msg.getToken === 'function') {
        token = await msg.getToken();
      }

      if (token && userId) {
        await registerPushToken(userId, token);
      }
    } catch (tokenErr) {
      console.warn('Could not retrieve FCM token:', tokenErr.message);
    }

    // Token refresh listener
    let unsubscribeTokenRefresh = () => {};
    if (typeof messagingModule.onTokenRefresh === 'function') {
      unsubscribeTokenRefresh = messagingModule.onTokenRefresh(msg, async (newToken) => {
        if (userId) await registerPushToken(userId, newToken);
      });
    } else if (typeof msg.onTokenRefresh === 'function') {
      unsubscribeTokenRefresh = msg.onTokenRefresh(async (newToken) => {
        if (userId) await registerPushToken(userId, newToken);
      });
    }

    // Foreground message handler
    let unsubscribeForeground = () => {};
    if (typeof messagingModule.onMessage === 'function') {
      unsubscribeForeground = messagingModule.onMessage(msg, async (remoteMessage) => {
        await displayLocalNotification(remoteMessage);
        notifyListeners(remoteMessage);
      });
    } else if (typeof msg.onMessage === 'function') {
      unsubscribeForeground = msg.onMessage(async (remoteMessage) => {
        await displayLocalNotification(remoteMessage);
        notifyListeners(remoteMessage);
      });
    }

    // Notification tap handler (Notifee foreground events)
    let unsubscribeNotifee = () => {};
    try {
      if (notifee && typeof notifee.onForegroundEvent === 'function') {
        unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
          if (type === EventType.PRESS && detail.notification?.data) {
            handleNotificationPress(detail.notification.data);
          }
        });
      }
    } catch (notifErr) {
      console.warn('Notifee event listener error:', notifErr.message);
    }

    // App opened from background state
    if (typeof messagingModule.onNotificationOpenedApp === 'function') {
      messagingModule.onNotificationOpenedApp(msg, (remoteMessage) => {
        if (remoteMessage?.data) handleNotificationPress(remoteMessage.data);
      });
    } else if (typeof msg.onNotificationOpenedApp === 'function') {
      msg.onNotificationOpenedApp((remoteMessage) => {
        if (remoteMessage?.data) handleNotificationPress(remoteMessage.data);
      });
    }

    // App opened from quit state
    try {
      if (typeof messagingModule.getInitialNotification === 'function') {
        messagingModule.getInitialNotification(msg).then((remoteMessage) => {
          if (remoteMessage?.data) handleNotificationPress(remoteMessage.data);
        }).catch(() => {});
      } else if (typeof msg.getInitialNotification === 'function') {
        msg.getInitialNotification().then((remoteMessage) => {
          if (remoteMessage?.data) handleNotificationPress(remoteMessage.data);
        }).catch(() => {});
      }
    } catch (initNotifErr) {
      console.warn('Initial notification error:', initNotifErr.message);
    }

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
      unsubscribeNotifee();
    };
  } catch (e) {
    console.warn('Error in initNotifications:', e);
  }
};

/**
 * Handle notification tap routing
 */
export const handleNotificationPress = (data) => {
  if (!navigationRef || !data) return;

  const targetScreen = data.targetScreen;
  try {
    if (targetScreen === 'Chat' && data.conversationId) {
      navigationRef.navigate('Chat', {
        conversationId: data.conversationId,
        recipientName: data.senderName || 'Consultation Chat'
      });
    } else if (targetScreen === 'VetCases') {
      navigationRef.navigate('VetCases');
    } else if (targetScreen === 'MyConsultations') {
      navigationRef.navigate('MyConsultations');
    } else if (targetScreen === 'Notifications') {
      navigationRef.navigate('Notifications');
    } else if (targetScreen === 'VetNotificationCenter') {
      navigationRef.navigate('VetNotificationCenter');
    }
  } catch (err) {
    console.warn('Failed to route notification press:', err);
  }
};

/**
 * Background notification handler for index.js
 */
export const backgroundMessageHandler = async (remoteMessage) => {
  console.log('📬 Background FCM message received:', remoteMessage);
  return Promise.resolve();
};

/**
 * Register background message handler safely
 */
export const setupBackgroundNotificationHandler = () => {
  try {
    const msg = getMessagingInstance();
    if (msg) {
      if (typeof messagingModule.setBackgroundMessageHandler === 'function') {
        messagingModule.setBackgroundMessageHandler(msg, backgroundMessageHandler);
      } else if (typeof msg.setBackgroundMessageHandler === 'function') {
        msg.setBackgroundMessageHandler(backgroundMessageHandler);
      }
    }
  } catch (err) {
    console.warn('Could not register background message handler:', err.message);
  }
};

// ==========================================
// REST API Helpers for Notification Center
// ==========================================

export const fetchNotifications = async (userId, type = 'all') => {
  try {
    const typeParam = type && type !== 'all' ? `&type=${encodeURIComponent(type)}` : '';
    const res = await fetch(`${BASE_URL}/api/notifications?userId=${userId}${typeParam}`);
    if (res.ok) {
      const data = await res.json();
      return {
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0
      };
    }
  } catch (e) {
    console.warn('Error fetching notifications:', e.message);
  }
  return { notifications: [], unreadCount: 0 };
};

export const fetchUnreadCount = async (userId) => {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/unread-count?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.count || 0;
    }
  } catch (e) {
    console.warn('Error fetching unread count:', e.message);
  }
  return 0;
};

export const markNotificationAsRead = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
      method: 'PUT'
    });
    return res.ok;
  } catch (e) {
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
};

export const deleteNotification = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (e) {
    return false;
  }
};

export const clearAllNotifications = async (userId) => {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/clear-all`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
};

export const fetchNotificationPreferences = async (userId) => {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/preferences?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.preferences || null;
    }
  } catch (e) {
    console.warn('Error fetching preferences:', e.message);
  }
  return null;
};

export const saveNotificationPreferences = async (userId, preferences) => {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...preferences
      })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
};
