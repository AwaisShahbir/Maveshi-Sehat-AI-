import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform, TextInput, Alert, Image } from 'react-native';
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
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
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
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
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

  const handleDeleteConsultation = (item) => {
    Alert.alert(
      t('Delete Consultation'),
      t('Are you sure you want to delete this consultation case? This action cannot be undone.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const baseUrl = 'https://maveshi-sehat-api.onrender.com';
              const idsToDelete = item.consultations?.map(c => c.id) || [item.id];
              for (const cId of idsToDelete) {
                await fetch(`${baseUrl}/api/consultations/${cId}`, { method: 'DELETE' });
              }
              setConsultations(prev => prev.filter(c => !idsToDelete.includes(c.id)));
              Alert.alert(t('Success'), t('Consultation case deleted.'));
            } catch (err) {
              console.error('Delete consultation error:', err);
              Alert.alert(t('Error'), 'Could not delete consultation case.');
            }
          }
        }
      ]
    );
  };

  const openChat = async (item) => {
    try {
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
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
        consultationId: item.id,
        consultation: item,
        initialRecord,
        consultations: [item]
      });
    } catch (error) {
      console.error('Error opening chat', error);
    }
  };

  const handleApproveAndChat = async (item) => {
    await handleStatusUpdate(item.id, 'approved');
    openChat({ ...item, status: 'approved' });
  };

  const handleDecline = (item) => {
    Alert.alert(
      t('Decline Consultation'),
      t('Are you sure you want to decline this consultation request?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Decline'),
          style: 'destructive',
          onPress: async () => {
            await handleStatusUpdate(item.id, 'rejected');
          }
        }
      ]
    );
  };

  const tabs = ['All', 'Pending', 'Active', 'Resolved'];

  const filteredConsultations = consultations.filter(item => {
    const s = normalizeConsultationStatus(item.status);
    const isPending = s === 'pending';
    const isActive = s === 'approved';
    const isResolved = s === 'resolved' || s === 'completed';

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
      pending: consultations.filter(c => normalizeConsultationStatus(c.status) === 'pending').length,
      active: consultations.filter(c => normalizeConsultationStatus(c.status) === 'approved').length,
      resolved: consultations.filter(c => ['resolved', 'completed'].includes(normalizeConsultationStatus(c.status))).length,
    };
  };
  const stats = getStats();

  const renderConversationCard = ({ item }) => {
    const timeText = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '';

    const s = normalizeConsultationStatus(item.status);
    const isPending = s === 'pending';
    const isActive = s === 'approved';
    const isResolved = s === 'resolved' || s === 'completed';
    const isRejected = s === 'rejected';

    const statusBadgeBg = isActive
      ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#E8F8EA')
      : isRejected
      ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FFEBEB')
      : isPending
      ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF3CD')
      : (isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9');

    const statusBadgeColor = isActive
      ? colors.primary
      : isRejected
      ? '#EF4444'
      : isPending
      ? '#D97706'
      : '#64748B';

    const statusTextDisplay = isPending
      ? 'PENDING'
      : isActive
      ? 'ACTIVE'
      : isRejected
      ? 'DECLINED'
      : 'RESOLVED';

    let aiData = null;
    if (item.ai_record_data) {
      if (typeof item.ai_record_data === 'object') {
        aiData = item.ai_record_data;
      } else {
        try {
          aiData = JSON.parse(item.ai_record_data);
        } catch (e) {
          aiData = null;
        }
      }
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.farmer_name ? item.farmer_name.trim().charAt(0).toUpperCase() : 'F'}</Text>
              {isPending && <View style={styles.avatarBadge}><Text style={styles.avatarBadgeText}>!</Text></View>}
            </View>
            <View>
              <Text style={styles.farmerName}>{item.farmer_name || 'Farmer'}</Text>
              {item.farmer_phone ? (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  {item.farmer_phone}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg, marginRight: 6 }]}>
              <Text style={[styles.statusText, { color: statusBadgeColor, fontWeight: '700' }]}>
                {statusTextDisplay}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteConsultation(item)}
              style={{ padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="trash-2" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Prominent Attached AI Scan Report Box */}
        {aiData && (
          <View style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F0FDF4',
            borderRadius: 14,
            padding: 12,
            marginTop: 8,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: isDark ? colors.border : '#BBF7D0'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="stethoscope" size={16} color="#059669" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>
                  AI Clinical Pathology Scan
                </Text>
              </View>
              {aiData.confidence ? (
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534' }}>
                    {aiData.confidence}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {(aiData.imageUrl || aiData.uri) ? (
                <Image
                  source={{ uri: aiData.imageUrl || aiData.uri }}
                  style={{ width: 52, height: 52, borderRadius: 10, marginRight: 12, backgroundColor: '#E2E8F0' }}
                />
              ) : (
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  backgroundColor: isDark ? colors.cardElevated : '#E2E8F0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <MaterialCommunityIcons name="cow" size={28} color={colors.primary} />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}>
                  Livestock #{aiData.animalId || aiData.id || 'N/A'} {aiData.animalType ? `(${aiData.animalType})` : ''}
                </Text>
                <Text style={{ fontSize: 13, color: '#D97706', fontWeight: '700', marginTop: 2 }}>
                  {aiData.disease || aiData.name || 'AI Analysis'}
                </Text>
                {aiData.breed ? (
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    Breed: {aiData.breed}
                  </Text>
                ) : null}
              </View>
            </View>

            {aiData.description ? (
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
                <Text style={{ fontSize: 12, color: colors.textPrimary, lineHeight: 18 }}>
                  <Text style={{ fontWeight: '700' }}>Clinical Observation: </Text>{aiData.description}
                </Text>
              </View>
            ) : null}

            {aiData.firstAid && (Array.isArray(aiData.firstAid) ? aiData.firstAid.length > 0 : !!aiData.firstAid) ? (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
                  <Text style={{ fontWeight: '700' }}>Rec. First Aid: </Text>
                  {Array.isArray(aiData.firstAid) ? aiData.firstAid.slice(0, 2).join('; ') : aiData.firstAid}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {item.reason ? (
          <Text style={styles.reasonText} numberOfLines={2}>
            <Text style={{ fontWeight: '700' }}>Farmer Note: </Text>{item.reason}
          </Text>
        ) : null}

        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: isDark ? colors.border : '#E2E8F0', paddingTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="clock" size={12} color={colors.textSecondary} />
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 5 }}>
                {timeText}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="chat-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
                {item.type === 'online_chat' ? 'Online Chat' : 'Physical'}
              </Text>
            </View>
          </View>

          {isPending ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => handleDecline(item)}
                activeOpacity={0.8}
              >
                <Feather name="x-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 14 }}>
                  {t('Decline')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1.4,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#059669',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#059669',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                }}
                onPress={() => handleApproveAndChat(item)}
                activeOpacity={0.8}
              >
                <Feather name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                  {t('Accept & Consult')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : isActive ? (
            <TouchableOpacity
              style={{
                width: '100%',
                height: 44,
                borderRadius: 12,
                backgroundColor: colors.primary,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 2,
              }}
              onPress={() => openChat(item)}
              activeOpacity={0.8}
            >
              <Feather name="message-square" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                {t('Continue Consultation →')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                width: '100%',
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? colors.cardElevated : '#F1F5F9',
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => openChat(item)}
              activeOpacity={0.8}
            >
              <Feather name="lock" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>
                {t('View Consultation History')}
              </Text>
            </TouchableOpacity>
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
