import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Alert, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  // Dynamic States
  const [userName, setUserName] = useState(params.userName || 'Muhammad Ahmed');
  const [stats, setStats] = useState({
    livestock: 0,
    aiScans: 0,
    healthy: 100
  });

  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const fetchDashboardData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/dashboard-stats?ownerName=${encodeURIComponent(userName)}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      if (data.stats) setStats(data.stats);
      if (data.recentScans) setRecentScans(data.recentScans);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userName]);

  const onRefresh = () => {
    fetchDashboardData(true);
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
        {/* Top Green Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Assalam-o-Alaikum</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn} onPress={handleComingSoon}>
              <Feather name="bell" size={24} color="#FFF" />
              {notificationsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.livestock}</Text>
              <Text style={styles.statLabel}>Livestock</Text>
              <Text style={styles.statUrdu}>مویشی</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.aiScans}</Text>
              <Text style={styles.statLabel}>AI Scans</Text>
              <Text style={styles.statUrdu}>اسکین</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.healthy}%</Text>
              <Text style={styles.statLabel}>Healthy</Text>
              <Text style={styles.statUrdu}>صحت مند</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Quick Actions / فوری اعمال</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={handleComingSoon}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8EA' }]}>
                <MaterialCommunityIcons name="line-scan" size={28} color="#4CB85C" />
              </View>
              <Text style={styles.actionText}>AI Scan <Text style={styles.soonText}>(Soon)</Text></Text>
              <Text style={styles.actionUrdu}>اسکین</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleComingSoon}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF5E5' }]}>
                <MaterialCommunityIcons name="syringe" size={28} color="#FFB020" />
              </View>
              <Text style={styles.actionText}>Vaccination <Text style={styles.soonText}>(Soon)</Text></Text>
              <Text style={styles.actionUrdu}>ویکسین</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleComingSoon}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8EA' }]}>
                <MaterialCommunityIcons name="chat-outline" size={28} color="#4CB85C" />
              </View>
              <Text style={styles.actionText}>Vet Chat <Text style={styles.soonText}>(Soon)</Text></Text>
              <Text style={styles.actionUrdu}>ڈاکٹر</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('HeatAlert')}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF5E5' }]}>
                <MaterialCommunityIcons name="thermometer" size={28} color="#FFB020" />
              </View>
              <Text style={styles.actionText}>Heat Alert</Text>
              <Text style={styles.actionUrdu}>گرمی</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleComingSoon}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8EA' }]}>
                <MaterialCommunityIcons name="shopping-outline" size={28} color="#4CB85C" />
              </View>
              <Text style={styles.actionText}>Marketplace <Text style={styles.soonText}>(Soon)</Text></Text>
              <Text style={styles.actionUrdu}>مارکیٹ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent AI Scans Card */}
        <View style={[styles.cardContainer, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent AI Scans / حالیہ اسکین</Text>
            <TouchableOpacity onPress={handleComingSoon}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CB85C" />
            </View>
          ) : recentScans.length > 0 ? (
            recentScans.map((scan) => (
              <TouchableOpacity key={scan.id} style={styles.scanItem} onPress={handleComingSoon}>
                <View style={[styles.scanIconBox, { backgroundColor: scan.bg }]}>
                  <Feather name={scan.icon} size={20} color={scan.color} />
                </View>
                <View style={styles.scanDetails}>
                  <Text style={styles.scanTitle}>{scan.title}</Text>
                  <Text style={styles.scanTime}>{scan.time}</Text>
                </View>
                <View style={styles.scanStatus}>
                  <Text style={styles.scanPercentage}>{scan.percentage}%</Text>
                  <View style={[styles.severityBadge, { backgroundColor: scan.bg }]}>
                    <Text style={[styles.severityText, { color: scan.color }]}>{scan.severity}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="info" size={24} color="#ccc" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>No recent scans found</Text>
              <Text style={styles.emptyUrduText}>کوئی حالیہ اسکین نہیں ملا</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="home" size={24} color="#FFF" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}>
          <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>AI Scan (Soon)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}>
          <Feather name="file-text" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>Records (Soon)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}>
          <Feather name="message-square" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>Forum (Soon)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {
          Alert.alert(
            "Profile Options",
            "Do you want to logout?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", style: "destructive", onPress: () => navigation.replace('Welcome') }
            ]
          )
        }}>
          <Feather name="user" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAF9' },
  scrollContent: { paddingBottom: 20 },
  
  header: {
    backgroundColor: '#58D66D',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 12, color: '#E8F8EA', marginTop: 2 },
  statUrdu: { fontSize: 10, color: '#E8F8EA', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },

  cardContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
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
    gap: 20,
    justifyContent: 'space-between'
  },
  actionItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 10,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center' },
  actionUrdu: { fontSize: 10, color: '#666', textAlign: 'center' },
  soonText: { fontSize: 9, color: '#FF4D4D', fontWeight: 'bold' },

  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  scanPercentage: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: { fontSize: 10, fontWeight: 'bold' },

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
