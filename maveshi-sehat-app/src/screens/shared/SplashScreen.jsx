import React, { useEffect } from 'react';
import { View, Text, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import styles from '../../styles/SplashScreenStyles';

const logoImg = require('../../../assets/images/maveshi_sehat_logo.png');

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#071C0F', '#0E4224', '#1A6B3A', '#0E4224', '#071C0F']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor="#071C0F" hidden />

      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Image source={logoImg} style={styles.logoImage} resizeMode="cover" />
        </View>
        <Text style={styles.mainTitle}>Maveshi Sehat AI</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pakistan's #1 Livestock AI</Text>
      </View>
    </LinearGradient>
  );
}
