import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/MyConsultationsScreenStyles';

import { t } from '../../utils/translate';

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
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/consultations/farmer/${profile.userId || 2}`);
      const data = await response.json();
      if (response.ok) {
        setConsultations(data.consultations || []);
      } else {
        throw new Error(data.error || 'Failed to fetch consultations');
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('Error'), err.message || 'Network request failed. Is the server running?');
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

  const handleDeleteConsultation = (item) => {
    Alert.alert(
      t('Delete Consultation'),
      t('Are you sure you want to delete this consultation record? This action cannot be undone.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const baseUrl = 'https://maveshi-sehat-api.onrender.com';
              await fetch(`${baseUrl}/api/consultations/${item.id}`, { method: 'DELETE' });
              setConsultations(prev => prev.filter(c => c.id !== item.id));
              Alert.alert(t('Success'), t('Consultation record deleted.'));
            } catch (err) {
              console.error('Delete consultation error:', err);
              Alert.alert(t('Error'), 'Could not delete consultation record.');
            }
          }
        }
      ]
    );
  };

  const handleStartChat = async (consult) => {
    try {
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
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
        consultationId: consult.id,
        consultation: consult,
        initialRecord,
        consultations: [consult]
      });
    } catch (error) {
      Alert.alert(t('Error'), 'Could not start chat.');
    }
  };

  const renderItem = ({ item }) => {
    let aiData = null;
    if (item.ai_record_data) {
      if (typeof item.ai_record_data === 'object') {
        aiData = item.ai_record_data;
      } else {
        try {
          aiData = JSON.parse(item.ai_record_data);
        } catch (e) {
          aiData = null;
        }
      }
    }

    const isPending = item.status === 'pending';
    const isApproved = item.status === 'approved';
    const isRejected = item.status === 'rejected';

    const statusBadgeBg = isApproved
      ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#E8F8EA')
      : isRejected
      ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FFEBEB')
      : isPending
      ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF3CD')
      : (isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9');

    const statusBadgeColor = isApproved
      ? colors.primary
      : isRejected
      ? '#EF4444'
      : isPending
      ? '#D97706'
      : '#64748B';

    const statusTextDisplay = isPending
      ? 'PENDING APPROVAL'
      : isApproved
      ? 'APPROVED'
      : isRejected
      ? 'DECLINED'
      : 'RESOLVED';

    const formattedDate = item.created_at
      ? new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.vetName}>Dr. {item.vet_name?.replace(/^Dr\.\s*/i, '')}</Text>
            <Text style={styles.typeText}>
              {item.vet_specialization ? `${item.vet_specialization} · ` : ''}
              {item.type === 'online_chat' ? 'Online Consultation' : 'Physical Appointment'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg }]}>
            <Text style={[styles.statusText, { color: statusBadgeColor, fontWeight: '700' }]}>
              {statusTextDisplay}
            </Text>
          </View>
        </View>

        {/* Attached AI Scan Card */}
        {aiData && (
          <View style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
            borderRadius: 14,
            padding: 12,
            marginTop: 10,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: isDark ? colors.border : '#E2E8F0'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialCommunityIcons name="robot" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Attached AI Medical Report
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {(aiData.imageUrl || aiData.uri) ? (
                <Image
                  source={{ uri: aiData.imageUrl || aiData.uri }}
                  style={{ width: 48, height: 48, borderRadius: 10, marginRight: 12, backgroundColor: '#E2E8F0' }}
                />
              ) : (
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  backgroundColor: isDark ? colors.cardElevated : '#E2E8F0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <MaterialCommunityIcons name="cow" size={26} color={colors.primary} />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                  Livestock #{aiData.animalId || aiData.id || 'N/A'} {aiData.animalType ? `(${aiData.animalType})` : ''}
                </Text>
                <Text style={{ fontSize: 13, color: '#D97706', fontWeight: '600', marginTop: 2 }}>
                  {aiData.disease || aiData.name || 'AI Analysis'} {aiData.confidence ? `· ${aiData.confidence}` : ''}
                </Text>
              </View>
            </View>

            {aiData.description ? (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' }} numberOfLines={2}>
                "{aiData.description}"
              </Text>
            ) : null}
          </View>
        )}

        {item.reason ? (
          <Text style={[styles.reasonText, { marginTop: 4 }]}>
            <Text style={{ fontWeight: '700' }}>Reason: </Text>{item.reason}
          </Text>
        ) : null}

        {item.appointment_date && (
          <Text style={styles.dateText}>
            <Text style={{ fontWeight: '700' }}>Appointment: </Text>{new Date(item.appointment_date).toLocaleString()}
          </Text>
        )}

        {formattedDate ? (
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
            Requested: {formattedDate}
          </Text>
        ) : null}

        {/* Action Row */}
        <View style={[styles.cardActionRow, { marginTop: 12, alignItems: 'center' }]}>
          {isPending ? (
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A'
            }}>
              <Feather name="clock" size={16} color="#D97706" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#B45309' }}>
                  {t('Waiting for Doctor Approval')}
                </Text>
                <Text style={{ fontSize: 11, color: '#92400E', marginTop: 1 }}>
                  Dr. {item.vet_name} is reviewing your report. Chat will unlock once approved.
                </Text>
              </View>
            </View>
          ) : isApproved ? (
            <TouchableOpacity
              style={[styles.chatBtn, { flex: 1, marginTop: 0 }]}
              onPress={() => handleStartChat(item)}
              activeOpacity={0.8}
            >
              <Feather name="message-square" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.chatBtnText}>{t('Open Chat')}</Text>
            </TouchableOpacity>
          ) : isRejected ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="x-circle" size={15} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600' }}>
                Consultation declined by doctor
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.chatBtn, { flex: 1, marginTop: 0, backgroundColor: colors.cardElevated }]}
              onPress={() => handleStartChat(item)}
              activeOpacity={0.8}
            >
              <Feather name="message-square" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={[styles.chatBtnText, { color: colors.textPrimary }]}>{t('View Chat History')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.deleteBtn, { marginLeft: 10 }]} 
            onPress={() => handleDeleteConsultation(item)} 
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          data={consultations}
          keyExtractor={(i) => i.id.toString()} 
          renderItem={renderItem} 
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
