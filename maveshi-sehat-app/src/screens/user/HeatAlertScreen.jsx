import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, subscribeProfile } from '../../utils/profileStore.js';
import { t, tSplit, translateText, subscribeTranslation } from '../../utils/translate.js';

// Major livestock dairy hubs for quick tap (names in English only - translated dynamically)
const QUICK_DISTRICTS = [
  'Lahore',
  'Okara',
  'Sahiwal',
  'Faisalabad',
  'Multan',
  'Kasur',
  'Gujranwala',
  'Sargodha',
  'Rawalpindi',
  'Bahawalpur',
  'Karachi',
  'Peshawar',
];

const calculateTHI = (temp, rh) => {
  const thi = (1.8 * temp + 32) - ((0.55 - 0.0055 * rh) * (1.8 * temp - 26));
  return Math.round(thi);
};

const getStressLevel = (thi) => {
  if (thi < 72) return { level: 'none', color: '#4CB85C', bg: '#E8F8EA' };
  if (thi >= 72 && thi < 79) return { level: 'moderate', color: '#F5A623', bg: '#FFF5E5' };
  if (thi >= 79 && thi < 89) return { level: 'severe', color: '#FF4D4D', bg: '#FFEBEB' };
  return { level: 'deadly', color: '#900000', bg: '#FFD6D6' };
};

// Pure English stress labels (Urdu generated dynamically via Translation API)
const getStressLabel = (level) => {
  if (level === 'none') return 'No Stress';
  if (level === 'moderate') return 'Moderate Stress';
  if (level === 'severe') return 'Severe Stress';
  if (level === 'deadly') return 'Deadly';
  return '';
};

// Pure English veterinary advisory (Urdu generated dynamically via Translation API)
const getAdvisoryText = (level) => {
  if (level === 'none') {
    return 'Animals are comfortable. Maintain standard feeding and provide continuous access to fresh clean drinking water.';
  }
  if (level === 'moderate') {
    return 'Mild heat stress detected. Ensure shed ventilation, run ceiling fans, provide shaded resting areas, and check water troughs frequently.';
  }
  if (level === 'severe') {
    return 'High heat stress! Turn on water misting or sprinklers with fans, feed during cooler morning and night hours, and add mineral electrolytes.';
  }
  return 'DANGER: Critical heat stress! Risk of heatstroke and drop in milk yield. Continuous cooling required. Contact a veterinarian immediately if animals pant heavily.';
};

