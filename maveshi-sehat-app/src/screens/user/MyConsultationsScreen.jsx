import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/MyConsultationsScreenStyles';

export default function MyConsultationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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
          farmerId: profile.userId || 2,
          farmerName: profile.userName || 'Farmer',
          vetId: consult.vet_id
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      let initialRecord = null;
      if (consult.ai_record_data) {
        if (typeof consult.ai_record_data === 'object') {
          initialRecord = consult.ai_record_data;
        } else {
          try {
            initialRecord = JSON.parse(consult.ai_record_data);
          } catch (e) {
            initialRecord = null;
          }
        }
      }

      navigation.navigate('Chat', {
        conversationId: data.id,
        partnerName: consult.vet_name,
        partnerRole: 'vet',
        userName: profile.userName || 'Farmer',
        userRole: 'farmer',
        vetId: consult.vet_id,
        initialRecord,
        consultations: consult.consultations || [consult]
      });
    } catch (error) {
      Alert.alert('Error', 'Could not start chat.');
    }
  };

  const groupedConsultations = useMemo(() => {
    const online = consultations.filter(item => item.type === 'online_chat');
    const physical = consultations.filter(item => item.type !== 'online_chat');
    const grouped = new Map();

    online.forEach(consultation => {
      const key = String(consultation.vet_id);
      const existing = grouped.get(key);
      if (existing) {
        existing.consultations.push(consultation);
      } else {
        grouped.set(key, { ...consultation, consultations: [consultation] });
      }
    });

    const chatGroups = Array.from(grouped.values()).map(group => {
      const hasApproved = group.consultations.some(item => item.status === 'approved');
      const hasPending = group.consultations.some(item => item.status === 'pending');
      const hasRejected = !hasApproved && !hasPending && group.consultations.some(item => item.status === 'rejected');
      return {
        ...group,
        status: hasApproved ? 'approved' : hasPending ? 'pending' : hasRejected ? 'rejected' : 'completed',
      };
    });

    return [...chatGroups, ...physical];
  }, [consultations]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.vetName}>{item.vet_name}</Text>
          <Text style={styles.typeText}>
            {item.type === 'online_chat'
              ? `${item.consultations?.length || 1} Online Consultation${(item.consultations?.length || 1) === 1 ? '' : 's'}`
              : 'Physical Appointment'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.status === 'approved' 
            ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#E8F8EA') 
            : item.status === 'rejected' 
            ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FFEBEB') 
            : (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF3CD') 
        }]}>
          <Text style={[styles.statusText, { 
            color: item.status === 'approved' ? colors.primary : item.status === 'rejected' ? '#EF4444' : '#F59E0B' 
          }]}>
            {(item.status === 'completed' ? 'RESOLVED' : item.status).toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.reasonText}>Reason: {item.reason}</Text>
      {item.appointment_date && <Text style={styles.dateText}>Date: {new Date(item.appointment_date).toLocaleString()}</Text>}

      {item.type === 'online_chat' && item.status !== 'pending' && item.status !== 'rejected' && (
        <TouchableOpacity style={styles.chatBtn} onPress={() => handleStartChat(item)} activeOpacity={0.8}>
          <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.chatBtnText}>{item.status === 'completed' ? 'View Chat' : 'Open Chat'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>My Consultations</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : consultations.length === 0 ? (
        <View style={[styles.emptyState, { flex: 1, backgroundColor: colors.background }]}>
          <Feather name="calendar" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No consultations found</Text>
        </View>
      ) : (
        <FlatList 
          style={{ flex: 1, backgroundColor: colors.background }}
          data={groupedConsultations}
          keyExtractor={(i) => i.id.toString()} 
          renderItem={renderItem} 
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
