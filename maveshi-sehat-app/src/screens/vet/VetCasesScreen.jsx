import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform, TextInput, Image, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';
import { subscribeProfile, getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetCasesScreenStyles';

export default function VetCasesScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const profile = getProfile();
  const userId = params.user?.id || params.userId || profile?.userId || 1;
  const userName = params.userName || profile?.userName || 'Dr. Rahim';

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribeProfile(() => forceUpdate(n => n + 1));
    return () => unsubscribe();
  }, []);

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCases = async () => {
    try {
      const activeId = params.user?.id || params.userId || getProfile()?.userId || 1;
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const url = `${baseUrl}/api/consultations/vet/${activeId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cases');
      const data = await response.json();
      setCases(data.consultations || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCases();
    });
    return unsubscribe;
  }, [userId, navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const tabs = ['All', 'Pending', 'Urgent', 'Resolved'];

  const filteredCases = cases.filter(item => {
    const s = String(item.status || '').trim().toLowerCase();
    const isPending = s === 'pending';
    const isResolved = s === 'resolved' || s === 'completed';
    const isUrgent = s === 'pending' || (item.reason && item.reason.toLowerCase().includes('urgent')) || (item.ai_record_data && String(item.ai_record_data).toLowerCase().includes('high'));

    const matchesTab = 
      activeTab === 'All' ? true : 
      activeTab === 'Pending' ? isPending : 
      activeTab === 'Urgent' ? isUrgent : 
      activeTab === 'Resolved' ? isResolved : true;
      
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.farmer_name?.toLowerCase().includes(searchLower) ||
                          item.reason?.toLowerCase().includes(searchLower) ||
                          (item.ai_record_data && String(item.ai_record_data).toLowerCase().includes(searchLower));

    return matchesTab && matchesSearch;
  });

  const renderCaseCard = ({ item }) => {
    const timeText = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const aiData = item.ai_record_data ? (typeof item.ai_record_data === 'string' ? JSON.parse(item.ai_record_data) : item.ai_record_data) : null;
    const diseaseName = aiData?.disease || item.reason || 'General Consultation';
    const confidence = aiData?.confidence ? parseInt(aiData.confidence) : null;

    const isUrgent = item.reason && item.reason.toLowerCase().includes('urgent');
    const isResolved = item.status === 'resolved';
    const isPending = item.status === 'pending';

    const statusLabel = isResolved ? 'RESOLVED' : isUrgent ? 'URGENT' : isPending ? 'PENDING' : item.status.toUpperCase();
    const statusColor = isResolved ? '#58D66D' : isUrgent ? '#FF3B30' : isPending ? '#FFB020' : '#888';
    const statusBg = isResolved ? '#E8F8EA' : isUrgent ? '#FFEBEB' : isPending ? '#FFF3CD' : '#EEE';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.farmer_name ? item.farmer_name.trim().charAt(0).toUpperCase() : 'F'}</Text>
            </View>
            <View>
              <Text style={styles.farmerName}>{item.farmer_name}</Text>
                          </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 6 }}>
          {(aiData?.imageUrl || aiData?.uri) ? (
            <Image
              source={{ uri: aiData.imageUrl || aiData.uri }}
              style={{ width: 44, height: 44, borderRadius: 8, marginRight: 10, backgroundColor: '#E2E8F0' }}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.diseaseText}>{diseaseName}</Text>
            {aiData?.animalId ? (
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Livestock ID: #{aiData.animalId} {aiData.animalType ? `(${aiData.animalType})` : ''}
              </Text>
            ) : null}
          </View>
        </View>
        
        {confidence && (
          <View style={styles.confidenceSection}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>{t('Confidence')}</Text>
              <Text style={styles.confidenceValue}>{confidence}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${confidence}%`, backgroundColor: confidence > 80 ? '#FF3B30' : '#FFB020' }]} />
            </View>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.animalInfoRow}>
            <MaterialCommunityIcons name="cow" size={24} color="#555" />
            <Text style={styles.timeText}>{timeText}</Text>
          </View>
          <TouchableOpacity 
            style={styles.reviewBtn}
            onPress={() => navigation.navigate('VetConsultations', { userName, userId })}
          >
            <Text style={styles.reviewBtnText}>{isPending ? 'Review & Accept →' : 'View Details →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Submitted Cases</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Feather name="filter" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {tabs.map(tab => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                {tab === 'Urgent' && <View style={styles.dotUrgent} />}
                {tab === 'Resolved' && <View style={styles.dotResolved} />}
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {t(tab)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search owner or disease..."
            placeholderTextColor="rgba(255,255,255,0.75)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Feather name="mic" size={20} color="#FFF" style={styles.micIcon} />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: colors.background }}
          data={filteredCases}
          renderItem={renderCaseCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No cases found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
