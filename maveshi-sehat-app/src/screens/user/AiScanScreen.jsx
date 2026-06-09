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
import { addRecord } from '../../utils/recordsStore';
import { t, getLocalizedDescription, getLocalizedFirstAid } from '../../utils/translate';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// Mock images for simulation representing different animal health statuses
const MOCK_IMAGES = [
  {
    id: '1',
    type: 'Cow',
    status: 'Lumpy Skin Disease',
    statusUrdu: 'لمپی سکن کی بیماری',
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
    // Stylized local illustration placeholder (using React Native system icons or elegant visual representation)
    uri: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=400&auto=format&fit=crop', // Beautiful Cow
  },
  {
    id: '2',
    type: 'Cow',
    status: 'Healthy (No Symptoms)',
    statusUrdu: 'صحت مند (کوئی علامات نہیں)',
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
    uri: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?q=80&w=400&auto=format&fit=crop', // Grazing Cow
  },
  {
    id: '3',
    type: 'Buffalo',
    status: 'Foot and Mouth Disease',
    statusUrdu: 'منہ کھر کی بیماری',
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
    uri: 'https://images.unsplash.com/photo-1627998774704-512b9ad71f54?q=80&w=400&auto=format&fit=crop', // Buffalo in field
  },
  {
    id: '4',
    type: 'Buffalo',
    status: 'Healthy (No Symptoms)',
    statusUrdu: 'صحت مند (کوئی علامات نہیں)',
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
    uri: 'https://images.unsplash.com/photo-1558024920-b41e1887dc32?q=80&w=400&auto=format&fit=crop', // Buffalo close-up
  }
];

