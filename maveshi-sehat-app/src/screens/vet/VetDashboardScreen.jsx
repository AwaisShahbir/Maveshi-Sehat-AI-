import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Alert, Switch, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';

export default function VetDashboardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [profile, setProfile] = useState(getProfile());
  const [userName, setUserName] = useState(profile.userName || params.userName || 'Vet');
  const userId = profile.userId || params.userId || 1;

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
              <Text style={styles.reviewBtnText}>{t('Review Case', 'کیس دیکھیں')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerBg}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleComingSoon} style={{ zIndex: 1 }}>
              <Feather name="menu" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Dashboard</Text>
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
            <Text style={styles.statLabel}>{t('Cases', 'کیسز')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Feather name="clock" size={24} color="#F5B041" />
            </View>
            <Text style={[styles.statValue, { color: '#F5B041' }]}>{loading ? '-' : stats.pending}</Text>
            <Text style={styles.statLabel}>{t('Pending', 'زیر التواء')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Feather name="check-circle" size={24} color="#58D66D" />
            </View>
            <Text style={styles.statValue}>{loading ? '-' : stats.resolved}</Text>
            <Text style={styles.statLabel}>{t('Resolved', 'حل شدہ')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Feather name="star" size={24} color="#F5B041" />
            </View>
            <Text style={[styles.statValue, { color: '#F5B041' }]}>{stats.rating}</Text>
            <Text style={styles.statLabel}>{t('Rating', 'درجہ بندی')}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('New Cases', 'نئے کیسز')}</Text>
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
          <Text style={styles.sectionTitle}>{t('Quick Actions', 'فوری اعمال')}</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VetCases')}>
            <View style={[styles.actionIconBox, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="clipboard" size={28} color="#4CB85C" />
            </View>
            <Text style={styles.actionTitle}>All Cases</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VetConsultations', { userName, userId })}>
            <View style={[styles.actionIconBox, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="message-square" size={28} color="#4CB85C" />
            </View>
            <Text style={styles.actionTitle}>Consultations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VetPrescriptions', { userName, userId })}>
            <View style={[styles.actionIconBox, { backgroundColor: '#FFF5E5' }]}>
              <Feather name="file-text" size={28} color="#F5B041" />
            </View>
            <Text style={styles.actionTitle}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VetHealthRecords')}>
            <View style={[styles.actionIconBox, { backgroundColor: '#F0E6FF' }]}>
              <Feather name="activity" size={28} color="#9B51E0" />
            </View>
            <Text style={styles.actionTitle}>Health Records</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MaterialCommunityIcons name="home-variant" size={26} color="#58D66D" />
          <Text style={[styles.navText, { color: '#58D66D' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetCases')}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={26} color="#999" />
          <Text style={styles.navText}>Cases</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetConsultations', { userName, userId })}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color="#999" />
          <Text style={styles.navText}>Consult</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetHealthRecords')}>
          <MaterialCommunityIcons name="pulse" size={26} color="#999" />
          <Text style={styles.navText}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetProfile')}>
          <View style={styles.navProfile}>
            <Text style={styles.navProfileText}>DR</Text>
          </View>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  headerBg: { backgroundColor: '#58D66D', paddingBottom: 50 }, 
  headerTop: { backgroundColor: '#58D66D', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notificationBtn: { marginRight: 15, position: 'relative' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#F5B041', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#58D66D' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { color: '#58D66D', fontWeight: 'bold', fontSize: 12 },
  welcomeCard: { backgroundColor: '#6CE581', marginHorizontal: 20, marginTop: -15, borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeLeft: { flex: 1 },
  welcomeTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  welcomeUrdu: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 },
  availableToggle: { alignItems: 'flex-end' },
  availableText: { color: '#FFF', fontSize: 12, marginBottom: 5 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 15, marginTop: -30, justifyContent: 'space-between' },
  statCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, flex: 1, marginHorizontal: 5, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, alignItems: 'center' },
  statIconRow: { marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#58D66D' },
  statLabel: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  viewAllBtn: { fontSize: 14, color: '#58D66D', fontWeight: '600' },
  casesContainer: { paddingHorizontal: 20 },
  caseCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#A3E6B2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  farmerName: { fontSize: 16, fontWeight: '700', color: '#333' },
  farmerNameUrdu: { fontSize: 12, color: '#888', marginTop: 2 },
  diseaseText: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 4 },
  diseaseUrduText: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 12 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  confidenceSection: { marginBottom: 12 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
  confidenceValue: { width: 35, fontSize: 12, fontWeight: 'bold', color: '#FF3B30' },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#EEE', borderRadius: 3, overflow: 'hidden', marginLeft: 8 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  cardFooterBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 12, color: '#888' },
  reviewBtn: { borderWidth: 1, borderColor: '#58D66D', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16 },
  reviewBtnText: { color: '#58D66D', fontSize: 12, fontWeight: '600' },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between', paddingBottom: 20 },
  actionCard: { backgroundColor: '#FFF', width: '47%', borderRadius: 16, padding: 20, marginBottom: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  actionIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#333', textAlign: 'center' },
  actionSub: { fontSize: 12, color: '#888', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: '#888', fontSize: 14 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 20, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEE', elevation: 10 },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#999', marginTop: 4, fontWeight: '500' },
  navProfile: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  navProfileText: { fontSize: 10, fontWeight: 'bold', color: '#888' }
});
