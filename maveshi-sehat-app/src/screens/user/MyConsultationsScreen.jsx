import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { getProfile } from '../../utils/profileStore';
import styles from '../../styles/MyConsultationsScreenStyles';

export default function MyConsultationsScreen() {
  const navigation = useNavigation();
  const profile = getProfile();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
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
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
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
        initialRecord: consult.ai_record_data ? JSON.parse(consult.ai_record_data) : null
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
