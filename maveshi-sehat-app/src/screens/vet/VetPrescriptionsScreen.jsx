import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VetPrescriptionsScreenStyles';

export default function VetPrescriptionsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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
  const [sending, setSending] = useState(false);
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

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

  useEffect(() => {
    fetchPrescriptions();
  }, []);


  const [patientInfo, setPatientInfo] = useState({ ownerName: '', animal: '' });
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [diagnosisEng, setDiagnosisEng] = useState('');
  const [diagnosisUrdu, setDiagnosisUrdu] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dose: '', frequency: '', days: '' }]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/vet/farmers`);
        const responseText = await response.text();
        let data;
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new Error('The server returned an invalid response. Restart the backend and try again.');
        }
        if (!response.ok) throw new Error(data.error || 'Failed to fetch farmers');
        setFarmers(Array.isArray(data) ? data : (data.farmers || []));
      } catch (err) {
        console.error('Error fetching farmers:', err);
        Alert.alert('Unable to load farmers', err.message || 'Please check the server connection and try again.');
      }
    };

    if (activeTab === 'Write New' && farmers.length === 0) {
      fetchFarmers();
    }
  }, [activeTab]);

  const farmerSuggestions = useMemo(() => {
    const query = patientInfo.ownerName.trim().toLowerCase();
    if (!query || selectedFarmer) return [];
    return farmers
      .filter(farmer => (farmer.full_name || '').toLowerCase().includes(query))
      .slice(0, 6);
  }, [farmers, patientInfo.ownerName, selectedFarmer]);

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dose: '', frequency: '', days: '' }]);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleRemoveMedicine = (index) => {
    if (medicines.length <= 1) return;
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
  };

  const handleSendPrescription = async () => {
    if (!selectedFarmer || !diagnosisEng.trim()) {
      Alert.alert(t('Missing Info') || 'Missing Info', 'Select a farmer from the suggestions and enter a diagnosis.');
      return;
    }

    const validMedicines = medicines.filter(m => m.name.trim() !== '');
    if (validMedicines.length === 0) {
      Alert.alert(t('Missing Info') || 'Missing Info', t('Please add at least one medicine.') || 'Please add at least one medicine.');
      return;
    }

    setSending(true);
    try {
      const profile = getProfile();
      const response = await fetch(`${baseUrl}/api/vet/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vetId: profile?.userId || params.userId,
          vetName: profile?.fullName || params.userName,
          farmerId: selectedFarmer.id,
          farmerName: patientInfo.ownerName.trim(),
          animal: patientInfo.animal.trim(),
          diagnosis: diagnosisEng.trim(),
          diagnosisUrdu: diagnosisUrdu.trim(),
          medicines: validMedicines,
          notes: notes.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(t('Error') || 'Error', data.error || 'Failed to send prescription.');
        return;
      }

      Alert.alert(
        t('Success') || 'Success',
        t('Prescription sent successfully!') || 'Prescription sent successfully!',
        [{ text: t('OK') || 'OK' }]
      );

      // Reset form
      setPatientInfo({ ownerName: '', animal: '' });
      setSelectedFarmer(null);
      setDiagnosisEng('');
      setDiagnosisUrdu('');
      setMedicines([{ name: '', dose: '', frequency: '', days: '' }]);
      setNotes('');
      setActiveTab('History');

      // Refresh prescriptions list
      setLoading(true);
      fetchPrescriptions();
    } catch (err) {
      console.error('Error sending prescription:', err);
      Alert.alert(t('Error') || 'Error', t('Network error. Please try again.') || 'Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const filteredPrescriptions = useMemo(() => {
    if (!searchQuery.trim()) return prescriptions;
    const q = searchQuery.toLowerCase();
    return prescriptions.filter(p => {
      const owner = (p.farmer_name || '').toLowerCase();
      const diag = (p.prescription_data?.diagnosis || '').toLowerCase();
      const id = (p.id || '').toString().toLowerCase();
      return owner.includes(q) || diag.includes(q) || id.includes(q);
    });
  }, [prescriptions, searchQuery]);

  const renderHistory = () => (
    <View style={[styles.historyContainer, { backgroundColor: colors.background }]}>
    <View style={[styles.searchContainer, { flexDirection: 'row', alignItems: 'center' }]}>
      <Feather name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
      <TextInput
        style={[styles.searchInput, { flex: 1 }]}
        placeholder="Search by owner, diagnosis, ID..."
        placeholderTextColor={colors.inputPlaceholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery !== '' && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Feather name="x" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>

    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={[styles.statValue, { color: '#58D66D' }]}>{loading ? '-' : prescriptions.length}</Text>
        <Text style={styles.statLabel}>{t('Total')}</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={[styles.statValue, { color: '#F5B041' }]}>{loading ? '-' : prescriptions.length}</Text>
        <Text style={styles.statLabel}>{t('Sent')}</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={[styles.statValue, { color: '#3B82F6' }]}>{loading ? '-' : prescriptions.length}</Text>
        <Text style={styles.statLabel}>{t('Completed')}</Text>
      </View>
    </View>

    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
      {loading ? (
        <ActivityIndicator size="large" color="#58D66D" style={{ marginTop: 40 }} />
      ) : filteredPrescriptions.length > 0 ? (
        filteredPrescriptions.map((item, index) => renderPrescriptionCard(item, index))
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
    let data = item.prescription_data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = null;
      }
    }
    if (!data) return null;
    return (
      <View key={index} style={styles.historyCard}>
        <View style={styles.historyCardHeader}>
          <Text style={styles.historyFarmerName}>{item.farmer_name || 'Farmer'}</Text>
          <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.historyDiagnosis}>Diagnosis: {data.diagnosis || 'General Treatment'}</Text>
        <View style={styles.historyDivider} />
        {data.medicines && Array.isArray(data.medicines) && data.medicines.map((m, i) => (
          <Text key={i} style={styles.historyMedicineText}>• {m.name || 'Medicine'} - {m.dosage || ''} ({m.duration || ''})</Text>
        ))}
      </View>
    );
  };

  const renderWriteNew = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.writeNewContainer}
    >
      <View style={styles.formSection}>
        <View style={styles.sectionTitleRow}>
          <Feather name="user" size={16} color="#888" />
          <Text style={styles.sectionTitleText}>{t('PATIENT INFO')}</Text>
        </View>

        <Text style={styles.inputLabel}>{t('Owner Name')}</Text>
        <View style={styles.autocompleteContainer}>
          <View style={styles.autocompleteInputRow}>
            <Feather name="user" size={17} color={selectedFarmer ? colors.primary : colors.textSecondary} />
            <TextInput
              style={styles.autocompleteInput}
              placeholder="Search registered farmer..."
              placeholderTextColor={colors.inputPlaceholder}
              value={patientInfo.ownerName}
              onChangeText={val => {
                setSelectedFarmer(null);
                setPatientInfo({ ...patientInfo, ownerName: val });
              }}
            />
            {selectedFarmer && <Feather name="check-circle" size={18} color={colors.primary} />}
          </View>
          {farmerSuggestions.length > 0 && (
            <View style={styles.suggestionsList}>
              {farmerSuggestions.map(farmer => (
                <TouchableOpacity
                  key={farmer.id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSelectedFarmer(farmer);
                    setPatientInfo({ ...patientInfo, ownerName: farmer.full_name });
                  }}
                >
                  <View style={styles.suggestionAvatar}>
                    <Text style={styles.suggestionAvatarText}>{farmer.full_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.suggestionDetails}>
                    <Text style={styles.suggestionName}>{farmer.full_name}</Text>
                    {!!farmer.district && <Text style={styles.suggestionMeta}>{farmer.district}</Text>}
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {patientInfo.ownerName.trim() && !selectedFarmer && farmerSuggestions.length === 0 && farmers.length > 0 && (
          <Text style={styles.helperText}>Choose a farmer from the registered suggestions.</Text>
        )}

        <Text style={styles.inputLabel}>{t('Animal')}</Text>
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
          <Text style={styles.sectionTitleText}>{t('DIAGNOSIS')}</Text>
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
          placeholder={t('Enter Urdu diagnosis (optional)')}
          textAlign="right"
          value={diagnosisUrdu}
          onChangeText={setDiagnosisUrdu}
        />
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="paperclip" size={16} color="#888" />
            <Text style={styles.sectionTitleText}>{t('MEDICINES')}</Text>
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
        <Text style={styles.sectionTitleText}>{t('NOTES')}</Text>
        <TextInput
          style={[styles.inputField, styles.textArea]}
          placeholder="Additional instructions for the owner..."
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <TouchableOpacity
        style={[styles.sendBtn, sending && { opacity: 0.6 }]}
        onPress={handleSendPrescription}
        disabled={sending}
        activeOpacity={0.8}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.sendBtnText}>{t('Send Prescription')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Prescriptions</Text>
          </View>
          {activeTab === 'History' ? (
            <TouchableOpacity style={styles.newBtn} onPress={() => setActiveTab('Write New')}>
              <Text style={styles.newBtnText}>+ New</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'History' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('History')}
          >
            <Text style={[styles.tabText, activeTab === 'History' ? styles.tabTextActive : styles.tabTextInactive]}>{t('History')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Write New' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('Write New')}
          >
            <Text style={[styles.tabText, activeTab === 'Write New' ? styles.tabTextActive : styles.tabTextInactive]}>{t('Write New')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'History' ? renderHistory() : renderWriteNew()}

    </SafeAreaView>
  );
}
