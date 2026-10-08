import React, { useState, useEffect } from 'react';
import { 
  View, Text, SafeAreaView, FlatList, TextInput, 
  TouchableOpacity, StatusBar, ActivityIndicator, Platform, Alert, Image, Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const userName = profile.userName || params.userName || 'Awais shabbir ';
  const userId = profile.userId || params.userId || 2;

  const [vets, setVets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [consultModalVisible, setConsultModalVisible] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);
  const [consultType, setConsultType] = useState('online_chat'); // 'online_chat' or 'physical_appointment'
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
    });
    return () => unsubscribeProfile();
  }, []);

  const fetchVets = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
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

  const openConsultModal = (vet, type) => {
    setSelectedVet(vet);
    setConsultType(type);
    setConsultModalVisible(true);
  };

  const submitConsultationRequest = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please provide a reason for the consultation.');
      return;
    }
    if (consultType === 'physical_appointment' && (!appointmentDate || !appointmentTime)) {
      Alert.alert('Required', 'Please provide both date and time for the physical appointment.');
      return;
    }

    try {
      setLoading(true);
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: userId,
          vet_id: selectedVet.id,
          type: consultType,
          reason: reason,
          appointment_date: consultType === 'physical_appointment' ? `${appointmentDate} ${appointmentTime}` : null,
          ai_record_data: params.initialRecord || null
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
      
      Alert.alert(t('Request Sent'),
        'Your request has been sent to the vet. You can track its status in your Consultations dashboard.',
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
      );
      
    } catch (error) {
      console.error('Error submitting consultation:', error);
      Alert.alert('Error', 'Could not send request. Please try again later.');
    } finally {
      setLoading(false);
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
    const isBusy = index % 3 === 2; // Mocking busy status for UI showcase

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
                <Text style={styles.ratingText}>4.8 <Text style={styles.ratingCount}>(127)</Text></Text>
              </View>
              <View style={styles.locationContainer}>
                <Feather name="map-pin" size={12} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.locationText}>{item.district || 'Lahore, Punjab'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.experienceRow}>
          <Text style={styles.experienceLabel}>Experience: <Text style={styles.experienceValue}>{item.experience_years || 5} years</Text></Text>
          <View style={[styles.availabilityBadge, { backgroundColor: isBusy ? '#FFEBEB' : '#E8F8EA' }]}>
            <Text style={[styles.availabilityText, { color: isBusy ? '#FF3B30' : '#58D66D' }]}>
              {isBusy ? 'Busy' : 'Available Now'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.chatBtn} onPress={() => openConsultModal(item, 'online_chat')}>
            <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.chatBtnText}>Req. Online Consult</Text>
          </TouchableOpacity>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {consultType === 'online_chat' ? 'Request Online Consult' : 'Book Physical Appointment'}
            </Text>
            <Text style={styles.modalSubtitle}>with Dr. {selectedVet?.full_name?.replace('Dr. ', '')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason for Consultation:</Text>
              <TextInput
                style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Describe your animal's issue..."
                value={reason}
                onChangeText={setReason}
                multiline
              />
            </View>

            {consultType === 'physical_appointment' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date (e.g. YYYY-MM-DD):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2023-10-15"
                    value={appointmentDate}
                    onChangeText={setAppointmentDate}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Time (e.g. 14:30):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="14:30"
                    value={appointmentTime}
                    onChangeText={setAppointmentTime}
                  />
                </View>
              </>
            )}

            {params.initialRecord && (
              <View style={styles.aiRecordNotice}>
                <Feather name="info" size={16} color="#0056b3" style={{ marginRight: 6 }} />
                <Text style={styles.aiRecordNoticeText}>AI Scan Report will be attached automatically.</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConsultModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitConsultationRequest}>
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
