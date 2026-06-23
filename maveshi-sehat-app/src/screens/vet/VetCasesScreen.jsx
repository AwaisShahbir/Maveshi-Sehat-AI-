import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform, TextInput, Image, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VetCasesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.user?.id || params.userId || 1;

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCases = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const url = `${baseUrl}/api/consultations/vet/${userId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cases');
      const data = await response.json();
      setCases(data.consultations || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const tabs = ['All', 'Pending', 'Urgent', 'Resolved'];

  const filteredCases = cases.filter(item => {
    const matchesTab = 
      activeTab === 'All' ? true : 
      activeTab === 'Pending' ? item.status === 'pending' : 
      activeTab === 'Urgent' ? (item.reason && item.reason.toLowerCase().includes('urgent')) : 
      activeTab === 'Resolved' ? item.status === 'resolved' : true;
      
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.farmer_name?.toLowerCase().includes(searchLower) || item.reason?.toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  const renderCaseCard = ({ item }) => {
    const timeText = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const aiData = item.ai_record_data ? (typeof item.ai_record_data === 'string' ? JSON.parse(item.ai_record_data) : item.ai_record_data) : null;
    const diseaseName = aiData?.disease || item.reason || 'General Consultation';
    const confidence = aiData?.confidence ? parseInt(aiData.confidence) : null;

    const isUrgent = item.reason && item.reason.toLowerCase().includes('urgent');
    const isResolved = item.status === 'resolved';
    const isPending = item.status === 'pending';

    const statusLabel = isResolved ? 'RESOLVED' : isUrgent ? 'URGENT' : isPending ? 'PENDING' : item.status.toUpperCase();
    const statusColor = isResolved ? '#58D66D' : isUrgent ? '#FF3B30' : isPending ? '#FFB020' : '#888';
    const statusBg = isResolved ? '#E8F8EA' : isUrgent ? '#FFEBEB' : isPending ? '#FFF3CD' : '#EEE';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.farmer_name ? item.farmer_name.trim().charAt(0).toUpperCase() : 'F'}</Text>
            </View>
            <View>
              <Text style={styles.farmerName}>{item.farmer_name}</Text>
                          </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.diseaseText}>{diseaseName}</Text>
        
        {confidence && (
          <View style={styles.confidenceSection}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>{t('Confidence', 'اعتماد')}</Text>
              <Text style={styles.confidenceValue}>{confidence}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${confidence}%`, backgroundColor: confidence > 80 ? '#FF3B30' : '#FFB020' }]} />
            </View>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.animalInfoRow}>
            <MaterialCommunityIcons name="cow" size={24} color="#555" />
            <Text style={styles.timeText}>{timeText}</Text>
          </View>
          <TouchableOpacity 
            style={styles.reviewBtn}
            onPress={() => navigation.navigate('VetConsultations', { userName: params.userName, userId })}
          >
            <Text style={styles.reviewBtnText}>Review →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Submitted Cases</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Feather name="filter" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {tabs.map(tab => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                {tab === 'Pending' && <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{t('Pending', 'زیر')}</Text>}
                {tab === 'Urgent' && <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}><View style={styles.dotUrgent}/>{t('Urgent', 'فوری')}</Text>}
                {tab === 'Resolved' && <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}><View style={styles.dotResolved}/> Resolved</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search owner or disease..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Feather name="mic" size={20} color="#888" style={styles.micIcon} />
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#58D66D" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredCases}
          renderItem={renderCaseCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No cases found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  header: { backgroundColor: '#58D66D', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 4 },
  titleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  filterBtn: { padding: 4 },
  tabsContainer: { marginBottom: 15 },
  tabsScroll: { paddingRight: 20 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 10, flexDirection: 'row', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFF' },
  tabText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#58D66D' },
  dotUrgent: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginRight: 6 },
  dotResolved: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#58D66D', marginRight: 6 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 16, height: 48 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  micIcon: { marginLeft: 10 },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#A3E6B2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  farmerName: { fontSize: 16, fontWeight: '700', color: '#333' },
  farmerNameUrdu: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5 },
  diseaseText: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 4 },
  diseaseUrduText: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 16 },
  confidenceSection: { marginBottom: 16 },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confidenceLabel: { fontSize: 12, color: '#666' },
  confidenceValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  progressBarBg: { height: 6, backgroundColor: '#EEE', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  animalInfoRow: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 12, color: '#888', marginLeft: 10 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center' },
  reviewBtnText: { color: '#58D66D', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#888' }
});
