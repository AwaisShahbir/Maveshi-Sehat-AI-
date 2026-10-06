import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Platform, 
  TextInput,
  Alert,
  Image,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRecords, subscribe, loadRecords } from '../../utils/recordsStore';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t, useTranslation, subscribeTranslation, getLocalizedDescription, getLocalizedFirstAid } from '../../utils/translate';
import fonts from '../../styles/fonts';
import styles from '../../styles/HealthRecordsScreenStyles';

export default function HealthRecordsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const [activeUserName, setActiveUserName] = useState(params.userName || getProfile().userName);
  const userName = activeUserName;
  const userId = params.userId || null;

  const { isUrdu } = useTranslation();
  const [, setTick] = useState(0);

  
  const [records, setRecords] = useState(getRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const handleOpenRecordDetail = (record) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  
  useEffect(() => {
    const activeUser = getProfile().userName;
    setActiveUserName(activeUser);
    loadRecords(activeUser).then(loadedRecords => {
      setRecords(loadedRecords);
    }).catch(err => console.log('Error loading initial health records:', err));

    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setActiveUserName(updatedProfile.userName);
      loadRecords(updatedProfile.userName).then(loadedRecords => {
        setRecords(loadedRecords);
      }).catch(err => console.log('Error loading updated profile health records:', err));
    });

    const unsubscribeRecords = subscribe((updatedRecords) => {
      setRecords(updatedRecords);
    });

    const unsubscribeTranslation = subscribeTranslation(() => {
      setTick(t => t + 1);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeRecords();
      unsubscribeTranslation();
    };
  }, []);

  
  const filteredRecords = records.filter((rec) => {
    
    const matchesSearch = 
      rec.animalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.diseaseUrdu.includes(searchQuery);

    
    let matchesFilter = true;
    if (activeFilter !== 'All') {
      if (activeFilter === 'Active') {
        matchesFilter = rec.status === 'Active';
      } else if (activeFilter === 'Under Treatment') {
        matchesFilter = rec.status === 'Under Treatment';
      } else if (activeFilter === 'Recovered') {
        matchesFilter = rec.status === 'Recovered';
      } else if (activeFilter === 'Healthy') {
        matchesFilter = rec.status === 'Healthy';
      }
    }

    return matchesSearch && matchesFilter;
  });

  
  const totalScans = records.length;
  const activeCases = records.filter(r => r.status === 'Active' || r.status === 'Under Treatment').length;
  const healthyCount = records.filter(r => r.status === 'Healthy' || r.status === 'Recovered').length;

  const getIconComponent = (iconName, color) => {
    if (iconName === 'alert-circle') {
      return <Feather name="alert-circle" size={22} color={color} />;
    } else if (iconName === 'check-circle') {
      return <Feather name="check-circle" size={22} color={color} />;
    } else {
      return <Feather name="trending-up" size={22} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Health Records')}</Text>
                    
          
          <View style={styles.searchBarRow}>
            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, isUrdu && { fontFamily: fonts.urduRegular }]}
                placeholder={t('Search records...')}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={18} color="#999" style={{ marginRight: 8 }} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.filterBtn, showFilterOptions && styles.filterBtnActive]}
              onPress={() => setShowFilterOptions(!showFilterOptions)}
            >
              <Feather name="sliders" size={20} color={showFilterOptions ? '#FFF' : '#58D66D'} />
            </TouchableOpacity>
          </View>
        </View>

        
        {showFilterOptions && (
          <View style={styles.filterChipsRow}>
            {['All', 'Active', 'Under Treatment', 'Recovered', 'Healthy'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip, 
                  activeFilter === filter && styles.filterChipActive
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterChipText, 
                  activeFilter === filter && styles.filterChipTextActive,
                  isUrdu && { fontFamily: fonts.urduRegular }
                ]}>
                  {t(filter)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        
        <View style={styles.statsCardRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalScans}</Text>
            <Text style={[styles.statLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Total Scans')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF4D4D' }]}>{activeCases}</Text>
            <Text style={[styles.statLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Active Cases')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#4CB85C' }]}>{healthyCount}</Text>
            <Text style={[styles.statLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Healthy')}</Text>
          </View>
        </View>

        
        <View style={styles.recordsListContainer}>
          {filteredRecords.length > 0 ? (
            filteredRecords.map((rec) => (
              <TouchableOpacity key={rec.id} style={styles.recordCard} onPress={() => handleOpenRecordDetail(rec)}>
                
                <View style={[styles.iconContainer, { backgroundColor: rec.bg, overflow: 'hidden' }]}>
                  {rec.uri ? (
                    <Image source={{ uri: rec.uri }} style={{ width: 44, height: 44, resizeMode: 'cover' }} />
                  ) : (
                    getIconComponent(rec.icon, rec.color)
                  )}
                </View>

                
                <View style={styles.detailsContainer}>
                  <Text style={[styles.diseaseTitle, isUrdu && { fontFamily: fonts.urduBold }]}>{t(rec.disease)}</Text>
                  <Text style={[styles.animalSub, isUrdu && { fontFamily: fonts.urduRegular }]}>
                    {rec.animalId} • {rec.timeAgo === 'Just now' ? t('Just now') : rec.timeAgo}
                  </Text>
                  
                  
                  <View style={styles.badgesRow}>
                    <View style={[
                      styles.badge, 
                      { backgroundColor: rec.risk === 'High Risk' ? '#FFEBEB' : (rec.risk === 'Medium Risk' ? '#FFF5E5' : '#E8F8EA') }
                    ]}>
                      <Text style={[
                        styles.badgeText, 
                        { color: rec.risk === 'High Risk' ? '#FF4D4D' : (rec.risk === 'Medium Risk' ? '#FF9500' : '#4CB85C') },
                        isUrdu && { fontFamily: fonts.urduRegular }
                      ]}>
                        {t(rec.risk)}
                      </Text>
                    </View>

                    <View style={[
                      styles.badge, 
                      { backgroundColor: rec.status === 'Active' ? '#F0F0F0' : (rec.status === 'Under Treatment' ? '#FFF5E5' : '#E8F8EA') }
                    ]}>
                      <Text style={[
                        styles.badgeText, 
                        { color: rec.status === 'Active' ? '#666' : (rec.status === 'Under Treatment' ? '#FF9500' : '#4CB85C') },
                        isUrdu && { fontFamily: fonts.urduRegular }
                      ]}>
                        {t(rec.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                
                <View style={styles.rightContainer}>
                  <Text style={styles.confidenceText}>{rec.confidence}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="info" size={32} color="#ccc" style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('No records found matching criteria')}</Text>
            </View>
          )}
        </View>

        
        <View style={{ height: 120 }} />
      </ScrollView>

      
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            {selectedRecord && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Animal Record')} ({selectedRecord.animalId})</Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <Feather name="x" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  
                  {selectedRecord.uri && (
                    <View style={styles.detailImageWrapper}>
                      <Image source={{ uri: selectedRecord.uri }} style={styles.detailImage} />
                    </View>
                  )}

                  
                  <View style={styles.detailHeaderInfo}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailDisease, isUrdu && { fontFamily: fonts.urduBold }]}>{t(selectedRecord.disease)}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: selectedRecord.bg, alignSelf: 'flex-start', marginLeft: 8 }]}>
                      <Text style={[styles.badgeText, { color: selectedRecord.color }, isUrdu && { fontFamily: fonts.urduRegular }]}>
                        {t(selectedRecord.status)}
                      </Text>
                    </View>
                  </View>

                  
                  <View style={styles.detailTable}>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Animal Type:')}</Text>
                      <Text style={[styles.tableVal, isUrdu && { fontFamily: fonts.urduRegular }]}>{t(selectedRecord.animalType)}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Date & Time:')}</Text>
                      <Text style={styles.tableVal}>{selectedRecord.date}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Confidence:')}</Text>
                      <Text style={styles.tableVal}>{selectedRecord.confidence}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableLabel, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Risk Level:')}</Text>
                      <Text style={[styles.tableVal, { color: selectedRecord.color, fontWeight: 'bold' }, isUrdu && { fontFamily: fonts.urduRegular }]}>
                        {t(selectedRecord.risk)}
                      </Text>
                    </View>
                  </View>

                  
                  {selectedRecord.description && (
                    <>
                      <Text style={[styles.sectionTitleModal, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Clinical Description:')}</Text>
                      <Text style={[styles.detailTextModal, isUrdu && { fontFamily: fonts.urduRegular }]}>{getLocalizedDescription(selectedRecord.disease, selectedRecord.description)}</Text>
                    </>
                  )}

                  
                  {selectedRecord.firstAid && selectedRecord.firstAid.length > 0 && (
                    <>
                      <Text style={[styles.sectionTitleModal, isUrdu && { fontFamily: fonts.urduBold }]}>{t('First Aid / Treatment:')}</Text>
                      {getLocalizedFirstAid(selectedRecord.disease, selectedRecord.firstAid).map((tip, idx) => (
                        <View key={idx} style={styles.bulletRowModal}>
                          <Text style={styles.bulletDotModal}>•</Text>
                          <Text style={[styles.bulletTextModal, isUrdu && { fontFamily: fonts.urduRegular }]}>{tip}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </ScrollView>

                
                <TouchableOpacity 
                  style={styles.consultVetBtnModal} 
                  onPress={() => {
                    setDetailModalVisible(false);
                    navigation.navigate('VeterinariansList', { userName, initialRecord: selectedRecord });
                  }}
                >
                  <Feather name="message-circle" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.consultVetBtnTextModal, isUrdu && { fontFamily: fonts.urduBold }]}>{t('Consult Veterinarian')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan', { userName, userId })}>
            <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('AI Scan')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Feather name="file-text" size={24} color="#FFF" />
            <Text style={[styles.navText, { color: '#FFF' }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Records')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum', { userName, userId })}>
            <Feather name="message-square" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Forum')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile', { userId })}>
            <Feather name="user" size={24} color="#A3E6B2" />
            <Text style={[styles.navText, { color: '#A3E6B2' }, isUrdu && { fontFamily: fonts.urduRegular }]}>{t('Profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
