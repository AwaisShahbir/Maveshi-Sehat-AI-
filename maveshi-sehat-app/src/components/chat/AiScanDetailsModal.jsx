import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AiScanDetailsModal({
  visible,
  attachedAiRecord,
  onClose,
  styles
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '85%' }]}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="stethoscope" size={22} color="#059669" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>AI Scan Medical Report</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {attachedAiRecord && (
              <>
                {(attachedAiRecord.imageUrl || attachedAiRecord.uri) ? (
                  <Image
                    source={{ uri: attachedAiRecord.imageUrl || attachedAiRecord.uri }}
                    style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 14, backgroundColor: '#E2E8F0' }}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Livestock Tag / ID</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 2 }}>
                    #{attachedAiRecord.animalId || attachedAiRecord.id || 'N/A'}
                  </Text>

                  <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>Species & Breed</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>
                        {attachedAiRecord.animalType || 'Livestock'} {attachedAiRecord.breed ? `(${attachedAiRecord.breed})` : ''}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>Confidence Score</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#059669' }}>
                        {attachedAiRecord.confidence || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 4 }}>
                    Primary Diagnosis:
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#DC2626' }}>
                    {attachedAiRecord.disease || attachedAiRecord.name}
                  </Text>
                </View>

                {attachedAiRecord.description ? (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 4 }}>
                      Clinical Observations:
                    </Text>
                    <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                      {attachedAiRecord.description}
                    </Text>
                  </View>
                ) : null}

                {attachedAiRecord.firstAid && (Array.isArray(attachedAiRecord.firstAid) ? attachedAiRecord.firstAid.length > 0 : !!attachedAiRecord.firstAid) ? (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                      Recommended First Aid:
                    </Text>
                    {Array.isArray(attachedAiRecord.firstAid) ? (
                      attachedAiRecord.firstAid.map((tip, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', marginBottom: 6 }}>
                          <Text style={{ color: '#059669', marginRight: 6, fontWeight: '700' }}>•</Text>
                          <Text style={{ flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 }}>{tip}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }}>{attachedAiRecord.firstAid}</Text>
                    )}
                  </View>
                ) : null}
              </>
            )}

            <TouchableOpacity
              style={[styles.submitPrescriptionButton, { backgroundColor: '#059669', marginTop: 10 }]}
              onPress={onClose}
            >
              <Text style={styles.submitPrescriptionButtonText}>Close Report</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
