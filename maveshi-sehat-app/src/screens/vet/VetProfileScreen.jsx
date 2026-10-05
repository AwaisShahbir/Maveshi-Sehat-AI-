import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Switch, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, updateProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import styles from '../../styles/VetProfileScreenStyles';

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
              profile.enforceAdminLanguage ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.menuSubtitleActive}>
                    {profile.language === 'English' ? 'English' : (profile.language === 'Urdu' ? 'Urdu' : 'Both (English and Urdu)')}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#999' }}>Set by Admin</Text>
                </View>
              ) : (
                <Text style={styles.menuSubtitleActive}>
                  {profile.language === 'English' ? 'English' : (profile.language === 'Urdu' ? 'Urdu' : 'Both (English and Urdu)')}
                </Text>
              ), 
              profile.enforceAdminLanguage 
                ? () => Alert.alert(t('Managed by Admin', 'ایڈمن کنٹرولڈ'), t('Language is currently set centrally by the administrator.', 'زبان فی الحال ایڈمنسٹریٹر کے زیر انتظام ہے۔'))
                : () => setLangModalVisible(true)
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

      {/* Language Selection Modal (Available when Admin enforcement is OFF) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Your Language</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {[
              { id: 'English', label: 'English' },
              { id: 'Urdu', label: 'Urdu' },
              { id: 'Both', label: 'Both (English and Urdu)' }
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
                <Text style={[styles.langOptionText, profile.language === item.id && styles.langOptionTextSelected]}>
                  {item.label}
                </Text>
                {profile.language === item.id && (
                  <Feather name="check" size={20} color="#58D66D" />
                )}
              </TouchableOpacity>
            ))}
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
