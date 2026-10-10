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
  Alert,
  Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, updateProfile, subscribeProfile } from '../../utils/profileStore';
import { getRecords, subscribe, loadRecords } from '../../utils/recordsStore';
import { t, useTranslation, subscribeTranslation } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import fonts from '../../styles/fonts';
import { getStyles } from '../../styles/ProfileScreenStyles';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.userId || 'user_123';

  const { isDark, colors, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [profile, setProfile] = useState(getProfile());
  const [records, setRecords] = useState(getRecords());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const { isUrdu } = useTranslation();
  const [, setTick] = useState(0);

  // Edit form states
  const [editName, setEditName] = useState(profile.userName);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editLocation, setEditLocation] = useState(profile.location);

  useEffect(() => {
    loadRecords(profile.userName).then(loadedRecords => {
      setRecords(loadedRecords);
    }).catch(err => console.log('Error initial loading records for profile:', err));

    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
      loadRecords(updatedProfile.userName).then(loadedRecords => {
        setRecords(loadedRecords);
      }).catch(err => console.log('Error reloading records for profile:', err));
    });

    const unsubscribeRecords = subscribe((updatedRecords) => {
      setRecords(updatedRecords);
    });

    const unsubscribeTranslation = subscribeTranslation(() => {
      setTick(t => t + 1);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeRecords();
      unsubscribeTranslation();
    };
  }, []);

  useEffect(() => {
    setEditName(profile.userName);
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
      Alert.alert(t('Error'), t('Name cannot be empty.'));
      return;
    }
    updateProfile({
      userName: editName,
      phone: editPhone,
      location: editLocation
    });
    setEditModalVisible(false);
    Alert.alert(t('Success'), t('Saved successfully'));
  };

  const toggleNotifications = (val) => {
    updateProfile({ notificationsEnabled: val });
  };

  const handleLogout = () => {
    Alert.alert(
      t('Log Out'),
      t('Are you sure you want to log out?'),
      [
        { text: t('Cancel'), style: "cancel" },
        { text: t('Log Out'), style: "destructive", onPress: () => navigation.replace('Welcome') }
      ]
    );
  };

  const currentLang = profile.language === 'Urdu' ? 'Urdu' : 'English';

  const openSupportEmail = async () => {
    try {
      const subject = encodeURIComponent('Maveshi Sehat support request');
      const body = encodeURIComponent(`Hello Maveshi Sehat Support,\n\nFarmer: ${profile.userName}\nPhone: ${profile.phone}\n\nHow can we help?\n`);
      const mailtoUrl = `mailto:maveshisehatai@gmail.com?subject=${subject}&body=${body}`;
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
      const phoneUrl = 'tel:03054758667';
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? '#0B1120' : '#059669'} />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isUrdu && { fontFamily: fonts.urduBold }]}>
            {t('Profile & Settings')}
          </Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(profile.userName)}</Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile.userName}</Text>
              <View style={styles.roleBadge}>
                <Feather name="user" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.roleText, isUrdu && { fontFamily: fonts.urduRegular }]}>
                  {t('Farmer')}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editIconBtn} onPress={() => setEditModalVisible(true)}>
              <Feather name="edit-2" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{uniqueAnimals}</Text>
              <Text style={[styles.statLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Livestock')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={[styles.statLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('AI Scans')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.consultationsCount}</Text>
              <Text style={[styles.statLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Consultations')}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.groupTitle, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Account')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: colors.secondaryLight }]}>
              <Feather name="user" size={18} color={colors.secondary} />
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Edit Profile')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: colors.primaryLight }]}>
              <Feather name="phone-call" size={18} color={colors.primary} />
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Phone Number')}</Text>
              <Text style={styles.itemVal}>{profile.phone}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: colors.accentAmberLight }]}>
              <Feather name="map-pin" size={18} color={colors.accentAmber} />
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Location')}</Text>
              <Text style={styles.itemVal}>{profile.location}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.groupTitle, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Preferences')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity 
            style={styles.settingsItem}
            activeOpacity={profile.enforceAdminLanguage ? 1 : 0.7}
            onPress={() => {
              if (profile.enforceAdminLanguage) {
                Alert.alert(t('Managed by Admin'), t('Language is currently set centrally by the administrator.'));
              } else {
                setLangModalVisible(true);
              }
            }}
          >
            <View style={[styles.itemIconBg, { backgroundColor: colors.accentPurpleLight }]}>
              <Feather name="globe" size={18} color={colors.accentPurple} />
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Language')}</Text>
              <Text style={[styles.itemVal, isUrdu && { fontFamily: fonts.urduRegular }]}>
                {currentLang === 'Urdu' ? 'Urdu' : 'English'}
              </Text>
            </View>
            {profile.enforceAdminLanguage ? (
              <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
                {t('Set by Admin')}
              </Text>
            ) : (
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          <View style={styles.settingsItem}>
            <View style={[styles.itemIconBg, { backgroundColor: colors.accentRedLight }]}>
              <Feather name="bell" size={18} color={colors.accentRed} />
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Notifications')}</Text>
            </View>
            <Switch
              value={profile.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
              thumbColor={'#FFF'}
            />
          </View>

          <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.itemIconBg, { backgroundColor: colors.secondaryLight }]}>
              <Feather name={isDark ? "moon" : "sun"} size={18} color={colors.secondary} />
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Dark Mode')}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
              thumbColor={'#FFF'}
            />
          </View>
        </View>

        <Text style={[styles.groupTitle, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Support')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsItem} onPress={() => setLegalModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: colors.accentTealLight }]}>
              <Feather name="shield" size={18} color={colors.accentTeal} />
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Terms & Privacy')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={() => setSupportModalVisible(true)}>
            <View style={[styles.itemIconBg, { backgroundColor: colors.secondaryLight }]}>
              <Feather name="help-circle" size={18} color={colors.secondary} />
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Help & Support')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#FF3B30" style={{ transform: [{ scaleX: -1 }], marginRight: 8 }} />
          <Text style={[styles.logoutBtnText, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Log Out')}</Text>
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
              <Text style={[styles.modalTitle, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Edit Profile')}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <Text style={[styles.inputLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Full Name')}</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder={t('Enter Full Name')}
                placeholderTextColor="#999"
              />

              <Text style={[styles.inputLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Phone Number')}</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder={t('Enter Phone Number')}
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Location')}</Text>
              <TextInput
                style={styles.textInput}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder={t('Enter Location (City, Province)')}
                placeholderTextColor="#999"
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={[styles.saveBtnText, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Save Changes')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clean 2-Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Choose Your Language')}</Text>
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
                  currentLang === item.id && styles.langOptionSelected
                ]}
                onPress={() => {
                  updateProfile({ language: item.id });
                  setLangModalVisible(false);
                }}
              >
                <Text style={[styles.langOptionText, currentLang === item.id && styles.langOptionTextSelected]}>
                  {item.label}
                </Text>
                {currentLang === item.id && (
                  <Feather name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={legalModalVisible}
        onRequestClose={() => setLegalModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.infoModalTitleRow}>
                <View style={[styles.infoModalIcon, { backgroundColor: colors.accentTealLight }]}>
                  <Feather name="shield" size={18} color={colors.accentTeal} />
                </View>
                <Text style={styles.modalTitle}>{t('Terms & Privacy')}</Text>
              </View>
              <TouchableOpacity onPress={() => setLegalModalVisible(false)} accessibilityLabel={t('Close')}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.infoModalContent}>
              <Text style={styles.infoModalUpdated}>{t('Last updated')}: 10 October 2026</Text>
              <Text style={styles.infoModalHeading}>{t('Your privacy matters')}</Text>
              <Text style={styles.infoModalText}>
                {t('Maveshi Sehat uses your account details and livestock health information to provide animal-health guidance, records, consultations, and support.')}
              </Text>
              <Text style={styles.infoModalHeading}>{t('Information we use')}</Text>
              <Text style={styles.infoModalText}>
                {t('We use your name, phone number, location, uploaded images, scan results, consultation messages, and prescriptions to provide the features you request.')}
              </Text>
              <Text style={styles.infoModalHeading}>{t('Your choices')}</Text>
              <Text style={styles.infoModalText}>
                {t('You can update your profile, control notifications, change language when available, and contact support about your account or data.')}
              </Text>
              <Text style={styles.infoModalHeading}>{t('Acceptable use')}</Text>
              <Text style={styles.infoModalText}>
                {t('Use the service responsibly. AI guidance is informational and does not replace an in-person veterinary examination or emergency care.')}
              </Text>
              <View style={styles.infoModalNotice}>
                <Feather name="info" size={16} color={colors.primary} />
                <Text style={styles.infoModalNoticeText}>{t('By continuing to use Maveshi Sehat, you agree to use the service lawfully and responsibly.')}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={supportModalVisible}
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.infoModalTitleRow}>
                <View style={[styles.infoModalIcon, { backgroundColor: colors.secondaryLight }]}>
                  <Feather name="help-circle" size={18} color={colors.secondary} />
                </View>
                <Text style={styles.modalTitle}>{t('Help & Support')}</Text>
              </View>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)} accessibilityLabel={t('Close')}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.infoModalContent}>
              <Text style={styles.infoModalIntro}>{t('Find quick answers or contact the Maveshi Sehat team.')}</Text>
              {[
                {
                  id: 'scan',
                  question: t('How do I save an AI scan?'),
                  answer: t('Open an AI scan result and choose Save to Records. Saved results are available from the Records section.')
                },
                {
                  id: 'consultation',
                  question: t('How do consultations work?'),
                  answer: t('Choose a veterinarian, submit your request, and wait for approval. You can open the consultation chat after the veterinarian approves it.')
                },
                {
                  id: 'privacy',
                  question: t('Who can see my consultation messages?'),
                  answer: t('Your consultation messages and prescriptions are shared with the veterinarian connected to that consultation so they can provide care.')
                }
              ].map((faq) => (
                <View key={faq.id} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    <Feather name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {expandedFaq === faq.id && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
                </View>
              ))}
              <Text style={styles.infoModalHeading}>{t('Contact support')}</Text>
              <Text style={styles.infoModalText}>{t('Our support team can help with account access, consultations, records, and app issues.')}</Text>
              <TouchableOpacity style={styles.supportAction} onPress={openSupportEmail}>
                <Feather name="mail" size={18} color={colors.primary} />
                <View style={styles.supportActionDetails}>
                  <Text style={styles.supportActionTitle}>{t('Email support')}</Text>
                  <Text style={styles.supportActionSubtitle}>maveshisehatai@gmail.com</Text>
                </View>
                <Feather name="external-link" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.supportAction} onPress={openSupportPhone}>
                <Feather name="phone" size={18} color={colors.primary} />
                <View style={styles.supportActionDetails}>
                  <Text style={styles.supportActionTitle}>{t('Call support')}</Text>
                  <Text style={styles.supportActionSubtitle}>03054758667</Text>
                </View>
                <Feather name="external-link" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={24} color={colors.navInactive} />
            <Text style={[styles.navText, { color: colors.navInactive }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan', { userName: profile.userName, userId })}>
            <MaterialCommunityIcons name="line-scan" size={24} color={colors.navInactive} />
            <Text style={[styles.navText, { color: colors.navInactive }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('AI Scan')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords', { userName: profile.userName, userId })}>
            <Feather name="file-text" size={24} color={colors.navInactive} />
            <Text style={[styles.navText, { color: colors.navInactive }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Records')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName: profile.userName, userId })}>
            <Feather name="message-square" size={24} color={colors.navInactive} />
            <Text style={[styles.navText, { color: colors.navInactive }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Forum')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Feather name="user" size={24} color={colors.navActive} />
            <Text style={[styles.navText, { color: colors.navActive, fontWeight: '700' }, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
