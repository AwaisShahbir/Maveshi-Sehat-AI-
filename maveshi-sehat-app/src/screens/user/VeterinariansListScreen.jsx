import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';

export default function VeterinariansListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [profile, setProfile] = useState(getProfile());
  const userName = profile.userName || params.userName || 'Awais shabbir ';

  const [vets, setVets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Subscribe to profile updates
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
        vetId: vet.id
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

  const renderVetCard = ({ item }) => {
    const experienceText = item.experience_years 
      ? t(`${item.experience_years} Years Experience`, `${item.experience_years} سال کا تجربہ`)
      : t('Experienced Vet', 'تجربہ کار ڈاکٹر');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="doctor" size={28} color="#58D66D" />
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.vetInfo}>
            <Text style={styles.vetName}>{item.full_name}</Text>
            <Text style={styles.vetSpecialization}>
              {item.specialization || t('General Veterinarian', 'عام جانوروں کا ڈاکٹر')}
            </Text>
            <View style={styles.locationContainer}>
              <Feather name="map-pin" size={12} color="#666" />
              <Text style={styles.locationText}>{item.district}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.experienceText}>{experienceText}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.ratingContainer}>
            <Feather name="star" size={14} color="#FFB020" style={{ marginRight: 4 }} />
            <Text style={styles.ratingText}>{t('4.9 (Verified)', '4.9 (تصدیق شدہ)')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={() => handleChatNow(item)}
            activeOpacity={0.8}
          >
            <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.chatButtonText}>{t('Chat Now', 'مشورہ کریں')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const lang = profile.language || 'English';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {lang === 'English' && <Text style={styles.headerTitle}>Find Veterinarians</Text>}
          {lang === 'Urdu' && <Text style={styles.headerTitle}>جانوروں کے ڈاکٹر تلاش کریں</Text>}
          {lang === 'Both' && (
            <>
              <Text style={styles.headerTitle}>Find Veterinarians</Text>
              <Text style={styles.headerSubtitle}>جانوروں کے ڈاکٹر تلاش کریں</Text>
            </>
          )}
        </View>
        <View style={{ width: 24 }} /> {/* Balance back button spacing */}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('Search by name, specialty...', 'تلاش کریں...')}
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Veterinarian List */}
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
    backgroundColor: '#F8FAF9',
  },
  header: {
    backgroundColor: '#58D66D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 14,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    height: '100%',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
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
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F8EA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 12,
  },
  onlineBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#58D66D',
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vetSpecialization: {
    fontSize: 13,
    color: '#58D66D',
    fontWeight: '600',
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  experienceText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F8FAF9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  chatButton: {
    backgroundColor: '#58D66D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 12,
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
