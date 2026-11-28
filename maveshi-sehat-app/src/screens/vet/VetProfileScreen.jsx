import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Switch, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Linking, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, updateProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetProfileScreenStyles';
import { saveNotificationPreferences, fetchNotificationPreferences } from '../../services/notificationService';

export default function VetProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [profile, setProfile] = useState(getProfile());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [helpCenterModalVisible, setHelpCenterModalVisible] = useState(false);
  const [contactAdminModalVisible, setContactAdminModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
    });
    if (profile?.userId) {
      fetchNotificationPreferences(profile.userId).then(prefs => {
        if (prefs && typeof prefs.enabled === 'boolean') {
          setNotificationsEnabled(prefs.enabled);
        }
      });
    }
    return () => unsubscribe();
  }, [profile?.userId]);

  const handleToggleNotifications = (val) => {
    setNotificationsEnabled(val);
    updateProfile({ notificationsEnabled: val });
    if (profile?.userId) {
      saveNotificationPreferences(profile.userId, { enabled: val });
    }
  };

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'editProfile' | 'license' | 'specialization' | 'availability' | null

  const [stats, setStats] = useState({ cases: 0, prescriptions: 0, rating: '5.0★' });
  const [loadingStats, setLoadingStats] = useState(true);

  // Form states initialized dynamically from profile
  const [formName, setFormName] = useState(profile.userName || profile.fullName || '');
  const [formLicense, setFormLicense] = useState(profile.license || profile.pvmcNumber || '');
  const [formSpec, setFormSpec] = useState(profile.specialization || '');
  const [formAvail, setFormAvail] = useState(profile.availability || profile.availabilitySchedule || '');
  const [consultationMode, setConsultationMode] = useState(profile.consultationMode || 'Chat + Video');
  const [consultModeModalVisible, setConsultModeModalVisible] = useState(false);

  const baseUrl = 'https://maveshi-sehat-api.onrender.com';
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
            if (data.consultationMode) {
              setConsultationMode(data.consultationMode);
            }
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
              availabilitySchedule: data.availabilitySchedule,
              consultationMode: data.consultationMode || profile.consultationMode || 'Chat + Video'
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
    if (activeModal === 'name' && (!formName.trim() || formName.trim().length < 3)) {
      Alert.alert(t('Error') || 'Error', 'Full name must be at least 3 characters long.');
      return;
    }
    if (activeModal === 'license' && (!formLicense.trim() || !/^pvmc-\d{4,}$/i.test(formLicense.trim()))) {
      Alert.alert(t('Error') || 'Error', 'License number must start with PVMC- followed by at least 4 digits (e.g. PVMC-1234).');
      return;
    }
    if (activeModal === 'specialization' && (!formSpec.trim() || formSpec.trim().length < 2)) {
      Alert.alert(t('Error') || 'Error', 'Specialization must be at least 2 characters long.');
      return;
    }
    if (activeModal === 'availability' && (!formAvail.trim() || formAvail.trim().length < 3)) {
      Alert.alert(t('Error') || 'Error', 'Schedule details must be at least 3 characters long.');
      return;
    }

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
            availabilitySchedule: formAvail,
            consultationMode: consultationMode
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
        availabilitySchedule: formAvail,
        consultationMode: consultationMode
      });
      setProfile(getProfile());
      setActiveModal(null);
      Alert.alert(t('Success') || 'Success', t('Profile updated successfully!') || 'Profile updated successfully!');
    } catch (err) {
      console.error('Error saving vet profile:', err);
      Alert.alert(t('Error') || 'Error', t('Failed to update profile.') || 'Failed to update profile.');
    }
  };

  const handleSelectConsultMode = async (mode) => {
    setConsultationMode(mode);
    updateProfile({ consultationMode: mode });
    setConsultModeModalVisible(false);
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
            availabilitySchedule: formAvail,
            consultationMode: mode
          })
        });
      }
      Alert.alert(t('Success') || 'Success', `${t('Consultation mode updated to')} ${t(mode)}`);
    } catch (err) {
      console.error('Error updating consultation mode:', err);
    }
  };

  const openSupportEmail = async () => {
    try {
      const docName = formName || profile.userName || profile.fullName || 'Doctor';
      const licenseNum = formLicense || profile.pvmcNumber || profile.license || 'Not specified';
      const subject = encodeURIComponent(`Vet Support Request - Dr. ${docName} (PVMC: ${licenseNum})`);
      const body = encodeURIComponent(
        `Dear Maveshi Sehat Support Team,\n\nDoctor Name: Dr. ${docName}\nPVMC License: ${licenseNum}\nPhone: ${profile.phone || 'N/A'}\nSpecialization: ${formSpec || profile.specialization || 'Livestock Specialist'}\n\nPlease describe your inquiry, verification request, or clinical issue below:\n\n`
      );
      const mailtoUrl = `mailto:support@maveshisehat.ai?subject=${subject}&body=${body}`;
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (!canOpen) {
        Alert.alert(t('Support unavailable'), t('No email application is available on this device.'));
        return;
      }
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.error('Unable to open support email:', error);
      Alert.alert(t('Support unavailable'), t('No email application is available on this device.'));
    }
  };

  const openSupportPhone = async () => {
    try {
      const phoneUrl = 'tel:+923054758667';
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (!canOpen) {
        Alert.alert(t('Support unavailable'), t('Calling is not available on this device.'));
        return;
      }
      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('Unable to open support phone:', error);
      Alert.alert(t('Support unavailable'), t('Calling is not available on this device.'));
    }
  };

  const openSupportWhatsApp = async () => {
    try {
      const docName = formName || profile.userName || profile.fullName || 'Doctor';
      const text = encodeURIComponent(
        `Hello Maveshi Sehat Support Team,\nI am Dr. ${docName} (PVMC: ${formLicense || profile.pvmcNumber || 'N/A'}). I need veterinary support assistance.`
      );
      const waUrl = `https://wa.me/923054758667?text=${text}`;
      await Linking.openURL(waUrl);
    } catch (error) {
      console.error('Unable to open WhatsApp:', error);
      Alert.alert(t('Support unavailable'), t('WhatsApp is not available on this device.'));
    }
  };

  const openEmergencyDesk = async () => {
    try {
      const phoneUrl = 'tel:+923054758667';
      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('Unable to open emergency desk:', error);
      Alert.alert(t('Support unavailable'), t('Calling is not available on this device.'));
    }
  };

  const renderMenuItem = (icon, title, subtitle, rightElement, onPress) => {
    const profile = getProfile();
    const lang = profile.language || 'English';
    
    let leftText = t(title);
    let rightText = '';
    
    if (lang === 'Urdu') {
      leftText = subtitle || title;
    } else {
      leftText = title;
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
                    {profile.language === 'Urdu' ? 'Urdu' : 'English'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#999' }}>Set by Admin</Text>
                </View>
              ) : (
                <Text style={styles.menuSubtitleActive}>
                  {profile.language === 'Urdu' ? 'Urdu' : 'English'}
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
                onValueChange={handleToggleNotifications}
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
              <Text style={styles.menuSubtitleActive}>{t(consultationMode)}</Text>,
              () => setConsultModeModalVisible(true)
            )}
          </View>

          <Text style={styles.sectionHeading}>{t('Support')}</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('help-circle', 'Help Center', null, null, () => setHelpCenterModalVisible(true))}
            <View style={styles.menuDivider} />
            {renderMenuItem('headphones', 'Contact Admin', null, null, () => setContactAdminModalVisible(true))}
            <View style={styles.menuDivider} />
            {renderMenuItem('shield', 'Privacy Policy', null, null, () => setPrivacyModalVisible(true))}
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
              { id: 'Urdu', label: 'Urdu' }
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

      {/* Consultation Mode Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={consultModeModalVisible}
        onRequestClose={() => setConsultModeModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.infoModalTitleRow}>
                <View style={[styles.infoModalIcon, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5' }]}>
                  <Feather name="message-circle" size={18} color="#059669" />
                </View>
                <Text style={styles.modalTitle}>{t('Consultation Mode')}</Text>
              </View>
              <TouchableOpacity onPress={() => setConsultModeModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.infoModalContent}>
              <Text style={styles.infoModalIntro}>
                {t('Select how you wish to conduct patient consultations with livestock farmers.')}
              </Text>

              {[
                {
                  id: 'Chat + Video',
                  title: 'Chat + Video',
                  desc: 'Enable both text messaging and live video consultation calls with farmers.'
                },
                {
                  id: 'Chat Only',
                  title: 'Chat Only',
                  desc: 'Accept only secure text chats and electronic prescription requests.'
                },
                {
                  id: 'Video Only',
                  title: 'Video Only',
                  desc: 'Conduct scheduled live video diagnostics and clinical inspection calls only.'
                }
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.langOption,
                    consultationMode === item.id && styles.langOptionSelected
                  ]}
                  onPress={() => handleSelectConsultMode(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.langOptionText, consultationMode === item.id && styles.langOptionTextSelected]}>
                      {t(item.title)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                      {t(item.desc)}
                    </Text>
                  </View>
                  {consultationMode === item.id && (
                    <Feather name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 1. Help Center Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={helpCenterModalVisible}
        onRequestClose={() => setHelpCenterModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.infoModalTitleRow}>
                <View style={[styles.infoModalIcon, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5' }]}>
                  <Feather name="help-circle" size={18} color="#059669" />
                </View>
                <Text style={styles.modalTitle}>{t('Veterinary Help Center')}</Text>
              </View>
              <TouchableOpacity onPress={() => setHelpCenterModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.infoModalContent}>
              <Text style={styles.infoModalIntro}>
                {t('Find quick guidance on PVMC verification, digital prescriptions, consultation management, and clinical decision support.')}
              </Text>

              {[
                {
                  id: 'license_verif',
                  question: t('How is my PVMC license verified or updated?'),
                  answer: t('Your Pakistan Veterinary Medical Council (PVMC) license number is submitted during registration and audited by our verification desk. You can update your degree documents, clinic location, or license renewal certificate by opening License Details or contacting Admin Support.')
                },
                {
                  id: 'consult_flow',
                  question: t('How do consultation requests work?'),
                  answer: t('When farmers in your district submit consultation requests with symptoms and animal photos, they appear in your Consultations dashboard. You can review the clinical telemetry, accept the case, and conduct chat or video consultations.')
                },
                {
                  id: 'eprescriptions',
                  question: t('How are digital prescriptions generated & dispensed?'),
                  answer: t('Use the Prescriptions tab to enter your clinical diagnosis, active chemical entities, dosage (mg/kg), and duration. The signed digital prescription is immediately shared with the farmer and can be dispatched to authorized partner pharmacies.')
                },
                {
                  id: 'ai_cdss',
                  question: t('How does the Clinical Decision Support System (CDSS) work?'),
                  answer: t('The CDSS operates in doctor mode: it provides peer-level bovine differential diagnoses, pharmacological dosage guidance, withdrawal intervals, and district epidemic alerts based on active cases.')
                },
                {
                  id: 'hours_mode',
                  question: t('How can I adjust my availability and consultation hours?'),
                  answer: t('Tap Availability Schedule under Account to set your daily consultation schedule (e.g. Mon-Fri 9 AM - 5 PM) or temporarily mark yourself as unavailable.')
                }
              ].map((faq) => (
                <View key={faq.id} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    <Feather name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {expandedFaq === faq.id && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </View>
              ))}

              <View style={styles.infoModalNotice}>
                <Feather name="info" size={16} color={colors.primary} />
                <Text style={styles.infoModalNoticeText}>
                  {t('Need one-on-one administrative support? Tap Contact Admin below to connect directly with our technical operations desk.')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Contact Admin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactAdminModalVisible}
        onRequestClose={() => setContactAdminModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.infoModalTitleRow}>
                <View style={[styles.infoModalIcon, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5' }]}>
                  <Feather name="headphones" size={18} color="#059669" />
                </View>
                <Text style={styles.modalTitle}>{t('Contact Platform Admin & Helpdesk')}</Text>
              </View>
              <TouchableOpacity onPress={() => setContactAdminModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.infoModalContent}>
              <Text style={styles.infoModalIntro}>
                {t('Our dedicated administrative operations team provides 24/7 priority assistance to verified veterinarians regarding credential audits, consultations, pharmacy fulfillment, and clinical platform tools.')}
              </Text>

              <Text style={styles.infoModalHeading}>{t('Direct Contact Channels')}</Text>

              <TouchableOpacity style={styles.supportAction} onPress={openSupportEmail} activeOpacity={0.7}>
                <Feather name="mail" size={20} color="#059669" />
                <View style={styles.supportActionDetails}>
                  <Text style={styles.supportActionTitle}>{t('Official Support Email')}</Text>
                  <Text style={styles.supportActionSubtitle}>support@maveshisehat.ai</Text>
                </View>
                <Feather name="external-link" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.supportAction} onPress={openSupportPhone} activeOpacity={0.7}>
                <Feather name="phone" size={20} color="#0284C7" />
                <View style={styles.supportActionDetails}>
                  <Text style={styles.supportActionTitle}>{t('Helpline Phone')}</Text>
                  <Text style={styles.supportActionSubtitle}>+92 305 4758667 (Toll-Free Helpline)</Text>
                </View>
                <Feather name="external-link" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.supportAction} onPress={openSupportWhatsApp} activeOpacity={0.7}>
                <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
                <View style={styles.supportActionDetails}>
                  <Text style={styles.supportActionTitle}>{t('WhatsApp Helpdesk')}</Text>
                  <Text style={styles.supportActionSubtitle}>+92 305 4758667 ({t('Instant Chat')})</Text>
                </View>
                <Feather name="external-link" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.supportAction, { borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FEE2E2', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2' }]} onPress={openEmergencyDesk} activeOpacity={0.7}>
                <Feather name="alert-triangle" size={20} color="#EF4444" />
                <View style={styles.supportActionDetails}>
                  <Text style={[styles.supportActionTitle, { color: '#DC2626' }]}>{t('Emergency Disease Outbreak Desk')}</Text>
                  <Text style={styles.supportActionSubtitle}>{t('Report notifiable epizootic outbreaks (FMD, Anthrax, LSD)')}</Text>
                </View>
                <Feather name="external-link" size={16} color="#DC2626" />
              </TouchableOpacity>

              <Text style={styles.infoModalHeading}>{t('Administrative Details')}</Text>
              <View style={styles.faqItem}>
                <View style={{ padding: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>
                    {t('Operating Hours')}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                    Monday – Saturday: 9:00 AM – 6:00 PM (PKT)
                  </Text>

                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>
                    {t('Response SLA')}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                    {t('Guaranteed response within 2 hours for verified veterinarians.')}
                  </Text>

                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>
                    {t('National Operations Center')}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                    Maveshi Sehat AI National Livestock Center, Lahore, Punjab, Pakistan
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 3. Privacy Policy Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.infoModalTitleRow}>
                <View style={[styles.infoModalIcon, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5' }]}>
                  <Feather name="shield" size={18} color="#059669" />
                </View>
                <Text style={styles.modalTitle}>{t('Clinical Privacy & Data Ethics')}</Text>
              </View>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.infoModalContent}>
              <Text style={styles.infoModalIntro}>
                {t('Maveshi Sehat AI is committed to maintaining strict clinical data confidentiality, patient health security, and PVMC veterinary regulatory compliance.')}
              </Text>

              <Text style={styles.infoModalHeading}>{t('1. Veterinary Clinical Confidentiality')}</Text>
              <Text style={styles.infoModalText}>
                {t('All clinical notes, diagnoses, and prescription history logged by doctors are strictly confidential. Animal health data is securely encrypted in transit and at rest using 256-bit AES encryption.')}
              </Text>

              <Text style={styles.infoModalHeading}>{t('2. Farmer & Patient Data Protection')}</Text>
              <Text style={styles.infoModalText}>
                {t('Contact information and location coordinates for livestock farmers are shared exclusively during active consultations to facilitate accurate diagnosis and medical care.')}
              </Text>

              <Text style={styles.infoModalHeading}>{t('3. PVMC Regulatory Compliance')}</Text>
              <Text style={styles.infoModalText}>
                {t('Digital prescriptions issued through the platform contain verifiable doctor credentials and PVMC registration tags in compliance with national veterinary medicine regulations.')}
              </Text>

              <Text style={styles.infoModalHeading}>{t('4. Security & Audit Logging')}</Text>
              <Text style={styles.infoModalText}>
                {t('Every administrative check and clinical data access is recorded in an immutable audit trail to protect practitioner integrity and prevent unauthorized record alteration.')}
              </Text>

              <View style={styles.infoModalNotice}>
                <MaterialCommunityIcons name="shield-check" size={18} color={colors.primary} />
                <Text style={styles.infoModalNoticeText}>
                  {t('For privacy or regulatory inquiries, contact our Data Governance Officer at support@maveshisehat.ai.')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetDashboard')}>
          <MaterialCommunityIcons name="home-variant-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetCases')}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Cases')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetConsultations')}>
          <MaterialCommunityIcons name="message-text-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Consult')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName: profile.userName || userName, userId: vetId })}>
          <MaterialCommunityIcons name="forum-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Forum')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navProfile, styles.navProfileActive]}>
            <Text style={[styles.navProfileText, styles.navProfileTextActive]}>{initial}</Text>
          </View>
          <Text style={[styles.navText, { color: colors.primary, fontWeight: '700' }]}>{t('Profile')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
