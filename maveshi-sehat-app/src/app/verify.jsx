import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams(); // Get email passed from Register
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

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
      return Platform.OS === 'web' ? alert('Please enter the 4-digit code.') : Alert.alert('Error', 'Please enter the 4-digit code.');
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/verify-otp', {
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
      
      router.push('/dashboard');
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
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Top Green Section */}
          <View style={styles.topSection}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <Feather name="shield" size={40} color="#FFFFFF" />
            </View>
            
            <Text style={styles.mainTitle}>Verify Phone</Text>
            <Text style={styles.urduTitle}>فون کی تصدیق کریں</Text>
          </View>

          {/* White Card */}
          <View style={styles.cardContainer}>
            <Text style={styles.instructionText}>Enter 4-digit code sent to</Text>
            <Text style={styles.phoneNumber}>{email || '+92 300 1234567'}</Text>

            {/* OTP Inputs */}
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

            {/* Resend Timer */}
            <Text style={styles.timerText}>
              Resend code in <Text style={styles.timerHighlight}>60s</Text>
            </Text>
            
            <TouchableOpacity>
              <Text style={styles.resendLink}>Resend OTP / دوبارہ بھیجیں</Text>
            </TouchableOpacity>

            {/* Verify Button */}
            <TouchableOpacity 
              style={[styles.verifyBtn, loading && { opacity: 0.7 }]} 
              activeOpacity={0.9}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text style={styles.verifyBtnText}>{loading ? 'Verifying...' : 'تصدیق کریں / Verify'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#58D66D' },
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  scrollContent: { flexGrow: 1 },
  topSection: {
    backgroundColor: '#58D66D',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 70,
    alignItems: 'center', // Center content in this screen
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    width: '100%',
  },
  backText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 4 },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mainTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  urduTitle: { color: '#FFFFFF', fontSize: 20 },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 32,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 40,
    alignItems: 'center',
  },
  instructionText: { fontSize: 15, color: '#555', marginBottom: 4 },
  phoneNumber: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 32 },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
    width: '100%',
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timerText: { fontSize: 13, color: '#777', marginBottom: 8 },
  timerHighlight: { color: '#4CB85C', fontWeight: 'bold' },
  resendLink: { color: '#4CB85C', fontSize: 14, fontWeight: 'bold', marginBottom: 32 },
  verifyBtn: {
    backgroundColor: '#58D66D',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#58D66D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});
