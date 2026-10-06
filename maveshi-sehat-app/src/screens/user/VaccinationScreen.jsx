import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import styles from '../../styles/VaccinationScreenStyles';

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
            <Text style={styles.headerTitle}>{t('Vaccination')}</Text>
            <Text style={styles.headerSubtitle}>{t('Vaccination Schedule')}</Text>
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
              {t('Upcoming')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
            onPress={() => setActiveTab('Completed')}
          >
            <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>
              {t('Completed')}
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
          <Text style={styles.emptyText}>{t('No vaccinations found')}</Text>
        </View>
      )}

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Feather name="home" size={24} color="#FFF" />
          <Text style={styles.navText}>{t('Home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan', { userName, userId })}>
          <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('AI Scan')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords', { userName, userId })}>
          <Feather name="file-text" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Records')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
          <Feather name="message-square" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Forum')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile', { userId })}>
          <Feather name="user" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Profile')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
