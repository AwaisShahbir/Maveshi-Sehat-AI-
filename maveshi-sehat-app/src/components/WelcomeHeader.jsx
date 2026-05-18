import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WelcomeHeader() {
  return (
    <View style={styles.logoContainer}>
      <View style={styles.iconPlaceholder}>
        <Text style={styles.iconText}>🐄</Text>
        <Text style={styles.sparkleIcon}>✨</Text>
      </View>
      <Text style={styles.mainTitle}>Maveshi Sehat AI</Text>
      <Text style={styles.urduTitle}>مویشی صحت اے آئی</Text>
      <Text style={styles.englishSub}>AI-Powered Livestock Healthcare</Text>
      <Text style={styles.urduSub}>مویشیوں کی صحت کی دیکھ بھال</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40, // Move down slightly
  },
  iconPlaceholder: {
    width: 88,
    height: 88,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  iconText: {
    fontSize: 44,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontSize: 24,
  },
  mainTitle: {
    fontSize: 36, // Larger font size
    fontWeight: '800', // Bolder
    color: '#FFFFFF',
    marginBottom: 12,
  },
  urduTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 28,
  },
  englishSub: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 6,
    opacity: 0.9,
  },
  urduSub: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
