import React, { useState, useEffect } from 'react';
import {
  View, Text, SafeAreaView, FlatList, TextInput,
  TouchableOpacity, StatusBar, ActivityIndicator, Platform, Alert, Image, Modal,
  ScrollView, KeyboardAvoidingView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import LinearGradient from 'react-native-linear-gradient';
import { getStyles } from '../../styles/VeterinariansListScreenStyles';

export default function VeterinariansListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const params = route.params || {};

  const [profile, setProfile] = useState(getProfile());
  const userName = profile.userName || profile.fullName || params.userName || '';
  const userId = profile.userId || profile.id || params.userId || null;

  const [vets, setVets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const isSubmittingRef = React.useRef(false);
  const [consultModalVisible, setConsultModalVisible] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);
  const [consultType, setConsultType] = useState('online_chat'); // 'online_chat' or 'physical_appointment'
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [senderPhone, setSenderPhone] = useState(profile?.phone || '');
  const [transactionId, setTransactionId] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [errors, setErrors] = useState({
    reason: '',
    appointmentDate: '',
    appointmentTime: ''
  });

  const getFormattedFutureDate = (daysAhead = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const validateDateString = (dateStr) => {
    if (!dateStr || !dateStr.trim()) {
      return t('Appointment date is required (YYYY-MM-DD).');
    }
    const trimmed = dateStr.trim();
    const formatMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (!formatMatch) {
      return t('Format must be YYYY-MM-DD (e.g. 2026-11-25).');
    }
    let year = parseInt(formatMatch[1], 10);
    let month = parseInt(formatMatch[2], 10);
    let day = parseInt(formatMatch[3], 10);

    // Auto-swap if user typed YYYY-DD-MM (e.g. 2026-30-12)
    if (month > 12 && day <= 12) {
      const temp = month;
      month = day;
      day = temp;
    }

    // Auto-bump past year to current year
    const curYear = new Date().getFullYear();
    if (year < curYear) {
      year = curYear;
    }

    if (month < 1 || month > 12) {
      return t('Invalid month. Month must be between 01 and 12.');
    }
    if (day < 1 || day > 31) {
      return t('Invalid day. Day must be between 01 and 31.');
    }

    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      return t('Invalid calendar date for this month.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) {
      return t('Date cannot be in the past. Select today or a future date.');
    }

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    if (d > maxDate) {
      return t('Date cannot be more than 6 months ahead.');
    }

    return '';
  };

  const validateTimeString = (timeStr, dateStr) => {
    if (!timeStr || !timeStr.trim()) {
      return t('Appointment time is required (HH:MM).');
    }
    const trimmed = timeStr.trim();
    const timeMatch = trimmed.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!timeMatch) {
      return t('Time must be in 24-hr format (e.g. 14:30 or 09:30).');
    }
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    // Auto-adjust afternoon hours entered as 1:00 - 6:59
    if (hours >= 1 && hours <= 6) {
      hours += 12;
    }

    if (dateStr && !validateDateString(dateStr)) {
      const parts = dateStr.trim().split(/[-/]/).map(Number);
      if (parts.length === 3) {
        let [y, m, d] = parts;
        if (m > 12 && d <= 12) {
          const temp = m; m = d; d = temp;
        }
        const curY = new Date().getFullYear();
        if (y < curY) y = curY;
        const targetDate = new Date(y, m - 1, d);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDate.getTime() === today.getTime()) {
          const now = new Date();
          // Allow 1 hour grace period
          if (hours < (now.getHours() - 1)) {
            return t('Selected time has already passed for today.');
          }
        }
      }
    }

    return '';
  };

  const validateReasonString = (reasonStr) => {
    if (!reasonStr || !reasonStr.trim()) {
      return t('Please describe your animal condition or reason.');
    }
    if (reasonStr.trim().length < 5) {
      return t('Reason must be at least 5 characters long.');
    }
    return '';
  };

  useEffect(() => {
    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
    });
    return () => unsubscribeProfile();
  }, []);

  const fetchVets = async () => {
    try {
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const url = `${baseUrl}/api/vets?ownerName=${encodeURIComponent(userName)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch vets');
      }
      const data = await response.json();
      setVets(data);
    } catch (error) {
      console.error('Error fetching vets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, [userName]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVets();
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
        Alert.alert(t('Image Error'), response.errorMessage);
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setProofImage({
          uri: asset.uri,
          base64: asset.base64,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `consult-proof-${Date.now()}.jpg`
        });
      }
    });
  };

  const openConsultModal = (vet, type) => {
    setSelectedVet(vet);
    const resolvedType = (type === 'online_chat' && vet?.consultation_mode === 'Video Only')
      ? 'video_consult'
      : (type || 'online_chat');
    setConsultType(resolvedType);
    setErrors({
      reason: '',
      appointmentDate: '',
      appointmentTime: ''
    });

    setSenderPhone(profile?.phone || '');
    setTransactionId('');
    setProofImage(null);

    // Always prefill today's date and a standard consultation time
    setAppointmentDate(getFormattedFutureDate(0));
    setAppointmentTime('14:30');

    if (params.initialRecord) {
      const rec = params.initialRecord;
      const tag = rec.animalId || rec.id || '';
      const diseaseName = rec.disease || rec.name || rec.status || 'Livestock Condition';
      const defaultReason = tag
        ? `AI Scan: ${diseaseName} (Livestock #${tag}). Requesting veterinary consultation and treatment.`
        : `AI Scan: ${diseaseName}. Requesting veterinary consultation and treatment.`;
      setReason(defaultReason);
    }
    setConsultModalVisible(true);
  };

  const submitConsultationRequest = async () => {
    const reasonErr = validateReasonString(reason);
    let dateErr = '';
    let timeErr = '';

    if (consultType === 'physical_appointment') {
      dateErr = validateDateString(appointmentDate);
      timeErr = validateTimeString(appointmentTime, appointmentDate);
    }

    setErrors({
      reason: reasonErr,
      appointmentDate: dateErr,
      appointmentTime: timeErr
    });

    if (reasonErr || dateErr || timeErr) {
      const firstError = reasonErr || dateErr || timeErr;
      Alert.alert(t('Validation Error'), firstError);
      return;
    }

    const activeProfile = getProfile();
    const effectiveUserId = profile.userId || profile.id || activeProfile.userId || activeProfile.id || params.userId;
    const effectiveUserName = profile.userName || profile.fullName || activeProfile.userName || activeProfile.fullName || params.userName || '';
    const effectivePhone = profile.phone || activeProfile.phone || '';

    let formattedDate = (appointmentDate || getFormattedFutureDate(0)).trim();
    let formattedTime = (appointmentTime || '14:30').trim();

    // Auto-swap date if user entered YYYY-DD-MM (e.g. 2026-30-12)
    const dMatch = formattedDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (dMatch) {
      let y = parseInt(dMatch[1], 10);
      let m = parseInt(dMatch[2], 10);
      let d = parseInt(dMatch[3], 10);
      if (m > 12 && d <= 12) {
        const temp = m; m = d; d = temp;
      }
      const curY = new Date().getFullYear();
      if (y < curY) y = curY;
      formattedDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    if (/^[0-9]:[0-5][0-9]$/.test(formattedTime)) {
      formattedTime = '0' + formattedTime;
    }
    if (/^0[1-6]:[0-5][0-9]$/.test(formattedTime)) {
      const hh = parseInt(formattedTime.slice(0, 2), 10) + 12;
      formattedTime = `${hh}${formattedTime.slice(2)}`;
    }

    // Clean normalized type mapping
    let mappedType = 'chat';
    if (consultType === 'physical_appointment') mappedType = 'physical';
    else if (consultType === 'video_consult') mappedType = 'video';
    else mappedType = 'chat';

    try {
      if (submittingRequest || isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setSubmittingRequest(true);
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: effectiveUserId,
          farmer_name: effectiveUserName,
          phone: effectivePhone,
          vet_id: selectedVet.id,
          type: mappedType,
          consultType: consultType,
          reason: reason.trim(),
          appointment_date: consultType === 'physical_appointment' ? `${formattedDate} ${formattedTime}` : null,
          ai_record_data: params.initialRecord || null,
          fee: consultType === 'physical_appointment' ? 0.00 : 300.00,
          payment_method: 'JazzCash',
          sender_phone: (senderPhone || effectivePhone || '').trim(),
          transaction_id: (transactionId || '').trim() || null,
          paymentProofBase64: proofImage ? proofImage.base64 : null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request consultation');
      }

      setConsultModalVisible(false);
      setReason('');
      setAppointmentDate('');
      setAppointmentTime('');
      setSenderPhone('');
      setTransactionId('');
      setProofImage(null);
      setErrors({ reason: '', appointmentDate: '', appointmentTime: '' });

      const isPhysical = consultType === 'physical_appointment';
      Alert.alert(
        t('Request Sent'),
        isPhysical
          ? `Your physical appointment request has been sent to ${selectedVet?.full_name || 'the vet'}. The veterinarian will contact you to confirm timing and visit charges.`
          : `Your consultation request (Rs. 300) has been sent to ${selectedVet?.full_name || 'the vet'}. Once verified, your chat and video consultation will activate.`,
        [
          {
            text: 'View Consultations',
            onPress: () => navigation.navigate('MyConsultations')
          }
        ]
      );

    } catch (error) {
      console.error('Error submitting consultation:', error);
      Alert.alert('Error', error.message || 'Could not send request. Please try again later.');
    } finally {
      isSubmittingRef.current = false;
      setSubmittingRequest(false);
    }
  };

  const filteredVets = vets.filter(vet =>
    vet.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vet.specialization && vet.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getInitials = (name) => {
    if (!name) return 'V';
    const parts = name.trim().split(' ');
    if (parts.length > 0 && parts[0].toLowerCase() === 'dr.') {
      parts.shift();
    }
    if (parts.length > 0) {
      return parts[0][0].toUpperCase();
    }
    return 'V';
  };

  const renderVetCard = ({ item, index }) => {
    const isBusy = item.status === 'busy';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarBg}>
              <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: isBusy ? '#FF3B30' : '#58D66D' }]} />
          </View>

          <View style={styles.vetInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.vetName}>{item.full_name}</Text>
              <MaterialCommunityIcons name="check-decagram" size={16} color="#58D66D" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.vetSpecialization}>
              {item.specialization || 'Generalist'}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.ratingContainer}>
                <Feather name="star" size={12} color="#F5B041" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>{item.rating || '5.0'}</Text>
              </View>
              <View style={styles.locationContainer}>
                <Feather name="map-pin" size={12} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.locationText}>{item.district || t('Location Pending')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.experienceRow}>
          <Text style={styles.experienceLabel}>Experience: <Text style={styles.experienceValue}>{item.experience_years ? (item.experience_years + ' years') : 'Clinical'}</Text></Text>
          <View style={[styles.availabilityBadge, { backgroundColor: isBusy ? '#FFEBEB' : '#E8F8EA' }]}>
            <Text style={[styles.availabilityText, { color: isBusy ? '#FF3B30' : '#58D66D' }]}>
              {isBusy ? 'Busy' : 'Available Now'}
            </Text>
          </View>
        </View>

        {/* Consultation Mode and Fee Badges */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
          {item.consultation_mode === 'Video Only' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Feather name="video" size={13} color="#0284C7" style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7' }}>{t('Video Consult Only')}</Text>
            </View>
          ) : item.consultation_mode === 'Chat Only' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Feather name="message-square" size={13} color="#D97706" style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>{t('Chat Consult Only')}</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Feather name="message-square" size={13} color="#059669" style={{ marginRight: 4 }} />
              <Feather name="video" size={13} color="#059669" style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>{t('Chat & Video Available')}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#86EFAC' }}>
            <MaterialCommunityIcons name="cash-check" size={14} color="#059669" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857' }}>{t('Rs. 300 / Consultation')}</Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          {item.consultation_mode === 'Video Only' ? (
            <TouchableOpacity style={[styles.chatBtn, { backgroundColor: '#0284C7' }]} onPress={() => openConsultModal(item, 'video_consult')}>
              <Feather name="video" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.chatBtnText}>{t('Req. Video Consult')}</Text>
            </TouchableOpacity>
          ) : item.consultation_mode === 'Chat Only' ? (
            <TouchableOpacity style={styles.chatBtn} onPress={() => openConsultModal(item, 'online_chat')}>
              <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.chatBtnText}>{t('Req. Online Chat')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.chatBtn} onPress={() => openConsultModal(item, 'online_chat')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="message-square" size={14} color="#FFF" style={{ marginRight: 4 }} />
                <Feather name="video" size={14} color="#FFF" style={{ marginRight: 7 }} />
              </View>
              <Text style={styles.chatBtnText}>{t('Req. Online Consult')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.bookBtn} onPress={() => openConsultModal(item, 'physical_appointment')}>
          <Feather name="calendar" size={16} color="#D98A22" style={{ marginRight: 8 }} />
          <Text style={styles.bookBtnText}>Book Physical Appointment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />

      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Veterinarians</Text>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#FFF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search veterinarians..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#58D66D" />
          <Text style={styles.loadingText}>{t('Fetching vets in your area...')}</Text>
        </View>
      ) : filteredVets.length > 0 ? (
        <FlatList
          style={{ flex: 1, backgroundColor: colors.background }}
          data={filteredVets}
          renderItem={renderVetCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            params.initialRecord ? (
              <View style={{
                marginBottom: 14,
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <MaterialCommunityIcons name="file-document-check-outline" size={20} color="#059669" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#34D399' : '#047857' }}>
                    Consultation for Livestock #{params.initialRecord.animalId || params.initialRecord.id}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    Report: {params.initialRecord.disease || 'AI Scan'} will be forwarded to the chosen doctor.
                  </Text>
                </View>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="doctor" size={64} color="#CCC" />
          <Text style={styles.emptyText}>{t('No veterinarians found in your area')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>{t('Refresh')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Consultation Request Modal */}
      <Modal visible={consultModalVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '92%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                {consultType === 'video_consult'
                  ? t('Request Video Consultation')
                  : consultType === 'online_chat'
                    ? t('Request Online Consultation')
                    : t('Book Physical Appointment')}
              </Text>
              <Text style={styles.modalSubtitle}>with Dr. {selectedVet?.full_name?.replace('Dr. ', '')}</Text>

              {/* Mode Selector if Dr supports both */}
              {(selectedVet?.consultation_mode === 'Chat + Video' || !selectedVet?.consultation_mode) && consultType !== 'physical_appointment' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: consultType === 'online_chat' ? colors.primary : (isDark ? '#1E293B' : '#F1F5F9'),
                      borderWidth: 1,
                      borderColor: consultType === 'online_chat' ? colors.primary : colors.border
                    }}
                    onPress={() => setConsultType('online_chat')}
                  >
                    <Feather name="message-square" size={14} color={consultType === 'online_chat' ? '#FFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: consultType === 'online_chat' ? '#FFF' : colors.textPrimary }}>
                      {t('Chat Consult')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: consultType === 'video_consult' ? '#0284C7' : (isDark ? '#1E293B' : '#F1F5F9'),
                      borderWidth: 1,
                      borderColor: consultType === 'video_consult' ? '#0284C7' : colors.border
                    }}
                    onPress={() => setConsultType('video_consult')}
                  >
                    <Feather name="video" size={14} color={consultType === 'video_consult' ? '#FFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: consultType === 'video_consult' ? '#FFF' : colors.textPrimary }}>
                      {t('Video Consult')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Reason for Consultation */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.inputLabel}>Reason for Consultation *</Text>
                  {errors.reason ? (
                    <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '600' }}>{errors.reason}</Text>
                  ) : null}
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    { height: 80, textAlignVertical: 'top' },
                    errors.reason ? { borderColor: '#EF4444', borderWidth: 1.5, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2' } : null
                  ]}
                  placeholder="Describe your animal's issue or symptoms..."
                  placeholderTextColor={colors.placeholderText || '#94A3B8'}
                  value={reason}
                  onChangeText={(text) => {
                    setReason(text);
                    if (errors.reason) {
                      setErrors(prev => ({ ...prev, reason: validateReasonString(text) }));
                    }
                  }}
                  multiline
                />
              </View>

              {/* Physical Appointment Date & Time */}
              {consultType === 'physical_appointment' && (
                <>
                  <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
                      {errors.appointmentDate ? (
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '600' }}>{errors.appointmentDate}</Text>
                      ) : null}
                    </View>

                    {/* Quick Date Chips */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                          backgroundColor: appointmentDate === getFormattedFutureDate(0) ? colors.primary : (isDark ? '#1E293B' : '#F1F5F9'),
                          borderWidth: 1,
                          borderColor: appointmentDate === getFormattedFutureDate(0) ? colors.primary : colors.border
                        }}
                        onPress={() => {
                          const d = getFormattedFutureDate(0);
                          setAppointmentDate(d);
                          setErrors(prev => ({ ...prev, appointmentDate: '' }));
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: appointmentDate === getFormattedFutureDate(0) ? '#FFF' : colors.textPrimary }}>
                          {t('Today')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                          backgroundColor: appointmentDate === getFormattedFutureDate(1) ? colors.primary : (isDark ? '#1E293B' : '#F1F5F9'),
                          borderWidth: 1,
                          borderColor: appointmentDate === getFormattedFutureDate(1) ? colors.primary : colors.border
                        }}
                        onPress={() => {
                          const d = getFormattedFutureDate(1);
                          setAppointmentDate(d);
                          setErrors(prev => ({ ...prev, appointmentDate: '' }));
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: appointmentDate === getFormattedFutureDate(1) ? '#FFF' : colors.textPrimary }}>
                          {t('Tomorrow')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                          backgroundColor: appointmentDate === getFormattedFutureDate(2) ? colors.primary : (isDark ? '#1E293B' : '#F1F5F9'),
                          borderWidth: 1,
                          borderColor: appointmentDate === getFormattedFutureDate(2) ? colors.primary : colors.border
                        }}
                        onPress={() => {
                          const d = getFormattedFutureDate(2);
                          setAppointmentDate(d);
                          setErrors(prev => ({ ...prev, appointmentDate: '' }));
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: appointmentDate === getFormattedFutureDate(2) ? '#FFF' : colors.textPrimary }}>
                          {t('+2 Days')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={[
                        styles.textInput,
                        errors.appointmentDate ? { borderColor: '#EF4444', borderWidth: 1.5, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2' } : null
                      ]}
                      placeholder={getFormattedFutureDate(0)}
                      placeholderTextColor={colors.placeholderText || '#94A3B8'}
                      value={appointmentDate}
                      maxLength={10}
                      keyboardType="numbers-and-punctuation"
                      onChangeText={(text) => {
                        setAppointmentDate(text);
                        if (errors.appointmentDate) {
                          setErrors(prev => ({ ...prev, appointmentDate: validateDateString(text) }));
                        }
                      }}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={styles.inputLabel}>Time (24-Hour HH:MM) *</Text>
                      {errors.appointmentTime ? (
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '600' }}>{errors.appointmentTime}</Text>
                      ) : null}
                    </View>

                    {/* Quick Time Slots */}
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      {['09:30', '11:00', '14:30', '16:00', '17:30'].map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 10,
                            backgroundColor: appointmentTime === slot ? '#0284C7' : (isDark ? '#1E293B' : '#F1F5F9'),
                            borderWidth: 1,
                            borderColor: appointmentTime === slot ? '#0284C7' : colors.border
                          }}
                          onPress={() => {
                            setAppointmentTime(slot);
                            setErrors(prev => ({ ...prev, appointmentTime: '' }));
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: appointmentTime === slot ? '#FFF' : colors.textPrimary }}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={[
                        styles.textInput,
                        errors.appointmentTime ? { borderColor: '#EF4444', borderWidth: 1.5, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2' } : null
                      ]}
                      placeholder="14:30"
                      placeholderTextColor={colors.placeholderText || '#94A3B8'}
                      value={appointmentTime}
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                      onChangeText={(text) => {
                        setAppointmentTime(text);
                        if (errors.appointmentTime) {
                          setErrors(prev => ({ ...prev, appointmentTime: validateTimeString(text, appointmentDate) }));
                        }
                      }}
                    />
                  </View>
                </>
              )}

              {/* Consultation Fee (Rs. 300) & Payment Section */}
              <View style={{
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
                padding: 12,
                marginBottom: 16
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="wallet-outline" size={18} color="#D97706" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FBBF24' : '#B45309' }}>
                      {consultType === 'physical_appointment' ? t('Physical Appointment Fee') : t('Consultation Fee (Rs. 300)')}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: consultType === 'physical_appointment' ? '#0284C7' : '#D97706', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>
                      {consultType === 'physical_appointment' ? t('Custom / Mutually Agreed') : 'Rs. 300'}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: isDark ? '#CBD5E1' : '#92400E', marginBottom: 8, lineHeight: 16 }}>
                  {consultType === 'physical_appointment'
                    ? t('Physical appointment charges are set by the veterinarian based on distance and clinical treatment. Enter payment proof if agreed in advance, or pay during visit.')
                    : t('Transfer Rs. 300 to JazzCash (03054758667) and enter TID with receipt screenshot below.')}
                </Text>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>
                    {t('Sender Phone Number')}
                  </Text>
                  <TextInput
                    style={[styles.textInput, { height: 42, paddingVertical: 8 }]}
                    placeholder="03XXXXXXXXX"
                    placeholderTextColor={colors.placeholderText || '#94A3B8'}
                    value={senderPhone}
                    onChangeText={setSenderPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>
                    {t('TID / Transaction ID')}
                  </Text>
                  <TextInput
                    style={[styles.textInput, { height: 42, paddingVertical: 8 }]}
                    placeholder="e.g. 11223344556"
                    placeholderTextColor={colors.placeholderText || '#94A3B8'}
                    value={transactionId}
                    onChangeText={setTransactionId}
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: proofImage ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7') : (isDark ? '#334155' : '#E2E8F0'),
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: proofImage ? '#10B981' : colors.border
                    }}
                    onPress={handlePickReceipt}
                  >
                    <Feather name={proofImage ? "check-circle" : "camera"} size={14} color={proofImage ? "#059669" : colors.textPrimary} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: proofImage ? "#059669" : colors.textPrimary }}>
                      {proofImage ? t('Receipt Attached') : t('Attach Receipt')}
                    </Text>
                  </TouchableOpacity>

                  {proofImage && (
                    <TouchableOpacity
                      onPress={() => setProofImage(null)}
                      style={{ padding: 8 }}
                    >
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {params.initialRecord && (
                <View style={{
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                  padding: 12,
                  marginBottom: 16,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="check-decagram" size={16} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#34D399' : '#047857' }}>
                      AI Medical Report Attached
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {params.initialRecord.imageUrl || params.initialRecord.uri ? (
                      <Image
                        source={{ uri: params.initialRecord.imageUrl || params.initialRecord.uri }}
                        style={{ width: 44, height: 44, borderRadius: 8, marginRight: 10, backgroundColor: '#E2E8F0' }}
                      />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                        Livestock #{params.initialRecord.animalId || params.initialRecord.id || 'N/A'} ({params.initialRecord.animalType || 'Livestock'})
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        Diagnosis: {params.initialRecord.disease || params.initialRecord.name} · {params.initialRecord.confidence}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.cancelBtn, submittingRequest && { opacity: 0.5 }]} 
                  onPress={() => setConsultModalVisible(false)}
                  disabled={submittingRequest}
                >
                  <Text style={styles.cancelBtnText}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.submitBtn, submittingRequest && { opacity: 0.7 }]} 
                  onPress={submitConsultationRequest}
                  disabled={submittingRequest}
                  activeOpacity={0.8}
                >
                  {submittingRequest ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.submitBtnText}>{t('Submitting Request...')}</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitBtnText}>{t('Submit Request')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
