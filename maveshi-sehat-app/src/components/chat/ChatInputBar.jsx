import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from '../../utils/translate';

export default function ChatInputBar({
  isPendingApproval,
  conversationStatus,
  partnerName,
  userRole,
  selectedAttachmentUri,
  onRemoveAttachment,
  onOpenPrescription,
  onOpenVaccination,
  onOpenResolution,
  onAttachmentSelect,
  inputText,
  onChangeInputText,
  onSendText,
  onReopenConversation,
  insets,
  isDark,
  colors,
  styles
}) {
  if (isPendingApproval) {
    return (
      <View style={[styles.resolvedBanner, { 
        paddingBottom: Math.max(insets?.bottom || 0, 12),
        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
        borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'
      }]}>
        <View style={styles.resolvedBannerTextRow}>
          <Feather name="clock" size={17} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={[styles.resolvedBannerText, { color: '#B45309', fontWeight: '700' }]}>
            Pending Doctor Approval
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: '#92400E', textAlign: 'center', marginTop: 4, paddingHorizontal: 16 }}>
          Dr. {partnerName} has not accepted this request yet. Chat will unlock automatically once approved.
        </Text>
      </View>
    );
  }

  if (conversationStatus === 'resolved') {
    return (
      <View style={[styles.resolvedBanner, { paddingBottom: Math.max(insets?.bottom || 0, 10) }]}>
        <View style={styles.resolvedBannerTextRow}>
          <MaterialCommunityIcons name="lock" size={17} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={styles.resolvedBannerText}>This consultation is resolved.</Text>
        </View>
        <TouchableOpacity
          style={styles.reopenButton}
          onPress={onReopenConversation}
          activeOpacity={0.8}
        >
          <Feather name="plus-circle" size={15} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.reopenButtonText}>Start New Consultation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ paddingBottom: Math.max(insets?.bottom || 0, 10) }}>
      {selectedAttachmentUri && (
        <View style={styles.attachmentPreviewContainer}>
          <Image source={{ uri: selectedAttachmentUri }} style={styles.attachmentPreviewImage} />
          <TouchableOpacity 
            style={styles.attachmentRemoveBtn} 
            onPress={onRemoveAttachment}
          >
            <Feather name="x" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {userRole === 'vet' && conversationStatus === 'active' && (
        <View style={styles.vetActionRow}>
          <TouchableOpacity 
            style={styles.vetActionBtnOutline} 
            onPress={onOpenPrescription}
          >
            <MaterialCommunityIcons name="pill" size={18} color="#58D66D" />
            <Text style={styles.vetActionBtnTextOutline}>Rx</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.vetActionBtnOutline, { borderColor: '#3B82F6', flex: 0.8 }]} 
            onPress={onOpenVaccination}
          >
            <MaterialCommunityIcons name="needle" size={18} color="#3B82F6" />
            <Text style={[styles.vetActionBtnTextOutline, { color: '#3B82F6' }]}>Vaccine</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.vetActionBtnSolid} 
            onPress={onOpenResolution}
          >
            <Text style={styles.vetActionBtnSolidText}>✓ Mark Resolved</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={onAttachmentSelect}
        >
          <Feather name="paperclip" size={22} color="#4CB85C" style={{ transform: [{ rotate: '-45deg' }] }} />
        </TouchableOpacity>

        {userRole === 'farmer' && (
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => {}}
          >
            <MaterialCommunityIcons name="microphone" size={24} color="#4CB85C" />
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.textInput}
          placeholder={t('Type message...')}
          placeholderTextColor="#888"
          value={inputText}
          onChangeText={onChangeInputText}
          multiline
        />

        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() && !selectedAttachmentUri) && styles.sendButtonDisabled]} 
          onPress={onSendText}
          disabled={!inputText.trim() && !selectedAttachmentUri}
        >
          <Feather name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
