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

  // Flow steps: 1 = Request Code, 2 = Verify OTP, 3 = New Password
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

  // Safe fetch helper that handles HTML 404/500 responses gracefully
  const safeFetch = async (endpoint, payload) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      if (response.status === 404) {
        throw new Error('Backend update in progress. Please push latest backend to Render and try again.');
      }
      throw new Error('Server returned an unexpected response. Please try again.');
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Operation failed');
    }

    return data;
  };

  // Step 1: Request Code
  const handleRequestCode = async () => {
    setErrorMsg('');
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg(t('Please enter your phone number or email'));
      return;
    }

    setLoading(true);
    try {
      const data = await safeFetch('/forgot-password', { identifier: cleanId });
      setTargetEmail(data.email);
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
      setErrorMsg(t('Please enter the 4-digit verification code'));
      return;
    }

    setLoading(true);
    try {
      await safeFetch('/verify-reset-code', { email: targetEmail, otp: cleanOtp });
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
      setErrorMsg(t('Please enter a new password'));
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg(t('Password must be at least 6 characters long'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(t('Passwords do not match'));
      return;
    }

    setLoading(true);
    try {
      await safeFetch('/reset-password', {
        email: targetEmail,
        otp: otp.trim(),
        newPassword: newPassword.trim()
      });

      Alert.alert(
        t('Success'),
        t('Password reset successfully! You can now log in with your new password.'),
        [
          {
            text: t('Login Now'),
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
      await safeFetch('/forgot-password', { identifier: targetEmail });
      setTimer(60);
      setCanResend(false);
      Alert.alert(
        t('Code Resent'),
        t('A fresh verification code has been dispatched to your email.')
      );
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#135431' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#135431" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} keyboardShouldPersistTaps="handled">

          {/* Top Header Section */}
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
              <Text style={[styles.backText, isUrdu && { fontFamily: fonts.urduBold }]}>
                {t('Back')}
              </Text>
            </TouchableOpacity>

            <View style={styles.badgeContainer}>
              <Feather name="shield" size={14} color="#86EFAC" style={{ marginRight: 6 }} />
              <Text style={styles.badgeText}>ACCOUNT SECURITY</Text>
            </View>

            <Text style={[styles.mainTitle, isUrdu && { fontFamily: fonts.urduBold, fontSize: 26, lineHeight: 42 }]}>
              {t('Reset Password')}
            </Text>
            <Text style={[styles.subTitle, isUrdu && { fontFamily: fonts.urduRegular }]}>
              {step === 1 && t('Enter your registered phone number or email to receive a verification code.')}
              {step === 2 && t('Enter the 4-digit verification code sent to your email.')}
              {step === 3 && t('Create a secure new password for your account.')}
            </Text>
          </View>

          {/* White Card Container */}
          <View style={[styles.cardContainer, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>

            {/* Error Message Banner */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* STEP 1: Enter Identifier */}
            {step === 1 && (
              <View>
                <Text style={[styles.label, { color: isDark ? colors.text : '#1E293B' }, isUrdu && { fontFamily: fonts.urduBold }]}>
                  {t('Phone Number or Email')}
                </Text>
                <View style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? colors.inputBackground : '#F8FAFC',
                    borderColor: isDark ? colors.border : '#E2E8F0'
                  }
                ]}>
                  <Feather
                    name={identifier.includes('@') ? 'mail' : 'phone'}
                    size={20}
                    color="#10B981"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: isDark ? colors.text : '#0F172A' }]}
                    placeholder={t('03001234567 or email@domain.com')}
                    placeholderTextColor={isDark ? colors.inputPlaceholder : '#94A3B8'}
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
                      {t('Send Reset Code')}
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
                  <Text style={[styles.infoBannerText, { color: isDark ? colors.textSecondary : '#334155' }]}>
                    {t('We sent a 4-digit code to:') + '\n'}
                    <Text style={{ fontWeight: '700', color: '#10B981' }}>{targetEmail}</Text>
                  </Text>
                </View>

                <Text style={[styles.label, { color: isDark ? colors.text : '#1E293B' }, isUrdu && { fontFamily: fonts.urduBold }]}>
                  {t('4-Digit Verification Code')}
                </Text>
                <View style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? colors.inputBackground : '#F8FAFC',
                    borderColor: isDark ? colors.border : '#E2E8F0'
                  }
                ]}>
                  <Feather name="key" size={20} color="#10B981" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.otpInput, { color: isDark ? colors.text : '#0F172A' }]}
                    placeholder="• • • •"
                    placeholderTextColor={isDark ? colors.inputPlaceholder : '#94A3B8'}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otp}
                    onChangeText={setOtp}
                  />
                </View>

                {/* Timer & Resend */}
                <View style={styles.timerRow}>
                  {timer > 0 ? (
                    <Text style={[styles.timerText, { color: isDark ? colors.textSecondary : '#64748B' }]}>
                      {`${t('Resend code in')} ${timer}s`}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend} disabled={loading}>
                      <Text style={styles.resendLink}>
                        {t('Resend Code Now')}
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
                      {t('Verify Code')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: Set New Password */}
            {step === 3 && (
              <View>
                <Text style={[styles.label, { color: isDark ? colors.text : '#1E293B' }, isUrdu && { fontFamily: fonts.urduBold }]}>
                  {t('New Password')}
                </Text>
                <View style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? colors.inputBackground : '#F8FAFC',
                    borderColor: isDark ? colors.border : '#E2E8F0'
                  }
                ]}>
                  <Feather name="lock" size={20} color="#10B981" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? colors.text : '#0F172A' }]}
                    placeholder={t('At least 6 characters')}
                    placeholderTextColor={isDark ? colors.inputPlaceholder : '#94A3B8'}
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: isDark ? colors.text : '#1E293B' }, isUrdu && { fontFamily: fonts.urduBold }]}>
                  {t('Confirm New Password')}
                </Text>
                <View style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? colors.inputBackground : '#F8FAFC',
                    borderColor: isDark ? colors.border : '#E2E8F0'
                  }
                ]}>
                  <Feather name="check-circle" size={20} color="#10B981" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? colors.text : '#0F172A' }]}
                    placeholder={t('Re-enter new password')}
                    placeholderTextColor={isDark ? colors.inputPlaceholder : '#94A3B8'}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#64748B" />
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
                      {t('Set New Password')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Back to Login Link */}
            <View style={styles.bottomRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.backToLoginText, isUrdu && { fontFamily: fonts.urduRegular }]}>
                  {t('Back to Login')}
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
    paddingBottom: 28,
    backgroundColor: '#135431'
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
    marginLeft: 6
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8
  },
  badgeText: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6
  },
  subTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    lineHeight: 20
  },
  cardContainer: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: 480
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
    height: 54,
    marginBottom: 12
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
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center'
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
    marginBottom: 16
  },
  infoBannerText: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 10,
    flex: 1
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
    marginTop: 28
  },
  backToLoginText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700'
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginLeft: 8,
    flex: 1
  }
});
