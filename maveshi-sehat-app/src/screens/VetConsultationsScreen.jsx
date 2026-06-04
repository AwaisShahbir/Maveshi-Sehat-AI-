import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VetConsultationsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userName = params.userName || 'Dr. Rahim';

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'resolved'

  const fetchConversations = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const url = `${baseUrl}/api/chat/conversations/vet?vetName=${encodeURIComponent(userName)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [userName]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleSelectConversation = (item) => {
    navigation.navigate('Chat', {
      conversationId: item.id,
      partnerName: item.farmer_name,
      partnerRole: 'farmer',
      userName: userName,
      userRole: 'vet',
      vetId: item.vet_id
    });
  };

  const filteredConversations = conversations.filter(conv => conv.status === activeTab);

  const renderConversationCard = ({ item }) => {
    const timeText = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isResolved = item.status === 'resolved';

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleSelectConversation(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: isResolved ? '#E0E0E0' : '#E8F8EA' }]}>
            <Text style={[styles.avatarText, { color: isResolved ? '#666' : '#58D66D' }]}>
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
                <Feather name="map-pin" size={12} color="#888" />
                <Text style={styles.districtText}>{item.farmer_district || 'N/A'}</Text>
              </View>

              <View style={[
                styles.statusBadge, 
                { backgroundColor: isResolved ? '#F0F0F0' : '#E8F8EA' }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: isResolved ? '#888' : '#58D66D' }
                ]}>
                  {isResolved ? 'Resolved / حل شدہ' : 'Active / جاری'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      {/* Header */}
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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active / جاری ({conversations.filter(c => c.status === 'active').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'resolved' && styles.activeTab]}
          onPress={() => setActiveTab('resolved')}
        >
          <Text style={[styles.tabText, activeTab === 'resolved' && styles.activeTabText]}>
            Resolved / حل شدہ ({conversations.filter(c => c.status === 'resolved').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#58D66D" />
          <Text style={styles.loadingText}>Loading consultations...</Text>
        </View>
      ) : filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
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
            {activeTab === 'active' 
              ? 'کوئی جاری مشورہ نہیں ملا' 
              : 'کوئی حل شدہ مشورہ نہیں ملا'}
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
    paddingVertical: 14,
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
});
