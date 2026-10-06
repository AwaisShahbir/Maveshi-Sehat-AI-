import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { updateProfile } from '../../utils/profileStore';
import { t, tSplit } from '../../utils/translate';
import fonts from '../../styles/fonts';
import styles from '../../styles/LoginScreenStyles';


export default function LoginScreen() {
  const navigation = useNavigation();
  const [role, setRole] = useState('owner'); 
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      
      // Update global profile store
      updateProfile({
        userName: data.user.fullName,
        phone: data.user.phoneNumber || phoneNumber,
      });

      if (data.user.role === 'vet') {
        navigation.replace('VetDashboard', { userName: data.user.fullName, userId: data.user.id });
      } else {
        navigation.replace('Dashboard', { userName: data.user.fullName, userId: data.user.id });
      }
    } catch (error) {
      setErrorMsg(error.message);
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
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
              {(() => {
                const backItem = tSplit('Back', 'واپس');
                return backItem.isBoth ? (
                  <View style={{ marginLeft: 4 }}>
                    <Text style={styles.backText}>{backItem.en}</Text>
                    <Text style={[styles.backText, { fontFamily: fonts.urduBold, fontSize: 13, lineHeight: 20 }]}>{backItem.ur}</Text>
                  </View>
                ) : (
                  <Text style={[styles.backText, backItem.isUrdu && { fontFamily: fonts.urduBold, fontSize: 14, lineHeight: 22 }]}>
                    {backItem.display}
                  </Text>
                );
              })()}
            </TouchableOpacity>
            {(() => {
              const titleItem = tSplit('Welcome Back', 'خوش آمدید');
              return titleItem.isBoth ? (
                <View>
                  <Text style={styles.mainTitle}>{titleItem.en}</Text>
                  <Text style={styles.urduTitle}>{titleItem.ur}</Text>
                </View>
              ) : (
                <Text style={[styles.mainTitle, titleItem.isUrdu && { fontFamily: fonts.urduBold, fontSize: 28, lineHeight: 46 }]}>
                  {titleItem.display}
                </Text>
              );
            })()}
          </View>

          
          <View style={styles.cardContainer}>
            
            <Text style={styles.label}>{t('Login As', 'لاگ ان بطور')}</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'owner' && styles.roleButtonActive]}
                onPress={() => setRole('owner')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleText, role === 'owner' && styles.roleTextActive]}>
                  {t('Owner', 'مالک')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'vet' && styles.roleButtonActive]}
                onPress={() => setRole('vet')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleText, role === 'vet' && styles.roleTextActive]}>
                  {t('Vet', 'ڈاکٹر')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{t('Phone Number', 'فون نمبر')}</Text>
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

            <Text style={styles.label}>{t('Password', 'پاس ورڈ')}</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder={t('Enter password', 'پاس ورڈ درج کریں')}
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
              <Text style={styles.forgotPassword}>
                {t('Forgot Password?', 'پاس ورڈ بھول گئے؟')}
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
              <Text style={styles.loginButtonText}>
                {loading ? t('Logging in...', 'لاگ ان ہو رہا ہے...') : t('Login', 'لاگ اِن')}
              </Text>
            </TouchableOpacity>

            
            {(() => {
              const loginHelp = tSplit("Don't have an account?", 'اکاؤنٹ نہیں ہے؟');
              const regLink = tSplit('Register', 'رجسٹر کریں');
              return (
                <View style={styles.registerContainer}>
                  {loginHelp.isBoth ? (
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.registerText}>{loginHelp.en} </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                          <Text style={styles.registerLink}>{regLink.en}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <Text style={[styles.registerText, { fontFamily: fonts.urduRegular, fontSize: 13, lineHeight: 28 }]}>
                          {loginHelp.ur}{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                          <Text style={[styles.registerLink, { fontFamily: fonts.urduBold, fontSize: 13, lineHeight: 28 }]}>
                            {regLink.ur}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[styles.registerText, loginHelp.isUrdu && { fontFamily: fonts.urduRegular, fontSize: 13, lineHeight: 22 }]}>
                        {loginHelp.display}{' '}
                      </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={[styles.registerLink, regLink.isUrdu && { fontFamily: fonts.urduBold, fontSize: 13, lineHeight: 22 }]}>
                          {regLink.display}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })()}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

