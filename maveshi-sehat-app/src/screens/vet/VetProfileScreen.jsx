import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Switch, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, updateProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetProfileScreenStyles';

export default function VetProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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

  const [stats, setStats] = useState({ cases: 0, prescriptions: 0, rating: '5.0★' });
  const [loadingStats, setLoadingStats] = useState(true);

  // Form states initialized dynamically from profile
  const [formName, setFormName] = useState(profile.userName || profile.fullName || '');
  const [formLicense, setFormLicense] = useState(profile.license || profile.pvmcNumber || '');
  const [formSpec, setFormSpec] = useState(profile.specialization || '');
  const [formAvail, setFormAvail] = useState(profile.availability || profile.availabilitySchedule || '');

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
  const vetId = profile.userId || params.userId;

  useEffect(() => {
    const fetchVetProfile = async () => {
      if (!vetId) return;
      try {
        const res = await fetch(`${baseUrl}/api/vet/profile?vetId=${vetId}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setFormName(data.fullName || '');
            setFormLicense(data.pvmcNumber || '');
            setFormSpec(data.specialization || '');
            setFormAvail(data.availabilitySchedule || '');
            setStats({
              cases: data.stats?.cases || 0,
              prescriptions: data.stats?.prescriptions || 0,
              rating: '5.0★'
            });
            updateProfile({
              userName: data.fullName,
              fullName: data.fullName,
              license: data.pvmcNumber,
              pvmcNumber: data.pvmcNumber,
              specialization: data.specialization,
              availabilitySchedule: data.availabilitySchedule
            });
          }
        }
      } catch (err) {
        console.error('Error fetching vet profile data:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchVetProfile();
  }, [vetId]);

  const handleSave = async () => {
    try {
      if (vetId) {
        await fetch(`${baseUrl}/api/vet/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vetId,
            fullName: formName,
            pvmcNumber: formLicense,
            specialization: formSpec,
            availabilitySchedule: formAvail
          })
        });
      }
      updateProfile({
        userName: formName,
        fullName: formName,
        license: formLicense,
        pvmcNumber: formLicense,
        specialization: formSpec,
        availability: formAvail,
        availabilitySchedule: formAvail
      });
      setProfile(getProfile());
      setActiveModal(null);
      Alert.alert(t('Success') || 'Success', t('Profile updated successfully!') || 'Profile updated successfully!');
    } catch (err) {
      console.error('Error saving vet profile:', err);
      Alert.alert(t('Error') || 'Error', t('Failed to update profile.') || 'Failed to update profile.');
    }
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
            <Feather name={icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.menuTitle}>{leftText}</Text>
        </View>
        <View style={styles.menuRight}>
          {rightElement || (
            <>
              {rightText ? <Text style={styles.menuSubtitle}>{rightText}</Text> : null}
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const userName = profile.userName || profile.fullName || t('Veterinarian');
  const initial = userName.charAt(0).toUpperCase() || 'V';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent}
      >
        
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
                <Feather name="edit-2" size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.specializationText}>{profile.specialization || formSpec || t('Veterinarian')}</Text>
            
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.verifiedText}>{t('Verified Vet')}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{loadingStats ? '-' : stats.cases}</Text>
              <Text style={styles.statLabel}>{t('Cases')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{loadingStats ? '-' : stats.prescriptions}</Text>
              <Text style={styles.statLabel}>{t('Prescriptions')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#F5B041' }]}>{loadingStats ? '-' : stats.rating}</Text>
              <Text style={styles.statLabel}>{t('Rating')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionHeading}>{t('Account')}</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('user', 'Edit Profile', null, null, () => setActiveModal('editProfile'))}
            <View style={styles.menuDivider} />
            {renderMenuItem('file-text', 'License Details', null, null, () => setActiveModal('license'))}
            <View style={styles.menuDivider} />
            {renderMenuItem('award', 'Specialization', null, null, () => setActiveModal('specialization'))}
            <View style={styles.menuDivider} />
            {renderMenuItem('calendar', 'Availability Schedule', null, null, () => setActiveModal('availability'))}
          </View>

          <Text style={styles.sectionHeading}>{t('Preferences')}</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('globe', 'Language', null, 
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
                ? () => Alert.alert(t('Managed by Admin'), t('Language is currently set centrally by the administrator.'))
                : () => setLangModalVisible(true)
            )}
            <View style={styles.menuDivider} />
            {renderMenuItem('bell', 'Notifications', null, 
              <Switch
                trackColor={{ false: isDark ? '#334155' : '#EAEAEA', true: colors.primary }}
                thumbColor="#FFF"
                ios_backgroundColor="#EAEAEA"
                onValueChange={() => setNotificationsEnabled(!notificationsEnabled)}
                value={notificationsEnabled}
              />
            )}
            <View style={styles.menuDivider} />
            {renderMenuItem('moon', 'Dark Mode', null, 
              <Switch
                trackColor={{ false: isDark ? '#334155' : '#EAEAEA', true: colors.primary }}
                thumbColor="#FFF"
                ios_backgroundColor="#EAEAEA"
                onValueChange={toggleTheme}
                value={isDark}
              />
            )}
            <View style={styles.menuDivider} />
            {renderMenuItem('message-circle', 'Consultation Mode', null, 
              <Text style={styles.menuSubtitleActive}>Chat + Video</Text>
            )}
          </View>

          <Text style={styles.sectionHeading}>{t('Support')}</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('help-circle', 'Help Center')}
            <View style={styles.menuDivider} />
            {renderMenuItem('headphones', 'Contact Admin')}
            <View style={styles.menuDivider} />
            {renderMenuItem('shield', 'Privacy Policy')}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
            <Feather name="log-out" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>{t('Logout')}</Text>
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
                  <Feather name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetDashboard')}>
          <MaterialCommunityIcons name="home-variant-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetCases')}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Cases</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetConsultations')}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Consult</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetHealthRecords')}>
          <MaterialCommunityIcons name="pulse" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navProfile, styles.navProfileActive]}>
            <Text style={[styles.navProfileText, styles.navProfileTextActive]}>{initial}</Text>
          </View>
          <Text style={[styles.navText, { color: colors.primary, fontWeight: '700' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
