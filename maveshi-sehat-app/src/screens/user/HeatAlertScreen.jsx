import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t, tSplit, translateText, subscribeTranslation } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/HeatAlertScreenStyles';

// Major livestock dairy hubs in Pakistan for quick tap
const QUICK_DISTRICTS = [
  'Lahore',
  'Sahiwal',
  'Okara',
  'Faisalabad',
  'Multan',
  'Kasur',
  'Gujranwala',
  'Sargodha',
  'Jhang',
  'Bahawalpur',
  'Rawalpindi',
  'Karachi',
  'Peshawar',
];

const calculateTHI = (temp, rh) => {
  const tVal = parseFloat(temp) || 25;
  const rhVal = parseFloat(rh) || 50;
  const thi = 0.8 * tVal + (rhVal / 100.0) * (tVal - 14.4) + 46.4;
  return Math.round(thi);
};

const getStressLevel = (thi) => {
  if (thi < 72) return { level: 'none', color: '#10B981', bg: '#ECFDF5', label: 'No Stress', labelUr: 'کوئی خطرہ نہیں' };
  if (thi >= 72 && thi < 79) return { level: 'moderate', color: '#F59E0B', bg: '#FFFBEB', label: 'Moderate Stress', labelUr: 'معتدل گرمی' };
  if (thi >= 79 && thi < 89) return { level: 'severe', color: '#EF4444', bg: '#FEF2F2', label: 'Severe Stress', labelUr: 'شدید گرمی کا خطرہ' };
  return { level: 'deadly', color: '#7F1D1D', bg: '#FEE2E2', label: 'Emergency / Fatal', labelUr: 'انتہائی سنگین ایمرجنسی' };
};

const getAdvisoryText = (level) => {
  if (level === 'none') {
    return 'Cattle & buffaloes are comfortable. Maintain standard fresh water and routine feeding.';
  }
  if (level === 'moderate') {
    return 'Mild heat stress detected. Milk yield may drop by 10%. Ensure continuous shed ventilation and clean cold drinking water.';
  }
  if (level === 'severe') {
    return 'Severe heat stress! Turn on misting fans/sprinklers every 15 mins, shift 60% of feed to night hours, and add electrolytes.';
  }
  return 'CRITICAL DANGER: High risk of heatstroke and mortality! Continuous cooling required. Douse cattle with cold water immediately and call a vet.';
};

