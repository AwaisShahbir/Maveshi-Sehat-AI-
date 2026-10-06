import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform, TextInput, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';
import { subscribeProfile } from '../../utils/profileStore';
import styles from '../../styles/VetHealthRecordsScreenStyles';


export default function VetHealthRecordsScreen() {
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

  const tabs = ['All', 'LSD', 'FMD', 'Tick', 'BCS', 'Heat'];

  const filteredRecords = records.filter(item => {
    const aiData = typeof item.ai_record_data === 'string' ? JSON.parse(item.ai_record_data) : item.ai_record_data;
    const diseaseName = (aiData?.disease || '').toLowerCase();
    
    const matchesTab = 
      activeTab === 'All' ? true : 
      activeTab === 'LSD' ? diseaseName.includes('lumpy') || diseaseName.includes('lsd') : 
      activeTab === 'FMD' ? diseaseName.includes('foot') || diseaseName.includes('fmd') : 
      activeTab === 'Tick' ? diseaseName.includes('tick') : 
      activeTab === 'BCS' ? diseaseName.includes('bcs') : 
      activeTab === 'Heat' ? diseaseName.includes('heat') : true;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.farmer_name?.toLowerCase().includes(searchLower) || diseaseName.includes(searchLower);

    return matchesTab && matchesSearch;
  });

  const renderRecordCard = ({ item }) => {
    const timeText = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    const aiData = typeof item.ai_record_data === 'string' ? JSON.parse(item.ai_record_data) : item.ai_record_data;
    const diseaseName = aiData?.disease || 'Unknown Scan';
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
      riskColor = '#58D66D';
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.diseaseName}>{diseaseName}</Text>
          <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
            <Text style={styles.riskBadgeText}>{riskLevel}</Text>
          </View>
        </View>

        
        <View style={styles.infoRow}>
          <Feather name="user" size={14} color="#888" style={{ marginRight: 4 }} />
          <Text style={styles.infoText}>{item.farmer_name || 'Farmer'}</Text>
          <View style={styles.dotSeparator} />
          <Feather name="map-pin" size={14} color="#888" style={{ marginRight: 4 }} />
          <Text style={styles.infoText}>Location</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.dateText}>{timeText}</Text>
          <View style={styles.modelTag}>
            <MaterialCommunityIcons name="brain" size={12} color="#58D66D" style={{ marginRight: 4 }} />
            <Text style={styles.modelTagText}>ResNet50</Text>
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
        >
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Health Records</Text>
          </View>
          <TouchableOpacity style={styles.downloadBtn}>
            <Feather name="download" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search owner or disease..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Feather name="mic" size={20} color="#888" style={styles.micIcon} />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#58D66D" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
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
