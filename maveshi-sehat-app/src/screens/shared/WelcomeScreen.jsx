import React, { useState, useEffect } from 'react';
import { View, Text, Image, SafeAreaView, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { getProfile, subscribeProfile, setUserLanguage } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import styles from '../../styles/WelcomeScreenStyles';

const logoImg = require('../../../assets/images/maveshi_sehat_logo.png');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(getProfile());
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    const unsub = subscribeProfile((p) => {
      setProfile(p);
      // If admin enforcement is OFF and user has not chosen language, prompt them
      if (!p.enforceAdminLanguage && !p.hasChosenLanguage) {
        setShowLanguageModal(true);
      }
    });

    const current = getProfile();
    if (!current.enforceAdminLanguage && !current.hasChosenLanguage) {
      setShowLanguageModal(true);
    }

    return () => unsub();
  }, []);

  const handleSelectLanguage = (lang) => {
    setUserLanguage(lang);
    setShowLanguageModal(false);
  };

  const currentLang = profile.language || 'Both';

  return (
    <LinearGradient
      colors={['#071C0F', '#0E4224', '#1A6B3A', '#0E4224', '#071C0F']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor="#071C0F" />

      <SafeAreaView style={styles.safeArea}>

        {/* ── Top bar: Optional Language switch if Admin enforcement is OFF ── */}
        {!profile.enforceAdminLanguage && (
          <TouchableOpacity
            style={styles.langBadgeBtn}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.75}
          >
            <Feather name="globe" size={14} color="#58D66D" />
            <Text style={styles.langBadgeText}>
              {currentLang === 'English' ? 'EN' : currentLang === 'Urdu' ? 'Urdu' : 'Both'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Top branding section ── */}
        <View style={styles.topSection}>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>PAKISTAN'S #1 LIVESTOCK AI</Text>
          </View>

          <View style={styles.logoCircle}>
            <Image
              source={logoImg}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>

          {/* Dynamic Titles */}
          {(currentLang === 'English' || currentLang === 'Both') && (
            <Text style={styles.mainTitle}>Maveshi Sehat AI</Text>
          )}

          {(currentLang === 'Urdu' || currentLang === 'Both') && (
            <Text style={styles.urduTitle}>مویشی صحت اے آئی</Text>
          )}

          {/* Dynamic Subtitles */}
          {(currentLang === 'English' || currentLang === 'Both') && (
            <Text style={styles.englishSub}>
              Smart Disease Detection • Expert Vet Care • Medicine Delivery
            </Text>
          )}

          {(currentLang === 'Urdu' || currentLang === 'Both') && (
            <Text style={styles.urduSub}>
              بیماری کی شناخت • ماہر ڈاکٹر • ادویات کی ترسیل
            </Text>
          )}

        </View>

        {/* ── Bottom action section ── */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginText}>{t('Login', 'لاگ اِن')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.registerText}>{t('Register', 'رجسٹر کریں')}</Text>
          </TouchableOpacity>

          <Text style={styles.trustText}>
            {currentLang === 'Urdu'
              ? 'پاکستان بھر میں 10,000+ مویشی پال حضرات کا بھروسہ'
              : currentLang === 'English'
              ? 'Trusted by 10,000+ livestock owners across Pakistan'
              : 'Trusted by 10,000+ livestock owners across Pakistan\nپاکستان بھر میں بااعتماد'}
          </Text>
        </View>

      </SafeAreaView>

      {/* ── First-Time User Language Selection Modal ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Your Language</Text>

            {[
              { id: 'English', title: 'English' },
              { id: 'Urdu', title: 'Urdu' },
              { id: 'Both', title: 'Both (English and Urdu)' }
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
                  <Feather name="check" size={20} color="#58D66D" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
