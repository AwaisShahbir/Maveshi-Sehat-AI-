import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert, 
  Switch, 
  Platform, 
  ActivityIndicator,
  Modal,
  TextInput,
  Image 
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t, useTranslation } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetDashboardScreenStyles';
import io from 'socket.io-client';
import { fetchUnreadCount } from '../../services/notificationService';

export default function VetDashboardScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const { isUrdu } = useTranslation();
  const params = route.params || {};

  const [profile, setProfile] = useState(getProfile());
  const [userName, setUserName] = useState(profile.userName || profile.fullName || params.userName || 'Doctor');
  const userId = profile.userId || params.userId || null;

  useEffect(() => {
    const unsubscribe = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
      setUserName(updatedProfile.userName || updatedProfile.fullName || params.userName || 'Doctor');
    });
    return () => unsubscribe();
  }, []);

  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Financial & Commission States
  const [commissionStatus, setCommissionStatus] = useState(null);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleSenderPhone, setSettleSenderPhone] = useState(profile.phoneNumber || profile.phone || '');
  const [settleTid, setSettleTid] = useState('');
  const [settleReceipt, setSettleReceipt] = useState(null);
  const [submittingSettlement, setSubmittingSettlement] = useState(false);

  const [stats, setStats] = useState({
    cases: 0,
    pending: 0,
    resolved: 0,
    rating: profile.rating || '5.0'
  });

  const fetchCommissionStatus = async () => {
    try {
      if (!userId) return;
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const res = await fetch(`${baseUrl}/api/vet/${userId}/commission-status`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setCommissionStatus(json.data);
          if (json.data.commissionDue > 0) {
            setSettleAmount(String(json.data.commissionDue));
          }
        }
      }
    } catch (e) {
      console.error('Error fetching vet commission status:', e);
    }
  };

  const fetchCases = async () => {
    try {
      if (!userId) {
        setCases([]);
        setLoading(false);
        return;
      }
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const url = `${baseUrl}/api/consultations/vet/${userId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cases');
      const data = await response.json();
      
      const fetchedCases = data.consultations || [];
      setCases(fetchedCases);

      const pendingCount = fetchedCases.filter(c => c.status === 'pending').length;
      const resolvedCount = fetchedCases.filter(c => c.status === 'resolved').length;

      setStats({
        cases: fetchedCases.length,
        pending: pendingCount,
        resolved: resolvedCount,
        rating: profile.rating || '5.0'
      });
    } catch (error) {
      console.error('Error fetching dashboard cases:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCases();
      fetchCommissionStatus();
      if (userId) {
        fetchUnreadCount(userId).then(count => setUnreadNotifsCount(count));
      }
    }, [userId])
  );

  const handlePickSettleReceipt = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 1200,
      maxWidth: 1200,
      quality: 0.8,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert(t('Error'), response.errorMessage || 'Failed to select image');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setSettleReceipt(response.assets[0]);
      }
    });
  };

  const handleSubmitSettlement = async () => {
    const numAmount = parseFloat(settleAmount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert(t('Error'), t('Please enter a valid amount.'));
      return;
    }
    if (!settleSenderPhone || !settleSenderPhone.trim()) {
      Alert.alert(t('Error'), t('Please enter sender phone number.'));
      return;
    }
    if (!settleTid || !settleTid.trim()) {
      Alert.alert(t('Error'), t('Please enter transaction ID (TID).'));
      return;
    }

    try {
      setSubmittingSettlement(true);
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/vet/settlement-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vetId: userId,
          vetName: userName,
          amount: numAmount,
          paymentMethod: 'JazzCash',
          accountNumber: '03054758667',
          senderPhone: settleSenderPhone.trim(),
          transactionId: settleTid.trim(),
          proofBase64: settleReceipt ? settleReceipt.base64 : null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit settlement proof');

      Alert.alert(t('Success'), t('Settlement proof submitted successfully. Admin will review and update your balance.'));
      setSettleModalVisible(false);
      setSettleReceipt(null);
      setSettleTid('');
      fetchCommissionStatus();
    } catch (err) {
      console.error(err);
      Alert.alert(t('Error'), err.message || 'Could not submit settlement proof.');
    } finally {
      setSubmittingSettlement(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    const socketUrl = 'https://maveshi-sehat-api.onrender.com';
    const socket = io(socketUrl);
    socket.emit('join_user', userId);

    socket.on('notification_unread_count', (data) => {
      if (typeof data?.count === 'number') {
        setUnreadNotifsCount(data.count);
      }
    });

    socket.on('new_notification', () => {
      setUnreadNotifsCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const handleComingSoon = () => {
    Alert.alert('Coming Soon', 'Stay tuned for it!');
  };

  const renderCaseCard = (item) => {
    const timeText = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const aiData = item.ai_record_data ? (typeof item.ai_record_data === 'string' ? JSON.parse(item.ai_record_data) : item.ai_record_data) : null;
    const diseaseName = aiData?.disease || item.reason || 'General Consultation';
    const confidence = aiData?.confidence ? parseInt(aiData.confidence) : null;

    const isUrgent = item.reason && item.reason.toLowerCase().includes('urgent');
    const isPending = item.status === 'pending';

    const statusLabel = isUrgent ? 'URGENT' : isPending ? 'PENDING' : item.status.toUpperCase();
    const statusColor = isUrgent ? '#FF3B30' : isPending ? '#FFB020' : '#888';
    const statusBg = isUrgent ? '#FF3B30' : isPending ? '#FFB020' : '#EEE';

    return (
      <View key={item.id} style={[styles.caseCard, { borderLeftColor: statusBg, borderLeftWidth: 4 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.farmer_name ? item.farmer_name.trim().charAt(0).toUpperCase() : 'F'}</Text>
            </View>
            <View>
              <Text style={styles.farmerName}>{item.farmer_name}</Text>
                          </View>
          </View>
        </View>

        <Text style={styles.diseaseText}>{t(diseaseName)}</Text>
        
        <View style={styles.cardFooter}>
          {confidence ? (
            <View style={styles.confidenceSection}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{t(statusLabel)}</Text>
              </View>
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceValue}>{confidence}%</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${confidence}%`, backgroundColor: confidence > 80 ? '#FF3B30' : '#FFB020' }]} />
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: statusColor, alignSelf: 'flex-start', marginBottom: 10 }]}>
              <Text style={styles.statusText}>{t(statusLabel)}</Text>
            </View>
          )}

          <View style={styles.cardFooterBottom}>
            <Text style={styles.timeText}>{timeText}</Text>
            <TouchableOpacity 
              style={styles.reviewBtn}
              onPress={() => navigation.navigate('VetConsultations', { userName, userId })}
            >
              <Text style={styles.reviewBtnText}>{t('Review Case')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.headerBg}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>{t('Dashboard')}</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.notificationBtn} 
                onPress={() => navigation.navigate('VetNotificationCenter')}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Feather name="bell" size={20} color="#FFF" />
                {unreadNotifsCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadNotifsCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('VetProfile')}>
                <Text style={styles.profileAvatarText}>DR</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.welcomeCard}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeTitle}>{t('Good Morning')}, {userName}</Text>
            </View>
            <View style={styles.availableToggle}>
              <Switch
                trackColor={{ false: '#767577', true: '#FFF' }}
                thumbColor={isAvailable ? '#F5B041' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => setIsAvailable(!isAvailable)}
                value={isAvailable}
              />
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#58D66D" />
            </View>
            <Text style={styles.statValue}>{loading ? '-' : stats.cases}</Text>
            <Text style={styles.statLabel}>{t('Cases')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Feather name="clock" size={24} color="#F5B041" />
            </View>
            <Text style={[styles.statValue, { color: '#F5B041' }]}>{loading ? '-' : stats.pending}</Text>
            <Text style={styles.statLabel}>{t('Pending')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Feather name="check-circle" size={24} color="#58D66D" />
            </View>
            <Text style={styles.statValue}>{loading ? '-' : stats.resolved}</Text>
            <Text style={styles.statLabel}>{t('Resolved')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Feather name="star" size={24} color="#F5B041" />
            </View>
            <Text style={[styles.statValue, { color: '#F5B041' }]}>{stats.rating}</Text>
            <Text style={styles.statLabel}>{t('Rating')}</Text>
          </View>
        </View>

        {/* Consultation Earnings & Platform Commission Card */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 14,
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 6,
          elevation: 2
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <MaterialCommunityIcons name="cash-multiple" size={22} color="#059669" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>
                  {t('Consultation Earnings & Commission')}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {t('Consultation Fee: Rs. 300 / Case')}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#166534' }}>
                90% / 10%
              </Text>
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            justifyContent: 'space-between'
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
                {t('Net Earnings (90%)')}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#059669' }}>
                Rs. {Number(commissionStatus?.netVetEarnings || 0).toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>
                ({commissionStatus?.paidConsultations || 0} {t('Paid Cases')})
              </Text>
            </View>

            <View style={{ width: 1, backgroundColor: colors.border }} />

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
                {t('Commission Due (10%)')}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: (commissionStatus?.commissionDue > 0) ? '#D97706' : '#64748B' }}>
                Rs. {Number(commissionStatus?.commissionDue || 0).toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>
                ({t('Admin Commission')})
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={{
              height: 40,
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#86EFAC',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => {
              if (commissionStatus?.commissionDue > 0) {
                setSettleAmount(String(commissionStatus.commissionDue));
              }
              setSettleModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Feather name="send" size={14} color="#059669" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#047857' }}>
              {t('Settle 10% Commission with Admin')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sehat Assistant AI Chatbot Banner (Directly above New Cases) */}
        <TouchableOpacity
          style={[styles.aiBanner, { marginTop: 16, marginBottom: 8 }]}
          onPress={() => navigation.navigate('Chatbot')}
          activeOpacity={0.85}
        >
          <View style={styles.aiBannerLeft}>
            <View style={styles.aiBannerIcon}>
              <MaterialCommunityIcons name="stethoscope" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBannerTitle}>{t('Clinical AI Assistant')}</Text>
              <Text style={styles.aiBannerSub}>{t('Clinical decision support & case references')}</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('New Cases')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('VetCases', { userName, userId })}>
            <Text style={styles.viewAllBtn}>{t('View All →')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.casesContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#58D66D" />
          ) : cases.length > 0 ? (
            cases.slice(0, 2).map(renderCaseCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('No new cases today.')}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Quick Actions')}</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VetCases', { userName, userId })}>
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
              <Feather name="clipboard" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.actionTitle}>{t('All Cases')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VetConsultations', { userName, userId })}>
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
              <Feather name="message-square" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionTitle}>{t('Consultations')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VetPrescriptions', { userName, userId })}>
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB' }]}>
              <Feather name="file-text" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionTitle}>{t('Prescriptions')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VetHealthRecords')}>
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF' }]}>
              <Feather name="activity" size={28} color="#8B5CF6" />
            </View>
            <Text style={styles.actionTitle}>{t('Health Records')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#ECFEFF' }]}>
              <Feather name="users" size={28} color="#06B6D4" />
            </View>
            <Text style={styles.actionTitle}>{t('Community Forum')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Chatbot')}>
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
              <MaterialCommunityIcons name="stethoscope" size={28} color="#6366F1" />
            </View>
            <Text style={styles.actionTitle}>{t('Clinical AI')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MaterialCommunityIcons name="home-variant" size={26} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary, fontWeight: '700' }]}>{t('Home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetCases', { userName, userId })}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Cases')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetConsultations', { userName, userId })}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Consult')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
          <MaterialCommunityIcons name="forum-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Forum')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetProfile')}>
          <View style={styles.navProfile}>
            <Text style={styles.navProfileText}>DR</Text>
          </View>
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Profile')}</Text>
        </TouchableOpacity>
      </View>

      {/* Commission Settlement Modal */}
      <Modal visible={settleModalVisible} transparent={true} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '90%'
          }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                  {t('Commission Settlement')}
                </Text>
                <TouchableOpacity onPress={() => setSettleModalVisible(false)}>
                  <Feather name="x" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14, lineHeight: 18 }}>
                {t('Transfer the 10% admin commission (Rs. 30 per case) to Admin JazzCash (03054758667) and submit transaction proof below.')}
              </Text>

              {/* Admin JazzCash Details Card */}
              <View style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
                marginBottom: 16
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626', textTransform: 'uppercase' }}>
                    JazzCash (Admin)
                  </Text>
                  <View style={{ backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}>10% Platform Fee</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary, letterSpacing: 0.5 }}>
                  03054758667
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Title: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Maveshi Sehat Admin</Text>
                </Text>
              </View>

              {/* Amount Input */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                {t('Amount to Settle (Rs.)')} *
              </Text>
              <TextInput
                style={{
                  backgroundColor: isDark ? colors.cardElevated : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.textPrimary,
                  marginBottom: 12
                }}
                keyboardType="numeric"
                value={settleAmount}
                onChangeText={setSettleAmount}
                placeholder="e.g. 60"
                placeholderTextColor={colors.textSecondary}
              />

              {/* Sender Phone */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                {t('Sender Phone')} *
              </Text>
              <TextInput
                style={{
                  backgroundColor: isDark ? colors.cardElevated : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: colors.textPrimary,
                  marginBottom: 12
                }}
                keyboardType="phone-pad"
                value={settleSenderPhone}
                onChangeText={setSettleSenderPhone}
                placeholder="03XXXXXXXXX"
                placeholderTextColor={colors.textSecondary}
              />

              {/* TID */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                {t('Transaction ID (TID)')} *
              </Text>
              <TextInput
                style={{
                  backgroundColor: isDark ? colors.cardElevated : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: colors.textPrimary,
                  marginBottom: 14
                }}
                value={settleTid}
                onChangeText={setSettleTid}
                placeholder="e.g. 1294829104"
                placeholderTextColor={colors.textSecondary}
              />

              {/* Receipt Picker */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                  borderRadius: 12,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.border,
                  marginBottom: 16
                }}
                onPress={handlePickSettleReceipt}
              >
                <Feather name="camera" size={18} color={settleReceipt ? '#059669' : colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: settleReceipt ? '#059669' : colors.textPrimary }}>
                  {settleReceipt ? t('Receipt Selected') : t('Attach Receipt Screenshot')}
                </Text>
              </TouchableOpacity>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onPress={() => setSettleModalVisible(false)}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 2,
                    height: 46,
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row'
                  }}
                  onPress={handleSubmitSettlement}
                  disabled={submittingSettlement}
                >
                  {submittingSettlement ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Feather name="check" size={16} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>
                        {t('Submit Settlement Proof')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