export default function HeatAlertScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.userId || 'user_123';
  const userName = params.userName || 'Muhammad Ahmed';

  const [profile, setProfile] = useState(getProfile());
  const [, setLangTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);

  // Dynamic Advisory Urdu state (translated via API)
  const [advisoryUrdu, setAdvisoryUrdu] = useState('');

  // Location state
  const [currentLocation, setCurrentLocation] = useState({
    name: 'Lahore, Punjab',
    lat: 31.5497,
    lng: 74.3436,
    isGpsDetected: false,
  });
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const unsubProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
    });
    const unsubTrans = subscribeTranslation(() => {
      setLangTick((prev) => prev + 1);
    });
    return () => {
      unsubProfile();
      unsubTrans();
    };
  }, []);

  // Request location permission & detect location on mount
  useEffect(() => {
    requestAndDetectLocation();
  }, []);

  // When weather changes, fetch dynamic translation for the advisory text via API
  useEffect(() => {
    if (currentWeather && currentWeather.status) {
      const advEn = getAdvisoryText(currentWeather.status.level);
      translateText(advEn, 'ur').then((ur) => {
        setAdvisoryUrdu(ur);
      });
    }
  }, [currentWeather]);

  const requestAndDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLoading(true);

    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('Location Permission Required'),
            message: t('Maveshi Sehat needs location access to calculate accurate real-time Heat Stress for your area.'),
            buttonPositive: t('Allow'),
            buttonNegative: t('Cancel'),
          }
        );
      } catch (err) {
        console.warn('Location permission error:', err);
      }
    }

    try {
      // Dynamic IP/Network Geolocation (works on device & emulator worldwide)
      const response = await fetch('http://ip-api.com/json');
      const data = await response.json();

      if (data && data.status === 'success' && data.lat && data.lon) {
        const detected = {
          name: `${data.city}, ${data.regionName || 'Punjab'}`,
          lat: data.lat,
          lng: data.lon,
          isGpsDetected: true,
        };
        setCurrentLocation(detected);
        await fetchWeatherData(detected.lat, detected.lng);
        setIsDetectingLocation(false);
        setIsLocationModalVisible(false);
        return;
      }
    } catch (e) {
      console.log('Location detection fallback:', e);
    }

    // Fallback: user profile location or Lahore
    const fallbackCity = profile.location || 'Lahore, Punjab';
    await resolveAndSetLocation(fallbackCity);
    setIsDetectingLocation(false);
    setIsLocationModalVisible(false);
  };

  const resolveAndSetLocation = async (name) => {
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
      );
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        const item = data.results[0];
        const newLoc = {
          name: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}`,
          lat: item.latitude,
          lng: item.longitude,
          isGpsDetected: false,
        };
        setCurrentLocation(newLoc);
        await fetchWeatherData(newLoc.lat, newLoc.lng);
        return;
      }
    } catch (e) {
      console.log('Geocoding resolve error:', e);
    }

    const fallbackLoc = { name, lat: 31.5497, lng: 74.3436, isGpsDetected: false };
    setCurrentLocation(fallbackLoc);
    await fetchWeatherData(31.5497, 74.3436);
  };

  const fetchWeatherData = async (lat, lng) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean&timezone=auto`
      );
      const data = await response.json();

      const tVal = data.current.temperature_2m;
      const rhVal = data.current.relative_humidity_2m;
      const windVal = data.current.wind_speed_10m;
      const thi = calculateTHI(tVal, rhVal);

      setCurrentWeather({
        temp: Math.round(tVal),
        humidity: Math.round(rhVal),
        wind: Math.round(windVal),
        thi: thi,
        status: getStressLevel(thi),
      });

      const daily = data.daily;
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const forecastData = daily.time.map((dateStr, index) => {
        const date = new Date(dateStr);
        const dayName = daysOfWeek[date.getDay()];
        const maxT = daily.temperature_2m_max[index];
        const meanRH = daily.relative_humidity_2m_mean[index];
        const dailyTHI = calculateTHI(maxT, meanRH);

        return {
          id: index.toString(),
          day: index === 0 ? 'Today' : dayName,
          temp: Math.round(maxT),
          thi: dailyTHI,
          status: getStressLevel(dailyTHI),
        };
      });

      setForecast(forecastData);
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCity = async (text) => {
    setSearchQuery(text);
    if (!text || text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text.trim())}&count=5&language=en&format=json`
      );
      const data = await res.json();
      if (data && data.results) {
        setSearchResults(
          data.results.map((item) => ({
            id: item.id,
            name: item.name,
            province: item.admin1 || item.country || '',
            lat: item.latitude,
            lng: item.longitude,
          }))
        );
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectDistrict = (item) => {
    const newLoc = {
      name: `${item.name}${item.province ? ', ' + item.province : ''}`,
      lat: item.lat,
      lng: item.lng,
      isGpsDetected: false,
    };
    setCurrentLocation(newLoc);
    setIsLocationModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    fetchWeatherData(newLoc.lat, newLoc.lng);
  };

  const selectQuickCity = async (cityName) => {
    setIsLocationModalVisible(false);
    await resolveAndSetLocation(cityName);
  };

  // Language helpers
  const lang = profile.language || 'English';
  const isBoth = lang === 'Both';
  const isUrdu = lang === 'Urdu';

  // Stress info translation
  const stressRaw = currentWeather ? getStressLabel(currentWeather.status.level) : '';
  const stressSplit = tSplit(stressRaw);
  const advisoryRaw = currentWeather ? getAdvisoryText(currentWeather.status.level) : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F5A623" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.refreshLocButton}
            onPress={requestAndDetectLocation}
            disabled={isDetectingLocation}
          >
            {isDetectingLocation ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Bilingual Header Titles without single-line collisions */}
        {isBoth ? (
          <View>
            <Text style={styles.headerTitle}>Heat Stress Alert</Text>
            <Text style={styles.headerTitleUrdu}>{tSplit('Heat Stress Alert').ur}</Text>
            <Text style={styles.headerSubtitle}>Real-Time Livestock THI Index & Weather</Text>
            <Text style={styles.headerSubtitleUrdu}>{tSplit('Real-Time Livestock THI Index & Weather').ur}</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.headerTitle}>{t('Heat Stress Alert')}</Text>
            <Text style={styles.headerSubtitle}>{t('Real-Time Livestock THI Index & Weather')}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Location Banner */}
        <TouchableOpacity
          style={styles.locationBanner}
          onPress={() => setIsLocationModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.locationBannerLeft}>
            <View style={styles.locationIconWrap}>
              <MaterialCommunityIcons name="map-marker-radius" size={22} color="#F5A623" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationBannerLabel}>
                {currentLocation.isGpsDetected
                  ? t('Current Detected Location')
                  : t('Selected Farm Location')}
              </Text>
              <Text style={styles.locationBannerValue} numberOfLines={1}>
                {currentLocation.name}
              </Text>
            </View>
          </View>
          <View style={styles.changeLocBtn}>
            <Feather name="edit-3" size={13} color="#F5A623" />
            <Text style={styles.changeLocBtnText}>{t('Change')}</Text>
          </View>
        </TouchableOpacity>

        {loading || !currentWeather ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5A623" />
            <Text style={styles.loadingText}>
              {t('Calculating Heat Stress for your area...')}
            </Text>
          </View>
        ) : (
          <>
            {/* Main THI Gauge Card */}
            <View style={styles.mainCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  {isBoth ? (
                    <>
                      <Text style={styles.cardTitle}>Current THI Index</Text>
                      <Text style={styles.cardTitleSubUrdu}>{tSplit('Current THI Index').ur}</Text>
                    </>
                  ) : (
                    <Text style={styles.cardTitle}>{t('Current THI Index')}</Text>
                  )}
                  <Text style={styles.cardSubtitle}>{t('Temperature-Humidity Index')}</Text>
                </View>

                {/* Status Badge with no overflow */}
                <View style={[styles.statusBadge, { backgroundColor: currentWeather.status.bg }]}>
                  {isBoth ? (
                    <View style={styles.badgeBothWrap}>
                      <Text style={[styles.statusText, { color: currentWeather.status.color }]}>
                        {stressSplit.en}
                      </Text>
                      <Text style={[styles.statusTextSub, { color: currentWeather.status.color }]}>
                        {stressSplit.ur}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.statusText, { color: currentWeather.status.color }]}>
                      {t(stressRaw)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Gauge */}
              <View style={styles.gaugeContainer}>
                <View style={[styles.gaugeCircle, { borderColor: currentWeather.status.color }]}>
                  <Text style={[styles.gaugeValue, { color: currentWeather.status.color }]}>
                    {currentWeather.thi}
                  </Text>
                  <Text style={styles.gaugeLabel}>{t('THI Index')}</Text>
                </View>
              </View>

              {/* Gauge Description (Clean bilingual rendering with no nested slashes) */}
              <View style={styles.gaugeDescWrap}>
                {isBoth ? (
                  <>
                    <Text style={styles.gaugeDescEn}>
                      {`Livestock THI indicates ${stressSplit.en.toLowerCase()} danger level for cattle & buffaloes.`}
                    </Text>
                    <Text style={styles.gaugeDescUr}>
                      {`یہ انڈیکس مویشیوں کے لیے ${stressSplit.ur} کو ظاہر کرتا ہے۔`}
                    </Text>
                  </>
                ) : isUrdu ? (
                  <Text style={styles.gaugeDescUr}>
                    {`یہ انڈیکس مویشیوں کے لیے ${stressSplit.ur} کو ظاہر کرتا ہے۔`}
                  </Text>
                ) : (
                  <Text style={styles.gaugeDescEn}>
                    {`Livestock THI indicates ${stressSplit.en.toLowerCase()} danger level for cattle & buffaloes.`}
                  </Text>
                )}
              </View>

              {/* Metrics Row (Temp, Humidity, Wind) */}
              <View style={styles.metricsRow}>
                {/* Temperature */}
                <View style={styles.metricBox}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#FFEBEB' }]}>
                    <Feather name="thermometer" size={18} color="#FF4D4D" />
                  </View>
                  <Text style={styles.metricValue}>{currentWeather.temp}°C</Text>
                  {isBoth ? (
                    <>
                      <Text style={styles.metricLabelEn}>Temperature</Text>
                      <Text style={styles.metricLabelUr}>{tSplit('Temperature').ur}</Text>
                    </>
                  ) : (
                    <Text style={styles.metricLabel}>{t('Temperature')}</Text>
                  )}
                </View>

                {/* Humidity */}
                <View style={styles.metricBox}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#E8F8EA' }]}>
                    <Feather name="droplet" size={18} color="#4CB85C" />
                  </View>
                  <Text style={styles.metricValue}>{currentWeather.humidity}%</Text>
                  {isBoth ? (
                    <>
                      <Text style={styles.metricLabelEn}>Humidity</Text>
                      <Text style={styles.metricLabelUr}>{tSplit('Humidity').ur}</Text>
                    </>
                  ) : (
                    <Text style={styles.metricLabel}>{t('Humidity')}</Text>
                  )}
                </View>

                {/* Wind Speed */}
                <View style={styles.metricBox}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#FFF5E5' }]}>
                    <Feather name="wind" size={18} color="#F5A623" />
                  </View>
                  <Text style={styles.metricValue}>{currentWeather.wind} km/h</Text>
                  {isBoth ? (
                    <>
                      <Text style={styles.metricLabelEn}>Wind Speed</Text>
                      <Text style={styles.metricLabelUr}>{tSplit('Wind Speed').ur}</Text>
                    </>
                  ) : (
                    <Text style={styles.metricLabel}>{t('Wind Speed')}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Veterinary Advisory Card */}
            <View style={styles.advisoryCard}>
              <View style={styles.advisoryHeader}>
                <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#C67A00" />
                <Text style={styles.advisoryTitle}>{t('Veterinary Advisory')}</Text>
              </View>

              {isBoth ? (
                <View style={styles.advisoryBodyWrap}>
                  <Text style={styles.advisoryBodyEn}>{advisoryRaw}</Text>
                  <View style={styles.advisoryDivider} />
                  <Text style={styles.advisoryBodyUr}>{advisoryUrdu || advisoryRaw}</Text>
                </View>
              ) : isUrdu ? (
                <Text style={styles.advisoryBodyUr}>{advisoryUrdu || advisoryRaw}</Text>
              ) : (
                <Text style={styles.advisoryBodyEn}>{advisoryRaw}</Text>
              )}
            </View>

            {/* 7-Day Forecast Card */}
            <View style={[styles.mainCard, { marginBottom: 100 }]}>
              <View style={styles.forecastHeaderRow}>
                <Text style={styles.forecastTitle}>{t('7-Day Forecast')}</Text>
                <Text style={styles.forecastSubtitle}>{currentLocation.name}</Text>
              </View>

              {forecast.map((item) => (
                <View key={item.id} style={styles.forecastRow}>
                  <Text style={styles.forecastDay}>{t(item.day)}</Text>
                  <Feather name="sun" size={18} color="#F5A623" style={styles.forecastIcon} />

                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: item.status.color,
                          width: `${Math.min(item.thi, 100)}%`,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.forecastRight}>
                    <Text style={styles.forecastTemp}>{item.temp}°C</Text>
                    <Text style={[styles.forecastThi, { color: item.status.color }]}>
                      THI: {item.thi}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal
        visible={isLocationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('Select Farm Location')}</Text>
                <Text style={styles.modalSubtitle}>
                  {t('Heat stress calculation relies on your area weather')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsLocationModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Auto Detect Location Button */}
            <TouchableOpacity
              style={styles.autoDetectBtn}
              onPress={requestAndDetectLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? (
                <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#FFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.autoDetectBtnText}>
                {isDetectingLocation
                  ? t('Detecting Location...')
                  : t('Use Current Device Location')}
              </Text>
            </TouchableOpacity>

            {/* Search Input */}
            <View style={styles.searchBarContainer}>
              <Feather name="search" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('Search any district or city...')}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearchCity}
              />
              {searchLoading && <ActivityIndicator size="small" color="#F5A623" />}
              {searchQuery.length > 0 && !searchLoading && (
                <TouchableOpacity onPress={() => handleSearchCity('')}>
                  <Feather name="x" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results List */}
            {searchResults.length > 0 && (
              <View style={styles.searchResultsBox}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultItem}
                    onPress={() => selectDistrict(item)}
                  >
                    <Feather name="map-pin" size={16} color="#F5A623" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      {item.province ? (
                        <Text style={styles.searchResultSub}>{item.province}</Text>
                      ) : null}
                    </View>
                    <Feather name="chevron-right" size={16} color="#CCC" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Livestock Dairy Hubs */}
            <Text style={styles.sectionHeader}>{t('Major Livestock Hubs (Pakistan)')}</Text>
            <ScrollView style={styles.chipsScroll} contentContainerStyle={styles.chipsContainer}>
              {QUICK_DISTRICTS.map((cityName) => {
                const isSelected = currentLocation.name.toLowerCase().includes(cityName.toLowerCase());
                return (
                  <TouchableOpacity
                    key={cityName}
                    style={[styles.districtChip, isSelected && styles.districtChipActive]}
                    onPress={() => selectQuickCity(cityName)}
                  >
                    <Feather
                      name="map-pin"
                      size={12}
                      color={isSelected ? '#FFF' : '#555'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.districtChipText,
                        isSelected && styles.districtChipTextActive,
                      ]}
                    >
                      {cityName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('AiScan', { userName, userId })}
          >
            <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('AI Scan')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('HealthRecords', { userName, userId })}
          >
            <Feather name="file-text" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Records')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('CommunityForum', { userName, userId })}
          >
            <Feather name="message-square" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Forum')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Profile', { userId })}
          >
            <Feather name="user" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Profile')}</Text>
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
    backgroundColor: '#F5A623',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  refreshLocButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerTitleUrdu: { fontSize: 15, fontWeight: 'bold', color: '#FFF', opacity: 0.95, marginTop: 1 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.92)', marginTop: 2 },
  headerSubtitleUrdu: { fontSize: 11, color: 'rgba(255,255,255,0.92)', marginTop: 1 },

  locationBanner: {
    backgroundColor: '#FFF',
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  locationBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationBannerLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  locationBannerValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 2,
  },
  changeLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE2B8',
    gap: 5,
  },
  changeLocBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F5A623',
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  mainCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 18,
    borderRadius: 20,
    padding: 20,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardTitleSubUrdu: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 1 },
  cardSubtitle: { fontSize: 11, color: '#888', marginTop: 2 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  badgeBothWrap: {
    alignItems: 'center',
  },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  statusTextSub: { fontSize: 10, fontWeight: 'bold', marginTop: 1 },

  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gaugeCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 9,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeValue: { fontSize: 38, fontWeight: 'bold' },
  gaugeLabel: { fontSize: 11, color: '#999', marginTop: -2 },

  gaugeDescWrap: {
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  gaugeDescEn: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  gaugeDescUr: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
    marginTop: 2,
  },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    width: '31%',
  },
  metricIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  metricLabel: { fontSize: 10, color: '#777', marginTop: 2, textAlign: 'center' },
  metricLabelEn: { fontSize: 10, color: '#666', marginTop: 2, textAlign: 'center' },
  metricLabelUr: { fontSize: 9, color: '#888', marginTop: 1, textAlign: 'center' },

  advisoryCard: {
    backgroundColor: '#FFF9F0',
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE2B8',
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C67A00',
  },
  advisoryBodyWrap: {},
  advisoryBodyEn: {
    fontSize: 12,
    color: '#664400',
    lineHeight: 18,
  },
  advisoryDivider: {
    height: 1,
    backgroundColor: '#FFE2B8',
    marginVertical: 8,
  },
  advisoryBodyUr: {
    fontSize: 12,
    color: '#664400',
    lineHeight: 20,
    textAlign: 'right',
  },

  forecastHeaderRow: {
    marginBottom: 16,
  },
  forecastTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  forecastSubtitle: { fontSize: 11, color: '#888', marginTop: 2 },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  forecastDay: { width: 44, fontSize: 13, color: '#555', fontWeight: '500' },
  forecastIcon: { width: 28 },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  forecastRight: { width: 60, alignItems: 'flex-end' },
  forecastTemp: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  forecastThi: { fontSize: 10, fontWeight: '600' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoDetectBtn: {
    flexDirection: 'row',
    backgroundColor: '#4CB85C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  autoDetectBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    paddingVertical: 4,
  },
  searchResultsBox: {
    backgroundColor: '#FDFDFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 12,
    maxHeight: 180,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  searchResultSub: {
    fontSize: 11,
    color: '#888',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 6,
    marginBottom: 10,
  },
  chipsScroll: {
    maxHeight: 180,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10,
  },
  districtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F2',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8E4',
  },
  districtChipActive: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  districtChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  districtChipTextActive: {
    color: '#FFF',
  },

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
  navText: { fontSize: 10, color: '#A3E6B2', marginTop: 4, fontWeight: '600' },
});
