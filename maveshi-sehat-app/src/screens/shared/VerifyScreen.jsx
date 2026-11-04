import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VerifyScreenStyles';

const baseUrl = 'https://maveshi-sehat-api.onrender.com';

export default function VerifyScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const { email, role, userName, otp: initialOtp } = route.params || {};
  const [currentOtp, setCurrentOtp] = useState(initialOtp || null);
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

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

  const handleResendOtp = async () => {
    if (!email) {
      return Platform.OS === 'web' ? alert('Email address missing.') : Alert.alert('Error', 'Email address missing.');
    }
    setResending(true);
    try {
      const response = await fetch(`${baseUrl}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to resend OTP');

      if (data.otp) {
        setCurrentOtp(data.otp);
      }

      if (Platform.OS === 'web') {
        alert('A new 4-digit verification code has been sent to your email.');
      } else {
        Alert.alert('Code Sent', 'A new 4-digit verification code has been sent to your email. Check your Inbox or Spam folder.');
      }
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      if (Platform.OS === 'web') {
        alert('Resend Error: ' + err.message);
      } else {
        Alert.alert('Resend Error', err.message);
      }
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    const otpValue = code.join('');
    if (otpValue.length < 4) {
      return Platform.OS === 'web' ? alert('Please enter the 4-digit code.') : Alert.alert('Error', 'Please enter the 4-digit code.');
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      if (Platform.OS === 'web') {
        alert('Account Verified Successfully! Welcome to Maveshi Sehat.');
      } else {
        Alert.alert('Success', 'Account Verified Successfully! Welcome to Maveshi Sehat.');
      }

      if (role === 'vet') {
        navigation.navigate('VetDashboard', { userName });
      } else {
        navigation.navigate('Dashboard', { userName });
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Verification Error: ' + error.message);
      } else {
        Alert.alert('Verification Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

          <View style={styles.topSection}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Feather name="shield" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.mainTitle}>{t('Verify Account', 'اکاؤنٹ کی تصدیق')}</Text>
          </View>

          <View style={styles.cardContainer}>
            <Text style={styles.instructionText}>{t('Enter 4-digit code sent to', 'کوڈ درج کریں جو ای میل پر بھیجا گیا')}</Text>
            <Text style={styles.phoneNumber}>{email || '+92 300 1234567'}</Text>

            <View style={{
              backgroundColor: isDark ? '#1E293B' : '#F0FDF4',
              borderRadius: 10,
              padding: 12,
              marginVertical: 12,
              borderWidth: 1,
              borderColor: isDark ? '#334155' : '#BBF7D0',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Feather name="mail" size={18} color={isDark ? '#4ADE80' : '#16A34A'} style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, fontSize: 13, color: isDark ? '#E2E8F0' : '#166534', lineHeight: 18 }}>
                {t(
                  'Please check your email Inbox and Spam / Junk folder for the 4-digit code.',
                  'براہ کرم 4 ہندسوں کے کوڈ کے لیے اپنا ای میل ان باکس اور اسپام / جنک فولڈر چیک کریں۔'
                )}
              </Text>
            </View>

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

            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={resending} style={{ marginBottom: 24, paddingVertical: 4 }}>
                <Text style={styles.resendLink}>
                  {resending ? t('Sending code...', 'کوڈ بھیجا جا رہا ہے...') : t('Resend OTP Code', 'دوبارہ کوڈ حاصل کریں')}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                {t('Resend code in', 'دوبارہ کوڈ')} <Text style={styles.timerHighlight}>{timer}s</Text>
              </Text>
            )}

            <TouchableOpacity
              style={[styles.verifyBtn, loading && { opacity: 0.7 }]}
              activeOpacity={0.9}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyBtnText}>{t('Verify & Continue', 'تصدیق کریں')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
