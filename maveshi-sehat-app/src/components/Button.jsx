import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styles from '../styles/ButtonStyles';

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
