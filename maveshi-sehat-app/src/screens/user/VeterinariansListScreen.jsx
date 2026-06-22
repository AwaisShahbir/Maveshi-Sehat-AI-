import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, 
  TouchableOpacity, StatusBar, ActivityIndicator, Platform, Alert, Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import LinearGradient from 'react-native-linear-gradient';

export default function VeterinariansListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [profile, setProfile] = useState(getProfile());
  const userName = profile.userName || params.userName || 'Awais shabbir ';
  const userId = params.userId || 1;

  const [vets, setVets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleChatNow = async (vet) => {
    try {
      setLoading(true);
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: userId,
          farmerName: userName,
          vetId: vet.id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start conversation');
      }

      navigation.navigate('Chat', {
        conversationId: data.id,
        partnerName: vet.full_name,
        partnerRole: 'vet',
        userName: userName,
        userRole: 'farmer',
        vetId: vet.id,
        initialRecord: params.initialRecord || null
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert(t('Error', 'خرابی'), t('Could not start consultation. Please try again.', 'مشاورت شروع نہیں کی جا سکی۔ براہ کرم دوبارہ کوشش کریں۔'));
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
            <Text style={styles.vetNameUrdu}>ڈاکٹر {item.full_name.replace('Dr. ', '')}</Text>
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
          <TouchableOpacity style={styles.chatBtn} onPress={() => handleChatNow(item)}>
            <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.chatBtnText}>Chat Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn}>
            <Feather name="phone" size={16} color="#58D66D" style={{ marginRight: 8 }} />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.bookBtn}>
          <Feather name="calendar" size={16} color="#D98A22" style={{ marginRight: 8 }} />
          <Text style={styles.bookBtnText}>Book Appointment / ملاقات بک کریں</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Veterinarians</Text>
          <Text style={styles.headerSubtitle}>ڈاکٹرز کی فہرست</Text>
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
          <Text style={styles.loadingText}>{t('Fetching vets in your area...', 'آپ کے علاقے میں ڈاکٹر تلاش کیے جا رہے ہیں...')}</Text>
        </View>
      ) : filteredVets.length > 0 ? (
        <FlatList
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
          <Text style={styles.emptyText}>{t('No veterinarians found in your area', 'آپ کے علاقے میں کوئی ڈاکٹر نہیں ملا')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>{t('Refresh', 'تازہ کریں')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },
  headerArea: {
    backgroundColor: '#58D66D',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitleContainer: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#E8F8EA',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    height: '100%',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    marginTop: -20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarWrapper: {
    marginRight: 16,
    position: 'relative',
  },
  avatarBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#58D66D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  vetInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vetNameUrdu: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  vetSpecialization: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingCount: {
    color: '#888',
    fontWeight: 'normal',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#888',
  },
  experienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  experienceLabel: {
    fontSize: 13,
    color: '#666',
  },
  experienceValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: '#58D66D',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 8,
  },
  chatBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#58D66D',
  },
  callBtnText: {
    color: '#58D66D',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookBtn: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#F5B041',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 24,
  },
  bookBtnText: {
    color: '#D98A22',
    fontSize: 14,
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
