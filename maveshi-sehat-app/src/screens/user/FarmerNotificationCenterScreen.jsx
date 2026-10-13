import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import io from 'socket.io-client';
import { useTheme } from '../../utils/themeContext';
import { getProfile } from '../../utils/profileStore';
import { t, fonts } from '../../utils/translate';
import { getStyles } from '../../styles/FarmerNotificationCenterScreenStyles';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  handleNotificationPress
} from '../../services/notificationService';

const SOCKET_URL = 'http://10.0.2.2:5000';

export default function FarmerNotificationCenterScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const profile = getProfile();
  const isUrdu = profile.language === 'Urdu';
  const userId = profile.userId || 1;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const loadData = useCallback(async () => {
    try {
      const typeFilter = activeTab === 'All' ? 'all' : (
        activeTab === 'Consultations' ? 'consultation' : (
          activeTab === 'Prescriptions' ? 'prescription' : 'announcement'
        )
      );

      const result = await fetchNotifications(userId, typeFilter);
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (e) {
      console.warn('Error loading notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time socket listener
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join_user', userId);

    socket.on('new_notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    socket.on('notification_unread_count', (data) => {
      if (typeof data?.count === 'number') {
        setUnreadCount(data.count);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCardPress = async (item) => {
    if (!item.is_read) {
      await markNotificationAsRead(item.id);
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    if (item.data) {
      handleNotificationPress(item.data);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    const target = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (target && !target.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      isUrdu ? 'تمام نوٹیفکیشن حذف کریں' : 'Clear All Notifications',
      isUrdu ? 'کیا آپ واقعی تمام نوٹیفکیشن حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to remove all notifications?',
      [
        { text: isUrdu ? 'منسوخ' : 'Cancel', style: 'cancel' },
        {
          text: isUrdu ? 'حذف کریں' : 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllNotifications(userId);
            setNotifications([]);
            setUnreadCount(0);
          }
        }
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'consultation':
        return { name: 'calendar', color: '#10B981', bg: isDark ? '#064E3B' : '#D1FAE5' };
      case 'prescription':
        return { name: 'file-text', color: '#3B82F6', bg: isDark ? '#1E3A8A' : '#DBEAFE' };
      case 'chat':
        return { name: 'message-circle', color: '#059669', bg: isDark ? '#065F46' : '#DCFCE7' };
      case 'announcement':
        return { name: 'bell', color: '#F59E0B', bg: isDark ? '#78350F' : '#FEF3C7' };
      default:
        return { name: 'info', color: '#6366F1', bg: isDark ? '#312E81' : '#E0E7FF' };
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffMin < 1) return isUrdu ? 'ابھی' : 'Just now';
      if (diffMin < 60) return `${diffMin}m ${isUrdu ? 'پہلے' : 'ago'}`;
      if (diffHour < 24) return `${diffHour}h ${isUrdu ? 'پہلے' : 'ago'}`;
      if (diffDay < 7) return `${diffDay}d ${isUrdu ? 'پہلے' : 'ago'}`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const renderNotificationCard = ({ item }) => {
    const iconConfig = getNotificationIcon(item.type);
    const title = isUrdu ? (item.title_ur || item.title_en) : (item.title_en || item.title_ur);
    const message = isUrdu ? (item.message_ur || item.message_en) : (item.message_en || item.message_ur);

    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: iconConfig.bg }]}>
            <Feather name={iconConfig.name} size={18} color={iconConfig.color} />
          </View>

          <View style={styles.cardMeta}>
            <Text style={[styles.cardTitle, isUrdu && { fontFamily: fonts.urduBold, textAlign: 'right' }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.cardTime, isUrdu && { textAlign: 'right' }]}>
              {formatTime(item.created_at)}
            </Text>
          </View>

          {!item.is_read && <View style={styles.unreadDot} />}
        </View>

        <Text style={[styles.cardMessage, isUrdu && { fontFamily: fonts.urduRegular, textAlign: 'right' }]}>
          {message}
        </Text>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleCardPress(item)}
          >
            <Text style={[styles.actionBtnText, isUrdu && { fontFamily: fonts.urduBold }]}>
              {item.type === 'chat'
                ? (isUrdu ? 'چیٹ کھولیں' : 'Open Chat')
                : item.type === 'prescription'
                ? (isUrdu ? 'نسخہ دیکھیں' : 'View Prescription')
                : (isUrdu ? 'تفصیلات دیکھیں' : 'View Details')}
            </Text>
            <Feather name="arrow-right" size={14} color={isDark ? '#34D399' : '#059669'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={16} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const tabs = [
    { key: 'All', labelEn: 'All', labelUr: 'تمام' },
    { key: 'Consultations', labelEn: 'Consultations', labelUr: 'مشاورت' },
    { key: 'Prescriptions', labelEn: 'Prescriptions', labelUr: 'نسخے' },
    { key: 'Alerts', labelEn: 'Alerts', labelUr: 'انتباہات' }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? '#0F172A' : '#059669'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, isUrdu && { fontFamily: fonts.urduBold }]}>
              {isUrdu ? 'نوٹیفکیشن سنٹر' : 'Notification Center'}
            </Text>
            <Text style={[styles.headerSubtitle, isUrdu && { fontFamily: fonts.urduRegular }]}>
              {isUrdu ? 'مشاورت، نسخے اور تازہ ترین پیغامات' : 'Consultations, prescriptions & alerts'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleClearAll}
            disabled={notifications.length === 0}
          >
            <Feather name="trash-2" size={18} color={notifications.length === 0 ? 'rgba(255,255,255,0.4)' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions Bar */}
        <View style={styles.headerActionsRow}>
          <View style={styles.badgeInfo}>
            <Feather name="bell" size={16} color="#FFFFFF" />
            <Text style={styles.badgeCountText}>
              {unreadCount} {isUrdu ? 'نئے نوٹیفکیشن' : 'unread'}
            </Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleMarkAllRead}>
              <Text style={[styles.quickActionText, isUrdu && { fontFamily: fonts.urduBold }]}>
                {isUrdu ? 'سب پڑھے ہوئے نشان زد کریں' : 'Mark all read'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.activeTabText,
                  isUrdu && { fontFamily: isActive ? fonts.urduBold : fonts.urduRegular }
                ]}
              >
                {isUrdu ? tab.labelUr : tab.labelEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={isDark ? '#34D399' : '#059669'} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotificationCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#059669']}
              tintColor={isDark ? '#34D399' : '#059669'}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="bell-off" size={36} color={isDark ? '#64748B' : '#94A3B8'} />
              </View>
              <Text style={[styles.emptyTitle, isUrdu && { fontFamily: fonts.urduBold }]}>
                {isUrdu ? 'کوئی نیا نوٹیفکیشن نہیں' : 'No Notifications'}
              </Text>
              <Text style={[styles.emptySubtitle, isUrdu && { fontFamily: fonts.urduRegular }]}>
                {isUrdu
                  ? 'جب آپ کے ڈاکٹر یا مشاورت کے حوالے سے کوئی اپ ڈیٹ ہوگی تو آپ کو یہاں مطلع کیا جائے گا۔'
                  : 'You will receive updates here when veterinarians respond or prescriptions are issued.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
