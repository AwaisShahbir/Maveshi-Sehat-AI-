import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Switch, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, updateProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';

export default function VetProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [profile, setProfile] = useState(getProfile());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
    });
    return () => unsubscribe();
  }, []);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'editProfile' | 'license' | 'specialization' | 'availability' | null

  // Form states
  const [formName, setFormName] = useState(profile.userName || 'Dr. Rahim Malik');
  const [formLicense, setFormLicense] = useState(profile.license || 'VET-2023-9876');
  const [formSpec, setFormSpec] = useState(profile.specialization || 'Livestock Disease Specialist');
  const [formAvail, setFormAvail] = useState(profile.availability || 'Mon-Fri: 9 AM - 5 PM');

  const handleSave = () => {
    updateProfile({
      userName: formName,
      license: formLicense,
      specialization: formSpec,
      availability: formAvail
    });
    setProfile(getProfile());
    setActiveModal(null);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const renderMenuItem = (icon, title, subtitle, rightElement, onPress) => {
    const profile = getProfile();
    const lang = profile.language || 'English';
    
    let leftText = title;
    let rightText = '';
    
    if (lang === 'Urdu') {
      leftText = subtitle || title;
    } else if (lang === 'English') {
      leftText = title;
    } else if (lang === 'Both') {
      leftText = title;
      rightText = subtitle;
    }

    return (
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuLeft}>
          <View style={styles.menuIconBox}>
            <Feather name={icon} size={20} color="#58D66D" />
          </View>
          <Text style={styles.menuTitle}>{leftText}</Text>
        </View>
        <View style={styles.menuRight}>
          {rightElement || (
            <>
              {rightText ? <Text style={styles.menuSubtitle}>{rightText}</Text> : null}
              <Feather name="chevron-right" size={20} color="#CCC" />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const userName = profile.userName || 'Dr. Rahim Malik';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <Text style={styles.screenTitle}></Text>
          </View>
          
          <View style={styles.profileInfoContainer}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <TouchableOpacity style={styles.editAvatarBtn} onPress={() => setActiveModal('editProfile')}>
                <Feather name="edit-2" size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.profileName}>{userName}</Text>
                        <Text style={styles.specializationText}>{profile.specialization || 'Livestock Disease Specialist'}</Text>
            
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={16} color="#58D66D" style={{ marginRight: 6 }} />
              <Text style={styles.verifiedText}>{t('Verified Vet', 'تصدیق شدہ')}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>47</Text>
              <Text style={styles.statLabel}>{t('Cases', 'کیسز')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>{t('Prescriptions', 'نسخہ جات')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#F5B041' }]}>4.9★</Text>
              <Text style={styles.statLabel}>{t('Rating', 'ریٹنگ')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionHeading}>{t('Account', 'اکاؤنٹ')}</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('user', 'Edit Profile', 'پروفائل ترمیم کریں', null, () => setActiveModal('editProfile'))}
            <View style={styles.menuDivider} />
            {renderMenuItem('file-text', 'License Details', 'لائسنس کی تفصیلات', null, () => setActiveModal('license'))}
            <View style={styles.menuDivider} />
            {renderMenuItem('award', 'Specialization', 'تخصص', null, () => setActiveModal('specialization'))}
            <View style={styles.menuDivider} />
            {renderMenuItem('calendar', 'Availability Schedule', 'دستیابی شیڈول', null, () => setActiveModal('availability'))}
          </View>

          <Text style={styles.sectionHeading}>{t('Preferences', 'ترجیحات')}</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('globe', 'Language', 'زبان', 
              <Text style={styles.menuSubtitleActive}>
                {profile.language === 'English' ? 'English' : (profile.language === 'Urdu' ? 'Urdu' : 'Both')}
              </Text>, 
              () => setLangModalVisible(true)
            )}
            <View style={styles.menuDivider} />
            {renderMenuItem('bell', 'Notifications', 'اطلاعات', 
              <Switch
                trackColor={{ false: '#EAEAEA', true: '#58D66D' }}
                thumbColor="#FFF"
                ios_backgroundColor="#EAEAEA"
                onValueChange={() => setNotificationsEnabled(!notificationsEnabled)}
                value={notificationsEnabled}
              />
            )}
            <View style={styles.menuDivider} />
            {renderMenuItem('message-circle', 'Consultation Mode', 'مشاورت کا طریقہ', 
              <Text style={styles.menuSubtitleActive}>Chat + Video</Text>
            )}
          </View>

          <Text style={styles.sectionHeading}>{t('Support', 'مدد')}</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('help-circle', 'Help Center', 'مدد مرکز')}
            <View style={styles.menuDivider} />
            {renderMenuItem('headphones', 'Contact Admin', 'ایڈمن سے رابطہ')}
            <View style={styles.menuDivider} />
            {renderMenuItem('shield', 'Privacy Policy', 'رازداری')}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
            <Feather name="log-out" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>{t('Logout', 'لاگ آؤٹ')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Editor Modal */}
      <Modal visible={activeModal !== null} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'editProfile' && 'Edit Profile'}
                {activeModal === 'license' && 'License Details'}
                {activeModal === 'specialization' && 'Specialization'}
                {activeModal === 'availability' && 'Availability Schedule'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {activeModal === 'editProfile' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput style={styles.input} value={formName} onChangeText={setFormName} placeholder="Enter full name" />
              </View>
            )}

            {activeModal === 'license' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>License Number</Text>
                <TextInput style={styles.input} value={formLicense} onChangeText={setFormLicense} placeholder="e.g. VET-2023-9876" />
              </View>
            )}

            {activeModal === 'specialization' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialization</Text>
                <TextInput style={styles.input} value={formSpec} onChangeText={setFormSpec} placeholder="e.g. Livestock Specialist" />
              </View>
            )}

            {activeModal === 'availability' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Schedule</Text>
                <TextInput style={styles.input} value={formAvail} onChangeText={setFormAvail} placeholder="e.g. Mon-Fri: 9 AM - 5 PM" />
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Language Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetDashboard')}>
          <MaterialCommunityIcons name="home-variant-outline" size={26} color="#999" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetCases')}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={26} color="#999" />
          <Text style={styles.navText}>Cases</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetConsultations')}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color="#999" />
          <Text style={styles.navText}>Consult</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetHealthRecords')}>
          <MaterialCommunityIcons name="pulse" size={26} color="#999" />
          <Text style={styles.navText}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navProfile, styles.navProfileActive]}>
            <Text style={[styles.navProfileText, styles.navProfileTextActive]}>{initial}</Text>
          </View>
          <Text style={[styles.navText, { color: '#58D66D' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  scrollContent: { paddingBottom: 100 },
  headerSection: { backgroundColor: '#58D66D', paddingBottom: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { paddingHorizontal: 20, paddingTop: 10, height: 40 },
  screenTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  profileInfoContainer: { alignItems: 'center', marginTop: 10 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#58D66D' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  profileNameUrdu: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  specializationText: { fontSize: 14, color: '#E8F8EA', marginTop: 8 },
  specializationUrduText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  verifiedText: { fontSize: 12, fontWeight: 'bold', color: '#58D66D' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 25, borderRadius: 16, paddingVertical: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: -70 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#EAEAEA' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 4, textAlign: 'center' },
  contentSection: { marginTop: 80, paddingHorizontal: 20 },
  sectionHeading: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 10, marginLeft: 8, letterSpacing: 0.5 },
  menuCard: { backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F7F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuSubtitle: { fontSize: 13, color: '#999', marginRight: 8 },
  menuSubtitleActive: { fontSize: 13, fontWeight: '600', color: '#58D66D', backgroundColor: '#E8F8EA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  menuDivider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 48 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 16, marginBottom: 40, borderWidth: 1, borderColor: '#FFEBEB' },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#FF3B30' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 20, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEE', elevation: 10 },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#999', marginTop: 4, fontWeight: '500' },
  navProfile: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  navProfileActive: { backgroundColor: '#58D66D' },
  navProfileText: { fontSize: 10, fontWeight: 'bold', color: '#888' },
  navProfileTextActive: { color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 300 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalCloseBtn: { padding: 4 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#F4F7F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#EAEAEA' },
  saveBtn: { backgroundColor: '#58D66D', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
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
