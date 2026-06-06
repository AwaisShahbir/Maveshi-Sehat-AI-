import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Platform, 
  TextInput,
  Switch,
  Modal,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, updateProfile, subscribeProfile } from '../../utils/profileStore';
import { getRecords, subscribe, loadRecords } from '../../utils/recordsStore';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.userId || 'user_123';

  // Store States
  const [profile, setProfile] = useState(getProfile());
  const [records, setRecords] = useState(getRecords());

  // Edit Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile.userName);
  const [editNameUrdu, setEditNameUrdu] = useState(profile.userNameUrdu);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editLocation, setEditLocation] = useState(profile.location);

  // Subscriptions
  useEffect(() => {
    // Initial fetch of records from DB for the user
    loadRecords(profile.userName).then(loadedRecords => {
      setRecords(loadedRecords);
    }).catch(err => console.log('Error loading records for profile:', err));

    // Subscribe to profile modifications
    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
      // Re-load records when user profile name changes
      loadRecords(updatedProfile.userName).then(loadedRecords => {
        setRecords(loadedRecords);
      }).catch(err => console.log('Error reloading records for profile:', err));
    });

    // Subscribe to records modifications
    const unsubscribeRecords = subscribe((updatedRecords) => {
      setRecords(updatedRecords);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeRecords();
    };
  }, []);

  // Sync edit modal fields when profile state changes
  useEffect(() => {
    setEditName(profile.userName);
    setEditNameUrdu(profile.userNameUrdu);
    setEditPhone(profile.phone);
    setEditLocation(profile.location);
  }, [profile]);

  // Calculate dynamic stats
  const totalScans = records.length;
  const uniqueAnimals = new Set(records.map(r => r.animalId)).size;

  // Derive Initials (e.g. "Muhammad Ahmed" -> "MA")
  const getInitials = (name) => {
    if (!name) return 'MA';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    updateProfile({
      userName: editName,
      userNameUrdu: editNameUrdu || 'صارف',
      phone: editPhone,
      location: editLocation
    });
    setEditModalVisible(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const toggleNotifications = (val) => {
    updateProfile({ notificationsEnabled: val });
  };

  const toggleLanguage = () => {
    const nextLang = profile.language === 'English' ? 'Urdu' : 'English';
    updateProfile({ language: nextLang });
    Alert.alert('Language / زبان', `App language set to ${nextLang === 'English' ? 'English' : 'Urdu (اردو)'}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <Text style={styles.headerUrdu}>پروفائل اور ترتیبات</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.cardTopRow}>
            {/* Initials Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(profile.userName)}</Text>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile.userName}</Text>
              <Text style={styles.userNameUrdu}>{profile.userNameUrdu}</Text>
              
              <View style={styles.roleBadge}>
                <Feather name="user" size={12} color="#58D66D" style={{ marginRight: 4 }} />
                <Text style={styles.roleText}>Farmer / کسان</Text>
              </View>
            </View>

            {/* Edit Icon */}
            <TouchableOpacity style={styles.editIconBtn} onPress={() => setEditModalVisible(true)}>
              <Feather name="edit-2" size={20} color="#58D66D" />
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{uniqueAnimals}</Text>
              <Text style={styles.statLabel}>Livestock</Text>
              <Text style={styles.statUrdu}>مویشی</Text>
            </View>
            <View style={styles.statColumnDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={styles.statLabel}>AI Scans</Text>
              <Text style={styles.statUrdu}>اسکین</Text>
            </View>
            <View style={styles.statColumnDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.consultationsCount}</Text>
              <Text style={styles.statLabel}>Consultations</Text>
              <Text style={styles.statUrdu}>مشاورت</Text>
            </View>
          </View>
        </View>

        {/* Settings Groups */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="user" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>Edit Profile</Text>
              <Text style={styles.itemSubtitle}>پروفائل ایڈٹ کریں</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="phone" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>Phone Number</Text>
              <Text style={styles.itemSubtitle}>فون نمبر</Text>
              <Text style={styles.itemVal}>{profile.phone}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="map-pin" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>Location</Text>
              <Text style={styles.itemSubtitle}>مقام</Text>
              <Text style={styles.itemVal}>{profile.location}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={[styles.settingsGroup, { marginBottom: 100 }]}>
          <Text style={styles.groupTitle}>Preferences</Text>

          <TouchableOpacity style={styles.settingsItem} onPress={toggleLanguage}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="globe" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>Language</Text>
              <Text style={styles.itemSubtitle}>زبان</Text>
              <Text style={styles.itemVal}>{profile.language === 'English' ? 'English / اردو' : 'اردو / English'}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.settingsItem}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="bell" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>Notifications</Text>
              <Text style={styles.itemSubtitle}>اطلاعات</Text>
            </View>
            <Switch
              value={profile.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#dcdcdc', true: '#A3E6B2' }}
              thumbColor={profile.notificationsEnabled ? '#58D66D' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Info</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>Full Name (English)</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter Full Name"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>نام (Urdu Name)</Text>
              <TextInput
                style={styles.textInput}
                value={editNameUrdu}
                onChangeText={setEditNameUrdu}
                placeholder="اپنا نام درج کریں"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter Phone Number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Enter Location (City, Province)"
                placeholderTextColor="#999"
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Changes / محفوظ کریں</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan', { userName: profile.userName, userId })}>
            <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>AI Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords', { userName: profile.userName, userId })}>
            <Feather name="file-text" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName: profile.userName, userId })}>
            <Feather name="message-square" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>Forum</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Feather name="user" size={24} color="#FFF" />
            <Text style={[styles.navText, { color: '#FFF' }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAF9' },
  scrollContent: { paddingBottom: 20 },
  
  header: {
    backgroundColor: '#58D66D',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  headerUrdu: { fontSize: 16, color: '#E8F8EA', marginTop: 4, fontWeight: '500' },

  profileCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#58D66D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  userNameUrdu: { fontSize: 14, color: '#666', marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: 10, color: '#58D66D', fontWeight: 'bold' },
  editIconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F7F9F8',
    borderWidth: 1,
    borderColor: '#E2E6E4',
  },
  statsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4, fontWeight: '600' },
  statUrdu: { fontSize: 9, color: '#999', marginTop: 2 },
  statColumnDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F0F0F0',
  },

  settingsGroup: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F9F8',
  },
  itemIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  itemSubtitle: { fontSize: 11, color: '#999', marginTop: 1 },
  itemVal: { fontSize: 12, color: '#58D66D', fontWeight: '600', marginTop: 3 },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  inputLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 12, marginBottom: 6 },
  textInput: {
    backgroundColor: '#F7F9F8',
    borderWidth: 1,
    borderColor: '#E2E6E4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#58D66D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveBtnText: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },

  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CB85C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#FFF', marginTop: 4, fontWeight: '600' }
});
