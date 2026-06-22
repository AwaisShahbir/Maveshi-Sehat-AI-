import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { getProfile } from '../../utils/profileStore';

export default function MyConsultationsScreen() {
  const navigation = useNavigation();
  const profile = getProfile();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const baseUrl = Platform.OS === 'android' ? 'http://localhost:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/consultations/farmer/${profile.userId || 2}`); 
      const data = await response.json();
      if (response.ok) {
        setConsultations(data.consultations || []);
      } else {
        throw new Error(data.error || 'Failed to fetch consultations');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Fetch Error', err.message || 'Network request failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConsultations();
    });
    return unsubscribe;
  }, [navigation]);

  const handleStartChat = async (consult) => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://localhost:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: 1,
          farmerName: profile.userName || 'Farmer',
          vetId: consult.vet_id
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      navigation.navigate('Chat', {
        conversationId: data.id,
        partnerName: consult.vet_name,
        partnerRole: 'vet',
        userName: profile.userName || 'Farmer',
        userRole: 'farmer',
        vetId: consult.vet_id,
        initialRecord: consult.ai_record_data ? (typeof consult.ai_record_data === 'string' ? JSON.parse(consult.ai_record_data) : consult.ai_record_data) : null
      });
    } catch (error) {
      Alert.alert('Error', 'Could not start chat.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.vetName}>{item.vet_name}</Text>
          <Text style={styles.typeText}>{item.type === 'online_chat' ? 'Online Consultation' : 'Physical Appointment'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'approved' ? '#E8F8EA' : item.status === 'rejected' ? '#FFEBEB' : '#FFF3CD' }]}>
          <Text style={[styles.statusText, { color: item.status === 'approved' ? '#58D66D' : item.status === 'rejected' ? '#FF3B30' : '#856404' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.reasonText}>Reason: {item.reason}</Text>
      {item.appointment_date && <Text style={styles.dateText}>Date: {new Date(item.appointment_date).toLocaleString()}</Text>}

      {item.status === 'approved' && item.type === 'online_chat' && (
        <TouchableOpacity style={styles.chatBtn} onPress={() => handleStartChat(item)}>
          <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.chatBtnText}>Open Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Consultations</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#58D66D" style={{ marginTop: 50 }} />
      ) : consultations.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No consultations found</Text>
        </View>
      ) : (
        <FlatList data={consultations} keyExtractor={(i) => i.id.toString()} renderItem={renderItem} contentContainerStyle={{ padding: 16 }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  vetName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  typeText: { fontSize: 14, color: '#666', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  reasonText: { fontSize: 14, color: '#444', marginBottom: 8 },
  dateText: { fontSize: 14, color: '#D98A22', fontWeight: 'bold', marginBottom: 12 },
  chatBtn: { backgroundColor: '#58D66D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginTop: 8 },
  chatBtnText: { color: '#FFF', fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 12, fontSize: 16, color: '#888' }
});
