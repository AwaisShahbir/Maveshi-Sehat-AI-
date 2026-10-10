import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';
import { subscribeProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetConsultationsScreenStyles';

export default function VetConsultationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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
  const normalizeConsultationStatus = (status) => String(status || '').trim().toLowerCase();

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

      let initialRecord = null;
      if (item.ai_record_data) {
        if (typeof item.ai_record_data === 'object') {
          initialRecord = item.ai_record_data;
        } else {
          try {
            initialRecord = JSON.parse(item.ai_record_data);
          } catch (e) {
            initialRecord = null;
          }
        }
      }

      navigation.navigate('Chat', {
        conversationId: data.id,
        partnerName: item.farmer_name,
        partnerRole: 'farmer',
        userName: userName,
        userRole: 'vet',
        vetId: userId,
        initialRecord,
        consultations: item.consultations || [item]
      });
    } catch (error) {
      console.error('Error opening chat', error);
    }
  };

  const handleAction = async (item) => {
    const pendingConsultation = item.consultations.find(
      consultation => normalizeConsultationStatus(consultation.status) === 'pending'
    );
    if (pendingConsultation) {
      await handleStatusUpdate(pendingConsultation.id, 'approved');
      openChat({
        ...item,
        status: 'approved',
        consultations: item.consultations.map(consultation =>
          consultation.id === pendingConsultation.id
            ? { ...consultation, status: 'approved' }
            : consultation
        )
      });
    } else {
      openChat(item);
    }
  };

  const tabs = ['All', 'Pending', 'Active', 'Resolved'];

  const farmerChats = useMemo(() => {
    const grouped = new Map();
    consultations.forEach(consultation => {
      const key = String(consultation.farmer_id);
      const existing = grouped.get(key);
      if (existing) {
        existing.consultations.push(consultation);
        return;
      }
      grouped.set(key, {
        ...consultation,
        consultations: [consultation],
      });
    });

    return Array.from(grouped.values()).map(group => {
      const hasPending = group.consultations.some(
        item => normalizeConsultationStatus(item.status) === 'pending'
      );
      const hasActive = group.consultations.some(
        item => normalizeConsultationStatus(item.status) === 'approved'
      );
      const status = hasPending ? 'pending' : hasActive ? 'approved' : 'resolved';
      const latest = group.consultations[0];
      return {
        ...group,
        ...latest,
        status,
        consultations: group.consultations,
      };
    });
  }, [consultations]);

  const filteredConsultations = farmerChats.filter(item => {
    const normalizedStatus = normalizeConsultationStatus(item.status) === 'completed' ? 'resolved' : normalizeConsultationStatus(item.status);
    const isPending = normalizedStatus === 'pending';
    const isActive = normalizedStatus === 'approved';
    const isResolved = normalizedStatus === 'resolved';

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
      pending: farmerChats.filter(c => normalizeConsultationStatus(c.status) === 'pending').length,
      active: farmerChats.filter(c => normalizeConsultationStatus(c.status) === 'approved').length,
      resolved: farmerChats.filter(c => c.status === 'resolved' || c.status === 'completed').length,
    };
  };
  const stats = getStats();

  const renderConversationCard = ({ item }) => {
    const timeText = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const normalizedStatus = normalizeConsultationStatus(item.status) === 'completed' ? 'resolved' : normalizeConsultationStatus(item.status);
    const isPending = normalizedStatus === 'pending';
    const isActive = normalizedStatus === 'approved';
    const isResolved = normalizedStatus === 'resolved';

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

        <Text style={styles.reasonText} numberOfLines={2}>
          {item.consultations.length > 1 ? `${item.consultations.length} consultations · ` : ''}{item.reason}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.statusRow}>
            <Feather name="clock" size={12} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isPending ? 'Pending' : isActive ? 'Active' : 'Resolved'}
            </Text>
          </View>
          
          {(isPending || isActive) ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleAction(item)}
            >
              <Text style={styles.actionBtnText}>
                {isPending ? 'Start Consultation →' : 'Continue →'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.resolvedAction}>
              <Feather name="lock" size={13} color="#64748B" />
              <Text style={styles.resolvedActionText}>Closed</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />

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
          <Feather name="search" size={20} color="#FFF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search owner or issue..."
            placeholderTextColor="rgba(255,255,255,0.75)"
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
              {tab === 'All' ? t('All') : tab === 'Pending' ? t('Pending') : tab === 'Active' ? t('Active') : t('Resolved')}
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
          <Text style={[styles.statNum, { color: colors.primary }]}>{loading ? '-' : stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#888' }]}>{loading ? '-' : stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: colors.background }}
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
