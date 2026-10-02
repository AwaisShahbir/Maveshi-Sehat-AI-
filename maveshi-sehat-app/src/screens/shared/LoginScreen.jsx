import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { updateProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
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
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.mainTitle}>Welcome Back</Text>
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
                placeholder="Enter password"
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
                {loading ? 'Logging in...' : 'لاگ ان / Login'}
              </Text>
            </TouchableOpacity>

            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>{t('Register', 'رجسٹر')}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

