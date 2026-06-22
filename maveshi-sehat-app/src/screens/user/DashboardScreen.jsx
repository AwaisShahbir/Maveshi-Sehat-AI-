import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Alert, Platform, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { getRecords, subscribe, loadRecords } from '../../utils/recordsStore';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  
  const [profile, setProfile] = useState(getProfile());
  const userName = profile.userName || params.userName || 'Muhammad Ahmed';
  const userId = params.userId || null;
  const [stats, setStats] = useState({
    livestock: 0,
    aiScans: 0,
    healthy: 100
  });

  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const updateStats = (currentRecords) => {
    const totalScans = currentRecords.length;
    
    
    const uniqueAnimals = new Set(currentRecords.map(r => r.animalId));
    const livestockCount = uniqueAnimals.size;
    
    
    const healthyRecords = currentRecords.filter(r => r.status === 'Healthy' || r.status === 'Recovered');
    const healthyPercentage = totalScans > 0 
      ? Math.round((healthyRecords.length / totalScans) * 100) 
      : 100; 
      
    setStats({
      livestock: livestockCount,
      aiScans: totalScans,
      healthy: healthyPercentage
    });

    
    const recent = currentRecords.slice(0, 3).map(rec => ({
      id: rec.id,
      bg: rec.bg,
      icon: rec.icon,
      color: rec.color,
      title: `${rec.animalId} - ${t(rec.disease, rec.diseaseUrdu)}`,
      time: rec.timeAgo === 'Just now' ? t('Just now', 'ابھی ابھی') : rec.timeAgo,
      percentage: rec.confidence.replace('%', ''),
      severity: rec.status === 'Active' ? t('Active', 'سرگرم') : (rec.status === 'Under Treatment' ? t('Under Treatment', 'زیر علاج') : t('Healthy', 'صحت مند')),
      rawRecord: rec
    }));
    setRecentScans(recent);
    setLoading(false);
  };

  useEffect(() => {
    
    loadRecords(userName).then(loadedRecords => {
      updateStats(loadedRecords);
    }).catch(err => {
      console.log('Error loading initial stats:', err);
      updateStats(getRecords());
    });

    
    const unsubscribeRecords = subscribe((updatedRecords) => {
      updateStats(updatedRecords);
    });

    
    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
      loadRecords(updatedProfile.userName).then(loadedRecords => {
        updateStats(loadedRecords);
      }).catch(err => console.log('Error loading updated profile stats:', err));
    });

    return () => {
      unsubscribeRecords();
      unsubscribeProfile();
    };
  }, [userName]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRecords(userName).then((loaded) => {
      updateStats(loaded);
      setRefreshing(false);
    }).catch(() => {
      updateStats(getRecords());
      setRefreshing(false);
    });
  };

  const handleComingSoon = () => {
    Alert.alert('Coming Soon', 'Stay tuned for it!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#58D66D']} />
        }
      >
        
        <LinearGradient 
          colors={['#58D66D', '#4CB85C']} 
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{t('Assalam-o-Alaikum', 'السلام علیکم')}</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
              <Feather name="bell" size={24} color="#FFF" />
              {notificationsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.livestock}</Text>
              <Text style={styles.statLabel}>{t('Livestock', 'مویشی')}</Text>
              <Text style={styles.statUrdu}>مویشی</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.aiScans}</Text>
              <Text style={styles.statLabel}>{t('AI Scans', 'اسکین')}</Text>
              <Text style={styles.statUrdu}>اسکین</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.healthy}%</Text>
              <Text style={styles.statLabel}>{t('Healthy', 'صحت مند')}</Text>
              <Text style={styles.statUrdu}>صحت مند</Text>
            </View>
          </View>
        </LinearGradient>

        
        <View style={[styles.cardContainer, styles.overlapCard]}>
          <Text style={styles.sectionTitle}>{t('Quick Actions / فوری اعمال', 'فوری اعمال')}</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('AiScan', { userName, userId })}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8EA' }]}>
                <MaterialCommunityIcons name="line-scan" size={28} color="#4CB85C" />
              </View>
              <Text style={styles.actionText}>{t('AI Scan', 'اسکین')}</Text>
              <Text style={styles.actionUrdu}>اسکین</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Vaccination')}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF5E5' }]}>
                <MaterialCommunityIcons name="needle" size={28} color="#F5B041" />
              </View>
              <Text style={styles.actionText}>{t('Vaccination', 'ویکسین')}</Text>
              <Text style={styles.actionUrdu}>ویکسین</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('VeterinariansList', { userName, userId })}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8EA' }]}>
                <Feather name="users" size={26} color="#4CB85C" />
              </View>
              <Text style={styles.actionText}>{t('Veterinarians', 'ڈاکٹرز')}</Text>
              <Text style={styles.actionUrdu}>ڈاکٹر</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MyConsultations')}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8EA' }]}>
                <Feather name="calendar" size={26} color="#4CB85C" />
              </View>
              <Text style={styles.actionText}>{t('Consultations', 'مشاورت')}</Text>
              <Text style={styles.actionUrdu}>مشاورت</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('HeatAlert', { userName, userId })}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF5E5' }]}>
                <Feather name="thermometer" size={28} color="#F5B041" />
              </View>
              <Text style={styles.actionText}>{t('Heat Alert', 'گرمی')}</Text>
              <Text style={styles.actionUrdu}>گرمی</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Marketplace', { userName, userId })}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8EA' }]}>
                <Feather name="shopping-bag" size={26} color="#4CB85C" />
              </View>
              <Text style={styles.actionText}>{t('Marketplace', 'مارکیٹ')}</Text>
              <Text style={styles.actionUrdu}>مارکیٹ</Text>
            </TouchableOpacity>
          </View>
        </View>

        
        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('Recent AI Scans / حالیہ اسکین', 'حالیہ اسکین')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HealthRecords', { userName, userId })}>
              <Text style={styles.viewAll}>{t('View All', 'سب دیکھیں')}</Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CB85C" />
            </View>
          ) : recentScans.length > 0 ? (
            recentScans.map((scan) => (
              <TouchableOpacity key={scan.id} style={styles.scanItem} onPress={() => navigation.navigate('HealthRecords', { userName, userId })}>
                <View style={[styles.scanIconBox, { backgroundColor: scan.bg, borderRadius: 10, borderWidth: 1, borderColor: `${scan.color}30` }]}>
                  {scan.rawRecord && scan.rawRecord.uri ? (
                    <Image source={{ uri: scan.rawRecord.uri }} style={{ width: 40, height: 40, borderRadius: 10 }} />
                  ) : (
                    <Feather name={scan.icon} size={20} color={scan.color} />
                  )}
                </View>
                <View style={styles.scanDetails}>
                  <Text style={styles.scanTitle}>{scan.title.split(' - ')[1] || scan.title}</Text>
                  <Text style={styles.scanTime}>{scan.time}</Text>
                </View>
                <View style={styles.scanStatus}>
                  <Text style={styles.scanPercentage}>{scan.percentage}%</Text>
                  <Text style={[styles.severityText, { color: scan.color }]}>{scan.severity}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="info" size={24} color="#ccc" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>{t('No recent scans found', 'کوئی حالیہ اسکین نہیں ملا')}</Text>
            </View>
          )}
        </View>

        
        <View style={[styles.cardContainer, { backgroundColor: '#F5B041', marginBottom: 100, elevation: 2 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, marginRight: 12 }}>
              <Feather name="trending-up" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 4 }}>Heat Stress Warning</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 12, lineHeight: 18 }}>
                THI Index: 78 - Moderate stress expected today
              </Text>
              <TouchableOpacity 
                style={{ backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 }}
                onPress={() => navigation.navigate('HeatAlert', { userName, userId })}
              >
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Feather name="home" size={24} color="#FFF" />
          <Text style={styles.navText}>{t('Home', 'ہوم')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan', { userName, userId })}>
          <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('AI Scan', 'اسکین')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords', { userName, userId })}>
          <Feather name="file-text" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Records', 'ریکاردز')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
          <Feather name="message-square" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Forum', 'فورم')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile', { userName, userId })}>
          <Feather name="user" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Profile', 'پروفائل')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAF9' },
  scrollContent: { paddingBottom: 20 },
  
  header: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 20,
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  userName: { fontSize: 14, color: '#E8F8EA', marginTop: 4 },
  notificationBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4D4D',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#58D66D'
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 11, color: '#FFF', marginTop: 2, fontWeight: '600' },
  statUrdu: { fontSize: 9, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  cardContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  overlapCard: {
    marginTop: -20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  viewAll: { fontSize: 13, color: '#4CB85C', fontWeight: 'bold', marginBottom: 16 },
  
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  actionItem: {
    alignItems: 'center',
    width: '33.33%',
    marginBottom: 20,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  actionText: { fontSize: 11, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  actionUrdu: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 2 },
  soonText: { fontSize: 9, color: '#FF4D4D', fontWeight: 'bold' },

  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  scanIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanDetails: { flex: 1 },
  scanTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  scanTime: { fontSize: 12, color: '#888', marginTop: 4 },
  scanStatus: { alignItems: 'flex-end' },
  scanPercentage: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  severityText: { fontSize: 11, fontWeight: 'bold' },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  emptyUrduText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CB85C',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#FFF', marginTop: 4, fontWeight: '600' }
});
