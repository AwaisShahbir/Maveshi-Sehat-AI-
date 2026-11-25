import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform, 
  Alert, 
  StatusBar, 
  Image, 
  Modal, 
  ScrollView, 
  TextInput, 
  KeyboardAvoidingView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/MyConsultationsScreenStyles';
import { t } from '../../utils/translate';

export default function MyConsultationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const profile = getProfile();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment Submission Modal States
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedConsultForPay, setSelectedConsultForPay] = useState(null);
  const [payPhone, setPayPhone] = useState(profile?.phone || '');
  const [payTid, setPayTid] = useState('');
  const [payReceipt, setPayReceipt] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const farmerId = profile.userId || profile.id;
      if (!farmerId) {
        setConsultations([]);
        setLoading(false);
        return;
      }
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/consultations/farmer/${farmerId}`);
      const data = await response.json();
      if (response.ok) {
        setConsultations(data.consultations || []);
      } else {
        throw new Error(data.error || 'Failed to fetch consultations');
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('Error'), err.message || 'Network request failed. Is the server running?');
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

  // Group consultations strictly by Veterinarian
  const groupedByVet = useMemo(() => {
    const groups = {};
    consultations.forEach(item => {
      const vId = item.vet_id || 'general';
      if (!groups[vId]) {
        groups[vId] = {
          vetId: vId,
          vetName: item.vet_name || 'Veterinarian',
          vetSpecialization: item.vet_specialization || 'General Practitioner',
          vetDistrict: item.vet_district || '',
          vetPhone: item.vet_phone || '',
          vetConsultationMode: item.vet_consultation_mode || 'Chat + Video',
          vetWalletType: item.vet_wallet_type || 'JazzCash',
          vetAccountTitle: item.vet_account_title,
          vetAccountNumber: item.vet_account_number,
          consultations: []
        };
      }
      groups[vId].consultations.push(item);
    });
    return Object.values(groups);
  }, [consultations]);

  const handleDeleteConsultation = (item) => {
    Alert.alert(
      t('Delete Consultation'),
      t('Are you sure you want to delete this consultation record? This action cannot be undone.'),
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
              Alert.alert(t('Success'), t('Consultation record deleted.'));
            } catch (err) {
              console.error('Delete consultation error:', err);
              Alert.alert(t('Error'), 'Could not delete consultation record.');
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
                  dischargeNotes: 'Consultation marked as resolved by farmer.'
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

  const handleStartChat = async (consult) => {
    try {
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: profile.userId || profile.id,
          farmerName: profile.userName || profile.fullName || 'Farmer',
          vetId: consult.vet_id,
          consultationId: consult.id
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      let initialRecord = null;
      if (consult.ai_record_data) {
        if (typeof consult.ai_record_data === 'object') {
          initialRecord = consult.ai_record_data;
        } else {
          try {
            initialRecord = JSON.parse(consult.ai_record_data);
          } catch (e) {
            initialRecord = null;
          }
        }
      }

      navigation.navigate('Chat', {
        conversationId: data.id,
        partnerName: consult.vet_name,
        partnerRole: 'vet',
        userName: profile.userName || profile.fullName || 'Farmer',
        userRole: 'farmer',
        vetId: consult.vet_id,
        consultationId: consult.id,
        consultation: consult,
        initialRecord,
        consultations: [consult],
        consultationMode: consult.vet_consultation_mode,
        partnerPhone: consult.vet_phone
      });
    } catch (error) {
      Alert.alert(t('Error'), 'Could not start chat.');
    }
  };

  const handleOpenPayModal = (consult) => {
    setSelectedConsultForPay(consult);
    setPayPhone(consult.sender_phone || profile?.phone || '');
    setPayTid(consult.transaction_id || '');
    setPayReceipt(null);
    setPayModalVisible(true);
  };

  const handlePickReceipt = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      includeBase64: true
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert(t('Error'), response.errorMessage);
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setPayReceipt({
          uri: asset.uri,
          base64: asset.base64
        });
      }
    });
  };

  const handleSubmitPayment = async () => {
    if (!selectedConsultForPay) return;
    if (!payPhone.trim() && !payTid.trim() && !payReceipt) {
      Alert.alert(t('Required'), 'Please provide sender phone number or transaction ID.');
      return;
    }
    try {
      setSubmittingPayment(true);
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/consultations/${selectedConsultForPay.id}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_phone: payPhone.trim(),
          transaction_id: payTid.trim(),
          payment_method: 'JazzCash',
          paymentProofBase64: payReceipt ? payReceipt.base64 : null
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit payment');
      Alert.alert(t('Success'), 'Payment proof submitted. Doctor will verify and unlock consultation.');
      setPayModalVisible(false);
      fetchConsultations();
    } catch (err) {
      Alert.alert(t('Error'), err.message || 'Could not submit payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const renderConsultationSubCard = (item) => {
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

    const isPending = item.status === 'pending';
    const isApproved = item.status === 'approved';
    const isRejected = item.status === 'rejected';
    const isResolved = item.status === 'resolved' || item.status === 'completed';

    const statusBadgeBg = isApproved
      ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#E8F8EA')
      : isRejected
      ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FFEBEB')
      : isPending
      ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF3CD')
      : (isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9');

    const statusBadgeColor = isApproved
      ? colors.primary
      : isRejected
      ? '#EF4444'
      : isPending
      ? '#D97706'
      : '#64748B';

    const statusTextDisplay = isPending
      ? 'PENDING'
      : isApproved
      ? 'APPROVED'
      : isRejected
      ? 'DECLINED'
      : 'RESOLVED';

    const isPaymentPaid = item.payment_status === 'paid';
    const isPaymentPending = item.payment_status === 'pending_verification';

    const formattedDate = item.created_at
      ? new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View 
        key={item.id} 
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
          borderRadius: 14,
          padding: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: isDark ? colors.border : '#E2E8F0'
        }}
      >
        {/* Case ID and Status Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
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
                ? '💬 Chat'
                : '🏥 Physical'}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg, paddingVertical: 3, paddingHorizontal: 8 }]}>
            <Text style={[styles.statusText, { color: statusBadgeColor, fontWeight: '800', fontSize: 10 }]}>
              {statusTextDisplay}
            </Text>
          </View>
        </View>

        {/* Payment Fee & Status Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="cash" size={14} color="#059669" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
              Rs. {item.fee ? Number(item.fee).toFixed(0) : '300'}
            </Text>
          </View>

          {isPaymentPaid ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <MaterialCommunityIcons name="check-circle" size={12} color="#059669" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857' }}>
                {t('Verified & Paid')}
              </Text>
            </View>
          ) : isPaymentPending ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Feather name="clock" size={11} color="#D97706" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>
                {t('Payment Under Review')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}
              onPress={() => handleOpenPayModal(item)}
            >
              <MaterialCommunityIcons name="wallet-plus" size={12} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>
                {t('Pay Rs. 300 & Confirm')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Attached AI Report Snippet */}
        {aiData && (
          <View style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
            borderRadius: 10,
            padding: 8,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: isDark ? colors.border : '#E2E8F0',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            {(aiData.imageUrl || aiData.uri) ? (
              <Image
                source={{ uri: aiData.imageUrl || aiData.uri }}
                style={{ width: 36, height: 36, borderRadius: 6, marginRight: 8, backgroundColor: '#E2E8F0' }}
              />
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                <MaterialCommunityIcons name="cow" size={20} color={colors.primary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                Animal #{aiData.animalId || aiData.id || 'N/A'}: {aiData.disease || aiData.name || 'AI Scan'}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={1}>
                {aiData.confidence ? `Confidence: ${aiData.confidence}` : 'Clinical Record Attached'}
              </Text>
            </View>
          </View>
        )}

        {/* Reason / Symptoms */}
        {item.reason ? (
          <Text style={{ fontSize: 12, color: colors.textPrimary, marginBottom: 4 }} numberOfLines={2}>
            <Text style={{ fontWeight: '700' }}>{t('Reason')}: </Text>{item.reason}
          </Text>
        ) : null}

        {formattedDate ? (
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 8 }}>
            {formattedDate}
          </Text>
        ) : null}

        {/* Action Buttons Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {isApproved ? (
            <>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 38,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => handleStartChat(item)}
                activeOpacity={0.8}
              >
                <Feather name="message-square" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>{t('Open Chat')}</Text>
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
          ) : isResolved ? (
            <>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 38,
                  backgroundColor: isDark ? colors.cardElevated : '#F1F5F9',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => handleStartChat(item)}
                activeOpacity={0.8}
              >
                <Feather name="message-square" size={14} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 12 }}>{t('View Chat History')}</Text>
              </TouchableOpacity>

              <View style={{
                paddingHorizontal: 10,
                height: 38,
                backgroundColor: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9',
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 11 }}>{t('Consultation Resolved')}</Text>
              </View>
            </>
          ) : isPending ? (
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 10
            }}>
              <Feather name="clock" size={13} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: '#B45309', fontWeight: '600', flex: 1 }}>
                Awaiting doctor approval. Chat will unlock once approved.
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="x-circle" size={13} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>
                Consultation declined by doctor
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => handleDeleteConsultation(item)} 
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderVetGroup = ({ item: vetGroup }) => {
    return (
      <View style={styles.card}>
        {/* Doctor Details Header Card */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? colors.border : '#E2E8F0',
          paddingBottom: 12,
          marginBottom: 12
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#DCFCE7',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10
            }}>
              <MaterialCommunityIcons name="doctor" size={24} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
                  Dr. {vetGroup.vetName.replace(/^Dr\.\s*/i, '')}
                </Text>
                <MaterialCommunityIcons name="check-decagram" size={14} color="#059669" style={{ marginLeft: 4 }} />
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                {vetGroup.vetSpecialization} {vetGroup.vetDistrict ? `· ${vetGroup.vetDistrict}` : ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#A7F3D0'
            }}
            onPress={() => navigation.navigate('Veterinarians')}
          >
            <Feather name="plus" size={13} color="#059669" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
              {t('New Consultation')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sub-list of consultations under this Doctor */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('Consultation Cases')} ({vetGroup.consultations.length})
          </Text>
          {vetGroup.consultations.map(consult => renderConsultationSubCard(consult))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('My Consultations')}</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : groupedByVet.length === 0 ? (
        <View style={[styles.emptyState, { flex: 1, backgroundColor: colors.background }]}>
          <MaterialCommunityIcons name="doctor" size={60} color={colors.textSecondary} />
          <Text style={styles.emptyText}>{t('No consultations found')}</Text>
          <TouchableOpacity 
            style={{
              marginTop: 16,
              backgroundColor: colors.primary,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 12
            }}
            onPress={() => navigation.navigate('Veterinarians')}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{t('Consult Veterinarian')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList 
          style={{ flex: 1, backgroundColor: colors.background }}
          data={groupedByVet}
          keyExtractor={(item) => String(item.vetId)} 
          renderItem={renderVetGroup} 
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Pay Rs. 300 JazzCash Modal */}
      <Modal visible={payModalVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <View style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '90%'
          }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                  {t('Pay Rs. 300 via JazzCash')}
                </Text>
                <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                  <Feather name="x" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Instructions Box */}
              <View style={{
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
                padding: 12,
                borderRadius: 12,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A'
              }}>
                <Text style={{ fontSize: 12, color: isDark ? '#FBBF24' : '#92400E', fontWeight: '700', marginBottom: 4 }}>
                  Case #{selectedConsultForPay?.id} · Dr. {selectedConsultForPay?.vet_name}
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#CBD5E1' : '#78350F', lineHeight: 18 }}>
                  Transfer Rs. 300 to: {'\n'}
                  <Text style={{ fontWeight: '800' }}>
                    {selectedConsultForPay?.vet_account_number
                      ? `${selectedConsultForPay.vet_wallet_type || 'JazzCash'} (${selectedConsultForPay.vet_account_title || selectedConsultForPay.vet_name}): ${selectedConsultForPay.vet_account_number}`
                      : 'JazzCash (Maveshi Sehat Admin): 03054758667'}
                  </Text>
                </Text>
              </View>

              {/* Sender Phone */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                  {t('Sender Phone Number')} *
                </Text>
                <TextInput
                  style={[styles.textInput, {
                    height: 44,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    color: colors.textPrimary,
                    backgroundColor: colors.background
                  }]}
                  placeholder="03XXXXXXXXX"
                  placeholderTextColor={colors.placeholderText || '#94A3B8'}
                  value={payPhone}
                  onChangeText={setPayPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Transaction ID */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                  {t('TID / Transaction ID')}
                </Text>
                <TextInput
                  style={[styles.textInput, {
                    height: 44,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    color: colors.textPrimary,
                    backgroundColor: colors.background
                  }]}
                  placeholder="e.g. 11223344556"
                  placeholderTextColor={colors.placeholderText || '#94A3B8'}
                  value={payTid}
                  onChangeText={setPayTid}
                />
              </View>

              {/* Receipt Image Attachment */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: payReceipt ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7') : (isDark ? '#334155' : '#E2E8F0'),
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: payReceipt ? '#10B981' : colors.border
                  }}
                  onPress={handlePickReceipt}
                >
                  <Feather name={payReceipt ? "check-circle" : "camera"} size={16} color={payReceipt ? "#059669" : colors.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: payReceipt ? "#059669" : colors.textPrimary }}>
                    {payReceipt ? t('Receipt Attached') : t('Attach Receipt Screenshot')}
                  </Text>
                </TouchableOpacity>

                {payReceipt && (
                  <TouchableOpacity
                    onPress={() => setPayReceipt(null)}
                    style={{ padding: 10 }}
                  >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={{
                  height: 48,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={handleSubmitPayment}
                disabled={submittingPayment}
              >
                {submittingPayment ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>
                    {t('Submit Payment Proof')}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
