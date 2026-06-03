import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [role, setRole] = useState('owner'); // 'owner' or 'vet'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg(''); // Reset error message

    if (!phoneNumber.trim() || !password.trim()) {
      return setErrorMsg('Please enter your phone number and password');
    }

    if (phoneNumber.length < 10) {
      return setErrorMsg('Please enter a valid phone number');
    }

    setLoading(true);
    try {
      // Use 'farmer' for owner to match register.jsx if needed, but keeping role as mapped
      const mappedRole = role === 'owner' ? 'farmer' : 'vet';
      
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password, role: mappedRole })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      if (data.user.role === 'vet') {
        navigation.replace('VetDashboard', { userName: data.user.fullName });
      } else {
        navigation.replace('Dashboard', { userName: data.user.fullName });
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
          {/* Top Green Section */}
          <View style={styles.topSection}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.mainTitle}>Welcome Back</Text>
            <Text style={styles.urduTitle}>خوش آمدید</Text>
          </View>

          {/* White Card */}
          <View style={styles.cardContainer}>
            
            {/* Role Selection */}
            <Text style={styles.label}>لاگ ان بطور / Login As</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'owner' && styles.roleButtonActive]}
                onPress={() => setRole('owner')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleText, role === 'owner' && styles.roleTextActive]}>مالک / Owner</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'vet' && styles.roleButtonActive]}
                onPress={() => setRole('vet')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleText, role === 'vet' && styles.roleTextActive]}>ڈاکٹر / Vet</Text>
              </TouchableOpacity>
            </View>

            {/* Phone Number */}
            <Text style={styles.label}>فون نمبر / Phone Number</Text>
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

            {/* Password */}
            <Text style={styles.label}>پاس ورڈ / Password</Text>
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

            {/* Forgot Password */}
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>پاس ورڈ بھول گئے؟ / Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Login Button */}
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

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Register / رجسٹر</Text>
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
    flex: 1,
    backgroundColor: '#58D66D',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9', // Light background for the bottom part
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: '#58D66D',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 70, // Extra padding to let card overlap
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  urduTitle: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    marginTop: -40, // Negative margin to overlap the green background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 40,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
    fontWeight: '600',
    marginTop: 20, // Space from previous element
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    borderColor: '#4CB85C',
    backgroundColor: '#E8F8EA',
  },
  roleText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#4CB85C',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: '#D1D5D3', // Adds a visible outline to the container
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%', // Makes input take full height
    fontSize: 15,
    color: '#333',
    outlineStyle: 'none', // Removes default small black web focus outline
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    color: '#4CB85C',
    fontSize: 13,
    marginTop: 16,
    marginBottom: 32,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#58D66D', // Match header green
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#58D66D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#777',
    fontSize: 14,
  },
  registerLink: {
    color: '#4CB85C',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
