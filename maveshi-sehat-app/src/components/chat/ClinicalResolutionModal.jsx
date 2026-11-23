import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

export default function ClinicalResolutionModal({
  visible,
  selectedConsultationId,
  consultationName,
  selectedOutcome,
  setSelectedOutcome,
  dischargeNotes,
  setDischargeNotes,
  followUpDays,
  setFollowUpDays,
  onConfirmResolution,
  onClose,
  isUrdu,
  isDark,
  colors
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'flex-end'
        }}
      >
        <View style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 24,
          maxHeight: '90%',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
        }}>
          {/* Modal Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Feather name="check-circle" size={20} color="#059669" />
              </View>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                  {isUrdu ? 'کیس مکمل اختتام و ڈسچارج' : 'Case Resolution & Sign-Off'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {isUrdu ? 'کیس نمبر' : 'Clinical Case'} #{selectedConsultationId || '1'} · {consultationName}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Outcome Selector */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
              {isUrdu ? 'طبی نتیجہ منتخب کریں' : 'Select Clinical Outcome'}
            </Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {[
                { key: 'fully_recovered', label: isUrdu ? 'صحت یاب / مکمل علاج' : 'Fully Recovered / Treated', icon: 'check-circle', color: '#10B981' },
                { key: 'improving', label: isUrdu ? 'بہتری کی طرف (گھریلو دیکھ بھال)' : 'Improving (Home Care Continued)', icon: 'activity', color: '#3B82F6' },
                { key: 'referred', label: isUrdu ? 'ریفر شدہ برائے فیلڈ ہسپتال' : 'Referred to Field Veterinary Hospital', icon: 'arrow-up-right', color: '#F59E0B' },
              ].map((item) => {
                const isSelected = selectedOutcome === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: isSelected ? item.color : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'),
                      backgroundColor: isSelected ? (isDark ? 'rgba(255, 255, 255, 0.06)' : '#F8FAFC') : 'transparent'
                    }}
                    onPress={() => setSelectedOutcome(item.key)}
                  >
                    <Feather name={item.icon} size={18} color={item.color} style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '500', color: isSelected ? item.color : colors.textPrimary, flex: 1 }}>
                      {item.label}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color={item.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Follow-up Days Timeline */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
              {isUrdu ? 'تجویز کردہ فالو اپ شیڈول' : 'Recommended Follow-Up'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[
                { val: 'none', label: isUrdu ? 'کوئی نہیں' : 'None' },
                { val: '3', label: isUrdu ? '3 دن' : '3 Days' },
                { val: '7', label: isUrdu ? '7 دن' : '7 Days' },
                { val: '14', label: isUrdu ? '14 دن' : '14 Days' },
              ].map((fu) => {
                const isChosen = followUpDays === fu.val;
                return (
                  <TouchableOpacity
                    key={fu.val}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isChosen ? '#0284C7' : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'),
                      borderWidth: 1,
                      borderColor: isChosen ? '#0284C7' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0')
                    }}
                    onPress={() => setFollowUpDays(fu.val)}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isChosen ? '#FFF' : colors.textPrimary }}>
                      {fu.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Discharge Instructions */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
              {isUrdu ? 'ڈسچارج ہدایات اور دیکھ بھال کا پلان' : 'Discharge Instructions & Recovery Advice'}
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                minHeight: 80,
                textAlignVertical: 'top',
                marginBottom: 20
              }}
              placeholder={isUrdu ? 'مثال کے طور پر: جانور کو علیحدہ رکھیں، پاؤں کی صفائی جاری رکھیں...' : 'e.g. Ensure dry bedding, monitor temperature for 48 hours, report any relapse...'}
              placeholderTextColor={colors.textSecondary}
              multiline
              value={dischargeNotes}
              onChangeText={setDischargeNotes}
            />

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: Platform.OS === 'ios' ? 24 : 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onPress={onClose}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>
                  {isUrdu ? 'منسوخ کریں' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 2,
                  paddingVertical: 13,
                  borderRadius: 12,
                  backgroundColor: '#059669',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row'
                }}
                onPress={onConfirmResolution}
              >
                <Feather name="check-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>
                  {isUrdu ? 'کیس بند کریں' : 'Resolve & Discharge'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
