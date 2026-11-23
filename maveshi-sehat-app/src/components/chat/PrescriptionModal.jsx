import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';

export default function PrescriptionModal({
  visible,
  diagnosis,
  setDiagnosis,
  prescriptionMedicines,
  onAddMedicineRow,
  onRemoveMedicineRow,
  onChangeMedicine,
  instructions,
  setInstructions,
  onSendPrescription,
  onClose,
  styles
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.prescriptionModalContainer}
        >
          <View style={styles.prescriptionModalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="file-document-edit" size={24} color="#58D66D" />
                <Text style={[styles.modalTitle, { marginLeft: 8 }]}>Write Prescription</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              
              <Text style={styles.formLabel}>{t('Diagnosis')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Foot and Mouth Disease (FMD)"
                placeholderTextColor="#999"
                value={diagnosis}
                onChangeText={setDiagnosis}
              />

              <View style={styles.formHeaderRow}>
                <Text style={styles.formLabel}>{t('Medicines')}</Text>
                <TouchableOpacity style={styles.addButton} onPress={onAddMedicineRow}>
                  <Feather name="plus" size={14} color="#58D66D" />
                  <Text style={styles.addButtonText}>{t('Add')}</Text>
                </TouchableOpacity>
              </View>

              {prescriptionMedicines.map((med, index) => (
                <View key={index} style={styles.medicineFormRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 2, marginRight: 6, marginBottom: 0 }]}
                    placeholder="Medicine Name"
                    placeholderTextColor="#999"
                    value={med.name}
                    onChangeText={(text) => onChangeMedicine(text, index, 'name')}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 1.2, marginRight: 6, marginBottom: 0 }]}
                    placeholder="Dosage"
                    placeholderTextColor="#999"
                    value={med.dosage}
                    onChangeText={(text) => onChangeMedicine(text, index, 'dosage')}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginRight: 6, marginBottom: 0 }]}
                    placeholder="Days"
                    placeholderTextColor="#999"
                    value={med.duration}
                    onChangeText={(text) => onChangeMedicine(text, index, 'duration')}
                  />
                  {prescriptionMedicines.length > 1 && (
                    <TouchableOpacity 
                      style={styles.deleteRowButton} 
                      onPress={() => onRemoveMedicineRow(index)}
                    >
                      <Feather name="trash-2" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <Text style={[styles.formLabel, { marginTop: 14 }]}>{t('Special Instructions')}</Text>
              <TextInput
                style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="e.g. Isolate the sick cow, wash hooves with antiseptic twice daily."
                placeholderTextColor="#999"
                value={instructions}
                onChangeText={setInstructions}
                multiline
              />

              <TouchableOpacity 
                style={styles.submitPrescriptionButton} 
                onPress={onSendPrescription}
                activeOpacity={0.8}
              >
                <Text style={styles.submitPrescriptionButtonText}>{t('Send Prescription')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
