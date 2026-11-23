import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';

export default function ChatMessageItem({
  item,
  ourUserId,
  conversationStatus,
  userRole,
  failedImageIds = {},
  onImageError,
  onOpenResolution,
  getConsultationName,
  parseMessageData,
  colors,
  styles
}) {
  if (item.isConsultationMarker) {
    return (
      <View style={styles.consultationStartMarker}>
        <View style={styles.consultationStartLine} />
        <View style={styles.consultationStartContent}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={16} color={colors.primary} />
          <Text style={styles.consultationStartText}>
            {item.reason} consultation started
          </Text>
          {item.created_at && (
            <Text style={styles.consultationStartDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          )}
        </View>
        <View style={styles.consultationStartLine} />
      </View>
    );
  }

  const isMe = item.sender_id === ourUserId;
  const timeText = new Date(item.created_at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
  let messageText = typeof item.message === 'string' ? item.message.trim() : '';
  if (messageText === '📋 A new consultation has been started.') {
    const caseName = typeof getConsultationName === 'function' ? getConsultationName(item.consultation_id) : 'Consultation';
    messageText = `📋 ${caseName} consultation has been started.`;
  }
  const hasImage = typeof item.image_url === 'string' && item.image_url.trim().length > 0;
  const imageFailed = !!failedImageIds[item.id];

  if (item.is_prescription) {
    const data = typeof parseMessageData === 'function' ? parseMessageData(item.prescription_data) : null;
    if (!data) return null;

    return (
      <View style={[styles.prescriptionWrapper, isMe ? styles.alignRight : styles.alignLeft]}>
        <View style={styles.prescriptionCard}>
          <View style={styles.prescriptionHeader}>
            <MaterialCommunityIcons name="file-document-edit" size={24} color="#FFF" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.prescriptionHeaderTitle}>{t('Rx Prescription')}</Text>
              <Text style={styles.prescriptionHeaderSubtitle}>Maveshi Sehat Vet Advice</Text>
            </View>
          </View>

          <View style={styles.prescriptionBody}>
            <Text style={styles.prescriptionLabel}>{t('Diagnosis')}</Text>
            <Text style={styles.prescriptionValue}>{data.diagnosis}</Text>

            <Text style={[styles.prescriptionLabel, { marginTop: 12 }]}>{t('Medicines')}</Text>
            {Array.isArray(data.medicines) && data.medicines.map((med, index) => (
              <View key={index} style={styles.medicineItem}>
                <Text style={styles.medicineName}>• {med.name}</Text>
                <Text style={styles.medicineDosage}>{med.dosage} ({med.duration})</Text>
              </View>
            ))}

            {data.instructions ? (
              <>
                <Text style={[styles.prescriptionLabel, { marginTop: 12 }]}>{t('Special Instructions')}</Text>
                <Text style={styles.prescriptionValue}>{data.instructions}</Text>
              </>
            ) : null}
          </View>

          {conversationStatus === 'active' && userRole === 'farmer' && (
            <TouchableOpacity 
              style={styles.resolveButton} 
              onPress={onOpenResolution}
              activeOpacity={0.8}
            >
              <Feather name="check-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.resolveButtonText}>{t('Mark Resolved')}</Text>
            </TouchableOpacity>
          )}

          {conversationStatus === 'resolved' && (
            <View style={styles.resolvedLabel}>
              <Feather name="check" size={14} color="#4CB85C" style={{ marginRight: 4 }} />
              <Text style={styles.resolvedLabelText}>{t('Case Resolved')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.messageTime}>{timeText}</Text>
      </View>
    );
  }

  if (item.is_vaccination) {
    const data = typeof parseMessageData === 'function' ? parseMessageData(item.vaccination_data) : null;
    if (!data) return null;

    return (
      <View style={[styles.prescriptionWrapper, isMe ? styles.alignRight : styles.alignLeft]}>
        <View style={styles.prescriptionCard}>
          <View style={[styles.prescriptionHeader, { backgroundColor: '#3B82F6' }]}>
            <MaterialCommunityIcons name="needle" size={24} color="#FFF" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.prescriptionHeaderTitle}>{t('Vaccination Schedule')}</Text>
              <Text style={styles.prescriptionHeaderSubtitle}>Maveshi Sehat Vet Advice</Text>
            </View>
          </View>

          <View style={styles.prescriptionBody}>
            <Text style={styles.prescriptionLabel}>{t('Vaccine')}</Text>
            <Text style={styles.prescriptionValue}>{data.vaccineName}</Text>

            <Text style={[styles.prescriptionLabel, { marginTop: 12 }]}>{t('Date Administered')}</Text>
            <Text style={styles.prescriptionValue}>{data.vaccineDate}</Text>

            {data.nextDueDate ? (
              <>
                <Text style={[styles.prescriptionLabel, { marginTop: 12, color: '#FF3B30' }]}>{t('Next Due Date')}</Text>
                <Text style={[styles.prescriptionValue, { color: '#FF3B30', fontWeight: 'bold' }]}>{data.nextDueDate}</Text>
              </>
            ) : null}

            {data.notes ? (
              <>
                <Text style={[styles.prescriptionLabel, { marginTop: 12 }]}>{t('Notes')}</Text>
                <Text style={styles.prescriptionValue}>{data.notes}</Text>
              </>
            ) : null}
          </View>
        </View>
        <Text style={styles.messageTime}>{timeText}</Text>
      </View>
    );
  }

  if (!messageText && !hasImage) return null;

  return (
    <View style={[styles.bubbleWrapper, isMe ? styles.alignRight : styles.alignLeft]}>
      <View style={[
        styles.bubble, 
        isMe ? styles.bubbleMe : styles.bubblePartner
      ]}>
        {hasImage && !imageFailed && (
          <Image
            source={{ uri: item.image_url.trim() }}
            style={styles.bubbleImage}
            resizeMode="cover"
            onError={() => onImageError && onImageError(item.id)}
          />
        )}
        {hasImage && imageFailed && (
          <View style={styles.attachmentUnavailable}>
            <Feather name="paperclip" size={16} color={isMe ? '#FFF' : colors.textSecondary} />
            <Text style={[styles.attachmentUnavailableText, isMe ? styles.messageTextMe : styles.messageTextPartner]}>
              Attachment unavailable
            </Text>
          </View>
        )}

        {!!messageText && (
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextPartner]}>
            {messageText}
          </Text>
        )}
        <Text style={[styles.messageTime, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: '#999' }]}>{timeText}</Text>
      </View>
    </View>
  );
}
