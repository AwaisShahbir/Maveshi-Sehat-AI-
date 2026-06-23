import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';
import { subscribeProfile } from '../../utils/profileStore';

export default function VetConsultationsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.user?.id || params.userId || 1;
  const userName = params.userName || 'Dr. Rahim';

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribeProfile(() => forceUpdate(n => n + 1));
    return () => unsubscribe();
  }, []);

  const fetchConsultations = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const url = `${baseUrl}/api/consultations/vet/${userId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch consultations');
      }
      const data = await response.json();
      setConsultations(data.consultations || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/consultations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) fetchConsultations();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const openChat = async (item) => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: item.farmer_id,
          farmerName: item.farmer_name,
          vetId: userId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      navigation.navigate('Chat', {
        conversationId: data.id,
        partnerName: item.farmer_name,
        partnerRole: 'farmer',
        userName: userName,
        userRole: 'vet',
        vetId: userId,
        initialRecord: item.ai_record_data ? (typeof item.ai_record_data === 'string' ? JSON.parse(item.ai_record_data) : item.ai_record_data) : null
      });
    } catch (error) {
      console.error('Error opening chat', error);
    }
  };

  const handleAction = async (item) => {
    if (item.status === 'pending') {
      await handleStatusUpdate(item.id, 'approved');
      const updatedItem = { ...item, status: 'approved' };
      openChat(updatedItem);
    } else {
      openChat(item);
    }
  };

  const tabs = ['All', 'Pending', 'Active', 'Resolved'];

  const filteredConsultations = consultations.filter(item => {
    const isPending = item.status === 'pending';
    const isActive = item.status === 'approved';
    const isResolved = item.status === 'resolved';

    const matchesTab = 
      activeTab === 'All' ? true : 
      activeTab === 'Pending' ? isPending : 
      activeTab === 'Active' ? isActive : 
      activeTab === 'Resolved' ? isResolved : true;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.farmer_name?.toLowerCase().includes(searchLower) || item.reason?.toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  const getStats = () => {
    return {
      pending: consultations.filter(c => c.status === 'pending').length,
      active: consultations.filter(c => c.status === 'approved').length,
      resolved: consultations.filter(c => c.status === 'resolved').length,
    };
  };
  const stats = getStats();

  const renderConversationCard = ({ item }) => {
    const timeText = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const isPending = item.status === 'pending';
    const isActive = item.status === 'approved';
    const isResolved = item.status === 'resolved';

    const statusColor = isPending ? '#FFB020' : isActive ? '#58D66D' : '#888';
    
    const aiData = item.ai_record_data ? (typeof item.ai_record_data === 'string' ? JSON.parse(item.ai_record_data) : item.ai_record_data) : null;
    const animalInfo = aiData ? `${aiData.animalType || 'Animal'}` : 'Consultation';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.farmer_name ? item.farmer_name.trim().charAt(0).toUpperCase() : 'F'}</Text>
              {isPending && <View style={styles.avatarBadge}><Text style={styles.avatarBadgeText}>1</Text></View>}
            </View>
            <View>
              <Text style={styles.farmerName}>{item.farmer_name}</Text>
                          </View>
          </View>
          <Text style={styles.timeText}>{timeText}</Text>
        </View>

        <View style={styles.animalInfoRow}>
          <MaterialCommunityIcons name="cow" size={16} color="#58D66D" style={{ marginRight: 6 }} />
          <Text style={styles.animalInfoText}>{animalInfo}</Text>
        </View>

        <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.statusRow}>
            <Feather name="clock" size={12} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isPending ? 'Pending' : isActive ? 'Active' : 'Resolved'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleAction(item)}
          >
            <Text style={styles.actionBtnText}>
              {isPending ? 'Start Consultation →' : isActive ? 'Continue →' : 'View →'}
            </Text>
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
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Consultations</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Feather name="filter" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search owner or issue..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'All' ? t('All', 'سب') : tab === 'Pending' ? t('Pending', 'زیر التواء') : tab === 'Active' ? t('Active', 'فعال') : t('Resolved', 'حل شدہ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#FFB020' }]}>{loading ? '-' : stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#58D66D' }]}>{loading ? '-' : stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#888' }]}>{loading ? '-' : stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#58D66D" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredConsultations}
          renderItem={renderConversationCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="message-text-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No consultations found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { backgroundColor: '#58D66D', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 4 },
  titleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  filterBtn: { padding: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchIcon: { marginRight: 10, color: '#FFF' },
  searchInput: { flex: 1, fontSize: 15, color: '#FFF' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 10, justifyContent: 'space-between' },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  tabBtnActive: { backgroundColor: '#58D66D' },
  tabText: { color: '#888', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#FFF' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#FFF', paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#58D66D', justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  avatarBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF3B30', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  avatarBadgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  farmerName: { fontSize: 16, fontWeight: '700', color: '#333' },
  farmerNameUrdu: { fontSize: 12, color: '#888', marginTop: 2 },
  timeText: { fontSize: 12, color: '#888' },
  animalInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  animalInfoText: { fontSize: 13, color: '#555', fontWeight: '500' },
  reasonText: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { color: '#58D66D', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#888' }
});
