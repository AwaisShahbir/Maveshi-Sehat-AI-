import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';


const calculateTHI = (t, rh) => {
  
  const thi = (1.8 * t + 32) - ((0.55 - 0.0055 * rh) * (1.8 * t - 26));
  return Math.round(thi);
};


const getStressLevel = (thi) => {
  if (thi < 72) return { level: 'none', color: '#4CB85C', bg: '#E8F8EA' };
  if (thi >= 72 && thi < 79) return { level: 'moderate', color: '#F5A623', bg: '#FFF5E5' };
  if (thi >= 79 && thi < 89) return { level: 'severe', color: '#FF4D4D', bg: '#FFEBEB' };
  return { level: 'deadly', color: '#900000', bg: '#FFD6D6' };
};

export default function HeatAlertScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.userId || 'user_123';
  const userName = params.userName || 'Muhammad Ahmed';
  
  const [profile, setProfile] = useState(getProfile());
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);

  
  useEffect(() => {
    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
    });
    return () => unsubscribeProfile();
  }, []);
  
  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      
      const lat = 31.5497;
      const lng = 74.3436;
      
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean&timezone=auto`);
      const data = await response.json();
      
      const t = data.current.temperature_2m;
      const rh = data.current.relative_humidity_2m;
      const wind = data.current.wind_speed_10m;
      const thi = calculateTHI(t, rh);
      
      setCurrentWeather({
        temp: Math.round(t),
        humidity: Math.round(rh),
        wind: Math.round(wind),
        thi: thi,
        status: getStressLevel(thi)
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
          status: getStressLevel(dailyTHI)
        };
      });
      
      setForecast(forecastData);
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStressLabel = (level) => {
    if (level === 'none') return t('No Stress', 'کوئی دباؤ نہیں');
    if (level === 'moderate') return t('Moderate Stress', 'معتدل دباؤ');
    if (level === 'severe') return t('Severe Stress', 'شدید دباؤ');
    if (level === 'deadly') return t('Deadly', 'خطرناک');
    return '';
  };

  const getLocalizedDay = (day) => {
    if (day === 'Today') return t('Today', 'آج');
    if (day === 'Sun') return t('Sun', 'اتوار');
    if (day === 'Mon') return t('Mon', 'پیر');
    if (day === 'Tue') return t('Tue', 'منگل');
    if (day === 'Wed') return t('Wed', 'بدھ');
    if (day === 'Thu') return t('Thu', 'جمعرات');
    if (day === 'Fri') return t('Fri', 'جمعہ');
    if (day === 'Sat') return t('Sat', 'ہفتہ');
    return day;
  };

  if (loading || !currentWeather) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={{ marginTop: 10, color: '#666' }}>{t('Fetching Realtime Weather...', 'موسم کی تازہ صورتحال لوڈ ہو رہی ہے...')}</Text>
      </SafeAreaView>
    );
  }

  const lang = profile.language || 'English';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F5A623" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          {lang === 'English' && <Text style={styles.headerTitle}>Heat Stress Alert</Text>}
          
          {lang === 'Both' && (
            <>
              <Text style={styles.headerTitle}>Heat Stress Alert</Text>
                          </>
          )}
        </View>

        
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('Current THI Index', 'موجودہ THI انڈیکس')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: currentWeather.status.bg }]}>
              <Text style={[styles.statusText, { color: currentWeather.status.color }]}>{getStressLabel(currentWeather.status.level)}</Text>
            </View>
          </View>

          
          <View style={styles.gaugeContainer}>
            <View style={[styles.gaugeCircle, { borderColor: currentWeather.status.color }]}>
              <Text style={[styles.gaugeValue, { color: currentWeather.status.color }]}>{currentWeather.thi}</Text>
              <Text style={styles.gaugeLabel}>{t('THI Index', 'ٹی ایچ آئی انڈیکس')}</Text>
            </View>
          </View>
          
          <Text style={styles.gaugeDesc}>
            {t(
              `Temperature-Humidity Index indicating ${getStressLabel(currentWeather.status.level).toLowerCase()} level`,
              `درجہ حرارت اور نمی کا انڈیکس جو ${getStressLabel(currentWeather.status.level)} کو ظاہر کرتا ہے`
            )}
          </Text>

          
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <View style={[styles.metricIconBg, { backgroundColor: '#FFEBEB' }]}>
                <Feather name="thermometer" size={18} color="#FF4D4D" />
              </View>
              <Text style={styles.metricValue}>{currentWeather.temp}°C</Text>
              <Text style={styles.metricLabel}>{t('Temperature', 'درجہ حرارت')}</Text>
            </View>
            <View style={styles.metricBox}>
              <View style={[styles.metricIconBg, { backgroundColor: '#E8F8EA' }]}>
                <Feather name="droplet" size={18} color="#4CB85C" />
              </View>
              <Text style={styles.metricValue}>{currentWeather.humidity}%</Text>
              <Text style={styles.metricLabel}>{t('Humidity', 'نمی')}</Text>
            </View>
            <View style={styles.metricBox}>
              <View style={[styles.metricIconBg, { backgroundColor: '#FFF5E5' }]}>
                <Feather name="wind" size={18} color="#F5A623" />
              </View>
              <Text style={styles.metricValue}>{currentWeather.wind}</Text>
              <Text style={styles.metricLabel}>{t('Wind km/h', 'ہوا کلومیٹر/گھنٹہ')}</Text>
            </View>
          </View>
        </View>

        
        <View style={[styles.mainCard, { marginBottom: 100 }]}>
          <Text style={styles.forecastTitle}>{t('7-Day Forecast', '7 روزہ پیشن گوئی')}</Text>
          
          {forecast.map((item, index) => (
            <View key={item.id} style={styles.forecastRow}>
              <Text style={styles.forecastDay}>{getLocalizedDay(item.day)}</Text>
              <Feather name="sun" size={18} color="#F5A623" style={styles.forecastIcon} />
              
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { backgroundColor: item.status.color, width: `${Math.min(item.thi, 100)}%` }]} />
              </View>
              
              <View style={styles.forecastRight}>
                <Text style={styles.forecastTemp}>{item.temp}°C</Text>
                <Text style={styles.forecastThi}>THI: {item.thi}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Home', 'ہوم')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan', { userName, userId })}>
            <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('AI Scan', 'اسکین')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords', { userName, userId })}>
            <Feather name="file-text" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Records', 'ریکارڈز')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
            <Feather name="message-square" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Forum', 'فورم')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile', { userId })}>
            <Feather name="user" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Profile', 'پروفائل')}</Text>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 60, 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  headerUrdu: { fontSize: 16, color: '#FFF', marginTop: 4, opacity: 0.9 },

  mainCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginTop: -40, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gaugeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeValue: { fontSize: 40, fontWeight: 'bold' },
  gaugeLabel: { fontSize: 12, color: '#999', marginTop: -4 },
  
  gaugeDesc: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginBottom: 30,
    lineHeight: 18,
  },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    width: '30%',
  },
  metricIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  metricLabel: { fontSize: 10, color: '#888', marginTop: 2 },

  forecastTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  forecastDay: { width: 40, fontSize: 13, color: '#555', fontWeight: '500' },
  forecastIcon: { width: 30 },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  forecastRight: { width: 50, alignItems: 'flex-end' },
  forecastTemp: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  forecastThi: { fontSize: 10, color: '#888' },

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
