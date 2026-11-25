import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator, 
  TextInput, 
  Alert, 
  Image, 
  Modal 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';
import { subscribeProfile, getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetConsultationsScreenStyles';

export default function VetConsultationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const profile = getProfile();
  const userId = params.user?.id || params.userId || profile?.userId || null;
  const userName = profile?.userName || profile?.fullName || params.userName || '';

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null);

  const normalizeConsultationStatus = (status) => String(status || '').trim().toLowerCase();

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribeProfile(() => forceUpdate(n => n + 1));
    return () => unsubscribe();
  }, []);

  const fetchConsultations = async () => {
    try {
      if (!userId) {
        setConsultations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
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

  const handleResolveConsultation = (item) => {
    Alert.alert(
      t('Mark as Resolved?'),
      t('Are you sure you want to resolve this consultation case?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Mark as Resolved'),
          onPress: async () => {
            try {
              const baseUrl = 'https://maveshi-sehat-api.onrender.com';
              const response = await fetch(`${baseUrl}/api/chat/conversation/resolve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  conversationId: item.conversation_id,
                  consultationId: item.id,
                  outcome: 'fully_recovered',
                  dischargeNotes: 'Consultation marked as resolved by veterinarian.'
                })
              });
              if (response.ok) {
                Alert.alert(t('Success'), t('Consultation marked as resolved.'));
                fetchConsultations();
              } else {
                throw new Error('Failed to resolve consultation');
              }
            } catch (err) {
              console.error(err);
              Alert.alert(t('Error'), 'Could not resolve consultation.');
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
          vetId: userId,
          consultationId: item.id
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
        consultations: [item],
        partnerPhone: item.farmer_phone
      });
    } catch (error) {
      console.error('Error opening chat', error);
      Alert.alert(t('Error'), 'Could not open chat.');
    }
  };

  const handleVerifyPaymentAndApprove = async (item) => {
    try {
      setLoading(true);
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/consultations/${item.id}/verify-payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to verify payment');
      
      Alert.alert(t('Success'), t('Payment verified and consultation approved.'));
      fetchConsultations();
      openChat({ ...item, status: 'approved', payment_status: 'paid' });
    } catch (err) {
      console.error(err);
      Alert.alert(t('Error'), err.message || 'Could not verify payment');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndChat = async (item) => {
    if (item.payment_status === 'pending_verification') {
      await handleVerifyPaymentAndApprove(item);
    } else {
      await handleStatusUpdate(item.id, 'approved');
      openChat({ ...item, status: 'approved' });
    }
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
            if (item.payment_status === 'pending_verification') {
              try {
                const baseUrl = 'https://maveshi-sehat-api.onrender.com';
                await fetch(`${baseUrl}/api/consultations/${item.id}/reject-payment`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rejectionReason: 'Consultation declined by doctor.' })
                });
                fetchConsultations();
              } catch (e) {
                console.error(e);
              }
            } else {
              await handleStatusUpdate(item.id, 'rejected');
            }
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

  // Group consultations strictly by Farmer
  const groupedByFarmer = useMemo(() => {
    const groups = {};
    filteredConsultations.forEach(item => {
      const fId = item.farmer_id || 'unknown';
      if (!groups[fId]) {
        groups[fId] = {
          farmerId: fId,
          farmerName: item.farmer_name || 'Farmer',
          farmerPhone: item.farmer_phone || '',
          farmerDistrict: item.farmer_district || '',
          consultations: []
        };
      }
      groups[fId].consultations.push(item);
    });
    return Object.values(groups);
  }, [filteredConsultations]);

  const getStats = () => {
    return {
      pending: consultations.filter(c => normalizeConsultationStatus(c.status) === 'pending').length,
      active: consultations.filter(c => normalizeConsultationStatus(c.status) === 'approved').length,
      resolved: consultations.filter(c => ['resolved', 'completed'].includes(normalizeConsultationStatus(c.status))).length,
    };
  };
  const stats = getStats();

  const renderConsultationSubCard = (item) => {
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

    const isPaid = item.payment_status === 'paid';
    const isPaymentUnderReview = item.payment_status === 'pending_verification';

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
      <View 
        key={item.id}
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
          borderRadius: 14,
          padding: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: isDark ? colors.border : '#E2E8F0'
        }}
      >
        {/* Sub Header: Case # and Badges */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <View style={{ backgroundColor: isDark ? '#334155' : '#E2E8F0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textPrimary }}>
                #Case-{item.id}
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>
              {item.type === 'video_consult' || item.type === 'video'
                ? '📹 Video'
                : item.type === 'online_chat' || item.type === 'chat'
                ? '💬 Online Chat'
                : '🏥 Physical'}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg, paddingVertical: 3, paddingHorizontal: 8 }]}>
            <Text style={[styles.statusText, { color: statusBadgeColor, fontWeight: '800', fontSize: 10 }]}>
              {statusTextDisplay}
            </Text>
          </View>
        </View>

        {/* Financial & Payment Row */}
        <View style={{
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5',
          borderRadius: 10,
          padding: 8,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#A7F3D0',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6
        }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#047857' }}>
              Fee: Rs. {Number(item.fee || 300).toFixed(0)} <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>(Vet: Rs. 270 · Admin 10%: Rs. 30)</Text>
            </Text>
            {item.transaction_id ? (
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                TID: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{item.transaction_id}</Text>
                {item.sender_phone ? ` · Sender: ${item.sender_phone}` : ''}
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isPaid ? (
              <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#166534' }}>✓ PAID</Text>
              </View>
            ) : isPaymentUnderReview ? (
              <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>REVIEW PROOF</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#DC2626' }}>UNPAID</Text>
              </View>
            )}

            {item.payment_proof_url ? (
              <TouchableOpacity
                style={{
                  backgroundColor: '#0284C7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
                onPress={() => setSelectedReceiptUrl(item.payment_proof_url)}
              >
                <Feather name="image" size={11} color="#FFF" style={{ marginRight: 3 }} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>{t('View Receipt')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* AI Scan Report Card */}
        {aiData && (
          <View style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F0FDF4',
            borderRadius: 10,
            padding: 8,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: isDark ? colors.border : '#BBF7D0'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="stethoscope" size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669', textTransform: 'uppercase' }}>
                  AI Pathology Scan
                </Text>
              </View>
              {aiData.confidence ? (
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#166534' }}>
                    {aiData.confidence}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {(aiData.imageUrl || aiData.uri) ? (
                <Image
                  source={{ uri: aiData.imageUrl || aiData.uri }}
                  style={{ width: 40, height: 40, borderRadius: 6, marginRight: 8, backgroundColor: '#E2E8F0' }}
                />
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                  <MaterialCommunityIcons name="cow" size={22} color={colors.primary} />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                  Animal #{aiData.animalId || aiData.id || 'N/A'}: {aiData.disease || aiData.name || 'AI Analysis'}
                </Text>
                {aiData.description ? (
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }} numberOfLines={1}>
                    {aiData.description}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* Farmer note / Reason */}
        {item.reason ? (
          <Text style={{ fontSize: 12, color: colors.textPrimary, marginBottom: 4 }} numberOfLines={2}>
            <Text style={{ fontWeight: '700' }}>{t('Farmer Note')}: </Text>{item.reason}
          </Text>
        ) : null}

        {timeText ? (
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 8 }}>
            {timeText}
          </Text>
        ) : null}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
          {isPending ? (
            <>
              <TouchableOpacity
                style={{
                  height: 38,
                  paddingHorizontal: 12,
                  borderRadius: 10,
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
                <Feather name="x-circle" size={14} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 12 }}>
                  {t('Decline')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#059669',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => handleApproveAndChat(item)}
                activeOpacity={0.8}
              >
                <Feather name="check-circle" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>
                  {item.payment_status === 'pending_verification' ? t('Verify Payment & Approve') : t('Accept & Consult')}
                </Text>
              </TouchableOpacity>
            </>
          ) : isActive ? (
            <>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => openChat(item)}
                activeOpacity={0.8}
              >
                <Feather name="message-square" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>
                  {t('Continue Consultation →')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 10,
                  height: 38,
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#86EFAC',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => handleResolveConsultation(item)}
                activeOpacity={0.7}
              >
                <Feather name="check" size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={{ color: '#047857', fontWeight: '700', fontSize: 11 }}>{t('Mark as Resolved')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={{
                flex: 1,
                height: 38,
                borderRadius: 10,
                backgroundColor: isDark ? colors.cardElevated : '#F1F5F9',
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => openChat(item)}
              activeOpacity={0.8}
            >
              <Feather name="lock" size={13} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 12 }}>
                {t('View Consultation History')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => handleDeleteConsultation(item)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFarmerGroup = ({ item: farmerGroup }) => {
    return (
      <View style={styles.card}>
        {/* Farmer Header Card */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? colors.border : '#E2E8F0',
          paddingBottom: 10,
          marginBottom: 10
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10
            }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0284C7' }}>
                {farmerGroup.farmerName ? farmerGroup.farmerName.charAt(0).toUpperCase() : 'F'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
                {farmerGroup.farmerName || 'Farmer'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                {farmerGroup.farmerPhone} {farmerGroup.farmerDistrict ? `· ${farmerGroup.farmerDistrict}` : ''}
              </Text>
            </View>
          </View>

          <View style={{ backgroundColor: isDark ? '#334155' : '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
              {farmerGroup.consultations.length} {farmerGroup.consultations.length === 1 ? 'Case' : 'Cases'}
            </Text>
          </View>
        </View>

        {/* Sub-list of consultations under this Farmer */}
        <View>
          {farmerGroup.consultations.map(consult => renderConsultationSubCard(consult))}
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
            <Text style={styles.headerTitle}>{t('Consultations')}</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={handleRefresh}>
            <Feather name="refresh-cw" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#FFF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search farmer name or issue..."
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
          <Text style={styles.statLabel}>{t('Pending')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{loading ? '-' : stats.active}</Text>
          <Text style={styles.statLabel}>{t('Active')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#888' }]}>{loading ? '-' : stats.resolved}</Text>
          <Text style={styles.statLabel}>{t('Resolved')}</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: colors.background }}
          data={groupedByFarmer}
          renderItem={renderFarmerGroup}
          keyExtractor={(item) => String(item.farmerId)}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="message-text-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>{t('No consultations found')}</Text>
            </View>
          }
        />
      )}

      {/* Receipt Viewer Modal */}
      <Modal visible={!!selectedReceiptUrl} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, width: '100%', maxWidth: 400 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
                {t('Payment Receipt')}
              </Text>
              <TouchableOpacity onPress={() => setSelectedReceiptUrl(null)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedReceiptUrl ? (
              <Image
                source={{ uri: selectedReceiptUrl }}
                style={{ width: '100%', height: 320, borderRadius: 12, backgroundColor: '#000' }}
                resizeMode="contain"
              />
            ) : null}

            <TouchableOpacity
              style={{
                marginTop: 14,
                height: 44,
                backgroundColor: colors.primary,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => setSelectedReceiptUrl(null)}
            >
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{t('Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
