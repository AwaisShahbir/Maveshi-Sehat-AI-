import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { updateProfile } from '../../utils/profileStore';
import { t, useTranslation, subscribeTranslation } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import fonts from '../../styles/fonts';
import { getStyles } from '../../styles/LoginScreenStyles';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { isUrdu } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [, setTick] = useState(0);

  const [role, setRole] = useState('owner');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Welcome');
    }
  };

  useEffect(() => {
    const onHardwareBack = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [navigation]);

  useEffect(() => {
    return subscribeTranslation(() => setTick(t => t + 1));
  }, []);

  const handleLogin = async () => {
    setErrorMsg('');

    if (!phoneNumber.trim() || !password.trim()) {
      return setErrorMsg('Please enter your phone number and password');
    }

    if (phoneNumber.length < 10) {
      return setErrorMsg('Please enter a valid phone number');
    }

    setLoading(true);
    try {
      const mappedRole = role === 'owner' ? 'farmer' : 'vet';
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password, role: mappedRole })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      updateProfile({
        userName: data.user.full_name,
        phone: data.user.phone,
        location: data.user.district,
        role: mappedRole
      });

      if (mappedRole === 'farmer') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'VetDashboard' }],
        });
      }
    } catch (err) {
      setErrorMsg(err.message);
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
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
              <Text style={[styles.backText, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Back')}</Text>
            </TouchableOpacity>
            <Text style={[styles.mainTitle, isUrdu && { fontFamily: fonts.urduBold, fontSize: 28, lineHeight: 46 }]}>
              {t('Welcome')}
            </Text>
          </View>

          <View style={styles.cardContainer}>

            <Text style={[styles.label, isUrdu && { fontFamily: fonts.urduBold, fontSize: 15, marginTop: 14, marginBottom: 6, includeFontPadding: false }]}>
              {t('Login As')}
            </Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'owner' && styles.roleButtonActive]}
                onPress={() => setRole('owner')}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.roleText,
                  role === 'owner' && styles.roleTextActive,
                  isUrdu && { fontFamily: fonts.urduRegular, fontSize: 17, lineHeight: 26, includeFontPadding: false }
                ]}>
                  {t('Owner')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'vet' && styles.roleButtonActive]}
                onPress={() => setRole('vet')}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.roleText,
                  role === 'vet' && styles.roleTextActive,
                  isUrdu && { fontFamily: fonts.urduRegular, fontSize: 17, lineHeight: 26, includeFontPadding: false }
                ]}>
                  {t('Vet')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, isUrdu && { fontFamily: fonts.urduBold, fontSize: 15, marginTop: 14, marginBottom: 6, includeFontPadding: false }]}>
              {t('Phone Number')}
            </Text>
            <View style={styles.inputContainer}>
              <Feather name="phone" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+92 300 1234567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            <Text style={[styles.label, isUrdu && { fontFamily: fonts.urduBold, fontSize: 15, marginTop: 14, marginBottom: 6, includeFontPadding: false }]}>
              {t('Password')}
            </Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('Enter password')}
                placeholderTextColor="#999"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon}>
                <Feather name={passwordVisible ? "eye-off" : "eye"} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity>
              <Text style={[styles.forgotPassword, isUrdu && { fontFamily: fonts.urduRegular, fontSize: 15, includeFontPadding: false }]}>
                {t('Forgot Password?')}
              </Text>
            </TouchableOpacity>

            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, loading && { opacity: 0.7 }]}
              activeOpacity={0.9}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={[styles.loginButtonText, isUrdu && { fontFamily: fonts.urduBold, fontSize: 19, includeFontPadding: false }]}>
                {loading ? t('Logging in...') : t('Login')}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, isUrdu && { fontFamily: fonts.urduRegular, fontSize: 15, includeFontPadding: false }]}>
                {t("Don't have an account?")}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.registerLink, isUrdu && { fontFamily: fonts.urduBold, fontSize: 15, includeFontPadding: false }]}>
                  {t('Register')}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
