import React from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';

export default function IncomingCallModal({
  visible,
  incomingCallData,
  partnerName,
  onAccept,
  onReject
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onReject}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(11, 19, 43, 0.88)',
        justifyContent: 'flex-end',
        paddingBottom: Platform.OS === 'ios' ? 40 : 24
      }}>
        <View style={{
          backgroundColor: '#1E293B',
          marginHorizontal: 16,
          borderRadius: 24,
          padding: 24,
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: 'rgba(56, 189, 248, 0.4)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 15
        }}>
          {/* Animated Ringing Calling Icon */}
          <View style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: 'rgba(2, 132, 199, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            borderWidth: 2,
            borderColor: '#38BDF8'
          }}>
            <View style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: '#0284C7',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Feather name="video" size={32} color="#FFF" />
            </View>
          </View>

          <View style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            marginBottom: 8
          }}>
            <Text style={{ color: '#34D399', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('Incoming Video Consultation Request')}
            </Text>
          </View>

          <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>
            {incomingCallData?.callerName || partnerName || 'Doctor'}
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            {incomingCallData?.callerRole === 'vet' ? 'Veterinary Surgeon' : t('Farmer')} · {t('is calling for live video clinical inspection')}
          </Text>

          {/* Accept & Decline Action Row */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            gap: 16
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#DC2626',
                paddingVertical: 14,
                borderRadius: 16
              }}
              onPress={onReject}
            >
              <MaterialCommunityIcons name="phone-hangup" size={22} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
                {t('Decline')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#059669',
                paddingVertical: 14,
                borderRadius: 16
              }}
              onPress={onAccept}
            >
              <Feather name="video" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
                {t('Accept Call')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
