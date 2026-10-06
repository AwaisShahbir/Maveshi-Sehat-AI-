import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { t, useTranslation, subscribeTranslation } from '../../utils/translate';
import fonts from '../../styles/fonts';
import styles from '../../styles/VerifyScreenStyles';

export default function VerifyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, role, userName } = route.params || {}; 
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const { isUrdu } = useTranslation();
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribeTranslation(() => setTick(t => t + 1));
  }, []);

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = code.join('');
    if (otpValue.length < 4) {
      return Alert.alert(t('Error'), t('Please enter the 4-digit code.'));
    }

    setLoading(true);
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      Alert.alert(t('Success'), t('Account Verified Successfully! Welcome to Maveshi Sehat.'));
      
      if (role === 'vet') {
        navigation.navigate('VetDashboard', { userName });
      } else {
        navigation.navigate('Dashboard', { userName });
      }
    } catch (error) {
      Alert.alert(t('Error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          
          <View style={styles.topSection}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
              <Text style={[styles.backText, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Back')}</Text>
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <Feather name="shield" size={40} color="#FFFFFF" />
            </View>
            
            <Text style={[styles.mainTitle, isUrdu && { fontFamily: fonts.urduBold, fontSize: 28, lineHeight: 46 }]}>
              {t('Verification')}
            </Text>
          </View>

          
          <View style={styles.cardContainer}>
            <Text style={[styles.instructionText, isUrdu && { fontFamily: fonts.urduRegular }]}>
              {t('Enter OTP')}
            </Text>
            <Text style={styles.phoneNumber}>{email || '+92 300 1234567'}</Text>

            
            <View style={styles.otpContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            
            <TouchableOpacity>
              <Text style={[styles.resendLink, isUrdu && { fontFamily: fonts.urduBold }]}>
                {t('Resend Code')}
              </Text>
            </TouchableOpacity>

            
            <TouchableOpacity 
              style={[styles.verifyBtn, loading && { opacity: 0.7 }]} 
              activeOpacity={0.9}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text style={[styles.verifyBtnText || { color: '#FFF', fontSize: 16, fontWeight: 'bold' }, isUrdu && { fontFamily: fonts.urduBold }]}>
                {loading ? t('Loading...') : t('Verify Code')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
