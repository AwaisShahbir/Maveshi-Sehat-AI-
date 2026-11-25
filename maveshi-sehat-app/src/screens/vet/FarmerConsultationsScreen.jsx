import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator, 
  Alert, 
  Image, 
  Modal 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';
import { getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetConsultationsScreenStyles';

export default function FarmerConsultationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const profile = getProfile();

  const userId = params.userId || profile?.userId;
  const userName = params.userName || profile?.userName || profile?.fullName || 'Dr. Doctor';
  const farmerGroup = params.farmerGroup || {};

  const [consultations, setConsultations] = useState(farmerGroup.consultations || []);
  const [loading, setLoading] = useState(false);
  const [selectedProofData, setSelectedProofData] = useState(null);

  const normalizeConsultationStatus = (status) => String(status || '').trim().toLowerCase();

  const fetchConsultations = async () => {
    try {
      if (!userId) return;
      setLoading(true);
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const url = `${baseUrl}/api/consultations/vet/${userId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const all = data.consultations || [];
        const matching = all.filter(c => String(c.farmer_id) === String(farmerGroup.farmerId));
        setConsultations(matching);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConsultations();
    });
    return unsubscribe;
  }, [navigation]);

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
              await fetch(`${baseUrl}/api/consultations/${item.id}`, { method: 'DELETE' });
              setConsultations(prev => prev.filter(c => c.id !== item.id));
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

  const renderConsultationCard = ({ item }) => {
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
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.05,
          shadowRadius: 6,
          elevation: 2
        }}
      >
        {/* Header: Case # and Type */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <View style={{ backgroundColor: isDark ? '#334155' : '#E2E8F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary }}>
                #Case-{item.id}
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }} numberOfLines={1}>
              {item.type === 'video_consult' || item.type === 'video'
                ? '📹 Video'
                : item.type === 'online_chat' || item.type === 'chat'
                ? '💬 Chat'
                : '🏥 Physical'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {isPaid ? (
              <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#047857' }}>✓ PAID</Text>
              </View>
            ) : isPaymentUnderReview ? (
              <View style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>REVIEW PROOF</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#DC2626' }}>UNPAID</Text>
              </View>
            )}

            <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg, paddingVertical: 3, paddingHorizontal: 8 }]}>
              <Text style={[styles.statusText, { color: statusBadgeColor, fontWeight: '800', fontSize: 10 }]}>
                {statusTextDisplay}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Proof Button (all TID & phone details inside modal) */}
        {(item.transaction_id || item.payment_proof_url || item.sender_phone) ? (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#F0F9FF',
              paddingVertical: 7,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : '#BAE6FD',
              marginBottom: 8
            }}
            onPress={() => setSelectedProofData(item)}
            activeOpacity={0.8}
          >
            <Feather name="file-text" size={13} color="#0284C7" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284C7' }}>
              {t('View Payment Proof')}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* AI Pathology Scan Card */}
        {aiData && (
          <View style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F0FDF4',
            borderRadius: 12,
            padding: 10,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: isDark ? colors.border : '#BBF7D0'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="stethoscope" size={15} color="#059669" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669', textTransform: 'uppercase' }}>
                  AI Pathology Scan
                </Text>
              </View>
              {aiData.confidence ? (
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
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
                  style={{ width: 44, height: 44, borderRadius: 8, marginRight: 10, backgroundColor: '#E2E8F0' }}
                />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                  <MaterialCommunityIcons name="cow" size={24} color={colors.primary} />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                  Animal #{aiData.animalId || aiData.id || 'N/A'}: {aiData.disease || aiData.name || 'AI Analysis'}
                </Text>
                {aiData.description ? (
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                    {aiData.description}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* Farmer note / Reason */}
        {item.reason ? (
          <Text style={{ fontSize: 13, color: colors.textPrimary, marginBottom: 4, lineHeight: 18 }}>
            <Text style={{ fontWeight: '700' }}>{t('Farmer Note')}: </Text>{item.reason}
          </Text>
        ) : null}

        {timeText ? (
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>
            {timeText}
          </Text>
        ) : null}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 }}>
          {isPending ? (
            <>
              <TouchableOpacity
                style={{
                  height: 42,
                  paddingHorizontal: 14,
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
                <Feather name="x-circle" size={15} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13 }}>
                  {t('Decline')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  minHeight: 42,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  backgroundColor: '#059669',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => handleApproveAndChat(item)}
                activeOpacity={0.8}
              >
                <Feather name="check-circle" size={15} color="#FFF" style={{ marginRight: 5 }} />
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }} numberOfLines={1} adjustsFontSizeToFit>
                  {item.payment_status === 'pending_verification' ? t('Verify & Approve') : t('Accept & Consult')}
                </Text>
              </TouchableOpacity>
            </>
          ) : isActive ? (
            <TouchableOpacity
              style={{
                flex: 1,
                height: 42,
                borderRadius: 12,
                backgroundColor: colors.primary,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => openChat(item)}
              activeOpacity={0.8}
            >
              <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>
                {t('Continue Consultation →')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                flex: 1,
                height: 42,
                borderRadius: 12,
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
              <Feather name="lock" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 13 }}>
                {t('Consultation Closed (Read-Only)')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => handleDeleteConsultation(item)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />

      {/* Header */}
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {farmerGroup.farmerName || t('Patient')}
            </Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={fetchConsultations}>
            <Feather name="refresh-cw" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Farmer Details Summary Banner */}
      <View style={{
        backgroundColor: colors.card,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10
          }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0284C7' }}>
              {farmerGroup.farmerName ? farmerGroup.farmerName.charAt(0).toUpperCase() : 'F'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
              {farmerGroup.farmerName || 'Farmer'}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
              {farmerGroup.farmerPhone} {farmerGroup.farmerDistrict ? `· ${farmerGroup.farmerDistrict}` : ''}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: isDark ? '#334155' : '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary }}>
            {consultations.length} {consultations.length === 1 ? 'Case' : 'Cases'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : consultations.length === 0 ? (
        <View style={[styles.emptyContainer, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialCommunityIcons name="message-text-outline" size={60} color="#CCC" />
          <Text style={styles.emptyText}>{t('No consultations found')}</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: colors.background }}
          data={consultations}
          renderItem={renderConsultationCard}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('Consultation Cases')} ({consultations.length})
              </Text>
            </View>
          }
        />
      )}

      {/* Payment Proof Details Modal */}
      <Modal visible={!!selectedProofData} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 18, width: '100%', maxWidth: 420, maxHeight: '90%' }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="file-text" size={18} color="#0284C7" />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
                    {t('Payment Proof Details')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedProofData(null)}>
                  <Feather name="x" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Receipt Screenshot Image */}
              {selectedProofData?.payment_proof_url ? (
                <Image
                  source={{ uri: selectedProofData.payment_proof_url }}
                  style={{ width: '100%', height: 260, borderRadius: 12, backgroundColor: '#000', marginBottom: 14 }}
                  resizeMode="contain"
                />
              ) : (
                <View style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                  borderRadius: 12,
                  padding: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  marginBottom: 14
                }}>
                  <Feather name="image" size={32} color={colors.textSecondary} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6 }}>
                    {t('No receipt screenshot attached')}
                  </Text>
                </View>
              )}

              {/* Transaction Breakdown */}
              <View style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 8,
                marginBottom: 14
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Transaction ID (TID)')}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                    {selectedProofData?.transaction_id || t('Not Provided')}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Sender Phone')}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                    {selectedProofData?.sender_phone || selectedProofData?.farmer_phone || t('Not Provided')}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Payment Method')}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0284C7' }}>
                    {selectedProofData?.payment_method || 'JazzCash'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Consultation Fee')}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>
                    Rs. {parseFloat(selectedProofData?.fee || 300).toFixed(0)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Payment Status')}</Text>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: selectedProofData?.payment_status === 'paid' ? '#059669' : '#D97706'
                  }}>
                    {selectedProofData?.payment_status === 'paid' ? 'PAID' : 'PENDING VERIFICATION'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  height: 44,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => setSelectedProofData(null)}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{t('Close')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
