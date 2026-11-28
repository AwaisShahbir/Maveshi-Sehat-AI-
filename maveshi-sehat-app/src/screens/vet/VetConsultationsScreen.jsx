import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator, 
  TextInput 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';
import { subscribeProfile, getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetConsultationsScreenStyles';

export default function VetConsultationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const profile = getProfile();
  const userId = params.user?.id || params.userId || profile?.userId || null;
  const userName = profile?.userName || profile?.fullName || params.userName || '';

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  const normalizeConsultationStatus = (status) => String(status || '').trim().toLowerCase();

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribeProfile(() => forceUpdate(n => n + 1));
    return () => unsubscribe();
  }, []);

  const fetchConsultations = async () => {
    try {
      if (!userId) {
        setConsultations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const url = `${baseUrl}/api/consultations/vet/${userId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch consultations');
      }
      const data = await response.json();
      setConsultations(data.consultations || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  const tabs = ['All', 'Pending', 'Active', 'Resolved'];

  const filteredConsultations = consultations.filter(item => {
    const s = normalizeConsultationStatus(item.status);
    const isPending = s === 'pending';
    const isActive = s === 'approved';
    const isResolved = s === 'resolved' || s === 'completed';

    const matchesTab = 
      activeTab === 'All' ? true : 
      activeTab === 'Pending' ? isPending : 
      activeTab === 'Active' ? isActive : 
      activeTab === 'Resolved' ? isResolved : true;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.farmer_name?.toLowerCase().includes(searchLower) || item.reason?.toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  // Group consultations strictly by Farmer
  const groupedByFarmer = useMemo(() => {
    const groups = {};
    filteredConsultations.forEach(item => {
      const fId = item.farmer_id || 'unknown';
      if (!groups[fId]) {
        groups[fId] = {
          farmerId: fId,
          farmerName: item.farmer_name || 'Farmer',
          farmerPhone: item.farmer_phone || '',
          farmerDistrict: item.farmer_district || '',
          consultations: []
        };
      }
      groups[fId].consultations.push(item);
    });
    return Object.values(groups);
  }, [filteredConsultations]);

  const getStats = () => {
    return {
      pending: consultations.filter(c => normalizeConsultationStatus(c.status) === 'pending').length,
      active: consultations.filter(c => normalizeConsultationStatus(c.status) === 'approved').length,
      resolved: consultations.filter(c => ['resolved', 'completed'].includes(normalizeConsultationStatus(c.status))).length,
    };
  };
  const stats = getStats();

  const renderFarmerCard = ({ item: farmerGroup }) => {
    const totalCases = farmerGroup.consultations.length;
    const pendingCases = farmerGroup.consultations.filter(c => normalizeConsultationStatus(c.status) === 'pending').length;
    const activeCases = farmerGroup.consultations.filter(c => normalizeConsultationStatus(c.status) === 'approved').length;
    const resolvedCases = farmerGroup.consultations.filter(c => ['resolved', 'completed'].includes(normalizeConsultationStatus(c.status))).length;

    return (
      <TouchableOpacity
        style={[styles.card, {
          padding: 16,
          marginBottom: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border
        }]}
        onPress={() => navigation.navigate('FarmerConsultations', { 
          farmerGroup, 
          userId, 
          userName 
        })}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Avatar */}
          <View style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0284C7' }}>
              {farmerGroup.farmerName ? farmerGroup.farmerName.charAt(0).toUpperCase() : 'F'}
            </Text>
          </View>

          {/* Farmer Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
              {farmerGroup.farmerName || 'Farmer'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
              {farmerGroup.farmerPhone} {farmerGroup.farmerDistrict ? `· ${farmerGroup.farmerDistrict}` : ''}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
              <View style={{
                backgroundColor: isDark ? '#334155' : '#F1F5F9',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textPrimary }}>
                  {totalCases} {totalCases === 1 ? 'Case' : 'Cases'}
                </Text>
              </View>

              {pendingCases > 0 && (
                <View style={{
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>
                    {pendingCases} Pending
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Feather name="chevron-right" size={24} color={colors.textSecondary} style={{ marginLeft: 8 }} />
        </View>

        {/* Status Breakdown Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {activeCases > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 5 }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                  {activeCases} Active
                </Text>
              </View>
            )}

            {resolvedCases > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#64748B', marginRight: 5 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>
                  {resolvedCases} Resolved
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginRight: 2 }}>
              {t('View Cases')}
            </Text>
            <Feather name="arrow-right" size={13} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>{t('Consultations')}</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={handleRefresh}>
            <Feather name="refresh-cw" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#FFF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search farmer name or issue..."
            placeholderTextColor="rgba(255,255,255,0.75)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'All' ? t('All') : tab === 'Pending' ? t('Pending') : tab === 'Active' ? t('Active') : t('Resolved')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#FFB020' }]}>{loading ? '-' : stats.pending}</Text>
          <Text style={styles.statLabel}>{t('Pending')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{loading ? '-' : stats.active}</Text>
          <Text style={styles.statLabel}>{t('Active')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#888' }]}>{loading ? '-' : stats.resolved}</Text>
          <Text style={styles.statLabel}>{t('Resolved')}</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: colors.background }}
          data={groupedByFarmer}
          renderItem={renderFarmerCard}
          keyExtractor={(item) => String(item.farmerId)}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            groupedByFarmer.length > 0 ? (
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('Patients / Farmers')} ({groupedByFarmer.length})
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="message-text-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>{t('No consultations found')}</Text>
            </View>
          }
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetDashboard', { userName, userId })}>
          <MaterialCommunityIcons name="home-variant-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetCases', { userName, userId })}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Cases')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MaterialCommunityIcons name="message-text" size={26} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary, fontWeight: '700' }]}>{t('Consult')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
          <MaterialCommunityIcons name="forum-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Forum')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VetProfile')}>
          <View style={styles.navProfile}>
            <Text style={styles.navProfileText}>DR</Text>
          </View>
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{t('Profile')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
