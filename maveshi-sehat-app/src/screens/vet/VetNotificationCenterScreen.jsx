import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetNotificationCenterScreenStyles';

const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    type: 'alert',
    title: 'High Heat Stress Alert',
    message: 'THI Index has crossed 80 in your district today. Ensure shaded housing and abundant fresh drinking water for livestock.',
    time: '25m ago',
    actionText: 'View Weather',
    targetScreen: 'HeatAlert',
    isRead: false,
    role: 'all',
  },
  {
    id: '2',
    type: 'consultation',
    title: 'Urgent Consultation Request',
    message: 'Muhammad Ahmad submitted a case for Cow #04 with suspected Foot and Mouth symptoms.',
    time: '1h ago',
    actionText: 'Open Case',
    targetScreen: 'VetCases',
    isRead: false,
    role: 'vet',
  },
  {
    id: '3',
    type: 'consultation',
    title: 'Consultation Approved',
    message: 'Dr. Rahim Malik reviewed and approved your online case consultation.',
    time: '2h ago',
    actionText: 'View Chat',
    targetScreen: 'MyConsultations',
    isRead: false,
    role: 'farmer',
  },
  {
    id: '4',
    type: 'prescription',
    title: 'AI Diagnostic Scan Complete',
    message: 'ResNet50 model completed analysis for Buffalo #12 scan: 94% confidence Healthy (Low Risk).',
    time: '4h ago',
    actionText: 'View Scan',
    targetScreen: 'HealthRecords',
    isRead: true,
    role: 'all',
  },
  {
    id: '5',
    type: 'appointment',
    title: 'Vaccination Due Soon',
    message: 'Scheduled FMD & Hemorrhagic Septicemia (HS) booster due in 3 days for Cattle Herd #1.',
    time: 'Yesterday',
    actionText: 'Check Schedule',
    targetScreen: 'Vaccination',
    isRead: true,
    role: 'all',
  },
  {
    id: '6',
    type: 'prescription',
    title: 'Prescription Issued',
    message: 'Prescription Rx-7821 for Oxytetracycline & Meloxicam has been issued.',
    time: '2d ago',
    actionText: 'View Rx',
    targetScreen: 'VetPrescriptions',
    isRead: true,
    role: 'vet',
  },
];

export default function VetNotificationCenterScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const profile = getProfile();
  const isVet = profile.role === 'vet' || profile.role === 'veterinarian';
  
  const [notifications, setNotifications] = useState(() => {
    return INITIAL_NOTIFICATIONS.filter(n => n.role === 'all' || (isVet ? n.role === 'vet' : n.role === 'farmer'));
  });
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Unread', 'Alerts', 'Consultations', 'Schedule'];

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.isRead;
    if (activeTab === 'Alerts') return n.type === 'alert';
    if (activeTab === 'Consultations') return n.type === 'consultation';
    if (activeTab === 'Schedule') return n.type === 'appointment' || n.type === 'prescription';
    return true;
  });

  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const alertCount = notifications.filter(n => n.type === 'alert').length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    Alert.alert(
      t('Clear All Notifications') || 'Clear All Notifications',
      t('Are you sure you want to dismiss all notifications?') || 'Are you sure you want to dismiss all notifications?',
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
        console.log('Navigation target not found:', item.targetScreen);
      }
    }
  };

  const getIconConfig = (type) => {
    switch (type) {
      case 'alert':
        return {
          icon: 'alert-triangle',
          color: '#EF4444',
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
          badgeText: 'Alert',
        };
      case 'consultation':
        return {
          icon: 'message-square',
          color: colors.primary,
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
          badgeText: 'Consultation',
        };
      case 'prescription':
        return {
          icon: 'file-text',
          color: '#F59E0B',
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
          badgeText: 'Prescription',
        };
      case 'appointment':
      default:
        return {
          icon: 'calendar',
          color: '#3B82F6',
          bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
          badgeText: 'Schedule',
        };
    }
  };

  const renderNotificationCard = ({ item }) => {
    const config = getIconConfig(item.type);

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleToggleRead(item.id)}
        activeOpacity={0.8}
      >
        {!item.isRead && <View style={styles.unreadDot} />}
        
        <View style={styles.cardTopRow}>
          <View style={[styles.iconAvatar, { backgroundColor: config.bg }]}>
            <Feather name={config.icon} size={20} color={config.color} />
          </View>
          
          <View style={styles.cardHeader}>
            <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
              {t(item.title)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <View style={[styles.typeBadge, { borderColor: config.color, backgroundColor: config.bg }]}>
                <Text style={[styles.typeBadgeText, { color: config.color }]}>
                  {t(config.badgeText)}
                </Text>
              </View>
              <Text style={[styles.timeText, { marginLeft: 8 }]}>{item.time}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleDismiss(item.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.notificationMessage}>{t(item.message)}</Text>
        
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
          <TouchableOpacity style={styles.settingsBtn} onPress={handleMarkAllRead}>
            <Feather name="check-circle" size={22} color="#FFF" />
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
            <Text style={[styles.statValue, { color: colors.primary }]}>{alertCount}</Text>
            <Text style={styles.statLabel}>{t('Alerts')}</Text>
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
          <TouchableOpacity style={styles.headerActionBtn} onPress={handleMarkAllRead}>
            <Feather name="check" size={14} color={colors.primary} />
            <Text style={[styles.headerActionText, { color: colors.primary }]}>{t('Mark all read')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerActionBtn, { marginLeft: 16 }]} onPress={handleClearAll}>
            <Feather name="trash-2" size={14} color="#EF4444" />
            <Text style={[styles.headerActionText, { color: '#EF4444' }]}>{t('Clear all')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        style={{ flex: 1, backgroundColor: colors.background }}
        data={filteredNotifications}
        renderItem={renderNotificationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-sleep-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>{t('No notifications in this category.')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
