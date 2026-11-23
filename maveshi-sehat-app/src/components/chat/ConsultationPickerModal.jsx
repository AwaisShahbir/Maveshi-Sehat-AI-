import React from 'react';
import { View, Text, Modal, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ConsultationPickerModal({
  visible,
  consultationHistory = [],
  selectedConsultationId,
  userRole,
  partnerName,
  colors,
  styles,
  onSelectConsultation,
  onClose
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.consultationPickerScreen}>
        <View style={styles.consultationPickerHeader}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onClose}
          >
            <Feather name="chevron-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.consultationPickerHeaderText}>
            <Text style={styles.consultationPickerTitle}>Choose a consultation</Text>
            <Text style={styles.consultationPickerSubtitle}>{partnerName}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.consultationPickerContent}>
          <View style={styles.consultationPickerIntro}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={30} color={colors.primary} />
            <Text style={styles.consultationPickerIntroTitle}>What would you like to discuss?</Text>
            <Text style={styles.consultationPickerIntroText}>
              Select the consultation before opening the chat. Your messages and prescriptions will be linked to this case.
            </Text>
          </View>
          {consultationHistory.map((consultation, index) => {
            const resolved = consultation.status === 'completed' || consultation.status === 'resolved';
            const pending = consultation.status === 'pending';
            const selectable = !resolved && !(pending && userRole === 'farmer');
            return (
              <TouchableOpacity
                key={consultation.id || index}
                style={[styles.consultationPickerRow, !selectable && styles.consultationPickerRowDisabled]}
                onPress={() => {
                  if (selectable) {
                    onSelectConsultation(consultation.id);
                  }
                }}
                disabled={!selectable}
                activeOpacity={0.8}
              >
                <View style={styles.consultationPickerRowIcon}>
                  <MaterialCommunityIcons 
                    name={selectable ? 'message-text-outline' : 'lock-outline'} 
                    size={20} 
                    color={selectable ? colors.primary : colors.textSecondary} 
                  />
                </View>
                <View style={styles.consultationPickerRowDetails}>
                  <Text style={styles.consultationPickerReason}>{consultation.reason || 'General consultation'}</Text>
                  <Text style={styles.consultationPickerDate}>
                    Started {new Date(consultation.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.consultationPickerStatus}>
                  <Feather name={selectable ? 'chevron-right' : 'lock'} size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
