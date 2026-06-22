import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const logoImg = require('../../assets/images/maveshi_sehat_logo.png');

export default function WelcomeHeader() {
  return (
    <View style={styles.container}>

      {/* Top Badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>PAKISTAN'S #1 LIVESTOCK AI</Text>
      </View>

      {/* Logo Circle */}
      <View style={styles.logoCircle}>
        <Image source={logoImg} style={styles.logoImage} resizeMode="cover" />
      </View>

      {/* App Name */}
      <Text style={styles.mainTitle}>Maveshi Sehat AI</Text>
      <Text style={styles.urduTitle}>مویشی صحت اے آئی</Text>

      {/* Subtitle */}
      <Text style={styles.englishSub}>AI-Powered Livestock Healthcare</Text>
      <Text style={styles.urduSub}>مویشیوں کی صحت کی دیکھ بھال</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingVertical: 5,
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.5,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  logoImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  urduTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    textAlign: 'center',
  },
  englishSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  urduSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
});
