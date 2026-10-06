import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { t, tSplit } from '../../utils/translate';
import fonts from '../../styles/fonts';
import styles from '../../styles/RegisterScreenStyles';


export default function RegisterScreen() {
  const navigation = useNavigation();
  const [role, setRole] = useState('farmer'); 
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [isDistrictModalVisible, setDistrictModalVisible] = useState(false);
  const districts = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Rawalpindi', 'Gujranwala', 'Sialkot'];
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  
  const [pvmcNumber, setPvmcNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [licenseDocumentUrl, setLicenseDocumentUrl] = useState('');
  const [licenseFileName, setLicenseFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isUploadModalVisible, setUploadModalVisible] = useState(false);

  const handleFileUploadWeb = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('license', file);
      
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      setLicenseDocumentUrl(data.fileUrl);
      setLicenseFileName(file.name);
    } catch (err) {
      setErrorMsg('File upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleMockUploadMobile = async (choice) => {
    setUploadModalVisible(false);
    setUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      const mockFile = {
        uri: 'data:text/plain;base64,Vk1DLUxJQ0VOU0UtRE9DVU1FTlQtQ09OVEVOVA==', 
        name: choice === 'pdf' ? 'pvmc_license_document.pdf' : 'pvmc_license_photo.jpg',
        type: choice === 'pdf' ? 'application/pdf' : 'image/jpeg'
      };
      formData.append('license', mockFile);

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setLicenseDocumentUrl(data.fileUrl);
      setLicenseFileName(mockFile.name);
    } catch (err) {
      setErrorMsg('File upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMsg(''); 

    if (!fullName.trim() || !phoneNumber.trim() || !email.trim() || !password.trim()) {
      return setErrorMsg('Please fill in all required fields');
    }
    
    
    if (phoneNumber.length < 10) {
      return setErrorMsg('Please enter a valid phone number');
    }
    if (!email.includes('@')) {
      return setErrorMsg('Please enter a valid email address');
    }
    if (password.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long');
    }
    if (password !== confirmPassword) {
      return setErrorMsg('Passwords do not match!');
    }

    
    if (role === 'vet') {
      if (!pvmcNumber.trim()) {
        return setErrorMsg('Please enter your PVMC License Number');
      }
      const pvmcRegex = /^pvmc-\d{4,}$/i;
      if (!pvmcRegex.test(pvmcNumber)) {
        return setErrorMsg('License number must start with PVMC- followed by at least 4 digits (e.g. PVMC-1234)');
      }
      if (!specialization.trim()) {
        return setErrorMsg('Please enter your Specialization');
      }
      if (!experienceYears.trim() || isNaN(experienceYears)) {
        return setErrorMsg('Please enter a valid number of years of experience');
      }
      if (!licenseDocumentUrl.trim()) {
        return setErrorMsg('Please upload your License Document');
      }
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName, 
          phoneNumber, 
          email, 
          district, 
          role, 
          password,
          pvmcNumber: role === 'vet' ? pvmcNumber : null,
          specialization: role === 'vet' ? specialization : null,
          experienceYears: role === 'vet' ? parseInt(experienceYears) : null,
          licenseDocumentUrl: role === 'vet' ? licenseDocumentUrl : null
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (role === 'vet') {
        if (Platform.OS === 'web') {
          alert('Registration successful! Pending Admin Approval. You can login once your credentials are verified.');
          navigation.navigate('Login');
        } else {
          Alert.alert(
            'Registration Pending',
            'Your Vet registration is pending Admin Approval. You can login once your credentials are verified.',
            [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
          );
        }
      } else {
        navigation.navigate('Verify', { email: data.email, role: role, userName: fullName });
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
              <Text style={styles.backText}>{t('Back', 'واپس')}</Text>
            </TouchableOpacity>
            <Text style={styles.mainTitle}>{t('Create Account', 'اکاؤنٹ بنائیں')}</Text>
          </View>

          
          <View style={styles.cardContainer}>
            
            
            <Text style={styles.label}>{t('Full Name', 'نام')}</Text>
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder={t('Enter Full Name', 'پورا نام درج کریں')}
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            
            <Text style={styles.label}>{t('Email Address', 'ای میل')}</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder={t('Email', 'ای میل درج کریں')}
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
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

            
            <Text style={styles.label}>{t('District', 'ضلع')}</Text>
            <TouchableOpacity style={styles.inputContainer} activeOpacity={0.8} onPress={() => setDistrictModalVisible(true)}>
              <Feather name="map-pin" size={20} color="#4CB85C" style={styles.inputIcon} />
              <Text style={[styles.input, { height: 'auto', paddingTop: 0, color: district ? '#333' : '#999' }]}>
                {district || t('Select District', 'ضلع منتخب کریں')}
              </Text>
              <Feather name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>

            
            <Text style={styles.label}>{t('Role', 'کردار')}</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'farmer' && styles.roleButtonActive]}
                onPress={() => setRole('farmer')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleText, role === 'farmer' && styles.roleTextActive]}>
                  {t('Farmer', 'کسان')}
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


            {role === 'vet' && (
              <>
                
                <Text style={styles.label}>{t('License Number (PVMC)', 'لائسنس نمبر')}</Text>
                <View style={styles.inputContainer}>
                  <Feather name="file-text" size={20} color="#4CB85C" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Enter PVMC License Number"
                    placeholderTextColor="#999"
                    value={pvmcNumber}
                    onChangeText={setPvmcNumber}
                  />
                </View>

                
                <Text style={styles.label}>{t('Specialization', 'مہارت')}</Text>
                <View style={styles.inputContainer}>
                  <Feather name="award" size={20} color="#4CB85C" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g. Livestock Generalist, Dairy Cattle"
                    placeholderTextColor="#999"
                    value={specialization}
                    onChangeText={setSpecialization}
                  />
                </View>

                
                <View style={styles.inputContainer}>
                  <Feather name="clock" size={20} color="#4CB85C" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g. 5"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={experienceYears}
                    onChangeText={setExperienceYears}
                  />
                </View>

                
                <TouchableOpacity 
                  style={[styles.inputContainer, { justifyContent: 'center', backgroundColor: '#E8F8EA', borderColor: '#4CB85C', borderStyle: 'dashed' }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      document.getElementById('web-license-file-input').click();
                    } else {
                      setUploadModalVisible(true);
                    }
                  }}
                  disabled={uploading}
                >
                  <Feather name={uploading ? "loader" : "upload-cloud"} size={22} color="#4CB85C" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#4CB85C', fontWeight: 'bold', fontSize: 14 }}>
                    {uploading ? t('Uploading...', 'اپ لوڈ ہو رہا ہے...') : (licenseFileName ? `Selected: ${licenseFileName}` : t('Upload Document', 'دستاویز اپ لوڈ کریں'))}
                  </Text>
                  {Platform.OS === 'web' && (
                    <input 
                      id="web-license-file-input"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      onChange={handleFileUploadWeb}
                    />
                  )}
                </TouchableOpacity>
              </>
            )}

            
            <Text style={styles.label}>{t('Password', 'پاس ورڈ')}</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder={t('Enter password', 'پاس ورڈ درج کریں')}
                placeholderTextColor="#999"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            
            <Text style={styles.label}>{t('Confirm Password', 'پاس ورڈ کی تصدیق')}</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#4CB85C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder={t('Confirm Password', 'پاس ورڈ کی تصدیق')}
                placeholderTextColor="#999"
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            
            <TouchableOpacity 
              style={[styles.registerBtn, loading && { opacity: 0.7 }]} 
              activeOpacity={0.9}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerBtnText}>
                {loading ? t('Creating Account...', 'اکاؤنٹ بن رہا ہے...') : t('Create Account', 'اکاؤنٹ بنائیں')}
              </Text>
            </TouchableOpacity>

            
            {(() => {
              const alreadyHelp = tSplit('Already have an account?', 'پہلے سے اکاؤنٹ ہے؟');
              const logLink = tSplit('Login', 'لاگ اِن');
              return (
                <View style={styles.loginContainer}>
                  {alreadyHelp.isBoth ? (
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.loginText}>{alreadyHelp.en} </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                          <Text style={styles.loginLink}>{logLink.en}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <Text style={[styles.loginText, { fontFamily: fonts.urduRegular, fontSize: 13, lineHeight: 28 }]}>
                          {alreadyHelp.ur}{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                          <Text style={[styles.loginLink, { fontFamily: fonts.urduBold, fontSize: 13, lineHeight: 28 }]}>
                            {logLink.ur}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[styles.loginText, alreadyHelp.isUrdu && { fontFamily: fonts.urduRegular, fontSize: 13, lineHeight: 22 }]}>
                        {alreadyHelp.display}{' '}
                      </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={[styles.loginLink, logLink.isUrdu && { fontFamily: fonts.urduBold, fontSize: 13, lineHeight: 22 }]}>
                          {logLink.display}
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

      
      <Modal visible={isDistrictModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('Select District', 'ضلع منتخب کریں')}</Text>
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

      
      <Modal visible={isUploadModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('Upload License', 'لائسنس اپ لوڈ کریں')}</Text>
            
            <TouchableOpacity 
              style={styles.modalUploadItem}
              onPress={() => handleMockUploadMobile('camera')}
            >
              <Feather name="camera" size={20} color="#4CB85C" style={{ marginRight: 12 }} />
              <Text style={[styles.modalItemText, { textAlign: 'left' }]}>{t('Scan Card (Camera)', 'کیمرہ')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalUploadItem}
              onPress={() => handleMockUploadMobile('gallery')}
            >
              <Feather name="image" size={20} color="#4CB85C" style={{ marginRight: 12 }} />
              <Text style={[styles.modalItemText, { textAlign: 'left' }]}>{t('Choose from Gallery', 'گیلری')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalUploadItem}
              onPress={() => handleMockUploadMobile('pdf')}
            >
              <Feather name="file-text" size={20} color="#4CB85C" style={{ marginRight: 12 }} />
              <Text style={[styles.modalItemText, { textAlign: 'left' }]}>{t('Select PDF File', 'پی ڈی ایف دستاویز')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setUploadModalVisible(false)}>
              <Text style={styles.modalCloseText}>{t('Cancel', 'منسوخ کریں۔')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
