import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, TextInput, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import Feather from 'react-native-vector-icons/Feather';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../../styles/VetPrescriptionsScreenStyles';

export default function VetPrescriptionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [activeTab, setActiveTab] = useState('History'); 
  const [searchQuery, setSearchQuery] = useState('');

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribeProfile(() => forceUpdate(n => n + 1));
    return () => unsubscribe();
  }, []);
  
  
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const profile = getProfile();
        const response = await fetch(`${baseUrl}/api/vet/prescriptions?vetName=${encodeURIComponent(profile?.fullName || '')}`);
        const data = await response.json();
        if (response.ok) {
          setPrescriptions(data);
        }
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  
  const [patientInfo, setPatientInfo] = useState({ ownerName: '', animal: '' });
  const [diagnosisEng, setDiagnosisEng] = useState('');
  const [diagnosisUrdu, setDiagnosisUrdu] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dose: '', frequency: '', days: '' }]);
  const [notes, setNotes] = useState('');

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dose: '', frequency: '', days: '' }]);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSendPrescription = () => {
    if (!patientInfo.ownerName || !diagnosisEng) {
      alert('Please fill out patient info and diagnosis.');
      return;
    }
    alert('Prescription Sent Successfully!');
    setActiveTab('History');
    
    setPatientInfo({ ownerName: '', animal: '' });
    setDiagnosisEng('');
    setDiagnosisUrdu('');
    setMedicines([{ name: '', dose: '', frequency: '', days: '' }]);
    setNotes('');
  };

  const renderHistory = () => (
    <View style={styles.historyContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by owner, diagnosis, ID..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#58D66D' }]}>0</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#F5B041' }]}>0</Text>
          <Text style={styles.statLabel}>Sent</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>0</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#58D66D" style={{ marginTop: 40 }} />
        ) : prescriptions.length > 0 ? (
          prescriptions.map((item, index) => renderPrescriptionCard(item, index))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>No prescriptions found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderPrescriptionCard = (item, index) => {
    const data = typeof item.prescription_data === 'string' ? JSON.parse(item.prescription_data) : item.prescription_data;
    if (!data) return null;
    return (
      <View key={index} style={styles.historyCard}>
        <View style={styles.historyCardHeader}>
          <Text style={styles.historyFarmerName}>{item.farmer_name || 'Farmer'}</Text>
          <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.historyDiagnosis}>Diagnosis: {data.diagnosis}</Text>
        <View style={styles.historyDivider} />
        {data.medicines && data.medicines.map((m, i) => (
          <Text key={i} style={styles.historyMedicineText}>• {m.name} - {m.dosage} ({m.duration})</Text>
        ))}
      </View>
    );
  };

  const renderWriteNew = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.writeNewContainer}>
      <View style={styles.formSection}>
        <View style={styles.sectionTitleRow}>
          <Feather name="user" size={16} color="#888" />
          <Text style={styles.sectionTitleText}>{t('PATIENT INFO', 'مریض کی معلومات')}</Text>
        </View>
        
        <Text style={styles.inputLabel}>{t('Owner Name', 'مالک کا نام')}</Text>
        <TextInput
          style={styles.inputField}
          placeholder="e.g. Ahmad Khan"
          value={patientInfo.ownerName}
          onChangeText={val => setPatientInfo({ ...patientInfo, ownerName: val })}
        />

        <Text style={styles.inputLabel}>{t('Animal', 'جانور')}</Text>
        <TextInput
          style={styles.inputField}
          placeholder="e.g. Cow, 4 years old"
          value={patientInfo.animal}
          onChangeText={val => setPatientInfo({ ...patientInfo, animal: val })}
        />
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionTitleRow}>
          <Feather name="file-text" size={16} color="#888" />
          <Text style={styles.sectionTitleText}>{t('DIAGNOSIS', 'تشخیص')}</Text>
        </View>
        
        <Text style={styles.inputLabel}>Diagnosis (English)</Text>
        <TextInput
          style={styles.inputField}
          placeholder="e.g. Lumpy Skin Disease"
          value={diagnosisEng}
          onChangeText={setDiagnosisEng}
        />

        <Text style={styles.inputLabel}>Diagnosis (Urdu)</Text>
        <TextInput
          style={styles.inputField}
          placeholder="مثلاً گانٹھ دار جلد کی بیماری"
          textAlign="right"
          value={diagnosisUrdu}
          onChangeText={setDiagnosisUrdu}
        />
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="paperclip" size={16} color="#888" />
            <Text style={styles.sectionTitleText}>{t('MEDICINES', 'دوائیں')}</Text>
          </View>
          <TouchableOpacity onPress={handleAddMedicine}>
            <Text style={styles.addMedicineBtn}>+ Add</Text>
          </TouchableOpacity>
        </View>
        
        {medicines.map((med, index) => (
          <View key={index} style={styles.medicineCard}>
            <Text style={styles.medicineIndex}>Medicine #{index + 1}</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Medicine name"
              value={med.name}
              onChangeText={val => handleMedicineChange(index, 'name', val)}
            />
            <View style={styles.medicineDetailsRow}>
              <TextInput
                style={[styles.inputField, styles.halfInput]}
                placeholder="Dose"
                value={med.dose}
                onChangeText={val => handleMedicineChange(index, 'dose', val)}
              />
              <TextInput
                style={[styles.inputField, styles.halfInput]}
                placeholder="Frequency"
                value={med.frequency}
                onChangeText={val => handleMedicineChange(index, 'frequency', val)}
              />
              <TextInput
                style={[styles.inputField, styles.halfInput]}
                placeholder="Days"
                value={med.days}
                onChangeText={val => handleMedicineChange(index, 'days', val)}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitleText}>{t('NOTES', 'نوٹس')}</Text>
        <TextInput
          style={[styles.inputField, styles.textArea]}
          placeholder="Additional instructions for the owner..."
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <TouchableOpacity style={styles.sendBtn} onPress={handleSendPrescription}>
        <Text style={styles.sendBtnText}>{t('Send Prescription', 'نسخہ بھیجیں')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Prescriptions</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => setActiveTab('Write New')}>
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'History' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('History')}
          >
            <Text style={[styles.tabText, activeTab === 'History' ? styles.tabTextActive : styles.tabTextInactive]}>{t('History', 'تاریخ')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Write New' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('Write New')}
          >
            <Text style={[styles.tabText, activeTab === 'Write New' ? styles.tabTextActive : styles.tabTextInactive]}>{t('Write New', 'نیا نسخہ')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'History' ? renderHistory() : renderWriteNew()}

    </SafeAreaView>
  );
}
