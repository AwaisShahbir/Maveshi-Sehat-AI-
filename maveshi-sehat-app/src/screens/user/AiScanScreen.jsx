import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Platform, 
  Modal, 
  Image, 
  Animated, 
  Easing, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { addRecord, loadRecords } from '../../utils/recordsStore';

const BASE_URL = 'https://maveshi-sehat-api.onrender.com';
import { t, getLocalizedDescription, getLocalizedFirstAid } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { getStyles } from '../../styles/AiScanScreenStyles';


const MOCK_IMAGES = [
  {
    id: '1',
    type: 'Cow',
    status: 'Lumpy Skin Disease',
    
    confidence: '94.8%',
    severity: 'High Severity',
    severityColor: '#FF4D4D',
    severityBg: '#FFEBEB',
    description: 'Nodular lesions on skin, fever, and enlargement of superficial lymph nodes.',
    firstAid: [
      'Isolate the infected animal from the rest of the herd immediately.',
      'Apply antiseptic solution to open skin lesions to prevent secondary infections.',
      'Control flies, mosquitoes, and ticks in the stable to stop the spread.',
      'Provide soft feed and clean, fresh drinking water.'
    ],
    
    uri: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=400&auto=format&fit=crop', 
  },
  {
    id: '2',
    type: 'Cow',
    status: 'Healthy (No Symptoms)',
    
    confidence: '98.5%',
    severity: 'No Stress',
    severityColor: '#4CB85C',
    severityBg: '#E8F8EA',
    description: 'No visible lesions, normal skin condition, bright eyes, and alert posture.',
    firstAid: [
      'Maintain regular balanced vaccination and feeding schedule.',
      'Keep the housing dry, well-ventilated, and clean.',
      'Perform regular health check-ups.'
    ],
    uri: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?q=80&w=400&auto=format&fit=crop', 
  },
  {
    id: '3',
    type: 'Buffalo',
    status: 'Foot and Mouth Disease',
    
    confidence: '91.2%',
    severity: 'Severe Stress',
    severityColor: '#FF9500',
    severityBg: '#FFF5E5',
    description: 'Blisters on mouth, tongue, and hooves. Excessive salivation, lameness, and high fever.',
    firstAid: [
      'Wash the mouth lesions with mild antiseptic like potassium permanganate.',
      'Apply boric acid paste/glycine mix on mouth blisters.',
      'Keep the animal in dry and mud-free environment to avoid hoof infection.',
      'Feed soft mashes or gruel to ease chewing.'
    ],
    uri: 'https://images.unsplash.com/photo-1627998774704-512b9ad71f54?q=80&w=400&auto=format&fit=crop', 
  },
  {
    id: '4',
    type: 'Buffalo',
    status: 'Healthy (No Symptoms)',
    
    confidence: '99.1%',
    severity: 'No Stress',
    severityColor: '#4CB85C',
    severityBg: '#E8F8EA',
    description: 'Normal feed intake, clean hooves, active rumination, and shiny black skin.',
    firstAid: [
      'Continue regular insect control measures.',
      'Provide mineral mixture with daily fodder.',
      'Isolate new livestock for 14 days before introducing to the herd.'
    ],
    uri: 'https://images.unsplash.com/photo-1558024920-b41e1887dc32?q=80&w=400&auto=format&fit=crop', 
  }
];

