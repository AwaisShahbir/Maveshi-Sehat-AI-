import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ClinicalCaseBar({
  selectedConsultationId,
  consultationHistory = [],
  conversationStatus = 'active',
  getConsultationName,
  isUrdu,
  isDark,
  colors,
  onOpenPicker,
  onOpenResolution
}) {
  return (
    <View style={{
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: conversationStatus === 'resolved' ? '#64748B' : '#10B981',
          marginRight: 8
        }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors?.primary || '#059669', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {isUrdu ? 'طبی کیس' : 'Clinical Case'} #{selectedConsultationId || '1'}
            </Text>
            <Text style={{ fontSize: 11, color: colors?.textSecondary || '#64748B', marginLeft: 6 }}>
              · {conversationStatus === 'resolved' ? (isUrdu ? 'مکمل کیس' : 'Resolved') : (isUrdu ? 'جاری کیس' : 'In Progress')}
            </Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors?.textPrimary || '#1E293B', marginTop: 1 }} numberOfLines={1}>
            {typeof getConsultationName === 'function' ? getConsultationName() : 'Selected consultation'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {consultationHistory.length > 1 && (
          <TouchableOpacity
            style={{
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE',
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD',
              flexDirection: 'row',
              alignItems: 'center'
            }}
            onPress={onOpenPicker}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={14} color="#0284C7" style={{ marginRight: 3 }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#0284C7' }}>
              {isUrdu ? 'کیس بدلیں' : 'Switch'}
            </Text>
          </TouchableOpacity>
        )}

        {conversationStatus === 'active' && (
          <TouchableOpacity
            style={{
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5',
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
              flexDirection: 'row',
              alignItems: 'center'
            }}
            onPress={onOpenResolution}
          >
            <Feather name="check-circle" size={12} color="#059669" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>
              {isUrdu ? 'مکمل کریں' : 'Resolve'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
