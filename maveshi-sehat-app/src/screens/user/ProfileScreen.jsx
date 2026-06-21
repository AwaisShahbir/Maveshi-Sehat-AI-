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
import { t } from '../../utils/translate';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.userId || 'user_123';

  
  const [profile, setProfile] = useState(getProfile());
  const [records, setRecords] = useState(getRecords());

  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile.userName);
  const [editNameUrdu, setEditNameUrdu] = useState(profile.userNameUrdu);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editLocation, setEditLocation] = useState(profile.location);

  
  useEffect(() => {
    
    loadRecords(profile.userName).then(loadedRecords => {
      setRecords(loadedRecords);
    }).catch(err => console.log('Error loading records for profile:', err));

    
    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
      
      loadRecords(updatedProfile.userName).then(loadedRecords => {
        setRecords(loadedRecords);
      }).catch(err => console.log('Error reloading records for profile:', err));
    });

    
    const unsubscribeRecords = subscribe((updatedRecords) => {
      setRecords(updatedRecords);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeRecords();
    };
  }, []);

  
  useEffect(() => {
    setEditName(profile.userName);
    setEditNameUrdu(profile.userNameUrdu);
    setEditPhone(profile.phone);
    setEditLocation(profile.location);
  }, [profile]);

  
  const totalScans = records.length;
  const uniqueAnimals = new Set(records.map(r => r.animalId)).size;

  
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

  const openLanguageSelector = () => {
    setLangModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('Profile & Settings', 'پروفائل اور ترتیبات')}</Text>
        </View>

        
        <View style={styles.profileCard}>
          <View style={styles.cardTopRow}>
            
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(profile.userName)}</Text>
            </View>

            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile.userName}</Text>
              <Text style={styles.userNameUrdu}>{profile.userNameUrdu}</Text>
              
              <View style={styles.roleBadge}>
                <Feather name="user" size={12} color="#58D66D" style={{ marginRight: 4 }} />
                <Text style={styles.roleText}>{t('Farmer', 'کسان')}</Text>
              </View>
            </View>

            
            <TouchableOpacity style={styles.editIconBtn} onPress={() => setEditModalVisible(true)}>
              <Feather name="edit-2" size={20} color="#58D66D" />
            </TouchableOpacity>
          </View>

          
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{uniqueAnimals}</Text>
              <Text style={styles.statLabel}>{t('Livestock', 'مویشی')}</Text>
            </View>
            <View style={styles.statColumnDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={styles.statLabel}>{t('AI Scans', 'اسکین')}</Text>
            </View>
            <View style={styles.statColumnDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.consultationsCount}</Text>
              <Text style={styles.statLabel}>{t('Consultations', 'مشاورت')}</Text>
            </View>
          </View>
        </View>

        
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>{t('Account', 'کھاتہ / اکاؤنٹ')}</Text>
          
          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="user" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Edit Profile', 'پروفائل تبدیل کریں')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="phone" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Phone Number', 'فون نمبر')}</Text>
              <Text style={styles.itemVal}>{profile.phone}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="map-pin" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Location', 'مقام / پتہ')}</Text>
              <Text style={styles.itemVal}>{profile.location}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={[styles.settingsGroup, { marginBottom: 100 }]}>
          <Text style={styles.groupTitle}>{t('Preferences', 'ترجیحات')}</Text>

          <TouchableOpacity style={styles.settingsItem} onPress={openLanguageSelector}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="globe" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Language', 'زبان')}</Text>
              <Text style={styles.itemSubtitle}>{t('Preferred App Language', 'ترجیحی زبان')}</Text>
              <Text style={styles.itemVal}>
                {profile.language === 'English' 
                  ? '🇬🇧 English' 
                  : (profile.language === 'Urdu' ? '🇵🇰 اردو (Urdu)' : '🔄 English / اردو (Both)')}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.settingsItem}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="bell" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Notifications', 'اطلاعات / نوٹیفکیشن')}</Text>
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

      
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Edit Profile Info', 'پروفائل تبدیل کریں')}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>{t('Full Name (English)', 'پورا نام (انگریزی)')}</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder={t('Enter Full Name', 'پورا نام انگریزی میں درج کریں')}
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>{t('Full Name (Urdu)', 'پورا نام (اردو)')}</Text>
              <TextInput
                style={styles.textInput}
                value={editNameUrdu}
                onChangeText={setEditNameUrdu}
                placeholder={t('Enter Urdu Name', 'اپنا نام اردو میں درج کریں')}
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>{t('Phone Number', 'فون نمبر')}</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder={t('Enter Phone Number', 'فون نمبر درج کریں')}
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>{t('Location', 'مقام / پتہ')}</Text>
              <TextInput
                style={styles.textInput}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder={t('Enter Location (City, Province)', 'مقام درج کریں (شہر، صوبہ)')}
                placeholderTextColor="#999"
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>{t('Save Changes', 'محفوظ کریں')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal
        animationType="slide"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Select Language', 'زبان کا انتخاب کریں')}</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.langOption, profile.language === 'English' && styles.langOptionSelected]}
              onPress={() => {
                updateProfile({ language: 'English' });
                setLangModalVisible(false);
              }}
            >
              <Text style={[styles.langOptionText, profile.language === 'English' && styles.langOptionTextSelected]}>
                🇬🇧 English
              </Text>
              {profile.language === 'English' && <Feather name="check" size={18} color="#58D66D" />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, profile.language === 'Urdu' && styles.langOptionSelected]}
              onPress={() => {
                updateProfile({ language: 'Urdu' });
                setLangModalVisible(false);
              }}
            >
              <Text style={[styles.langOptionText, profile.language === 'Urdu' && styles.langOptionTextSelected]}>
                🇵🇰 Urdu (اردو)
              </Text>
              {profile.language === 'Urdu' && <Feather name="check" size={18} color="#58D66D" />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, profile.language === 'Both' && styles.langOptionSelected]}
              onPress={() => {
                updateProfile({ language: 'Both' });
                setLangModalVisible(false);
              }}
            >
              <Text style={[styles.langOptionText, profile.language === 'Both' && styles.langOptionTextSelected]}>
                🔄 Both (English / اردو)
              </Text>
              {profile.language === 'Both' && <Feather name="check" size={18} color="#58D66D" />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Home', 'ہوم')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan', { userName: profile.userName, userId })}>
            <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('AI Scan', 'اسکین')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords', { userName: profile.userName, userId })}>
            <Feather name="file-text" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Records', 'ریکارڈز')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName: profile.userName, userId })}>
            <Feather name="message-square" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Forum', 'فورم')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Feather name="user" size={24} color="#FFF" />
            <Text style={[styles.navText, { color: '#FFF' }]}>{t('Profile', 'پروفائل')}</Text>
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
  navText: { fontSize: 10, color: '#FFF', marginTop: 4, fontWeight: '600' },

  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E6E4',
    marginBottom: 12,
    backgroundColor: '#F7F9F8'
  },
  langOptionSelected: {
    borderColor: '#58D66D',
    backgroundColor: '#E8F8EA'
  },
  langOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  langOptionTextSelected: {
    color: '#58D66D',
    fontWeight: 'bold'
  }
});
