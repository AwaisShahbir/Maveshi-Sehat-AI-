import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Alert, Switch, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetDashboardScreenStyles';

export default function VetDashboardScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [profile, setProfile] = useState(getProfile());
  const [userName, setUserName] = useState(profile.userName || params.userName || 'Vet');
  const userId = profile.userId || params.userId || 1;

  useEffect(() => {
    const unsubscribe = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
      setUserName(updatedProfile.userName || params.userName || 'Vet');
    });
    return () => unsubscribe();
  }, []);

  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);

  const [stats, setStats] = useState({
    cases: 0,
    pending: 0,
    resolved: 0,
    rating: 4.9
  });

  const fetchCases = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
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
        rating: 4.9
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
    }, [userId])
  );

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

        <Text style={styles.diseaseText}>{diseaseName}</Text>
        
        <View style={styles.cardFooter}>
          {confidence ? (
            <View style={styles.confidenceSection}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
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
              <Text style={styles.statusText}>{statusLabel}</Text>
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
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('VetProfile')}>
                <Text style={styles.profileAvatarText}>DR</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.welcomeCard}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeTitle}>Good Morning, {userName}</Text>
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
              <Text style={styles.aiBannerTitle}>{t('Ask Sehat Assistant')}</Text>
              <Text style={styles.aiBannerSub}>{t('Instant AI guidance for your animals')}</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('New Cases')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('VetCases')}>
            <Text style={styles.viewAllBtn}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.casesContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#58D66D" />
          ) : cases.length > 0 ? (
            cases.slice(0, 2).map(renderCaseCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No new cases today.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Quick Actions')}</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VetCases')}>
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
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MaterialCommunityIcons name="home-variant" size={26} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary, fontWeight: '700' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetCases')}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Cases</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetConsultations', { userName, userId })}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Consult</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetHealthRecords')}>
          <MaterialCommunityIcons name="pulse" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetProfile')}>
          <View style={styles.navProfile}>
            <Text style={styles.navProfileText}>DR</Text>
          </View>
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
