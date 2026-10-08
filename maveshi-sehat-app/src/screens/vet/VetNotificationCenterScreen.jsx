import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetNotificationCenterScreenStyles';

export default function VetNotificationCenterScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const profile = getProfile();
  const isVet = profile.role === 'vet' || profile.role === 'veterinarian';
  const userId = profile.userId || 1;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const fetchLiveNotifications = async () => {
    try {
      setLoading(true);
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const endpoint = isVet
        ? `${baseUrl}/api/consultations/vet/${userId}`
        : `${baseUrl}/api/consultations/farmer/${userId}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const consultations = data.consultations || [];
        
        // Map actual consultation records into real notifications
        const liveItems = consultations.map((c) => {
          const isPending = c.status === 'pending';
          const isApproved = c.status === 'approved';
          const isResolved = c.status === 'resolved' || c.status === 'completed';
          
          let title = isVet
            ? `Case from ${c.farmer_name || 'Farmer'}`
            : `Consultation with ${c.vet_name || 'Veterinarian'}`;
          let message = c.reason || 'Livestock checkup consultation request';
          let time = c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent';
          
          return {
            id: String(c.id),
            type: 'consultation',
            title,
            message,
            time,
            actionText: isVet ? 'Review Case' : 'View Details',
            targetScreen: isVet ? 'VetCases' : 'MyConsultations',
            isRead: !isPending,
          };
        });
        
        setNotifications(liveItems);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.log('Error fetching live notifications:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
  }, [userId, isVet]);

  const tabs = ['All', 'Unread', 'Consultations'];

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.isRead;
    if (activeTab === 'Consultations') return n.type === 'consultation';
    return true;
  });

  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      t('Clear All Notifications') || 'Clear All Notifications',
      t('Are you sure you want to clear all notifications?') || 'Are you sure you want to clear all notifications?',
      [
        { text: t('Cancel') || 'Cancel', style: 'cancel' },
        { text: t('Clear') || 'Clear', style: 'destructive', onPress: () => setNotifications([]) }
      ]
    );
  };

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleToggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  const handleActionPress = (item) => {
    handleToggleRead(item.id);
    if (item.targetScreen) {
      try {
        navigation.navigate(item.targetScreen);
      } catch (e) {
        console.log('Navigation error:', e);
      }
    }
  };

  const renderNotificationCard = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleToggleRead(item.id)}
        activeOpacity={0.8}
      >
        {!item.isRead && <View style={styles.unreadDot} />}
        
        <View style={styles.cardTopRow}>
          <View style={[styles.iconAvatar, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' }]}>
            <Feather name="message-square" size={20} color={colors.primary} />
          </View>
          
          <View style={styles.cardHeader}>
            <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <View style={[styles.typeBadge, { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5' }]}>
                <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                  {t('Consultation')}
                </Text>
              </View>
              <Text style={[styles.timeText, { marginLeft: 8 }]}>{item.time}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleDismiss(item.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {!item.isRead ? t('Tap to mark as read') : t('Read')}
          </Text>
          <TouchableOpacity 
            style={styles.footerRight}
            onPress={() => handleActionPress(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              {t(item.actionText)} →
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
          keyExtractor={(item) => item.id}
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
