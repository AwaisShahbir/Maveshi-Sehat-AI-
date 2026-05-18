import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Button({ title, onPress, variant = 'white' }) {
  const isWhite = variant === 'white';
  
  return (
    <TouchableOpacity 
      style={[styles.button, isWhite ? styles.whiteBg : styles.yellowBg]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, isWhite ? styles.whiteText : styles.yellowText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    borderRadius: 16, // More rounded corners
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  whiteBg: {
    backgroundColor: '#FFFFFF',
  },
  yellowBg: {
    backgroundColor: '#FFE135', // Slightly richer yellow to match screenshot
  },
  whiteText: {
    color: '#4CB85C', // A greener text to match the mockup
    fontSize: 16,
    fontWeight: '700',
  },
  yellowText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '700',
  },
});
