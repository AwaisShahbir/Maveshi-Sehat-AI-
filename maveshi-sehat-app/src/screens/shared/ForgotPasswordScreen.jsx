import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { t, useTranslation, subscribeTranslation } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import fonts from '../../styles/fonts';

const BASE_URL = 'https://maveshi-sehat-api.onrender.com';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isUrdu } = useTranslation();
  const { colors, isDark } = useTheme();
  const [, setTick] = useState(0);

  // Flow steps: 1 = Request Code, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState(route.params?.initialIdentifier || '');
  const [targetEmail, setTargetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Backend returned OTP for seamless test auto-fill fallback
  const [receivedOtp, setReceivedOtp] = useState('');

  useEffect(() => {
    return subscribeTranslation(() => setTick(t => t + 1));
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Request Code
  const handleRequestCode = async () => {
    setErrorMsg('');
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg(isUrdu ? 'برائے مہربانی اپنا فون نمبر یا ای میل درج کریں' : 'Please enter your phone number or email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }

      setTargetEmail(data.email);
      if (data.otp) setReceivedOtp(String(data.otp));
      setTimer(60);
      setCanResend(false);
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async () => {
    setErrorMsg('');
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setErrorMsg(isUrdu ? 'براہ کرم 4 ہندسوں کا درست کوڈ درج کریں' : 'Please enter the 4-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, otp: cleanOtp })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      setStep(3);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async () => {
    setErrorMsg('');
    if (!newPassword.trim()) {
      setErrorMsg(isUrdu ? 'براہ کرم نیا پاسورڈ درج کریں' : 'Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg(isUrdu ? 'پاسورڈ کم از کم 6 حروف پر مشتمل ہونا چاہیے' : 'Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(isUrdu ? 'پاسورڈ مماثل نہیں ہیں' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          otp: otp.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      Alert.alert(
        isUrdu ? 'کامیابی' : 'Success',
        isUrdu ? 'آپ کا پاسورڈ کامیابی کے ساتھ تبدیل کر دیا گیا ہے! اب آپ لاگ ان کر سکتے ہیں۔' : 'Password reset successfully! You can now log in with your new password.',
        [
          {
            text: isUrdu ? 'لاگ ان کریں' : 'Login Now',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to resend code');

      if (data.otp) setReceivedOtp(String(data.otp));
      setTimer(60);
      setCanResend(false);
      Alert.alert(
        isUrdu ? 'کوڈ دوبارہ بھیج دیا گیا' : 'Code Resent',
        isUrdu ? 'ایک نیا تصدیقی کوڈ آپ کے ای میل پر بھیج دیا گیا ہے۔' : 'A fresh verification code has been dispatched to your email.'
      );
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? colors.headerBackground : colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

          {/* Top Header */}
          <View style={styles.topSection}>
            <TouchableOpacity
              onPress={() => {
                if (step > 1) setStep(step - 1);
                else navigation.goBack();
              }}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
              <Text style={[styles.backText, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Back')}</Text>
            </TouchableOpacity>
            <Text style={[styles.mainTitle, isUrdu && { fontFamily: fonts.urduBold, fontSize: 26, lineHeight: 42 }]}>
              {isUrdu ? 'پاسورڈ بازیافت' : 'Reset Password'}
            </Text>
            <Text style={[styles.subTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>
              {step === 1 && (isUrdu ? 'اکاؤنٹ کا فون نمبر یا ای میل درج کریں' : 'Enter your registered phone or email')}
              {step === 2 && (isUrdu ? 'ای میل پر موصولہ تصدیقی کوڈ درج کریں' : 'Enter the verification code sent to your email')}
              {step === 3 && (isUrdu ? 'اپنا نیا پاسورڈ منتخب کریں' : 'Create a secure new password')}
            </Text>
          </View>

          {/* Card Container */}
          <View style={[styles.cardContainer, { backgroundColor: colors.surface }]}>

            {/* Error Message Banner */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={18} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* STEP 1: Enter Identifier */}
            {step === 1 && (
              <View>
                <Text style={[styles.label, { color: colors.text }, isUrdu && { fontFamily: fonts.urduBold }]}>
                  {isUrdu ? 'فون نمبر یا ای میل ایڈریس' : 'Phone Number or Email'}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Feather
                    name={identifier.includes('@') ? 'mail' : 'phone'}
                    size={20}
                    color="#10B981"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={isUrdu ? '03001234567 یا ای میل درج کریں' : '03001234567 or email@domain.com'}
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={identifier}
                    onChangeText={setIdentifier}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, loading && { opacity: 0.7 }]}
                  activeOpacity={0.88}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[styles.actionButtonText, isUrdu && { fontFamily: fonts.urduBold }]}>
                      {isUrdu ? 'تصدیقی کوڈ بھیجیں' : 'Send Reset Code'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: Enter OTP */}
            {step === 2 && (
              <View>
                <View style={styles.infoBanner}>
                  <Feather name="mail" size={20} color="#10B981" />
                  <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>
                    {isUrdu ? `ہم نے کوڈ اس پر بھیجا ہے:\n` : `We sent a 4-digit code to:\n`}
                    <Text style={{ fontWeight: '700', color: '#10B981' }}>{targetEmail}</Text>
                  </Text>
                </View>

                <Text style={[styles.label, { color: colors.text }, isUrdu && { fontFamily: fonts.urduBold }]}>
                  {isUrdu ? '4 ہندسوں کا کوڈ' : '4-Digit Verification Code'}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Feather name="key" size={20} color="#6366F1" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.otpInput, { color: colors.text }]}
                    placeholder="• • • •"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otp}
                    onChangeText={setOtp}
                  />
                </View>

                {/* Timer & Resend */}
                <View style={styles.timerRow}>
                  {timer > 0 ? (
                    <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                      {isUrdu ? `دوبارہ بھیجیں: ${timer} سیکنڈ` : `Resend code in ${timer}s`}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend} disabled={loading}>
                      <Text style={styles.resendLink}>
                        {isUrdu ? 'کوڈ دوبارہ بھیجیں' : 'Resend Code Now'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, loading && { opacity: 0.7 }]}
                  activeOpacity={0.88}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[styles.actionButtonText, isUrdu && { fontFamily: fonts.urduBold }]}>
                      {isUrdu ? 'کوڈ کی تصدیق کریں' : 'Verify Code'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: Set New Password */}
            {step === 3 && (
              <View>
                <Text style={[styles.label, { color: colors.text }, isUrdu && { fontFamily: fonts.urduBold }]}>
                  {isUrdu ? 'نیا پاسورڈ' : 'New Password'}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Feather name="lock" size={20} color="#10B981" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={isUrdu ? 'کم از کم 6 حروف' : 'At least 6 characters'}
                    placeholderTextColor={colors.inputPlaceholder}
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: colors.text }, isUrdu && { fontFamily: fonts.urduBold }]}>
                  {isUrdu ? 'پاسورڈ کی تصدیق کریں' : 'Confirm New Password'}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Feather name="check-circle" size={20} color="#6366F1" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={isUrdu ? 'دوبارہ پاسورڈ درج کریں' : 'Re-enter new password'}
                    placeholderTextColor={colors.inputPlaceholder}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, loading && { opacity: 0.7 }]}
                  activeOpacity={0.88}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[styles.actionButtonText, isUrdu && { fontFamily: fonts.urduBold }]}>
                      {isUrdu ? 'نیا پاسورڈ محفوظ کریں' : 'Set New Password'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Back to Login Link */}
            <View style={styles.bottomRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.backToLoginText, isUrdu && { fontFamily: fonts.urduRegular }]}>
                  {isUrdu ? 'واپس لاگ ان پر جائیں' : 'Back to Login'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4
  },
  subTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    lineHeight: 20
  },
  cardContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 10
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%'
  },
  otpInput: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 8
  },
  eyeIcon: {
    padding: 6
  },
  actionButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 12
  },
  infoBannerText: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 10,
    flex: 1
  },
  autoFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 10
  },
  autoFillText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5
  },
  timerRow: {
    alignItems: 'center',
    marginVertical: 12
  },
  timerText: {
    fontSize: 13,
    fontWeight: '500'
  },
  resendLink: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700'
  },
  bottomRow: {
    alignItems: 'center',
    marginTop: 24
  },
  backToLoginText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700'
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginLeft: 8,
    flex: 1
  }
});

