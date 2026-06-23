import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, TextInput, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import Feather from 'react-native-vector-icons/Feather';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VetPrescriptionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [activeTab, setActiveTab] = useState('History'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  header: { backgroundColor: '#58D66D', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 4 },
  titleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  newBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  newBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFF' },
  tabBtnInactive: { backgroundColor: 'transparent' },
  tabText: { fontWeight: 'bold', fontSize: 14 },
  tabTextActive: { color: '#58D66D' },
  tabTextInactive: { color: '#FFF' },

  
  historyContainer: { flex: 1 },
  searchContainer: { margin: 16, backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 16, height: 48, justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  searchInput: { fontSize: 15, color: '#333' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, justifyContent: 'space-between' },
  statBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginHorizontal: 4, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#888' },
  historyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyFarmerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  historyDate: { fontSize: 12, color: '#888' },
  historyDiagnosis: { fontSize: 14, color: '#58D66D', fontWeight: 'bold', marginBottom: 8 },
  historyDivider: { height: 1, backgroundColor: '#EAEAEA', marginBottom: 12 },
  historyMedicineText: { fontSize: 14, color: '#555', marginBottom: 4 },

  
  writeNewContainer: { padding: 16, paddingBottom: 100 },
  formSection: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitleText: { fontSize: 13, color: '#888', fontWeight: 'bold', marginLeft: 8, letterSpacing: 0.5 },
  inputLabel: { fontSize: 12, color: '#555', marginBottom: 6, fontWeight: '600' },
  inputField: { borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#333', marginBottom: 16, backgroundColor: '#F9F9F9' },
  addMedicineBtn: { color: '#58D66D', fontWeight: 'bold', fontSize: 14 },
  medicineCard: { backgroundColor: '#F8FAF9', borderRadius: 12, padding: 12, marginBottom: 12 },
  medicineIndex: { fontSize: 12, color: '#58D66D', fontWeight: 'bold', marginBottom: 8 },
  medicineDetailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 1, marginHorizontal: 4, paddingHorizontal: 10 },
  textArea: { borderRadius: 16, height: 100, textAlignVertical: 'top' },
  sendBtn: { backgroundColor: '#58D66D', borderRadius: 25, paddingVertical: 16, alignItems: 'center', elevation: 3, shadowColor: '#58D66D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
