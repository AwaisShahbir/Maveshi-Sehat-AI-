import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from '../styles/WelcomeHeaderStyles';

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
      

      {/* Subtitle */}
      <Text style={styles.englishSub}>AI-Powered Livestock Healthcare</Text>
      

    </View>
  );
}
