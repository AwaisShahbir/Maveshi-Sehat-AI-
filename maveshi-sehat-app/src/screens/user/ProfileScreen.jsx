import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
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
import styles from '../../styles/ProfileScreenStyles';

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

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (params.userName && params.userName !== profile.userName) {
      updateProfile({ userName: params.userName });
    }

    loadRecords(params.userName || profile.userName).then(loadedRecords => {
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

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => navigation.replace('Welcome') }
      ]
    );
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
                            <View style={styles.roleBadge}>
                <Feather name="user" size={12} color="#58D66D" style={{ marginRight: 4 }} />
                <Text style={styles.roleText}>{t(t('Farmer', 'کسان'), 'کسان')}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editIconBtn} onPress={() => setEditModalVisible(true)}>
              <Feather name="edit-2" size={18} color="#58D66D" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{uniqueAnimals}</Text>
              <Text style={styles.statLabel}>{t('Livestock', 'مویشی')}</Text>
                          </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={styles.statLabel}>{t('AI Scans', 'اسکین')}</Text>
                          </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.consultationsCount}</Text>
              <Text style={styles.statLabel}>{t('Consultations', 'مشاورت')}</Text>
                          </View>
          </View>
        </View>

        <Text style={styles.groupTitle}>{t('Account', 'کھاتہ / اکاؤنٹ')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="user" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Edit Profile', 'پروفائل ایڈیٹ کریں')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="phone-call" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Phone Number', 'فون نمبر')}</Text>
              <Text style={styles.itemVal}>{profile.phone}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="map-pin" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Location', 'مقام / پتہ')}</Text>
              <Text style={styles.itemVal}>{profile.location}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <Text style={styles.groupTitle}>{t('Preferences', 'ترجیحات')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity 
            style={styles.settingsItem}
            activeOpacity={profile.enforceAdminLanguage ? 1 : 0.7}
            onPress={() => {
              if (profile.enforceAdminLanguage) {
                Alert.alert(t('Managed by Admin', 'ایڈمن کنٹرولڈ'), t('Language is currently set centrally by the administrator.', 'زبان فی الحال ایڈمنسٹریٹر کے زیر انتظام ہے۔'));
              } else {
                setLangModalVisible(true);
              }
            }}
          >
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="globe" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Language', 'زبان')}</Text>
              <Text style={styles.itemVal}>
                {profile.language === 'English' ? 'English' : (profile.language === 'Urdu' ? 'Urdu' : 'Both (English & Urdu)')}
              </Text>
            </View>
            {profile.enforceAdminLanguage ? (
              <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                {t('Set by Admin', 'ایڈمن کنٹرولڈ')}
              </Text>
            ) : (
              <Feather name="chevron-right" size={18} color="#888" />
            )}
          </TouchableOpacity>

          <View style={styles.settingsItem}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="bell" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Notifications', 'اطلاعات')}</Text>
            </View>
            <Switch
              value={profile.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#dcdcdc', true: '#58D66D' }}
              thumbColor={'#FFF'}
            />
          </View>

          <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="moon" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Dark Mode', 'ڈارک موڈ')}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#dcdcdc', true: '#58D66D' }}
              thumbColor={'#FFF'}
            />
          </View>
        </View>

        <Text style={styles.groupTitle}>{t('Support', 'مدد')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="shield" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Privacy Policy', 'رازداری کی پالیسی')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.itemIconBg, { backgroundColor: '#E8F8EA' }]}>
              <Feather name="help-circle" size={18} color="#58D66D" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{t('Help & Support', 'مدد اور معاونت')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#FF3B30" style={{ transform: [{ scaleX: -1 }], marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>{t(t('Logout', 'لاگ آؤٹ'), 'لاگ آؤٹ')}</Text>
        </TouchableOpacity>

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
              <Text style={styles.modalTitle}>{t('Edit Profile Info', 'پروفائل ایڈیٹ کریں')}</Text>
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

      {/* Language Selection Modal (Available when Admin enforcement is OFF) */}
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

            {[
              { id: 'English', label: '🇬🇧 English', sub: 'English' },
              { id: 'Urdu', label: '🇵🇰 اردو', sub: 'Urdu' },
              { id: 'Both', label: '🔄 Both (English / اردو)', sub: 'Bilingual Interface' }
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.langOption,
                  profile.language === item.id && styles.langOptionSelected
                ]}
                onPress={() => {
                  updateProfile({ language: item.id });
                  setLangModalVisible(false);
                }}
              >
                <View>
                  <Text style={[styles.langOptionText, profile.language === item.id && styles.langOptionTextSelected]}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{item.sub}</Text>
                </View>
                {profile.language === item.id && (
                  <Feather name="check" size={20} color="#58D66D" />
                )}
              </TouchableOpacity>
            ))}
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
