import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Alert, Switch, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VetDashboardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  // Dynamic States
  const [userName, setUserName] = useState(params.userName || 'Dr. Rahim');
  const [isAvailable, setIsAvailable] = useState(true);

  const [stats, setStats] = useState({
    cases: 12,
    pending: 4,
    resolved: 7,
    rating: 4.9
  });

  const [newCases, setNewCases] = useState([
    { 
      id: 1, 
      initials: 'AK', 
      name: 'Ahmad Khan', 
      nameUrdu: 'احمد خان',
      disease: 'Lumpy Skin Disease (LSD)', 
      diseaseUrdu: 'گانٹھ دار جلد کی بیماری',
      confidence: 87, 
      status: 'URGENT', 
      statusUrdu: 'فوری',
      time: '2 hours ago', 
      color: '#FF3B30', 
      bg: '#FFEBEB',
      avatarBg: '#58D66D'
    },
    { 
      id: 2, 
      initials: 'ZA', 
      name: 'Zahid Ali', 
      nameUrdu: 'زاہد علی',
      disease: 'Tick Infestation', 
      diseaseUrdu: 'چیچڑ کا حملہ',
      confidence: 74, 
      status: 'PENDING', 
      statusUrdu: 'زیر التواء',
      time: '5 hours ago', 
      color: '#FFB020', 
      bg: '#FFF5E5',
      avatarBg: '#A3E6B2'
    },
  ]);

  const handleComingSoon = () => {
    Alert.alert('Coming Soon', 'Stay tuned for it!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Green Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleComingSoon} style={{ zIndex: 1 }}>
              <Feather name="menu" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>ڈیش بورڈ</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationBtn} onPress={handleComingSoon}>
                <Feather name="bell" size={20} color="#FFF" />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>4</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileAvatar} onPress={handleComingSoon}>
                <Text style={styles.profileAvatarText}>DR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeTitle}>Good Morning, {userName}</Text>
              <Text style={styles.welcomeUrdu}>السلام علیکم ڈاکٹر</Text>
              <Text style={styles.welcomeSub}>4 new cases today / آج 4 نئے کیس ہیں</Text>
            </View>
            <View style={styles.availableToggle}>
              <Text style={styles.availableText}>دستیاب / Available</Text>
              <Switch
                trackColor={{ false: "#ccc", true: "#FFD700" }}
                thumbColor={"#FFF"}
                ios_backgroundColor="#ccc"
                onValueChange={() => setIsAvailable(!isAvailable)}
                value={isAvailable}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScrollContainer}>
          <View style={styles.statBox}>
            <View style={styles.statTop}>
              <Text style={[styles.statValue, { color: '#58D66D' }]}>{stats.cases}</Text>
              <Feather name="clipboard" size={16} color="#58D66D" />
            </View>
            <Text style={styles.statLabel}>Cases / کیسز</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statTop}>
              <Text style={[styles.statValue, { color: '#FFB020' }]}>{stats.pending}</Text>
              <Feather name="clock" size={16} color="#FFB020" />
            </View>
            <Text style={styles.statLabel}>Pending / زیر التواء</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statTop}>
              <Text style={[styles.statValue, { color: '#4CB85C' }]}>{stats.resolved}</Text>
              <Feather name="check-circle" size={16} color="#4CB85C" />
            </View>
            <Text style={styles.statLabel}>Resolved / حل شدہ</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statTop}>
              <Text style={[styles.statValue, { color: '#FFB020' }]}>{stats.rating}</Text>
              <Feather name="star" size={16} color="#FFB020" />
            </View>
            <Text style={styles.statLabel}>Rating / ریٹنگ</Text>
          </View>
        </ScrollView>

        {/* New Cases List */}
        <View style={styles.casesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Cases / نئے کیسز</Text>
            <TouchableOpacity onPress={handleComingSoon}>
              <Text style={styles.viewAll}>View All <Feather name="arrow-right" size={12} /></Text>
            </TouchableOpacity>
          </View>

          {newCases.map((item) => (
            <View key={item.id} style={[styles.caseCard, { borderLeftColor: item.color }]}>
              <View style={styles.caseHeader}>
                <View style={[styles.caseAvatar, { backgroundColor: item.avatarBg }]}>
                  <Text style={styles.caseAvatarText}>{item.initials}</Text>
                </View>
                <View style={styles.caseUserInfo}>
                  <Text style={styles.caseUserName}>{item.name}</Text>
                  <Text style={styles.caseUserUrdu}>{item.nameUrdu}</Text>
                </View>
              </View>

              <Text style={styles.diseaseName}>{item.disease}</Text>
              <Text style={styles.diseaseUrdu}>{item.diseaseUrdu}</Text>

              <View style={styles.badgesContainer}>
                <View style={[styles.badgeItem, { backgroundColor: item.color }]}>
                  <Text style={styles.badgeItemText}>{item.confidence}%</Text>
                </View>
                <View style={[styles.badgeItem, { backgroundColor: item.color, marginLeft: 8 }]}>
                  <Text style={styles.badgeItemText}>{item.status} / {item.statusUrdu}</Text>
                </View>
              </View>

              <View style={styles.caseFooter}>
                <Text style={styles.timeText}>{item.time}</Text>
                <TouchableOpacity style={styles.reviewBtn} onPress={handleComingSoon}>
                  <Text style={styles.reviewBtnText}>Review Case / کیس دیکھیں</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNavHeader}>
          <Text style={styles.quickActionsTitle}>Quick Actions / فوری اعمال</Text>
        </View>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Feather name="clipboard" size={24} color="#58D66D" />
            <Text style={[styles.navText, { color: '#58D66D' }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}>
            <Feather name="file-text" size={24} color="#A3A3A3" />
            <Text style={styles.navText}>Cases</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetConsultations', { userName, user: params.user })}>
            <Feather name="message-square" size={24} color="#A3A3A3" />
            <Text style={styles.navText}>Consult</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}>
            <MaterialCommunityIcons name="heart-pulse" size={24} color="#A3A3A3" />
            <Text style={styles.navText}>Records</Text>
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
            <View style={styles.navAvatar}>
              <Text style={styles.navAvatarText}>DR</Text>
            </View>
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAF9' },
  scrollContent: { paddingBottom: 120 },
  
  header: {
    backgroundColor: '#58D66D',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: '#E8F8EA' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    position: 'relative',
    marginRight: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#FFD700',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#333', fontSize: 9, fontWeight: 'bold' },
  profileAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#A3E6B2',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  welcomeCard: {
    backgroundColor: '#61E076',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Allows text to wrap nicely
    gap: 12, // Prevents text from colliding with the toggle
  },
  welcomeLeft: {
    flex: 1, // Will wrap long text
  },
  welcomeTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  welcomeUrdu: { color: '#FFF', fontSize: 12, marginBottom: 8 },
  welcomeSub: { color: '#E8F8EA', fontSize: 11 },
  availableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0, // Prevents the toggle pill from getting squished
  },
  availableText: { color: '#FFF', fontSize: 10, marginRight: 4, fontWeight: '600' },

  statsScrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 12,
  },
  statBox: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    width: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },

  casesSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  viewAll: { fontSize: 12, color: '#4CB85C', fontWeight: 'bold' },

  caseCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  caseAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  caseUserInfo: { flex: 1 },
  caseUserName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  caseUserUrdu: { fontSize: 11, color: '#666' },

  diseaseName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  diseaseUrdu: { fontSize: 11, color: '#666', marginBottom: 12 },

  badgesContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badgeItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeItemText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: { fontSize: 11, color: '#999' },
  reviewBtn: {
    borderWidth: 1,
    borderColor: '#4CB85C',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  reviewBtnText: { color: '#4CB85C', fontSize: 11, fontWeight: 'bold' },

  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  bottomNavHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 24, // Extra padding for safe area
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#A3A3A3', marginTop: 4, fontWeight: '600' },
  navAvatar: {
    width: 24,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navAvatarText: { fontSize: 9, fontWeight: 'bold', color: '#666' }
});