export default function AiScanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const params = route.params || {};
  const userName = params.userName || 'Muhammad Ahmed';
  const userId = params.userId || null;

  
  const [animalType, setAnimalType] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('Uploading Image...');
  const [showReport, setShowReport] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  
  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopScanAnimation = () => {
    scanLineAnim.stopAnimation();
  };

  const handleSelectAnimal = (type) => {
    setAnimalType(type);
    setShowDropdown(false);
  };

  const handleTakePhoto = () => {
    if (!animalType) {
      Alert.alert(t('Select Animal'), 
        'Please select an animal type first.'
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      cameraType: 'back',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.7,
      includeBase64: true,
      saveToPhotos: false,
    };

    try {
      launchCamera(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled camera picker');
        } else if (response.errorCode) {
          console.log('Camera error: ', response.errorMessage);
          Alert.alert(
            'Camera Unavailable',
            'Real camera is not available. Opening sample selector instead.',
            [{ text: 'OK', onPress: () => setPickerModalVisible(true) }]
          );
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setSelectedImage({
            uri: asset.uri,
            base64: asset.base64,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || 'scan.jpg',
            isLocal: true
          });
          setShowReport(false);
        }
      });
    } catch (err) {
      console.log('Falling back to mock camera simulation:', err);
      setPickerModalVisible(true);
    }
  };

  const handleChooseFromGallery = () => {
    if (!animalType) {
      Alert.alert(t('Select Animal'), 
        'Please select an animal type first.'
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.7,
      includeBase64: true,
    };

    try {
      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled gallery picker');
        } else if (response.errorCode) {
          console.log('Gallery error: ', response.errorMessage);
          Alert.alert(
            'Gallery Unavailable',
            'Real gallery is not available. Opening sample selector instead.',
            [{ text: 'OK', onPress: () => setPickerModalVisible(true) }]
          );
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setSelectedImage({
            uri: asset.uri,
            base64: asset.base64,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || 'scan.jpg',
            isLocal: true
          });
          setShowReport(false);
        }
      });
    } catch (err) {
      console.log('Falling back to mock gallery simulation:', err);
      setPickerModalVisible(true);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setShowReport(false);
    startScanAnimation();

    setScanProgressText(t('Uploading Image to Maveshi AI...'));

    const t1 = setTimeout(() => {
      setScanProgressText(t('Analyzing Symptoms with Roboflow AI...'));
    }, 1200);

    const t2 = setTimeout(() => {
      setScanProgressText(t('Generating Health Diagnosis...'));
    }, 2400);

    try {
      let response;
      if (selectedImage.base64) {
        // High-reliability JSON base64 payload - avoids all multipart/FormData native Android crashes and OOM
        response = await fetch(`${BASE_URL}/api/ai/scan-disease`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: selectedImage.base64,
            animalType: animalType || 'Cow',
            ownerName: userName || 'Farmer',
            province: 'Punjab'
          }),
        });
      } else if (selectedImage.uri && selectedImage.isLocal) {
        // Fallback: FormData without manual Content-Type (OkHttp will automatically supply boundary)
        const formData = new FormData();
        formData.append('image', {
          uri: selectedImage.uri,
          name: selectedImage.fileName || 'scan.jpg',
          type: selectedImage.type || 'image/jpeg'
        });
        formData.append('animalType', animalType || 'Cow');
        formData.append('ownerName', userName || 'Farmer');
        formData.append('province', 'Punjab');

        response = await fetch(`${BASE_URL}/api/ai/scan-disease`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Web sample image
        response = await fetch(`${BASE_URL}/api/ai/scan-disease`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: selectedImage.uri,
            animalType: animalType || 'Cow',
            ownerName: userName || 'Farmer',
            province: 'Punjab'
          }),
        });
      }

      clearTimeout(t1);
      clearTimeout(t2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to detect disease');
      }

      const diagnosis = data.diagnosis;
      const isHealthy = !diagnosis.detected;

      const newRecord = {
        id: (data.record && data.record.id) || Date.now().toString(),
        animalId: diagnosis.animalId,
        animalType: animalType || 'Cow',
        disease: diagnosis.name || diagnosis.status,
        diseaseUrdu: diagnosis.urdu,
        confidence: diagnosis.confidence,
        timeAgo: 'Just now',
        date: new Date().toLocaleString(),
        risk: diagnosis.riskLevel === 'High' ? 'High Risk' : (diagnosis.riskLevel === 'Medium' ? 'Medium Risk' : 'Low Risk'),
        status: isHealthy ? 'Healthy' : 'Active',
        icon: isHealthy ? 'check-circle' : (diagnosis.riskLevel === 'High' ? 'alert-circle' : 'trending-up'),
        color: diagnosis.severityColor,
        bg: diagnosis.severityBg,
        uri: selectedImage.uri,
        description: diagnosis.description,
        firstAid: diagnosis.firstAid
      };

      // Refresh records store
      if (typeof loadRecords === 'function') {
        loadRecords(userName);
      } else {
        addRecord(newRecord, userName);
      }

      setScanResult({
        ...diagnosis,
        generatedAnimalId: diagnosis.animalId,
        statusUrdu: diagnosis.urdu,
        uri: selectedImage.uri
      });
      setShowReport(true);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      console.error('Scan Error:', err);
      Alert.alert(t('Scan Failed'), err.message || 'Unable to complete AI disease detection. Please try again.');
    } finally {
      setIsScanning(false);
      stopScanAnimation();
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setShowReport(false);
    setScanResult(null);
  };

  
  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 195], 
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color="#FFF" />
            <Text style={styles.backText}>{t('Back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('AI Disease Detection')}</Text>
                  </View>

        
        <View style={styles.mainCard}>
          <Text style={styles.fieldLabel}>{t('Select Animal Type')}</Text>
          
          
          <TouchableOpacity 
            style={styles.dropdownBtn} 
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={[styles.dropdownText, !animalType && styles.dropdownPlaceholder]}>
              {animalType ? t(animalType) : t('Select')}
            </Text>
            <Feather name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
          </TouchableOpacity>

          
          {/* Dropdown Options */}
          {showDropdown && (
            <View style={styles.dropdownList}>
              <TouchableOpacity 
                style={styles.dropdownItem} 
                onPress={() => handleSelectAnimal('Cow')}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="cow" size={22} color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={styles.dropdownItemText}>{t('Cow')}</Text>
                </View>
                {animalType === 'Cow' && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, { borderBottomWidth: 0 }]} 
                onPress={() => handleSelectAnimal('Buffalo')}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="cow" size={22} color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={styles.dropdownItemText}>{t('Buffalo')}</Text>
                </View>
                {animalType === 'Buffalo' && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Upload / Capture Section */}
          {!selectedImage ? (
            <View style={styles.uploadRow}>
              <TouchableOpacity style={[styles.uploadCard, { borderColor: colors.primary }]} onPress={handleTakePhoto}>
                <View style={[styles.uploadIconBg, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="camera" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>{t('Take Photo')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.uploadCard, { borderColor: colors.accentAmber }]} onPress={handleChooseFromGallery}>
                <View style={[styles.uploadIconBg, { backgroundColor: colors.accentAmberLight }]}>
                  <Feather name="image" size={28} color={colors.accentAmber} />
                </View>
                <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>{t('From Gallery')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            
            <View style={styles.previewContainer}>
              <View style={styles.imageWrapper}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                
                
                {isScanning && (
                  <View style={StyleSheet.absoluteFill}>
                    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                    <View style={styles.scanningOverlay}>
                      <ActivityIndicator size="large" color="#FFF" style={{ marginBottom: 12 }} />
                      <Text style={styles.scanningText}>{scanProgressText}</Text>
                    </View>
                  </View>
                )}
              </View>

              {!isScanning && !showReport && (
                <View style={styles.previewActionRow}>
                  <TouchableOpacity style={styles.changeBtn} onPress={handleReset}>
                    <Text style={styles.changeBtnText}>{t('Change Photo')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze}>
                    <MaterialCommunityIcons name="line-scan" size={20} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.analyzeBtnText}>{t('Analyze Image')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        
        {showReport && scanResult && (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{t('Health Status Report')}</Text>
              <View style={[styles.severityBadge, { backgroundColor: scanResult.severityBg }]}>
                <Text style={[styles.severityText, { color: scanResult.severityColor }]}>
                  {scanResult.severity === 'High Severity' ? t('High Severity') : (scanResult.severity === 'Severe Stress' ? t('Severe Stress') : (scanResult.severity === 'Medium Risk' ? t('Medium Risk') : t('No Stress')))}
                </Text>
              </View>
            </View>

            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Animal ID:')}</Text>
                <Text style={[styles.resultVal, { color: '#FFB020', fontWeight: 'bold' }]}>
                  {scanResult.generatedAnimalId}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Diagnosis:')}</Text>
                <Text style={styles.resultVal}>{t(scanResult.status, scanResult.statusUrdu)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Confidence Score:')}</Text>
                <Text style={[styles.resultVal, { color: '#333' }]}>{scanResult.confidence}</Text>
              </View>
              
              <Text style={[styles.descTitle, isUrdu && { fontFamily: fonts.urduBold, fontSize: 15 }]}>{t('Clinical Description:')}</Text>
              <Text style={[styles.descText, isUrdu && { fontFamily: fonts.urduRegular, fontSize: 14, lineHeight: 28 }]}>{getLocalizedDescription(scanResult.status, scanResult.description)}</Text>
              
              <Text style={[styles.aidTitle, isUrdu && { fontFamily: fonts.urduBold, fontSize: 15 }]}>{t('Recommended First Aid:')}</Text>
              {getLocalizedFirstAid(scanResult.status, scanResult.firstAid).map((tip, idx) => (
                <View key={idx} style={[styles.bulletRow, { alignItems: 'flex-start' }]}>
                  <Text style={[styles.bulletDot, isUrdu && { marginTop: 4 }]}>•</Text>
                  <Text style={[styles.bulletText, isUrdu && { fontFamily: fonts.urduRegular, fontSize: 14, lineHeight: 28 }]}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.reportActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Feather name="refresh-cw" size={16} color="#666" style={{ marginRight: 6 }} />
                <Text style={styles.resetBtnText}>{t('Scan Again')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.consultBtn} 
                onPress={() => navigation.navigate('VeterinariansList', { userName, initialRecord: scanResult })}
              >
                <Feather name="message-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.consultBtnText}>{t('Consult Vet')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Feather name="info" size={18} color="#1A73E8" style={{ marginRight: 8 }} />
            <Text style={styles.tipsTitle}>Tips for Best Results:</Text>
          </View>
          <View style={styles.tipsContent}>
            <Text style={styles.tipText}>• Ensure good lighting</Text>
            <Text style={styles.tipText}>• Capture affected area clearly</Text>
            <Text style={styles.tipText}>• Keep camera steady</Text>
            <Text style={[styles.tipText, { marginTop: 8, fontWeight: 'bold' }]}>{t('• Ensure good lighting')}</Text>
          </View>
        </View>

        
        <View style={{ height: 100 }} />
      </ScrollView>

      
      <Modal
        animationType="slide"
        transparent={true}
        visible={pickerModalVisible}
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Choose Sample Photo')}</Text>
              <TouchableOpacity onPress={() => setPickerModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select a {animalType} sample to simulate AI detection flow:
            </Text>

            <ScrollView style={styles.sampleList} showsVerticalScrollIndicator={false}>
              {MOCK_IMAGES.filter(img => img.type === animalType).map((img) => (
                <TouchableOpacity 
                  key={img.id} 
                  style={styles.sampleItem}
                  onPress={() => handleSelectMockImage(img)}
                >
                  <Image source={{ uri: img.uri }} style={styles.sampleImg} />
                  <View style={styles.sampleDetails}>
                    <Text style={styles.sampleStatus}>{img.status}</Text>
                                        <View style={[styles.sampleBadge, { backgroundColor: img.severityBg }]}>
                      <Text style={[styles.sampleBadgeText, { color: img.severityColor }]}>
                        {img.severity}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={24} color={colors.navInactive} />
            <Text style={[styles.navText, { color: colors.navInactive }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons name="line-scan" size={24} color={colors.navActive} />
            <Text style={[styles.navText, { color: colors.navActive, fontWeight: '700' }]}>AI Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords', { userName, userId })}>
            <Feather name="file-text" size={24} color={colors.navInactive} />
            <Text style={[styles.navText, { color: colors.navInactive }]}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
            <Feather name="message-square" size={24} color={colors.navInactive} />
            <Text style={[styles.navText, { color: colors.navInactive }]}>Forum</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile', { userId })}>
            <Feather name="user" size={24} color={colors.navInactive} />
            <Text style={[styles.navText, { color: colors.navInactive }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
