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
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { addRecord, loadRecords } from '../../utils/recordsStore';

const BASE_URL = 'https://maveshi-sehat-api.onrender.com';
import { t, useTranslation, getLocalizedDescription, getLocalizedFirstAid } from '../../utils/translate';
import fonts from '../../styles/fonts';
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
  const { isUrdu } = useTranslation();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const params = route.params || {};
  const userName = params.userName || 'Muhammad Ahmed';
  const userId = params.userId || null;

  
  const [animalType, setAnimalType] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [animalTagId, setAnimalTagId] = useState('');
  const [sampleTab, setSampleTab] = useState('Cow');
  
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('Uploading Image...');
  const [showReport, setShowReport] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const animationLoopRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationLoopRef.current) {
        animationLoopRef.current.stop();
      }
    };
  }, []);

  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    if (animationLoopRef.current) {
      animationLoopRef.current.stop();
    }
    animationLoopRef.current = Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animationLoopRef.current.start();
  };

  const stopScanAnimation = () => {
    if (animationLoopRef.current) {
      animationLoopRef.current.stop();
      animationLoopRef.current = null;
    }
    scanLineAnim.stopAnimation();
    scanLineAnim.setValue(0);
  };

  const handleSelectMockImage = (img) => {
    setSelectedImage({
      uri: img.uri,
      isLocal: false,
      sampleInfo: img,
    });
    setAnimalType(img.type);
    setSampleTab(img.type);
    if (!animalTagId.trim()) {
      setAnimalTagId(img.type === 'Buffalo' ? 'BUF-101' : 'COW-101');
    }
    setPickerModalVisible(false);
    setShowReport(false);
  };

  const handleTakePhoto = () => {
    if (!animalTagId || !animalTagId.trim()) {
      Alert.alert(
        t('Livestock ID Required'), 
        t('Please enter the Livestock ID / Tag number (e.g. COW-101, TAG-201) before taking a photo.')
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      cameraType: 'back',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      includeBase64: false,
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
    if (!animalTagId || !animalTagId.trim()) {
      Alert.alert(
        t('Livestock ID Required'), 
        t('Please enter the Livestock ID / Tag number (e.g. COW-101, TAG-201) before choosing from gallery.')
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      includeBase64: false,
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

    if (!animalTagId || !animalTagId.trim()) {
      Alert.alert(
        t('Livestock ID Required'),
        t('Please enter the Livestock ID (e.g. COW-101, TAG-201) before running AI diagnosis.')
      );
      return;
    }

    setIsScanning(true);
    setShowReport(false);
    startScanAnimation();

    const scanNow = new Date();
    const exactScanTime = scanNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + scanNow.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

    setScanProgressText(t('Validating Image & Species...'));

    const t1 = setTimeout(() => {
      setScanProgressText(t('Running Roboflow Vision Core...'));
    }, 1100);

    const t2 = setTimeout(() => {
      setScanProgressText(t('Synthesizing Clinical Pathology Report...'));
    }, 2200);

    try {
      let response;
      const effectiveAnimalId = animalTagId.trim();

      if (selectedImage.uri && selectedImage.isLocal) {
        const formData = new FormData();
        formData.append('image', {
          uri: Platform.OS === 'android' ? selectedImage.uri : selectedImage.uri.replace('file://', ''),
          name: selectedImage.fileName || `scan-${Date.now()}.jpg`,
          type: selectedImage.type || 'image/jpeg'
        });
        formData.append('ownerName', userName || 'Farmer');
        formData.append('animalId', effectiveAnimalId);
        formData.append('province', 'Punjab');

        response = await fetch(`${BASE_URL}/api/ai/scan-disease`, {
          method: 'POST',
          body: formData,
        });
      } else if (selectedImage.base64) {
        response = await fetch(`${BASE_URL}/api/ai/scan-disease`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: selectedImage.base64,
            ownerName: userName || 'Farmer',
            animalId: effectiveAnimalId,
            province: 'Punjab'
          }),
        });
      } else {
        response = await fetch(`${BASE_URL}/api/ai/scan-disease`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: selectedImage.uri,
            ownerName: userName || 'Farmer',
            animalId: effectiveAnimalId,
            province: 'Punjab'
          }),
        });
      }

      clearTimeout(t1);
      clearTimeout(t2);

      const rawResponseText = await response.text();
      let data;
      try {
        data = JSON.parse(rawResponseText);
      } catch (parseErr) {
        if (response.status === 413) {
          throw new Error('Image is too large. Please take a photo with standard resolution.');
        }
        if (response.status >= 500) {
          throw new Error('AI analysis server is waking up on Render. Please try again in 5 seconds.');
        }
        throw new Error(`Server response error (${response.status}): ${rawResponseText.slice(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to detect disease');
      }

      const diagnosis = data.diagnosis;

      const serverImg = diagnosis.imageUrl || (data.record && data.record.image_url);
      const fullImageUrl = serverImg
        ? (serverImg.startsWith('http') ? serverImg : `${BASE_URL}${serverImg.startsWith('/') ? '' : '/'}${serverImg}`)
        : selectedImage.uri;

      // Handle non-livestock invalid images cleanly
      if (diagnosis.isCattle === false) {
        setScanResult({
          ...diagnosis,
          isCattle: false,
          generatedAnimalId: effectiveAnimalId,
          statusUrdu: diagnosis.urdu || t('No Livestock Detected'),
          scanTime: exactScanTime,
          date: exactScanTime,
          uri: fullImageUrl
        });
        setShowReport(true);
        return;
      }

      const isHealthy = !diagnosis.detected;
      const detectedAnimal = diagnosis.animalType || diagnosis.breed || 'Cow';
      const finalAnimalId = effectiveAnimalId || diagnosis.animalId || 'LIVESTOCK-1';

      const newRecord = {
        id: (data.record && data.record.id) || finalAnimalId,
        animalId: finalAnimalId,
        animalType: detectedAnimal,
        breed: diagnosis.breed || detectedAnimal,
        disease: diagnosis.name || diagnosis.status,
        diseaseUrdu: diagnosis.urdu,
        confidence: diagnosis.confidence,
        timeAgo: exactScanTime,
        date: exactScanTime,
        risk: diagnosis.riskLevel === 'High' ? 'High Risk' : (diagnosis.riskLevel === 'Medium' ? 'Medium Risk' : 'Low Risk'),
        status: isHealthy ? 'Healthy' : 'Active',
        icon: isHealthy ? 'check-circle' : (diagnosis.riskLevel === 'High' ? 'alert-circle' : 'trending-up'),
        color: diagnosis.severityColor,
        bg: diagnosis.severityBg,
        uri: fullImageUrl,
        imageUrl: fullImageUrl,
        description: diagnosis.description,
        firstAid: diagnosis.firstAid,
        firstAidUrdu: diagnosis.firstAidUrdu
      };

      if (typeof loadRecords === 'function') {
        loadRecords(userName);
      } else {
        addRecord(newRecord, userName);
      }

      setScanResult({
        ...diagnosis,
        isCattle: true,
        generatedAnimalId: finalAnimalId,
        animalId: finalAnimalId,
        animalType: detectedAnimal,
        breed: diagnosis.breed || detectedAnimal,
        disease: diagnosis.name || diagnosis.status,
        confidence: diagnosis.confidence,
        risk: diagnosis.riskLevel === 'High' ? 'High Risk' : (diagnosis.riskLevel === 'Medium' ? 'Medium Risk' : 'Low Risk'),
        riskLevel: diagnosis.riskLevel,
        statusUrdu: diagnosis.urdu,
        scanTime: exactScanTime,
        date: exactScanTime,
        uri: fullImageUrl,
        imageUrl: fullImageUrl,
        description: diagnosis.description,
        firstAid: diagnosis.firstAid,
        firstAidUrdu: diagnosis.firstAidUrdu
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
    inputRange: [0, 0.5, 1],
    outputRange: [0, 195, 0], 
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
          {/* AI Species Auto-Detection Banner */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#064E3B' : '#F0FDF4',
            borderWidth: 1,
            borderColor: isDark ? '#059669' : '#86EFAC',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 14
          }}>
            <MaterialCommunityIcons name="robot" size={24} color={isDark ? '#4ADE80' : '#16A34A'} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#86EFAC' : '#166534' }}>
                {t('AI Species Auto-Detection Active')}
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#D1FAE5' : '#15803D', marginTop: 2 }}>
                {t('AI automatically identifies Cow, Buffalo, or Goat from photo')}
              </Text>
            </View>
          </View>

          {/* Mandatory Livestock ID Input */}
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.fieldLabel}>{t('Livestock ID')}</Text>
                <Text style={{ color: '#DC2626', fontWeight: '800', marginLeft: 4, fontSize: 16 }}>*</Text>
              </View>
              <View style={{
                backgroundColor: animalTagId.trim() ? (isDark ? '#064E3B' : '#DCFCE7') : (isDark ? '#7F1D1D' : '#FEE2E2'),
                borderWidth: 1,
                borderColor: animalTagId.trim() ? '#86EFAC' : '#FCA5A5',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: animalTagId.trim() ? '#166534' : '#DC2626' }}>
                  {animalTagId.trim() ? t('Ready') : t('Required')}
                </Text>
              </View>
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.inputBackground || (isDark ? '#1E293B' : '#F8FAFC'),
              borderWidth: 1.5,
              borderColor: animalTagId.trim() ? colors.primary : '#DC2626',
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 50,
            }}>
              <Feather name="tag" size={18} color={animalTagId.trim() ? colors.primary : '#DC2626'} style={{ marginRight: 10 }} />
              <TextInput
                value={animalTagId}
                onChangeText={setAnimalTagId}
                placeholder={t('Enter Livestock ID (e.g. COW-101, TAG-201)*')}
                placeholderTextColor="#94A3B8"
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.textPrimary || '#0F172A',
                  paddingVertical: 0
                }}
                autoCapitalize="characters"
              />
              {!!animalTagId && (
                <TouchableOpacity onPress={() => setAnimalTagId('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name="x-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

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

        
        {/* Report Card: Invalid Non-Livestock Image */}
        {showReport && scanResult && scanResult.isCattle === false && (
          <View style={[styles.reportCard, { borderColor: '#F87171', borderWidth: 1.5 }]}>
            <View style={[styles.reportHeader, { borderBottomColor: '#FEE2E2' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Feather name="alert-triangle" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={[styles.reportTitle, { color: '#DC2626' }]}>
                  {t('Non-Livestock Image')}
                </Text>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.severityText, { color: '#DC2626', fontWeight: '800' }]}>
                  {t('Invalid Image')}
                </Text>
              </View>
            </View>

            <View style={styles.resultDetails}>
              {(scanResult.uri || selectedImage?.uri) && (
                <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: '#FCA5A5' }}>
                  <Image 
                    source={{ uri: scanResult.uri || selectedImage?.uri }} 
                    style={{ width: '100%', height: 180, resizeMode: 'cover' }} 
                  />
                </View>
              )}

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Scan Result:')}</Text>
                <Text style={[styles.resultVal, { color: '#DC2626', fontWeight: '700' }]}>
                  {t('No Livestock Detected')}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Livestock ID:')}</Text>
                <Text style={[styles.resultVal, { color: '#0F172A', fontWeight: 'bold' }]}>
                  {scanResult.generatedAnimalId}
                </Text>
              </View>

              <Text style={[styles.descTitle, { color: '#DC2626', marginTop: 12 }, isUrdu && { fontFamily: fonts.urduBold, fontSize: 15 }]}>
                {t('Detection Notice:')}
              </Text>
              <Text style={[styles.descText, isUrdu && { fontFamily: fonts.urduRegular, fontSize: 14, lineHeight: 24 }]}>
                {scanResult.description}
              </Text>

              <Text style={[styles.aidTitle, { marginTop: 14 }, isUrdu && { fontFamily: fonts.urduBold, fontSize: 15 }]}>
                {t('How to Capture a Valid Photo:')}
              </Text>
              {((isUrdu && scanResult.firstAidUrdu) ? scanResult.firstAidUrdu : scanResult.firstAid).map((tip, idx) => (
                <View key={idx} style={[styles.bulletRow, { alignItems: 'flex-start' }]}>
                  <Text style={[styles.bulletDot, { color: '#DC2626' }, isUrdu && { marginTop: 4 }]}>•</Text>
                  <Text style={[styles.bulletText, isUrdu && { fontFamily: fonts.urduRegular, fontSize: 14, lineHeight: 24 }]}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.reportActions}>
              <TouchableOpacity 
                style={[styles.resetBtn, { flex: 1, backgroundColor: '#059669', borderColor: '#059669', paddingVertical: 14 }]} 
                onPress={handleReset}
              >
                <Feather name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={[styles.resetBtnText, { color: '#FFFFFF', fontWeight: '800' }]}>
                  {t('Re-scan Animal')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Report Card: Valid Livestock Disease Diagnosis */}
        {showReport && scanResult && scanResult.isCattle !== false && (
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
              {(scanResult.uri || selectedImage?.uri) && (
                <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB' }}>
                  <Image 
                    source={{ uri: scanResult.uri || selectedImage?.uri }} 
                    style={{ width: '100%', height: 180, resizeMode: 'cover' }} 
                  />
                </View>
              )}
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Scan Time:')}</Text>
                <Text style={styles.resultVal}>{scanResult.scanTime || scanResult.date}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Livestock ID:')}</Text>
                <Text style={[styles.resultVal, { color: '#FFB020', fontWeight: 'bold' }]}>
                  {scanResult.generatedAnimalId}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Species & Breed:')}</Text>
                <Text style={[styles.resultVal, { color: colors.primary, fontWeight: '700' }]}>
                  {scanResult.breed || scanResult.animalType || 'Cow'}
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
              {((isUrdu && scanResult.firstAidUrdu) ? scanResult.firstAidUrdu : getLocalizedFirstAid(scanResult.status, scanResult.firstAid)).map((tip, idx) => (
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
                onPress={() => {
                  const effectiveRecord = {
                    ...scanResult,
                    animalId: scanResult?.animalId || scanResult?.generatedAnimalId || animalTagId.trim() || 'Livestock',
                    disease: scanResult?.disease || scanResult?.name || scanResult?.status,
                    confidence: scanResult?.confidence,
                    imageUrl: scanResult?.imageUrl || scanResult?.uri,
                    animalType: scanResult?.animalType,
                    breed: scanResult?.breed,
                    description: scanResult?.description,
                    firstAid: scanResult?.firstAid,
                    firstAidUrdu: scanResult?.firstAidUrdu
                  };
                  navigation.navigate('VeterinariansList', { userName, userId, initialRecord: effectiveRecord });
                }}
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
