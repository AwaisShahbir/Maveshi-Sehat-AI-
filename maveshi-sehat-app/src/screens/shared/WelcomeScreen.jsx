import React from 'react';
import { View, Text, Image, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { t } from '../../utils/translate';
import styles from '../../styles/WelcomeScreenStyles';

const logoImg = require('../../../assets/images/maveshi_sehat_logo.png');

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={['#071C0F', '#0E4224', '#1A6B3A', '#0E4224', '#071C0F']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor="#071C0F" />

      <SafeAreaView style={styles.safeArea}>

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

          <Text style={styles.mainTitle}>Maveshi Sehat AI</Text>
          <Text style={styles.urduTitle}>مویشی صحت اے آئی</Text>

          <Text style={styles.englishSub}>
            Smart Disease Detection • Expert Vet Care • Medicine Delivery
          </Text>
          <Text style={styles.urduSub}>
            بیماری کی شناخت • ماہر ڈاکٹر • ادویات کی ترسیل
          </Text>

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
            Trusted by 10,000+ livestock owners across Pakistan
          </Text>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}
