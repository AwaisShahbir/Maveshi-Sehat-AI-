import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/MyConsultationsScreenStyles';
import { t } from '../../utils/translate';

export default function DoctorConsultationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const profile = getProfile();

  const [vetData, setVetData] = useState(() => params.vetGroup || null);
  const [consultations, setConsultations] = useState(() => params.vetGroup?.consultations || []);
  const [loading, setLoading] = useState(false);

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
      const vetId = vetData?.vetId || params.vetId;
      if (!farmerId) return;

      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/consultations/farmer/${farmerId}`);
      const data = await response.json();
      if (response.ok && data.consultations) {
        const matching = data.consultations.filter(c => String(c.vet_id) === String(vetId));
        setConsultations(matching);
        if (matching.length > 0 && !vetData) {
          const first = matching[0];
          setVetData({
            vetId: first.vet_id,
            vetName: first.vet_name,
            vetSpecialization: first.vet_specialization,
            vetDistrict: first.vet_district,
            vetPhone: first.vet_phone,
            vetConsultationMode: first.vet_consultation_mode,
            vetWalletType: first.vet_wallet_type,
            vetAccountTitle: first.vet_account_title,
            vetAccountNumber: first.vet_account_number
          });
        }
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

  const renderConsultationCard = ({ item }) => {
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
        {/* Case ID and Status Header */}
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {isPaymentPaid ? (
              <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#047857' }}>✓ PAID</Text>
              </View>
            ) : isPaymentPending ? (
              <View style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>UNDER REVIEW</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}
                onPress={() => handleOpenPayModal(item)}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#DC2626' }}>PAY RS. 300</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 5 }]}>
              <Text style={[styles.statusText, { color: statusBadgeColor, fontWeight: '800', fontSize: 10 }]}>
                {statusTextDisplay}
              </Text>
            </View>
          </View>
        </View>

        {/* Attached AI Report Snippet */}
        {aiData && (
          <View style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
            borderRadius: 12,
            padding: 10,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: isDark ? colors.border : '#E2E8F0',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
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
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                Animal #{aiData.animalId || aiData.id || 'N/A'}: {aiData.disease || aiData.name || 'AI Scan'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {aiData.confidence ? `Confidence: ${aiData.confidence}` : 'Clinical Record Attached'}
              </Text>
            </View>
          </View>
        )}

        {/* Reason / Symptoms */}
        {item.reason ? (
          <Text style={{ fontSize: 13, color: colors.textPrimary, marginBottom: 4, lineHeight: 18 }}>
            <Text style={{ fontWeight: '700' }}>{t('Reason')}: </Text>{item.reason}
          </Text>
        ) : null}

        {formattedDate ? (
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>
            {formattedDate}
          </Text>
        ) : null}

        {/* Action Buttons Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {isApproved ? (
            <TouchableOpacity
              style={{
                flex: 1,
                height: 42,
                backgroundColor: colors.primary,
                borderRadius: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => handleStartChat(item)}
              activeOpacity={0.8}
            >
              <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{t('Open Chat')}</Text>
            </TouchableOpacity>
          ) : isResolved ? (
            <>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 42,
                  backgroundColor: isDark ? colors.cardElevated : '#F1F5F9',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => handleStartChat(item)}
                activeOpacity={0.8}
              >
                <Feather name="message-square" size={15} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>{t('View Chat History')}</Text>
              </TouchableOpacity>

              <View style={{
                paddingHorizontal: 12,
                height: 42,
                backgroundColor: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9',
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 12 }}>{t('Consultation Resolved')}</Text>
              </View>
            </>
          ) : isPending ? (
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12
            }}>
              <Feather name="clock" size={14} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: '#B45309', fontWeight: '600', flex: 1 }}>
                Awaiting doctor approval. Chat will unlock once approved.
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="x-circle" size={15} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600' }}>
                Consultation declined by doctor
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => handleDeleteConsultation(item)} 
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {vetData?.vetName ? `Dr. ${vetData.vetName.replace(/^Dr\.\s*/i, '')}` : t('Doctor Details')}
        </Text>
        <TouchableOpacity 
          style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
          onPress={fetchConsultations}
        >
          <Feather name="refresh-cw" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Doctor Summary Banner */}
      {vetData && (
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
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
            <View style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#DCFCE7',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10
            }}>
              <MaterialCommunityIcons name="doctor" size={26} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
                  Dr. {vetData.vetName?.replace(/^Dr\.\s*/i, '')}
                </Text>
                <MaterialCommunityIcons name="check-decagram" size={15} color="#059669" style={{ marginLeft: 4 }} />
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                {vetData.vetSpecialization || 'Veterinary Specialist'} {vetData.vetDistrict ? `· ${vetData.vetDistrict}` : ''}
              </Text>
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : consultations.length === 0 ? (
        <View style={[styles.emptyState, { flex: 1, backgroundColor: colors.background }]}>
          <MaterialCommunityIcons name="calendar-blank" size={56} color={colors.textSecondary} />
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
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{t('Book New Consultation')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList 
          style={{ flex: 1, backgroundColor: colors.background }}
          data={consultations}
          keyExtractor={(item) => String(item.id)} 
          renderItem={renderConsultationCard} 
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Single Professional Fee & Payment Top Banner */}
              <View style={{
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                borderRadius: 14,
                padding: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#FBBF24' : '#B45309' }}>
                    {t('Consultation Fee')}: Rs. 300
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#CBD5E1' : '#78350F', marginTop: 2 }}>
                    JazzCash: <Text style={{ fontWeight: '700' }}>{vetData?.vetAccountNumber || '03054758667'}</Text>
                  </Text>
                </View>

                {consultations.some(c => c.payment_status !== 'paid') ? (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#D97706',
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      const firstUnpaid = consultations.find(c => c.payment_status !== 'paid');
                      handleOpenPayModal(firstUnpaid || consultations[0]);
                    }}
                  >
                    <Feather name="upload" size={13} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>
                      {t('Pay Rs. 300 & Confirm')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Feather name="check-circle" size={13} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857' }}>
                      {t('All Consultations Paid')}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('Consultation Cases')} ({consultations.length})
              </Text>
            </View>
          }
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                  {t('Pay Rs. 300 via JazzCash')}
                </Text>
                <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                  <Feather name="x" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Consultation Case Selector (if multiple cases exist) */}
              {consultations.length > 1 && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>
                    {t('Select Consultation Case')} *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {consultations.map(c => {
                      const isSelected = selectedConsultForPay?.id === c.id;
                      const isPaid = c.payment_status === 'paid';
                      const isReview = c.payment_status === 'pending_verification';
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 10,
                            backgroundColor: isSelected ? colors.primary : (isDark ? '#334155' : '#F1F5F9'),
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={() => {
                            setSelectedConsultForPay(c);
                            setPayPhone(c.sender_phone || profile?.phone || '');
                            setPayTid(c.transaction_id || '');
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? '#FFF' : colors.textPrimary }}>
                            #Case-{c.id} {isPaid ? '✓' : isReview ? '⏳' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

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
                  Case #{selectedConsultForPay?.id} · Dr. {selectedConsultForPay?.vet_name || vetData?.vetName}
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#CBD5E1' : '#78350F', lineHeight: 18 }}>
                  Transfer Rs. 300 to: {'\n'}
                  <Text style={{ fontWeight: '800' }}>
                    {selectedConsultForPay?.vet_account_number || vetData?.vetAccountNumber
                      ? `${selectedConsultForPay?.vet_wallet_type || vetData?.vetWalletType || 'JazzCash'} (${selectedConsultForPay?.vet_account_title || vetData?.vetAccountTitle || selectedConsultForPay?.vet_name || vetData?.vetName}): ${selectedConsultForPay?.vet_account_number || vetData?.vetAccountNumber}`
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
