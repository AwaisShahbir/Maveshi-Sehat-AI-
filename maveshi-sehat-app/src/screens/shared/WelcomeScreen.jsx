import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

// Path: src/screens/shared/ → ../../../assets/images/
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

        {/* ── Top / Hero ── */}
        <View style={styles.topSection}>

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PAKISTAN'S #1 LIVESTOCK AI</Text>
          </View>

          {/* Logo circle */}
          <View style={styles.logoCircle}>
            <Image
              source={logoImg}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>

          {/* App name */}
          <Text style={styles.mainTitle}>Maveshi Sehat AI</Text>

          {/* Tagline */}
          <Text style={styles.englishSub}>AI-Powered Livestock Healthcare</Text>
        </View>

        {/* ── Bottom Buttons ── */}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C3D1E',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },

  /* ── Top section ── */
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  badge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    elevation: 10,
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  urduTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 22,
    textAlign: 'center',
  },
  englishSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    textAlign: 'center',
  },
  urduSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },

  /* ── Bottom section ── */
  bottomSection: {
    paddingBottom: 36,
  },
  loginBtn: {
    backgroundColor: '#84f285',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 4,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#072B14',
  },
  registerBtn: {
    backgroundColor: '#fbed76',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  registerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  trustText: {
    textAlign: 'center',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.42)',
  },
});