export default function HeatAlertScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.userId || 'user_123';
  const userName = params.userName || 'Muhammad Ahmed';

  const [profile, setProfile] = useState(getProfile());
  const [, setLangTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Weather and Bioclimatic Environmental State
  const [currentWeather, setCurrentWeather] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [hourlyTab, setHourlyTab] = useState('temp'); // 'temp' | 'thi' | 'pop' | 'wind'

  // Dynamic Advisory Urdu state
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

  useEffect(() => {
    requestAndDetectLocation();
  }, []);

  // When weather changes, fetch dynamic translation for the advisory text
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
        await fetchWeatherData(detected.lat, detected.lng, detected.name);
        setIsDetectingLocation(false);
        setIsLocationModalVisible(false);
        return;
      }
    } catch (e) {
      console.log('Location detection fallback:', e);
    }

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
        await fetchWeatherData(newLoc.lat, newLoc.lng, newLoc.name);
        return;
      }
    } catch (e) {
      console.log('Geocoding resolve error:', e);
    }

    const fallbackLoc = { name, lat: 31.5497, lng: 74.3436, isGpsDetected: false };
    setCurrentLocation(fallbackLoc);
    await fetchWeatherData(31.5497, 74.3436, name);
  };

  const fetchWeatherData = async (lat, lng, districtName = '') => {
    setLoading(true);
    const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
    let fetchedFromBackend = false;

    // 1. Try Maveshi Sehat backend meteorological & THI service
    try {
      const res = await fetch(`${baseUrl}/api/weather/heat-stress?lat=${lat}&lng=${lng}&district=${encodeURIComponent(districtName || currentLocation.name)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.current) {
          const thiVal = data.current.thi;
          const statusObj = getStressLevel(thiVal);

          setCurrentWeather({
            temp: data.current.temp,
            feelsLike: data.current.feelsLike,
            humidity: data.current.humidity,
            dewPoint: data.current.dewPoint,
            wind: data.current.windSpeed,
            windGusts: data.current.windGusts,
            windDirection: data.current.windDirection,
            pressure: data.current.pressure,
            precipitation: data.current.precipitation,
            thi: thiVal,
            status: statusObj,
            todayHigh: data.current.todayHigh,
            todayLow: data.current.todayLow,
            sunrise: data.current.sunrise,
            sunset: data.current.sunset,
            uvIndex: data.current.uvIndex,
            visibilityKm: data.current.visibilityKm,
            moon: data.current.moon
          });

          setHourlyForecast(data.hourly || []);
          setDailyForecast(data.daily || []);
          fetchedFromBackend = true;
        }
      }
    } catch (backendErr) {
      console.log('Backend weather service unreachable, connecting directly to Open-Meteo:', backendErr.message);
    }

    // 2. Direct Open-Meteo Fallback if backend was unreachable
    if (!fetchedFromBackend) {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
          `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,wind_speed_10m,visibility` +
          `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=10`
        );
        const data = await response.json();

        if (data && data.current) {
          const tVal = Math.round(data.current.temperature_2m);
          const rhVal = Math.round(data.current.relative_humidity_2m);
          const thi = calculateTHI(tVal, rhVal);
          const status = getStressLevel(thi);

          setCurrentWeather({
            temp: tVal,
            feelsLike: Math.round(data.current.apparent_temperature ?? tVal),
            humidity: rhVal,
            dewPoint: Math.round(tVal - ((100 - rhVal) / 5)),
            wind: Math.round(data.current.wind_speed_10m || 10),
            windGusts: Math.round(data.current.wind_gusts_10m || 15),
            windDirection: { cardinal: 'NNW', degrees: 345 },
            pressure: Math.round(data.current.surface_pressure || 1014),
            precipitation: data.current.precipitation || 0,
            thi: thi,
            status: status,
            todayHigh: Math.round(data.daily?.temperature_2m_max[0] || tVal + 4),
            todayLow: Math.round(data.daily?.temperature_2m_min[0] || tVal - 6),
            sunrise: '06:15 AM',
            sunset: '05:30 PM',
            uvIndex: Math.round(data.daily?.uv_index_max[0] || 5),
            visibilityKm: Math.round((data.hourly?.visibility ? data.hourly.visibility[0] : 10000) / 1000),
            moon: { phaseName: 'Waning Gibbous', illumination: 62, daysToFullMoon: 23 }
          });

          // Process 24-hr forecast
          const hours = [];
          const nowHour = new Date().getHours();
          for (let i = 0; i < 24; i++) {
            const h = (nowHour + i) % 24;
            const isAm = h < 12;
            const hour12 = h % 12 === 0 ? 12 : h % 12;
            const tempH = Math.round(data.hourly?.temperature_2m[i] ?? tVal);
            const rhH = Math.round(data.hourly?.relative_humidity_2m[i] ?? rhVal);
            const thiH = calculateTHI(tempH, rhH);
            const stressH = getStressLevel(thiH);

            hours.push({
              label: i === 0 ? 'Now' : `${hour12} ${isAm ? 'AM' : 'PM'}`,
              hour: h,
              temp: tempH,
              thi: thiH,
              stressColor: stressH.color,
              pop: Math.round(data.hourly?.precipitation_probability[i] ?? 0),
              windSpeed: Math.round(data.hourly?.wind_speed_10m[i] ?? 12),
              isNight: h < 6 || h >= 19
            });
          }
          setHourlyForecast(hours);

          // Process Daily forecast
          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const daily = (data.daily?.time || []).map((dateStr, idx) => {
            const d = new Date(dateStr);
            const maxT = Math.round(data.daily.temperature_2m_max[idx]);
            const minT = Math.round(data.daily.temperature_2m_min[idx]);
            const dayTHI = calculateTHI(maxT, 50);
            return {
              day: idx === 0 ? 'Today' : daysOfWeek[d.getDay()],
              maxTemp: maxT,
              minTemp: minT,
              peakTHI: dayTHI,
              stressColor: getStressLevel(dayTHI).color
            };
          });
          setDailyForecast(daily);
        }
      } catch (err) {
        console.log('Error fetching weather fallback:', err);
      }
    }

    setLoading(false);
    setRefreshing(false);
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
    fetchWeatherData(newLoc.lat, newLoc.lng, newLoc.name);
  };

  const selectQuickCity = async (cityName) => {
    setIsLocationModalVisible(false);
    await resolveAndSetLocation(cityName);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData(currentLocation.lat, currentLocation.lng, currentLocation.name);
  };

  // Language helpers
  const lang = profile.language || 'English';
  const isBoth = lang === 'Both';
  const isUrdu = lang === 'Urdu';

  const stressRaw = currentWeather ? currentWeather.status.label : '';
  const stressSplit = tSplit(stressRaw);
  const advisoryRaw = currentWeather ? getAdvisoryText(currentWeather.status.level) : '';
  const isSevereOrWorse = currentWeather && (currentWeather.status.level === 'severe' || currentWeather.status.level === 'deadly');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : '#059669'} />

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

        {isBoth ? (
          <View>
            <Text style={styles.headerTitle}>Livestock Heat Stress & Weather</Text>
            <Text style={styles.headerTitleUrdu}>{tSplit('Heat Stress Alert').ur}</Text>
            <Text style={styles.headerSubtitle}>Real-Time Meteorological & Bovine THI Monitor</Text>
            <Text style={styles.headerSubtitleUrdu}>{tSplit('Real-Time Livestock THI Index & Weather').ur}</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.headerTitle}>{t('Livestock Heat Stress & Weather')}</Text>
            <Text style={styles.headerSubtitle}>{t('Real-Time Meteorological & Bovine THI Monitor')}</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
        }
      >
        {/* Active Location Banner */}
        <TouchableOpacity
          style={styles.locationBanner}
          onPress={() => setIsLocationModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.locationBannerLeft}>
            <View style={styles.locationIconWrap}>
              <MaterialCommunityIcons name="map-marker-radius" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationBannerLabel}>
                {currentLocation.isGpsDetected
                  ? t('Current Detected Farm Location')
                  : t('Selected Farm Location')}
              </Text>
              <Text style={styles.locationBannerValue} numberOfLines={1}>
                {currentLocation.name}
              </Text>
            </View>
          </View>
          <View style={styles.changeLocBtn}>
            <Feather name="edit-3" size={13} color="#059669" />
            <Text style={styles.changeLocBtnText}>{t('Change')}</Text>
          </View>
        </TouchableOpacity>

        {/* High Risk Urgent Heat Warning Banner */}
        {isSevereOrWorse && (
          <View style={styles.urgentBanner}>
            <View style={styles.urgentBannerTop}>
              <Feather name="alert-triangle" size={20} color="#DC2626" />
              <Text style={styles.urgentBannerTitle}>
                {t('CRITICAL HEAT STRESS ALERT (THI ' + currentWeather.thi + ')')}
              </Text>
            </View>
            <Text style={styles.urgentBannerDesc}>
              {t('Extreme heat stress detected in your area! High risk of dairy drop and heat exhaustion. Turn on sprinklers and ventilation immediately.')}
            </Text>
            <TouchableOpacity 
              style={styles.urgentVetBtn}
              onPress={() => navigation.navigate('VeterinariansList', { userName, userId })}
            >
              <Feather name="phone-call" size={14} color="#FFF" />
              <Text style={styles.urgentVetBtnText}>{t('Contact Emergency Vet')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading || !currentWeather ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>
              {t('Analyzing real-time meteorological conditions & bovine THI...')}
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
                      <Text style={styles.cardTitle}>Current Livestock THI Index</Text>
                      <Text style={styles.cardTitleSubUrdu}>{tSplit('Current THI Index').ur}</Text>
                    </>
                  ) : (
                    <Text style={styles.cardTitle}>{t('Current Livestock THI Index')}</Text>
                  )}
                  <Text style={styles.cardSubtitle}>
                    {t('Air Temp: ' + currentWeather.temp + '°C · High: ' + currentWeather.todayHigh + '°C · Low: ' + currentWeather.todayLow + '°C')}
                  </Text>
                </View>

                {/* Status Badge */}
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

              {/* Gauge Circle */}
              <View style={styles.gaugeContainer}>
                <View style={[styles.gaugeCircle, { borderColor: currentWeather.status.color }]}>
                  <Text style={[styles.gaugeValue, { color: currentWeather.status.color }]}>
                    {currentWeather.thi}
                  </Text>
                  <Text style={styles.gaugeLabel}>{t('THI SCORE')}</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.gaugeDescWrap}>
                <Text style={[styles.gaugeDescEn, isUrdu && styles.gaugeDescUr]}>
                  {t(`THI index measures combined heat and humidity stress for cattle & buffaloes. Current status is ${stressRaw.toLowerCase()}.`)}
                </Text>
              </View>

              {/* 3 Metrics Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#FEE2E2' }]}>
                    <Feather name="thermometer" size={16} color="#DC2626" />
                  </View>
                  <Text style={styles.metricValue}>{currentWeather.temp}°C</Text>
                  <Text style={styles.metricLabel}>{t('Temperature')}</Text>
                </View>

                <View style={styles.metricBox}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#ECFDF5' }]}>
                    <Feather name="droplet" size={16} color="#059669" />
                  </View>
                  <Text style={styles.metricValue}>{currentWeather.humidity}%</Text>
                  <Text style={styles.metricLabel}>{t('Humidity')}</Text>
                </View>

                <View style={styles.metricBox}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="wind" size={16} color="#2563EB" />
                  </View>
                  <Text style={styles.metricValue}>{currentWeather.wind} km/h</Text>
                  <Text style={styles.metricLabel}>{t('Wind Speed')}</Text>
                </View>
              </View>
            </View>

            {/* 24-Hour Hourly Conditions & THI Carousel */}
            {hourlyForecast.length > 0 && (
              <View style={styles.hourlyCard}>
                <View style={styles.hourlyTopRow}>
                  <Text style={styles.hourlyTitle}>{t('24-Hour Hourly Forecast')}</Text>
                  <Text style={styles.hourlySub}>{t('Next 24 hours')}</Text>
                </View>

                {/* Segmented Filter Tabs */}
                <View style={styles.hourlyTabs}>
                  <TouchableOpacity 
                    style={[styles.hourlyTabBtn, hourlyTab === 'temp' && styles.hourlyTabBtnActive]}
                    onPress={() => setHourlyTab('temp')}
                  >
                    <Text style={[styles.hourlyTabText, hourlyTab === 'temp' && styles.hourlyTabTextActive]}>
                      {t('Temp (°C)')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.hourlyTabBtn, hourlyTab === 'thi' && styles.hourlyTabBtnActive]}
                    onPress={() => setHourlyTab('thi')}
                  >
                    <Text style={[styles.hourlyTabText, hourlyTab === 'thi' && styles.hourlyTabTextActive]}>
                      {t('THI Stress')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.hourlyTabBtn, hourlyTab === 'pop' && styles.hourlyTabBtnActive]}
                    onPress={() => setHourlyTab('pop')}
                  >
                    <Text style={[styles.hourlyTabText, hourlyTab === 'pop' && styles.hourlyTabTextActive]}>
                      {t('Rain (%)')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.hourlyTabBtn, hourlyTab === 'wind' && styles.hourlyTabBtnActive]}
                    onPress={() => setHourlyTab('wind')}
                  >
                    <Text style={[styles.hourlyTabText, hourlyTab === 'wind' && styles.hourlyTabTextActive]}>
                      {t('Wind (km/h)')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Horizontal Scroll */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScrollList}>
                  {hourlyForecast.map((item, idx) => (
                    <View key={idx} style={[styles.hourlyItem, idx === 0 && styles.hourlyItemActive]}>
                      <Text style={styles.hourlyItemTime}>{item.label}</Text>
                      
                      <View style={styles.hourlyItemIcon}>
                        {hourlyTab === 'temp' ? (
                          item.isNight ? (
                            <Feather name="moon" size={16} color="#64748B" />
                          ) : (
                            <Feather name="sun" size={16} color="#F59E0B" />
                          )
                        ) : hourlyTab === 'thi' ? (
                          <MaterialCommunityIcons name="heart-pulse" size={16} color={item.stressColor || '#10B981'} />
                        ) : hourlyTab === 'pop' ? (
                          <Feather name="cloud-rain" size={16} color="#0284C7" />
                        ) : (
                          <Feather name="wind" size={16} color="#475569" />
                        )}
                      </View>

                      <Text style={styles.hourlyItemVal}>
                        {hourlyTab === 'temp' && `${item.temp}°`}
                        {hourlyTab === 'thi' && `${item.thi}`}
                        {hourlyTab === 'pop' && `${item.pop}%`}
                        {hourlyTab === 'wind' && `${item.windSpeed}`}
                      </Text>

                      {/* THI Warning indicator dot */}
                      <View style={[styles.hourlyThiDot, { backgroundColor: item.stressColor || '#10B981' }]} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 7-to-10 Day Forecast Card with Visual Range Bars */}
            {dailyForecast.length > 0 && (
              <View style={styles.forecastCard}>
                <View style={styles.forecastHeaderRow}>
                  <Text style={styles.forecastTitle}>{t('10-Day Livestock Weather Forecast')}</Text>
                  <Text style={styles.forecastSubtitle}>{currentLocation.name}</Text>
                </View>

                {dailyForecast.map((item, idx) => (
                  <View key={idx} style={styles.forecastRow}>
                    <Text style={styles.forecastDay}>{t(item.day)}</Text>
                    
                    <View style={styles.forecastIconWrap}>
                      <Feather name="sun" size={16} color="#F59E0B" />
                    </View>

                    <Text style={styles.forecastTempLow}>{item.minTemp}°</Text>

                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            backgroundColor: item.stressColor || '#10B981',
                            width: `${Math.min(100, Math.max(20, (item.maxTemp / 48) * 100))}%`,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.forecastTempHigh}>{item.maxTemp}°</Text>

                    <View style={[styles.forecastThiBadge, { backgroundColor: `${item.stressColor || '#10B981'}15` }]}>
                      <Text style={[styles.forecastThiBadgeText, { color: item.stressColor || '#10B981' }]}>
                        THI {item.peakTHI}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 8 Modular Bioclimatic Weather Tiles */}
            <Text style={styles.tilesSectionTitle}>{t('Bioclimatic Environmental Indicators')}</Text>
            <View style={styles.tilesGrid}>
              
              {/* Tile 1: Wind & Compass Direction */}
              <View style={styles.weatherTile}>
                <View style={styles.tileHeader}>
                  <Feather name="wind" size={14} color="#059669" />
                  <Text style={styles.tileHeaderLabel}>{t('Wind & Gusts')}</Text>
                </View>
                <View>
                  <Text style={styles.tileMainVal}>{currentWeather.wind} km/h</Text>
                  <Text style={styles.tileSubText}>
                    {t('Gusts up to: ' + currentWeather.windGusts + ' km/h')}
                  </Text>
                </View>
                <View style={styles.compassRow}>
                  <View style={styles.tileAccentPill}>
                    <Text style={[styles.tileAccentPillText, { color: '#059669' }]}>
                      {currentWeather.windDirection?.cardinal || 'NNW'} ({currentWeather.windDirection?.degrees || 348}°)
                    </Text>
                  </View>
                  <View style={styles.compassRing}>
                    <Feather 
                      name="navigation" 
                      size={18} 
                      color="#059669" 
                      style={{ transform: [{ rotate: `${(currentWeather.windDirection?.degrees || 0)}deg` }] }}
                    />
                  </View>
                </View>
              </View>

              {/* Tile 2: Humidity & Dew Point */}
              <View style={styles.weatherTile}>
                <View style={styles.tileHeader}>
                  <Feather name="droplet" size={14} color="#0284C7" />
                  <Text style={styles.tileHeaderLabel}>{t('Humidity')}</Text>
                </View>
                <View>
                  <Text style={styles.tileMainVal}>{currentWeather.humidity}%</Text>
                  <Text style={styles.tileSubText}>
                    {t('The dew point is ' + currentWeather.dewPoint + '° right now.')}
                  </Text>
                </View>
                <View style={[styles.tileAccentPill, { backgroundColor: '#F0F9FF' }]}>
                  <Text style={[styles.tileAccentPillText, { color: '#0284C7' }]}>
                    {currentWeather.humidity > 70 ? t('High Moisture') : t('Normal Range')}
                  </Text>
                </View>
              </View>

              {/* Tile 3: UV Index */}
              <View style={styles.weatherTile}>
                <View style={styles.tileHeader}>
                  <Feather name="sun" size={14} color="#D97706" />
                  <Text style={styles.tileHeaderLabel}>{t('UV Index')}</Text>
                </View>
                <View>
                  <Text style={styles.tileMainVal}>{currentWeather.uvIndex}</Text>
                  <Text style={styles.tileSubText}>
                    {currentWeather.uvIndex > 7 ? t('Very High: Keep cows under shed.') : t('Moderate solar exposure.')}
                  </Text>
                </View>
                <View style={styles.uvProgressBar}>
                  <View 
                    style={[
                      styles.uvProgressFill, 
                      { 
                        width: `${Math.min(100, (currentWeather.uvIndex / 11) * 100)}%`,
                        backgroundColor: currentWeather.uvIndex > 7 ? '#DC2626' : '#F59E0B'
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Tile 4: Precipitation */}
              <View style={styles.weatherTile}>
                <View style={styles.tileHeader}>
                  <Feather name="cloud-rain" size={14} color="#0284C7" />
                  <Text style={styles.tileHeaderLabel}>{t('Precipitation')}</Text>
                </View>
                <View>
                  <Text style={styles.tileMainVal}>{currentWeather.precipitation} mm</Text>
                  <Text style={styles.tileSubText}>
                    {currentWeather.precipitation > 0 ? t('Rain detected today.') : t('No rain expected today.')}
                  </Text>
                </View>
                <View style={[styles.tileAccentPill, { backgroundColor: '#F0F9FF' }]}>
                  <Text style={[styles.tileAccentPillText, { color: '#0284C7' }]}>
                    {t('Shed roof safe')}
                  </Text>
                </View>
              </View>

              {/* Tile 5: Atmospheric Visibility */}
              <View style={styles.weatherTile}>
                <View style={styles.tileHeader}>
                  <Feather name="eye" size={14} color="#475569" />
                  <Text style={styles.tileHeaderLabel}>{t('Visibility')}</Text>
                </View>
                <View>
                  <Text style={styles.tileMainVal}>{currentWeather.visibilityKm || 12} km</Text>
                  <Text style={styles.tileSubText}>
                    {currentWeather.visibilityKm < 5 ? t('Smog or haze reported.') : t('Clear open view.')}
                  </Text>
                </View>
                <View style={[styles.tileAccentPill, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.tileAccentPillText, { color: '#475569' }]}>
                    {currentWeather.visibilityKm > 8 ? t('Good clarity') : t('Reduced air view')}
                  </Text>
                </View>
              </View>

              {/* Tile 6: Barometric Pressure */}
              <View style={styles.weatherTile}>
                <View style={styles.tileHeader}>
                  <Feather name="compass" size={14} color="#7C3AED" />
                  <Text style={styles.tileHeaderLabel}>{t('Pressure')}</Text>
                </View>
                <View>
                  <Text style={styles.tileMainVal}>{currentWeather.pressure} hPa</Text>
                  <Text style={styles.tileSubText}>
                    {t('Stable atmospheric pressure.')}
                  </Text>
                </View>
                <View style={[styles.tileAccentPill, { backgroundColor: '#F5F3FF' }]}>
                  <Text style={[styles.tileAccentPillText, { color: '#7C3AED' }]}>
                    {t('Standard barometric')}
                  </Text>
                </View>
              </View>

              {/* Tile 7: Sunrise & Sunset */}
              <View style={styles.weatherTile}>
                <View style={styles.tileHeader}>
                  <Feather name="sunrise" size={14} color="#EA580C" />
                  <Text style={styles.tileHeaderLabel}>{t('Sun Schedule')}</Text>
                </View>
                <View>
                  <Text style={styles.tileMainVal}>{currentWeather.sunrise || '06:15 AM'}</Text>
                  <Text style={styles.tileSubText}>
                    {t('Sunset: ' + (currentWeather.sunset || '05:30 PM'))}
                  </Text>
                </View>
                <View style={[styles.tileAccentPill, { backgroundColor: '#FFF7ED' }]}>
                  <Text style={[styles.tileAccentPillText, { color: '#EA580C' }]}>
                    {t('Graze in morning')}
                  </Text>
                </View>
              </View>

              {/* Tile 8: Moon & Celestial Phase */}
              <View style={styles.weatherTile}>
                <View style={styles.tileHeader}>
                  <Feather name="moon" size={14} color="#6366F1" />
                  <Text style={styles.tileHeaderLabel}>{t('Moon Phase')}</Text>
                </View>
                <View>
                  <Text style={styles.tileMainVal}>
                    {currentWeather.moon?.illumination || 62}%
                  </Text>
                  <Text style={styles.tileSubText}>
                    {currentWeather.moon?.phaseName || 'Waning Gibbous'}
                  </Text>
                </View>
                <View style={[styles.tileAccentPill, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.tileAccentPillText, { color: '#6366F1' }]}>
                    {t((currentWeather.moon?.daysToFullMoon || 23) + 'd to full moon')}
                  </Text>
                </View>
              </View>

            </View>

            {/* Veterinary Advisory Card */}
            <View style={styles.advisoryCard}>
              <View style={styles.advisoryHeader}>
                <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#059669" />
                <Text style={styles.advisoryTitle}>{t('Veterinary Cooling Directives')}</Text>
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
              {searchLoading && <ActivityIndicator size="small" color="#059669" />}
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
                    <Feather name="map-pin" size={16} color="#059669" style={{ marginRight: 10 }} />
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
                      color={isSelected ? '#FFF' : '#059669'}
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
