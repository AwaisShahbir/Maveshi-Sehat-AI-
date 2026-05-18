import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState('farmer'); // 'farmer' or 'vet'
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [isDistrictModalVisible, setDistrictModalVisible] = useState(false);
  const districts = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Rawalpindi', 'Gujranwala', 'Sialkot'];
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !phoneNumber || !email || !password) {
      return Alert.alert('Error', 'Please fill in all required fields');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match!');
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phoneNumber, email, district, role, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push(`/verify?email=${data.email}`);
    } catch (error) {
      Alert.alert('Registration Error', error.message);
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
            <Text style={styles.mainTitle}>Create Account</Text>
            <Text style={styles.urduTitle}>اکاؤنٹ بنائیں</Text>
          </View>

          {/* White Card */}
          <View style={styles.cardContainer}>
            
            {/* Full Name */}
            <Text style={styles.label}>Full Name / نام</Text>
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Email */}
            <Text style={styles.label}>Email Address / ای میل</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number / فون نمبر</Text>
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

            {/* District */}
            <Text style={styles.label}>District / ضلع</Text>
            <TouchableOpacity style={styles.inputContainer} activeOpacity={0.8} onPress={() => setDistrictModalVisible(true)}>
              <Feather name="map-pin" size={20} color="#4CB85C" style={styles.inputIcon} />
              <Text style={[styles.input, { color: district ? '#333' : '#999', paddingTop: Platform.OS === 'web' ? 2 : 0 }]}>
                {district || 'Select District'}
              </Text>
              <Feather name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>

            {/* Role Selection */}
            <Text style={styles.label}>Role / کردار</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'farmer' && styles.roleButtonActive]}
                onPress={() => setRole('farmer')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleText, role === 'farmer' && styles.roleTextActive]}>کسان / Farmer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'vet' && styles.roleButtonActive]}
                onPress={() => setRole('vet')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleText, role === 'vet' && styles.roleTextActive]}>ویٹرنری / Vet</Text>
              </TouchableOpacity>
            </View>

            {/* Password */}
            <Text style={styles.label}>Password / پاس ورڈ</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#999"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm Password / پاس ورڈ کی تصدیق</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#999"
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerBtn, loading && { opacity: 0.7 }]} 
              activeOpacity={0.9}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerBtnText}>{loading ? 'Registering...' : 'رجسٹر / Register'}</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Login / لاگ ان</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* District Selection Modal */}
      <Modal visible={isDistrictModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select District</Text>
            <FlatList
              data={districts}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setDistrict(item);
                    setDistrictModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, district === item && { color: '#4CB85C', fontWeight: 'bold' }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDistrictModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
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
    backgroundColor: '#E8F8EA', // Matches active role bg in image
  },
  roleText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#4CB85C',
  },
  registerBtn: {
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
    marginTop: 32, // More margin since no forgot password
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#777',
    fontSize: 14,
  },
  loginLink: {
    color: '#4CB85C',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '80%',
    maxHeight: '60%',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
