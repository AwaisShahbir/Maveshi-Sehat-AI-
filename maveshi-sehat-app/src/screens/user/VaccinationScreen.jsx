import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../utils/translate';

const MOCK_VACCINES = [];

export default function VaccinationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userName = params.userName || 'Muhammad Ahmed';
  const userId = params.userId || null;
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('Upcoming');
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

  useEffect(() => {
    const fetchVaccinations = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/farmer/vaccinations?farmerName=${encodeURIComponent(userName)}`);
        const data = await response.json();
        if (response.ok) {
          setVaccinations(data);
        }
      } catch (err) {
        console.error('Error fetching vaccinations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVaccinations();
  }, [userName]);

  const filteredVaccines = vaccinations;

  const renderVaccineItem = ({ item }) => {
    const data = typeof item.vaccination_data === 'string' ? JSON.parse(item.vaccination_data) : item.vaccination_data;
    if (!data) return null;
    return (
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Feather name="check-circle" size={24} color="#4CB85C" />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.vaccineTitle}>{data.vaccineName}</Text>
          <Text style={styles.vaccineUrdu}>Prescribed by: {item.vet_name || 'Vet'}</Text>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={12} color="#888" style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>{data.vaccineDate}</Text>
            <Text style={styles.metaDivider}>  •  </Text>
            <Text style={styles.metaText}>Next: {data.nextDueDate || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Upcoming</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F5B041" />

      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{t('Vaccination', 'ویکسینیشن')}</Text>
            <Text style={styles.headerSubtitle}>{t('Vaccination Schedule', 'ویکسینیشن شیڈول')}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
            <Feather name="plus" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('Upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>
              {t('Upcoming / آنے والے', 'آنے والے')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
            onPress={() => setActiveTab('Completed')}
          >
            <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>
              {t('Completed / مکمل', 'مکمل')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F5B041" style={{ marginTop: 60 }} />
      ) : filteredVaccines.length > 0 ? (
        <FlatList
          data={filteredVaccines}
          renderItem={renderVaccineItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Math.max(insets.bottom, 12) + 90 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="needle" size={64} color="#CCC" />
          <Text style={styles.emptyText}>{t('No vaccinations found', 'کوئی ویکسینیشن نہیں ملی')}</Text>
        </View>
      )}

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Feather name="home" size={24} color="#FFF" />
          <Text style={styles.navText}>{t('Home', 'ہوم')}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F9F3',
  },
  headerContainer: {
    backgroundColor: '#F5B041',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginTop: 4,
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#FFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  activeTabText: {
    color: '#F5B041',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F8EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
  },
  vaccineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vaccineUrdu: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  metaDivider: {
    fontSize: 12,
    color: '#CCC',
  },
  statusBadge: {
    backgroundColor: '#E8F8EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#4CB85C',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CB85C',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#FFF', marginTop: 4, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
    marginTop: 16,
  },
});
