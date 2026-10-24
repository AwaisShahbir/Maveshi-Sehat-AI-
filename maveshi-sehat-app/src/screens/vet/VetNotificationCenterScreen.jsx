import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import io from 'socket.io-client';
import { getProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetNotificationCenterScreenStyles';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  handleNotificationPress
} from '../../services/notificationService';

const SOCKET_URL = 'http://10.0.2.2:5000';

export default function VetNotificationCenterScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const profile = getProfile();
  const userId = profile.userId || 1;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const fetchLiveNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchNotifications(userId);
      setNotifications(res.notifications || []);
    } catch (e) {
      console.warn('Error fetching live notifications:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLiveNotifications();
  }, [fetchLiveNotifications]);

  // Realtime Socket listener
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join_user', userId);

    socket.on('new_notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const tabs = ['All', 'Unread', 'Consultations'];

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.is_read;
    if (activeTab === 'Consultations') return n.type === 'consultation';
    return true;
  });

  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      t('Clear All Notifications') || 'Clear All Notifications',
      t('Are you sure you want to clear all notifications?') || 'Are you sure you want to clear all notifications?',
      [
        { text: t('Cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('Clear') || 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllNotifications(userId);
            setNotifications([]);
          }
        }
      ]
    );
  };

  const handleDismiss = (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to remove this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
          }
        }
      ]
    );
  };

  const handleToggleRead = async (item) => {
    if (!item.is_read) {
      await markNotificationAsRead(item.id);
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
    }
  };

  const handleActionPress = async (item) => {
    await handleToggleRead(item);
    if (item.data) {
      handleNotificationPress(item.data);
    } else if (item.type === 'consultation') {
      navigation.navigate('VetCases');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recent';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMin = Math.floor((now - date) / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const renderNotificationCard = ({ item }) => {
    const title = item.title_en || item.title_ur || 'Notification';
    const message = item.message_en || item.message_ur || '';
    const time = formatTime(item.created_at);

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        onPress={() => handleToggleRead(item)}
        activeOpacity={0.8}
      >
        {!item.is_read && <View style={styles.unreadDot} />}
        
        <View style={styles.cardTopRow}>
          <View style={[styles.iconAvatar, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' }]}>
            <Feather
              name={item.type === 'consultation' ? 'calendar' : (item.type === 'chat' ? 'message-circle' : 'bell')}
              size={20}
              color={colors.primary}
            />
          </View>
          
          <View style={styles.cardHeader}>
            <Text style={[styles.notificationTitle, !item.is_read && styles.unreadTitle]}>
              {title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <View style={[styles.typeBadge, { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5' }]}>
                <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                  {t(item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'General')}
                </Text>
              </View>
              <Text style={[styles.timeText, { marginLeft: 8 }]}>{time}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleDismiss(item.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.notificationMessage}>{message}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {!item.is_read ? t('Tap to mark as read') : t('Read')}
          </Text>
          <TouchableOpacity 
            style={styles.footerRight}
            onPress={() => handleActionPress(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              {item.type === 'consultation' ? t('Review Case') : t('View Details')} →
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>{t('Notification Center')}</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={fetchLiveNotifications}>
            <Feather name="refresh-cw" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>{t('Total')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{unreadCount}</Text>
            <Text style={styles.statLabel}>{t('Unread')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalCount - unreadCount}</Text>
            <Text style={styles.statLabel}>{t('Reviewed')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {t(tab)} {tab === 'Unread' && unreadCount > 0 && <View style={styles.unreadTabBadge} />}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {filteredNotifications.length} {t('Notifications')}
        </Text>
        <View style={styles.listHeaderActions}>
          {notifications.length > 0 && (
            <>
              <TouchableOpacity style={styles.headerActionBtn} onPress={handleMarkAllRead}>
                <Feather name="check" size={14} color={colors.primary} />
                <Text style={[styles.headerActionText, { color: colors.primary }]}>{t('Mark all read')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerActionBtn, { marginLeft: 16 }]} onPress={handleClearAll}>
                <Feather name="trash-2" size={14} color="#EF4444" />
                <Text style={[styles.headerActionText, { color: '#EF4444' }]}>{t('Clear all')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: colors.background }}
          data={filteredNotifications}
          renderItem={renderNotificationCard}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="bell-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>{t('No Notifications')}</Text>
              <Text style={styles.emptyText}>
                {t("You're all caught up! New updates, case requests, and livestock health alerts will appear here.")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