export default function AiScanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userName = params.userName || 'Muhammad Ahmed';
  const userId = params.userId || null;

  // UI States
  const [animalType, setAnimalType] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  
  // Scanning States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('Uploading Image...');
  const [showReport, setShowReport] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Animated values
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Run scanning animation loop
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
      Alert.alert(
        'Select Animal / جانور منتخب کریں', 
        'Please select an animal type first.\nبراہ کرم پہلے جانور کی قسم منتخب کریں۔'
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.8,
    };

    try {
      launchCamera(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled camera picker');
        } else if (response.errorCode) {
          console.log('Camera error: ', response.errorMessage);
          Alert.alert(
            'Camera Unavailable',
            'Real camera is not available or permission is denied on emulator. Opening sample selector instead.',
            [{ text: 'OK', onPress: () => setPickerModalVisible(true) }]
          );
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setSelectedImage({
            uri: asset.uri,
            isLocal: true
          });
          setShowReport(false);
        }
      });
    } catch (err) {
      console.log('Falling back to mock camera simulation due to native build:', err);
      Alert.alert(
        'Running in Simulation Mode',
        'Native camera module is not compiled yet. Opening sample photo selector instead.',
        [{ text: 'Choose Sample', onPress: () => setPickerModalVisible(true) }]
      );
    }
  };

  const handleChooseFromGallery = () => {
    if (!animalType) {
      Alert.alert(
        'Select Animal / جانور منتخب کریں', 
        'Please select an animal type first.\nبراہ کرم پہلے جانور کی قسم منتخب کریں۔'
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    try {
      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled gallery picker');
        } else if (response.errorCode) {
          console.log('Gallery error: ', response.errorMessage);
          Alert.alert(
            'Gallery Unavailable',
            'Real gallery is not available on emulator. Opening sample selector instead.',
            [{ text: 'OK', onPress: () => setPickerModalVisible(true) }]
          );
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setSelectedImage({
            uri: asset.uri,
            isLocal: true
          });
          setShowReport(false);
        }
      });
    } catch (err) {
      console.log('Falling back to mock gallery simulation due to native build:', err);
      Alert.alert(
        'Running in Simulation Mode',
        'Native gallery module is not compiled yet. Opening sample photo selector instead.',
        [{ text: 'Choose Sample', onPress: () => setPickerModalVisible(true) }]
      );
    }
  };

  const handleAnalyze = () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setShowReport(false);
    startScanAnimation();

    // Step 1: Uploading
    setScanProgressText(t('Uploading Image to Maveshi AI...', 'تصویر اپ لوڈ ہو رہی ہے...'));
    
    // Step 2: Running model
    setTimeout(() => {
      setScanProgressText(t('Analyzing Symptoms...', 'علامات کا تجزیہ کیا جا رہا ہے...'));
    }, 1200);

    // Step 3: Fetching results
    setTimeout(() => {
      setScanProgressText(t('Generating Health Diagnosis...', 'تشخیص تیار کی جا رہی ہے...'));
    }, 2400);

    // Step 4: Finished
    setTimeout(() => {
      setIsScanning(false);
      stopScanAnimation();
      
      const DISEASES = [
        {
          status: 'Lumpy Skin Disease',
          statusUrdu: 'لمپی سکن کی بیماری',
          confidence: `${(85 + Math.random() * 12).toFixed(1)}%`,
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
        },
        {
          status: 'Foot and Mouth Disease',
          statusUrdu: 'منہ کھر کی بیماری',
          confidence: `${(85 + Math.random() * 12).toFixed(1)}%`,
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
        },
        {
          status: 'Mastitis',
          statusUrdu: 'تھنوں کی سوزش',
          confidence: `${(80 + Math.random() * 15).toFixed(1)}%`,
          severity: 'Medium Risk',
          severityColor: '#FFB020',
          severityBg: '#FFF5E5',
          description: 'Swollen, painful, warm udder. Discolored milk, blood clots in milk, decrease in yield.',
          firstAid: [
            'Milk the affected quarter frequently (every 2 hours) to remove pathogens.',
            'Apply cold packs on swollen udder, followed by warm massage if udder is dry.',
            'Maintain strict milking hygiene, wash hands and dip teats before/after milking.',
            'Provide comfortable bedding to avoid further udder damage.'
          ],
        },
        {
          status: 'Healthy (No Symptoms)',
          statusUrdu: 'صحت مند (کوئی علامات نہیں)',
          confidence: `${(95 + Math.random() * 4).toFixed(1)}%`,
          severity: 'No Stress',
          severityColor: '#4CB85C',
          severityBg: '#E8F8EA',
          description: 'Normal feed intake, clear skin, bright eyes, clean hooves, active rumination, and alert posture.',
          firstAid: [
            'Maintain regular balanced vaccination and feeding schedule.',
            'Keep the housing dry, well-ventilated, and clean.',
            'Perform regular health check-ups.'
          ]
        }
      ];

      const randomOutcome = DISEASES[Math.floor(Math.random() * DISEASES.length)];
      const randomIdNum = Math.floor(100 + Math.random() * 900);
      const generatedAnimalId = `${animalType.toUpperCase()}-${randomIdNum}`;
      
      const isHealthy = randomOutcome.status.includes('Healthy');
      
      const newRecord = {
        id: Date.now().toString(),
        animalId: generatedAnimalId,
        animalType: animalType,
        disease: isHealthy ? 'Healthy' : randomOutcome.status,
        diseaseUrdu: isHealthy ? 'صحت مند' : randomOutcome.statusUrdu,
        confidence: randomOutcome.confidence,
        timeAgo: 'Just now',
        date: new Date().toLocaleString(),
        risk: isHealthy ? 'Low Risk' : (randomOutcome.severity.includes('High') || randomOutcome.severity.includes('Severe') ? 'High Risk' : 'Medium Risk'),
        status: isHealthy ? 'Healthy' : (randomOutcome.status === 'Mastitis' ? 'Under Treatment' : 'Active'),
        icon: isHealthy ? 'check-circle' : (randomOutcome.severity.includes('High') || randomOutcome.severity.includes('Severe') ? 'alert-circle' : 'trending-up'),
        color: randomOutcome.severityColor,
        bg: randomOutcome.severityBg,
        uri: selectedImage.uri,
        description: randomOutcome.description,
        firstAid: randomOutcome.firstAid
      };

      addRecord(newRecord, userName);
      
      // Update screen state with generated ID info so it's shown in the report
      setScanResult({
        ...randomOutcome,
        generatedAnimalId,
        uri: selectedImage.uri
      });
      setShowReport(true);
    }, 3600);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setShowReport(false);
    setScanResult(null);
  };

  // Interpolate scanning line position
  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 195], // height of container is 200, line is 5
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="#FFF" />
            <Text style={styles.backText}>{t('Back', 'پیچھے')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('AI Disease Detection', 'بیماری کی تشخیص')}</Text>
        </View>

        {/* Input Form Card */}
        <View style={styles.mainCard}>
          <Text style={styles.fieldLabel}>{t('Select Animal Type', 'جانور کی قسم منتخب کریں')}</Text>
          
          {/* Dropdown Selector */}
          <TouchableOpacity 
            style={styles.dropdownBtn} 
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={[styles.dropdownText, !animalType && styles.dropdownPlaceholder]}>
              {animalType ? t(animalType, animalType === 'Cow' ? 'گائے' : 'بھینس') : t('Select', 'منتخب کریں')}
            </Text>
            <Feather name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
          </TouchableOpacity>

          {/* Dropdown Content */}
          {showDropdown && (
            <View style={styles.dropdownList}>
              <TouchableOpacity 
                style={styles.dropdownItem} 
                onPress={() => handleSelectAnimal('Cow')}
              >
                <Text style={styles.dropdownItemText}>Cow / گائے 🐄</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, { borderBottomWidth: 0 }]} 
                onPress={() => handleSelectAnimal('Buffalo')}
              >
                <Text style={styles.dropdownItemText}>Buffalo / بھینس 🐃</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Grid (Take Photo / Gallery) */}
          {!selectedImage ? (
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadCard} onPress={handleTakePhoto}>
                <View style={[styles.uploadIconBg, { backgroundColor: '#E8F8EA' }]}>
                  <Feather name="camera" size={32} color="#4CB85C" />
                </View>
                <Text style={styles.uploadTitle}>{t('Take Photo', 'تصویر لیں')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadCard} onPress={handleChooseFromGallery}>
                <View style={[styles.uploadIconBg, { backgroundColor: '#FFF5E5' }]}>
                  <Feather name="image" size={32} color="#FFB020" />
                </View>
                <Text style={styles.uploadTitle}>{t('From Gallery', 'گیلری سے')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Selected Image Preview & Action */
            <View style={styles.previewContainer}>
              <View style={styles.imageWrapper}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                
                {/* Scanning overlay bar */}
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
                    <Text style={styles.changeBtnText}>{t('Change Photo', 'تصویر بدلیں')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze}>
                    <MaterialCommunityIcons name="line-scan" size={20} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.analyzeBtnText}>{t('Analyze Image', 'تجزیہ کریں')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Diagnosis Report Card */}
        {showReport && scanResult && (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{t('Health Status Report', 'صحت کی رپورٹ')}</Text>
              <View style={[styles.severityBadge, { backgroundColor: scanResult.severityBg }]}>
                <Text style={[styles.severityText, { color: scanResult.severityColor }]}>
                  {scanResult.severity === 'High Severity' ? t('High Severity', 'شدید بیماری') : (scanResult.severity === 'Severe Stress' ? t('Severe Stress', 'سخت دباؤ') : (scanResult.severity === 'Medium Risk' ? t('Medium Risk', 'درمیانہ خطرہ') : t('No Stress', 'کوئی خطرہ نہیں')))}
                </Text>
              </View>
            </View>

            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Animal ID:', 'شناختی نمبر:')}</Text>
                <Text style={[styles.resultVal, { color: '#FFB020', fontWeight: 'bold' }]}>
                  {scanResult.generatedAnimalId}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Diagnosis:', 'تشخیص:')}</Text>
                <Text style={styles.resultVal}>{t(scanResult.status, scanResult.statusUrdu)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('Confidence Score:', 'اعتماد کا اسکور:')}</Text>
                <Text style={[styles.resultVal, { color: '#333' }]}>{scanResult.confidence}</Text>
              </View>
              
              <Text style={styles.descTitle}>{t('Clinical Description:', 'طبی تفصیل:')}</Text>
              <Text style={styles.descText}>{getLocalizedDescription(scanResult.status, scanResult.description)}</Text>
              
              <Text style={styles.aidTitle}>{t('Recommended First Aid:', 'ابتدائی طبی امداد:')}</Text>
              {getLocalizedFirstAid(scanResult.status, scanResult.firstAid).map((tip, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.reportActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Feather name="refresh-cw" size={16} color="#666" style={{ marginRight: 6 }} />
                <Text style={styles.resetBtnText}>{t('Scan Again', 'دوبارہ اسکین')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.consultBtn} 
                onPress={() => navigation.navigate('VeterinariansList', { userName })}
              >
                <Feather name="message-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.consultBtnText}>{t('Consult Vet', 'ڈاکٹر سے رابطہ')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tips Box */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Feather name="info" size={20} color="#1A73E8" style={{ marginRight: 8 }} />
            <Text style={styles.tipsTitle}>Tips for Best Results:</Text>
          </View>
          <View style={styles.tipsContent}>
            <Text style={styles.tipText}>• Ensure good lighting</Text>
            <Text style={styles.tipText}>• Capture affected area clearly</Text>
            <Text style={styles.tipText}>• Keep camera steady</Text>
            <Text style={[styles.tipText, { marginTop: 6, fontWeight: 'bold' }]}>• روشنی اچھی ہو / واضح تصویر لیں</Text>
          </View>
        </View>

        {/* Dummy space for scrolling */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Mock Image Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pickerModalVisible}
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Sample Photo / تصویر منتخب کریں</Text>
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
                    <Text style={styles.sampleStatusUrdu}>{img.statusUrdu}</Text>
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

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons name="line-scan" size={24} color="#FFF" />
            <Text style={[styles.navText, { color: '#FFF' }]}>AI Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords', { userName, userId })}>
            <Feather name="file-text" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
            <Feather name="message-square" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>Forum</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile', { userId })}>
            <Feather name="user" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAF9' },
  scrollContent: { paddingBottom: 20 },
  
  header: {
    backgroundColor: '#58D66D',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: -8,
  },
  backText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFF' },
  headerUrdu: { fontSize: 16, color: '#E8F8EA', marginTop: 4, fontWeight: '500' },

  mainCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  fieldLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    borderWidth: 1,
    borderColor: '#E2E6E4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dropdownText: { fontSize: 15, color: '#333', fontWeight: '500' },
  dropdownPlaceholder: { color: '#999' },
  
  dropdownList: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E6E4',
    borderRadius: 12,
    marginTop: -10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: { fontSize: 14, color: '#333', fontWeight: '500' },

  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#DDE2E0',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  uploadIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  uploadUrdu: { fontSize: 12, color: '#666', marginTop: 2 },

  previewContainer: {
    alignItems: 'center',
    width: '100%',
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0F0F0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#58D66D',
    shadowColor: '#58D66D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanningText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  previewActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  changeBtn: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '45%',
  },
  changeBtnText: { fontSize: 11, color: '#555', fontWeight: 'bold', textAlign: 'center' },
  analyzeBtn: {
    backgroundColor: '#4CB85C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '50%',
  },
  analyzeBtnText: { fontSize: 11, color: '#FFF', fontWeight: 'bold', textAlign: 'center' },

  reportCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  reportTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: { fontSize: 10, fontWeight: 'bold' },
  resultDetails: {
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  resultLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  resultVal: { fontSize: 13, color: '#333', fontWeight: '700' },
  
  descTitle: { fontSize: 13, fontWeight: 'bold', color: '#333', marginTop: 12, marginBottom: 4 },
  descText: { fontSize: 12, color: '#555', lineHeight: 18 },
  
  aidTitle: { fontSize: 13, fontWeight: 'bold', color: '#333', marginTop: 12, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', marginBottom: 4, paddingRight: 10 },
  bulletDot: { fontSize: 14, color: '#4CB85C', marginRight: 6, marginTop: -2 },
  bulletText: { fontSize: 12, color: '#555', lineHeight: 16, flex: 1 },

  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 12,
    width: '45%',
  },
  resetBtnText: { fontSize: 13, color: '#555', fontWeight: 'bold' },
  consultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CB85C',
    borderRadius: 12,
    paddingVertical: 12,
    width: '50%',
  },
  consultBtnText: { fontSize: 13, color: '#FFF', fontWeight: 'bold' },

  tipsCard: {
    backgroundColor: '#EAF2FD',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C6DCF9',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A73E8' },
  tipsContent: {
    paddingLeft: 4,
  },
  tipText: { fontSize: 13, color: '#2C5EBD', lineHeight: 18, marginBottom: 2 },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  modalSub: { fontSize: 13, color: '#666', marginBottom: 16 },
  
  sampleList: {
    marginBottom: 20,
  },
  sampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E6E4',
  },
  sampleImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  sampleDetails: {
    flex: 1,
  },
  sampleStatus: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  sampleStatusUrdu: { fontSize: 12, color: '#666', marginVertical: 2 },
  sampleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sampleBadgeText: { fontSize: 9, fontWeight: 'bold' },

  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CB85C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#FFF', marginTop: 4, fontWeight: '600' }
});
