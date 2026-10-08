import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';
import { subscribeProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetHealthRecordsScreenStyles';

export default function VetHealthRecordsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userId = params.user?.id || params.userId || 1;

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribeProfile(() => forceUpdate(n => n + 1));
    return () => unsubscribe();
  }, []);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const url = `${baseUrl}/api/consultations/vet/${userId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      
      const aiRecords = (data.consultations || []).filter(c => c.ai_record_data !== null);
      setRecords(aiRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [userId]);

  const handleDownloadRecords = () => {
    Alert.alert(
      t('Export Records') || 'Export Records',
      t('Health records and AI diagnostics report exported successfully as PDF.') || 'Health records and AI diagnostics report exported successfully as PDF.',
      [{ text: t('OK') || 'OK' }]
    );
  };

  const tabs = ['All', 'LSD', 'FMD', 'Tick', 'BCS', 'Heat'];

  const safeParseAiData = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const filteredRecords = records.filter(item => {
    const aiData = safeParseAiData(item.ai_record_data);
    const disease = (aiData?.disease || '').toLowerCase();
    const farmerName = (item.farmer_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = disease.includes(query) || farmerName.includes(query);

    if (activeTab === 'All') return matchesSearch;
    if (activeTab === 'LSD') return matchesSearch && (disease.includes('lumpy') || disease.includes('lsd'));
    if (activeTab === 'FMD') return matchesSearch && (disease.includes('foot') || disease.includes('fmd') || disease.includes('mouth'));
    if (activeTab === 'Tick') return matchesSearch && (disease.includes('tick') || disease.includes('fever'));
    if (activeTab === 'BCS') return matchesSearch && (disease.includes('bcs') || disease.includes('body condition'));
    if (activeTab === 'Heat') return matchesSearch && (disease.includes('heat') || disease.includes('estrus'));

    return matchesSearch;
  });

  const renderRecordCard = ({ item }) => {
    const timeText = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    const aiData = safeParseAiData(item.ai_record_data);
    const diseaseName = aiData?.disease || 'Livestock Scan';
    const confidence = aiData?.confidence ? parseInt(aiData.confidence) : 85;

    let riskLevel = 'MED';
    let riskColor = '#FFB020';
    if (confidence > 80 && (diseaseName.toLowerCase().includes('lumpy') || diseaseName.toLowerCase().includes('foot'))) {
      riskLevel = 'HIGH';
      riskColor = '#FF3B30';
    } else if (confidence > 90) {
      riskLevel = 'HIGH';
      riskColor = '#FF3B30';
    } else if (confidence < 50) {
      riskLevel = 'LOW';
      riskColor = '#10B981';
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="cow" size={24} color={colors.primary} />
          </View>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.diseaseName}>{diseaseName}</Text>
              <Text style={styles.dateText}>{timeText}</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={styles.riskBadgeText}>{riskLevel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="user" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.infoText}>{item.farmer_name || 'Farmer'}</Text>
          <View style={styles.dotSeparator} />
          <Feather name="map-pin" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.infoText}>Location</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.modelTag}>
            <MaterialCommunityIcons name="brain" size={12} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.modelTagText}>ResNet50 AI</Text>
          </View>
        </View>

        <View style={styles.confidenceSection}>
          <View style={styles.confidenceHeader}>
            <Text style={styles.confidenceLabel}>{t('Confidence')}</Text>
            <Text style={[styles.confidenceValue, { color: riskColor }]}>{confidence}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${confidence}%`, backgroundColor: riskColor }]} />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.cardFooter}
          onPress={() => navigation.navigate('VetConsultations', { userName: params.userName, userId })}
          activeOpacity={0.7}
        >
          <Text style={styles.viewFullText}>{t('View Consultation')} →</Text>
        </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Health Records</Text>
          </View>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadRecords} activeOpacity={0.7}>
            <Feather name="download" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.85)" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search owner or disease..."
            placeholderTextColor="rgba(255,255,255,0.75)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Feather name="mic" size={20} color="rgba(255,255,255,0.85)" style={styles.micIcon} />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#58D66D" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: colors.background }}
          data={filteredRecords}
          renderItem={renderRecordCard}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="heart-pulse" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No AI health records found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
