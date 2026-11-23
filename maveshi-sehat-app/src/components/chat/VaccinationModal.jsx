import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { t } from '../../utils/translate';

export default function VaccinationModal({
  visible,
  vaccineName,
  setVaccineName,
  vaccineDate,
  setVaccineDate,
  nextDueDate,
  setNextDueDate,
  vaccineNotes,
  setVaccineNotes,
  onSendVaccination,
  onClose,
  styles
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Vaccination</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('Vaccine Name')}</Text>
              <TextInput style={styles.input} placeholder="e.g. FMD Vaccine" value={vaccineName} onChangeText={setVaccineName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('Date Administered')}</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={vaccineDate} onChangeText={setVaccineDate} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('Next Due Date')}</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={nextDueDate} onChangeText={setNextDueDate} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('Notes')}</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="Any special instructions..." value={vaccineNotes} onChangeText={setVaccineNotes} />
            </View>
            <TouchableOpacity style={[styles.submitPrescriptionButton, { backgroundColor: '#3B82F6' }]} onPress={onSendVaccination}>
              <Text style={styles.submitPrescriptionButtonText}>Send Schedule</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
