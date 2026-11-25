import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar 
} from 'react-native';
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
      const farmerId = profile.userId || profile.id;
      if (!farmerId) {
        setConsultations([]);
        setLoading(false);
        return;
      }
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/consultations/farmer/${farmerId}`);
      const data = await response.json();
      if (response.ok) {
        setConsultations(data.consultations || []);
      } else {
        throw new Error(data.error || 'Failed to fetch consultations');
      }
    } catch (err) {
      console.error(err);
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

  // Group consultations strictly by Veterinarian (Doctor)
  const groupedByVet = useMemo(() => {
    const groups = {};
    consultations.forEach(item => {
      const vId = item.vet_id || 'general';
      if (!groups[vId]) {
        groups[vId] = {
          vetId: vId,
          vetName: item.vet_name || 'Veterinarian',
          vetSpecialization: item.vet_specialization || 'General Practitioner',
          vetDistrict: item.vet_district || '',
          vetPhone: item.vet_phone || '',
          vetConsultationMode: item.vet_consultation_mode || 'Chat + Video',
          vetWalletType: item.vet_wallet_type || 'JazzCash',
          vetAccountTitle: item.vet_account_title,
          vetAccountNumber: item.vet_account_number,
          consultations: []
        };
      }
      groups[vId].consultations.push(item);
    });
    return Object.values(groups);
  }, [consultations]);

  const renderDoctorCard = ({ item: vetGroup }) => {
    const totalCases = vetGroup.consultations.length;
    const activeCases = vetGroup.consultations.filter(c => c.status === 'approved').length;
    const pendingCases = vetGroup.consultations.filter(c => c.status === 'pending').length;
    const resolvedCases = vetGroup.consultations.filter(c => c.status === 'resolved' || c.status === 'completed').length;

    return (
      <TouchableOpacity
        style={[styles.card, {
          padding: 16,
          marginBottom: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border
        }]}
        onPress={() => navigation.navigate('DoctorConsultations', { vetGroup })}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Doctor Avatar */}
          <View style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#DCFCE7',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          }}>
            <MaterialCommunityIcons name="doctor" size={30} color="#059669" />
          </View>

          {/* Doctor Info */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
                Dr. {vetGroup.vetName.replace(/^Dr\.\s*/i, '')}
              </Text>
              <MaterialCommunityIcons name="check-decagram" size={16} color="#059669" style={{ marginLeft: 5 }} />
            </View>

            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
              {vetGroup.vetSpecialization} {vetGroup.vetDistrict ? `· ${vetGroup.vetDistrict}` : ''}
            </Text>

            {/* Mode Tag */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
              <View style={{
                backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
                  {vetGroup.vetConsultationMode || 'Chat + Video'}
                </Text>
              </View>

              <View style={{
                backgroundColor: isDark ? '#334155' : '#F1F5F9',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textPrimary }}>
                  {totalCases} {totalCases === 1 ? 'Case' : 'Cases'}
                </Text>
              </View>
            </View>
          </View>

          <Feather name="chevron-right" size={24} color={colors.textSecondary} style={{ marginLeft: 8 }} />
        </View>

        {/* Case Status Summary Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {activeCases > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 5 }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                  {activeCases} Active
                </Text>
              </View>
            )}

            {pendingCases > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginRight: 5 }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>
                  {pendingCases} Pending
                </Text>
              </View>
            )}

            {resolvedCases > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#64748B', marginRight: 5 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>
                  {resolvedCases} Resolved
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginRight: 2 }}>
              {t('View Cases')}
            </Text>
            <Feather name="arrow-right" size={13} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('My Consultations')}</Text>
        <TouchableOpacity 
          style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => navigation.navigate('Veterinarians')}
        >
          <Feather name="plus-circle" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : groupedByVet.length === 0 ? (
        <View style={[styles.emptyState, { flex: 1, backgroundColor: colors.background }]}>
          <MaterialCommunityIcons name="doctor" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>{t('No consultations found')}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>
            You have not booked any consultations yet. Consult certified veterinarians for medical guidance.
          </Text>
          <TouchableOpacity 
            style={{
              marginTop: 20,
              backgroundColor: colors.primary,
              paddingHorizontal: 22,
              paddingVertical: 12,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center'
            }}
            onPress={() => navigation.navigate('Veterinarians')}
          >
            <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{t('Consult Veterinarian')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList 
          style={{ flex: 1, backgroundColor: colors.background }}
          data={groupedByVet}
          keyExtractor={(item) => String(item.vetId)} 
          renderItem={renderDoctorCard} 
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('Consulted Doctors')} ({groupedByVet.length})
              </Text>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.navigate('Veterinarians')}
              >
                <Feather name="plus" size={14} color={colors.primary} style={{ marginRight: 3 }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                  {t('New Consultation')}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
