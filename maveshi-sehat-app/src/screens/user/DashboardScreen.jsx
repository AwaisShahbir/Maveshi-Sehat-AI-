import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Alert, Platform, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { getRecords, subscribe, loadRecords } from '../../utils/recordsStore';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t, useTranslation } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import fonts from '../../styles/fonts';
import { getStyles } from '../../styles/DashboardScreenStyles';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isUrdu } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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
      time: rec.timeAgo === 'Just now' ? t('Just now') : rec.timeAgo,
      percentage: rec.confidence.replace('%', ''),
      severity: rec.status === 'Active' ? t('Active') : (rec.status === 'Under Treatment' ? t('Under Treatment') : t('Healthy')),
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
      <StatusBar barStyle="light-content" backgroundColor={isDark ? '#0B1120' : '#059669'} />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        
        <LinearGradient 
          colors={isDark ? ['#0B1120', '#1E293B'] : ['#059669', '#10B981']} 
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{t('Assalam-o-Alaikum')}</Text>
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
              <Text style={styles.statLabel}>{t('Livestock')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.aiScans}</Text>
              <Text style={styles.statLabel}>{t('AI Scans')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.healthy}%</Text>
              <Text style={styles.statLabel}>{t('Healthy')}</Text>
            </View>
          </View>
        </LinearGradient>

        
        <View style={[styles.cardContainer, styles.overlapCard]}>
          <Text style={styles.sectionTitle}>{t('Quick Actions')}</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('AiScan', { userName, userId })}>
              <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                <MaterialCommunityIcons name="line-scan" size={28} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>{t('AI Scan')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Vaccination')}>
              <View style={[styles.iconBox, { backgroundColor: colors.accentAmberLight }]}>
                <MaterialCommunityIcons name="needle" size={28} color={colors.accentAmber} />
              </View>
              <Text style={styles.actionText}>{t('Vaccination')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('VeterinariansList', { userName, userId })}>
              <View style={[styles.iconBox, { backgroundColor: colors.secondaryLight }]}>
                <Feather name="users" size={26} color={colors.secondary} />
              </View>
              <Text style={styles.actionText}>{t('Veterinarians')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MyConsultations')}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F5F3FF' }]}>
                <Feather name="calendar" size={26} color={colors.accentPurple} />
              </View>
              <Text style={styles.actionText}>{t('Consultations')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('HeatAlert', { userName, userId })}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED' }]}>
                <Feather name="thermometer" size={28} color="#EA580C" />
              </View>
              <Text style={styles.actionText}>{t('Heat Alert')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Marketplace', { userName, userId })}>
              <View style={[styles.iconBox, { backgroundColor: colors.accentTealLight }]}>
                <Feather name="shopping-bag" size={26} color={colors.accentTeal} />
              </View>
              <Text style={styles.actionText}>{t('Marketplace')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sehat Assistant AI Chatbot Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
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

        
        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('Recent AI Scans')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HealthRecords', { userName, userId })}>
              <Text style={styles.viewAll}>{t('View All')}</Text>
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
              <Text style={styles.emptyText}>{t('No recent scans found')}</Text>
            </View>
          )}
        </View>

        
        <View style={[styles.cardContainer, { backgroundColor: isDark ? '#78350F' : '#F59E0B', borderColor: isDark ? '#B45309' : '#FBBF24', marginBottom: 100, elevation: 3 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', padding: 10, borderRadius: 14, marginRight: 12 }}>
              <Feather name="trending-up" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 4 }}>{t('Heat Stress Warning')}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.95)', marginBottom: 12, lineHeight: 18 }}>
                THI Index: 78 - Moderate heat stress expected today
              </Text>
              <TouchableOpacity 
                style={{ backgroundColor: 'rgba(255,255,255,0.28)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 }}
                onPress={() => navigation.navigate('HeatAlert', { userName, userId })}
              >
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>{t('View Details')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Feather name="home" size={24} color={colors.navActive} />
          <Text style={[styles.navText, { color: colors.navActive, fontWeight: '700' }, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan', { userName, userId })}>
          <MaterialCommunityIcons name="line-scan" size={24} color={colors.navInactive} />
          <Text style={[styles.navText, { color: colors.navInactive }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('AI Scan')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords', { userName, userId })}>
          <Feather name="file-text" size={24} color={colors.navInactive} />
          <Text style={[styles.navText, { color: colors.navInactive }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Records')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
          <Feather name="message-square" size={24} color={colors.navInactive} />
          <Text style={[styles.navText, { color: colors.navInactive }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Forum')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile', { userName, userId })}>
          <Feather name="user" size={24} color={colors.navInactive} />
          <Text style={[styles.navText, { color: colors.navInactive }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Profile')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
