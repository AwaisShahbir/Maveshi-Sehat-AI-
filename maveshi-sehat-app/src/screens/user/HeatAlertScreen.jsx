import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/HeatAlertScreenStyles';

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
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : '#F5A623'} />

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
                <Text style={[styles.gaugeDescEn, isUrdu && styles.gaugeDescUr]}>
                  {t(`Livestock THI indicates ${stressInfo.title.toLowerCase()} danger level for cattle & buffaloes.`)}
                </Text>
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
            <Feather name="home" size={24} color={colors.primaryLight} />
            <Text style={[styles.navText, { color: colors.primaryLight }]}>{t('Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('AiScan', { userName, userId })}
          >
            <MaterialCommunityIcons name="line-scan" size={24} color={colors.primaryLight} />
            <Text style={[styles.navText, { color: colors.primaryLight }]}>{t('AI Scan')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('HealthRecords', { userName, userId })}
          >
            <Feather name="file-text" size={24} color={colors.primaryLight} />
            <Text style={[styles.navText, { color: colors.primaryLight }]}>{t('Records')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('CommunityForum', { userName, userId })}
          >
            <Feather name="message-square" size={24} color={colors.primaryLight} />
            <Text style={[styles.navText, { color: colors.primaryLight }]}>{t('Forum')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Profile', { userId })}
          >
            <Feather name="user" size={24} color={colors.primaryLight} />
            <Text style={[styles.navText, { color: colors.primaryLight }]}>{t('Profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
