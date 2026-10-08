import React, { useState, useEffect } from 'react';
import { View, Text, Image, SafeAreaView, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { getProfile, subscribeProfile, setUserLanguage } from '../../utils/profileStore';
import { t, useTranslation, subscribeTranslation } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import fonts from '../../styles/fonts';
import { getStyles } from '../../styles/WelcomeScreenStyles';

const logoImg = require('../../../assets/images/maveshi_sehat_logo.png');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [profile, setProfile] = useState(getProfile());
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { isUrdu } = useTranslation();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubProfile = subscribeProfile((p) => {
      setProfile(p);
      if (!p.enforceAdminLanguage && !p.hasChosenLanguage) {
        setShowLanguageModal(true);
      }
    });

    const unsubTrans = subscribeTranslation(() => {
      setTick(t => t + 1);
    });

    const current = getProfile();
    if (!current.enforceAdminLanguage && !current.hasChosenLanguage) {
      setShowLanguageModal(true);
    }

    return () => {
      unsubProfile();
      unsubTrans();
    };
  }, []);

  const handleSelectLanguage = (lang) => {
    setUserLanguage(lang);
    setShowLanguageModal(false);
  };

  const currentLang = profile.language === 'Urdu' ? 'Urdu' : 'English';

  return (
    <LinearGradient
      colors={isDark ? ['#0B1120', '#0F172A', '#1E293B', '#0F172A', '#0B1120'] : ['#041D10', '#07331B', '#136737', '#1A7A43', '#136737', '#07331B', '#041D10']}
      locations={isDark ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.18, 0.38, 0.5, 0.62, 0.82, 1.0]}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor={isDark ? '#0B1120' : '#041D10'} />

      <SafeAreaView style={styles.safeArea}>

        {/* ── Top bar: Optional Language switch if Admin enforcement is OFF ── */}
        {!profile.enforceAdminLanguage && (
          <TouchableOpacity
            style={styles.langBadgeBtn}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.75}
          >
            <Feather name="globe" size={14} color="#10B981" />
            <Text style={styles.langBadgeText}>
              {currentLang === 'Urdu' ? 'UR' : 'EN'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Top branding section ── */}
        <View style={styles.topSection}>

          <View style={styles.badge}>
            <Text style={[styles.badgeText, isUrdu && { fontFamily: fonts.urduBold }]}>
              {t("PAKISTAN'S #1 LIVESTOCK AI")}
            </Text>
          </View>

          <View style={styles.logoCircle}>
            <Image
              source={logoImg}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>

          {/* Dynamic Titles */}
          <Text style={[styles.mainTitle, isUrdu && { fontFamily: fonts.urduBold, fontSize: 30, lineHeight: 48 }]}>
            {t('Maveshi Sehat AI')}
          </Text>

          {/* Dynamic Subtitles */}
          <Text style={[styles.englishSub, isUrdu && { fontFamily: fonts.urduRegular, fontSize: 14, lineHeight: 26 }]}>
            {t('Smart Disease Detection • Expert Vet Care • Medicine Delivery')}
          </Text>

        </View>

        {/* ── Bottom action section ── */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={[styles.loginText, isUrdu && { fontFamily: fonts.urduBold }]}>
              {t('Login')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={[styles.registerText, isUrdu && { fontFamily: fonts.urduBold }]}>
              {t('Register')}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.trustText, isUrdu && { fontFamily: fonts.urduRegular, fontSize: 13, lineHeight: 24 }]}>
            {t('Trusted by 10,000+ livestock owners across Pakistan')}
          </Text>
        </View>

      </SafeAreaView>

      {/* ── Clean 2-Language Selection Modal (English or Urdu) ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('Choose Your Language')}</Text>

            {[
              { id: 'English', title: 'English' },
              { id: 'Urdu', title: 'Urdu' }
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.langOptionCard,
                  currentLang === item.id && styles.langOptionCardSelected
                ]}
                onPress={() => handleSelectLanguage(item.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.langCardTitle, currentLang === item.id && styles.langCardTitleSelected]}>
                  {item.title}
                </Text>

                {currentLang === item.id && (
                  <Feather name="check" size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
