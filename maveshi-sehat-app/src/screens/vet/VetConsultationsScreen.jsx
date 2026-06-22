import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VetConsultationsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.user?.id || params.userId || 1;
  const userName = params.userName || 'Dr. Rahim';

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'

  const fetchConsultations = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://localhost:5000' : 'http://localhost:5000';
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
      const baseUrl = Platform.OS === 'android' ? 'http://localhost:5000' : 'http://localhost:5000';
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

  const handleSelectConversation = async (item) => {
    if (item.status !== 'approved' || item.type !== 'online_chat') return;

    try {
      const baseUrl = Platform.OS === 'android' ? 'http://localhost:5000' : 'http://localhost:5000';
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

  const filteredConsultations = consultations.filter(conv => conv.status === activeTab);

  const renderConversationCard = ({ item }) => {
    const timeText = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isApproved = item.status === 'approved';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: isApproved ? '#E8F8EA' : '#FFF3CD' }]}>
            <Text style={[styles.avatarText, { color: isApproved ? '#58D66D' : '#856404' }]}>
              {item.farmer_name ? item.farmer_name.trim().charAt(0).toUpperCase() : 'F'}
            </Text>
          </View>
          
          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.farmerName}>{item.farmer_name}</Text>
              <Text style={styles.timeText}>{timeText}</Text>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.districtContainer}>
                <Feather name="file-text" size={12} color="#888" />
                <Text style={styles.districtText}>{item.type === 'online_chat' ? 'Online Consult' : 'Physical Appointment'}</Text>
              </View>

              <View style={[
                styles.statusBadge, 
                { backgroundColor: isApproved ? '#E8F8EA' : '#FFF3CD' }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: isApproved ? '#58D66D' : '#856404' }
                ]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        {item.appointment_date && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Date/Time:</Text>
            <Text style={styles.reasonText}>{new Date(item.appointment_date).toLocaleString()}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleStatusUpdate(item.id, 'rejected')}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleStatusUpdate(item.id, 'approved')}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {isApproved && item.type === 'online_chat' && (
          <TouchableOpacity style={styles.chatBtn} onPress={() => handleSelectConversation(item)}>
            <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.chatBtnText}>Open Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Consultations</Text>
          <Text style={styles.headerSubtitle}>مشاورتی گفتگو</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Feather name="refresh-cw" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({consultations.filter(c => c.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
            Approved ({consultations.filter(c => c.status === 'approved').length})
          </Text>
        </TouchableOpacity>
      </View>

      
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#58D66D" />
          <Text style={styles.loadingText}>Loading consultations...</Text>
        </View>
      ) : filteredConsultations.length > 0 ? (
        <FlatList
          data={filteredConsultations}
          renderItem={renderConversationCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chat-question" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No {activeTab} consultations</Text>
          <Text style={styles.emptyUrduText}>
            {activeTab === 'pending' 
              ? 'کوئی زیر التوا درخواست نہیں' 
              : 'کوئی منظور شدہ درخواست نہیں'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh / تازہ کریں</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    backgroundColor: '#58D66D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 14,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 4,
  },
  refreshButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#E8F8EA',
    fontSize: 12,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#58D66D',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F2EC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  farmerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  districtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  districtText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyUrduText: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#E8F8EA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#58D66D',
  },
  retryButtonText: {
    color: '#58D66D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  reasonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  reasonLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#444',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FFEBEB',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  rejectBtnText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#58D66D',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  chatBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#58D66D',
    paddingVertical: 12,
    borderRadius: 8,
  },
  chatBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});
