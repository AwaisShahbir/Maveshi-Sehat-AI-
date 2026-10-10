import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Modal, 
  ScrollView, 
  StatusBar, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import io from 'socket.io-client';
import { pick, types, isCancel } from '@react-native-documents/picker';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/ChatScreenStyles';

const MOCK_SYMPTOM_IMAGES = [
  { id: '1', title: 'Cow Close-up', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600' },
  { id: '2', title: 'Goat Symptom', url: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=600' },
  { id: '3', title: 'Cow Skin/Wound', url: 'https://images.unsplash.com/photo-1546445317-29f4545e6d5a?w=600' },
];

const parseMessageData = (value) => {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export default function ChatScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  const { conversationId, partnerName, partnerRole, userName, userRole, vetId } = params;
  const consultationHistory = Array.isArray(params.consultations) ? params.consultations : [];

  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationStatus, setConversationStatus] = useState('active'); 
  const [loading, setLoading] = useState(true);
  const [ourUserId, setOurUserId] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [selectedAttachmentUri, setSelectedAttachmentUri] = useState(null);
  const [failedImageIds, setFailedImageIds] = useState({});

  
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([{ name: '', dosage: '', duration: '' }]);
  const [instructions, setInstructions] = useState('');

  const [vaccinationModalVisible, setVaccinationModalVisible] = useState(false);
  const [vaccineName, setVaccineName] = useState('');
  const [vaccineDate, setVaccineDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [vaccineNotes, setVaccineNotes] = useState('');

  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

  useEffect(() => {
    
    const initChat = async () => {
      try {
        
        const convResponse = await fetch(`${baseUrl}/api/chat/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmerName: userRole === 'farmer' ? userName : partnerName,
            vetId: vetId
          })
        });

        const convData = await convResponse.json();
        if (convResponse.ok) {
          setConversationStatus(convData.status);
          setOurUserId(userRole === 'farmer' ? convData.farmer_id : convData.vet_id);
        }

        
        const msgResponse = await fetch(`${baseUrl}/api/chat/messages?conversationId=${conversationId}`);
        const msgData = await msgResponse.json();
        if (msgResponse.ok) {
          setMessages(msgData);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    
    socketRef.current = io(baseUrl);

    socketRef.current.emit('join_room', conversationId.toString());

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => {
        
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [conversationId]);

  
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [loading]);

  useEffect(() => {
    if (params.initialRecord && !inputText) {
      const rec = params.initialRecord;
      const animalType = rec.animalType || 'Livestock';
      const animalId = rec.animalId || rec.generatedAnimalId || 'Unknown';
      const disease = rec.disease || rec.status || 'Unknown';
      const risk = rec.risk || rec.severity || 'Unknown';
      
      const initialText = `AI Disease Detection Report:\nAnimal: ${animalType} (${animalId})\nDisease: ${disease}\nConfidence: ${rec.confidence || 'N/A'}\nRisk Level: ${risk}`;
      setInputText(initialText);
      
      if (rec.uri) {
        setSelectedAttachmentUri(rec.uri);
      }
    }
  }, [params.initialRecord]);

  const handleSendMessage = (text = '', imageUrl = null, isPrescription = false, prescriptionData = null, isVaccination = false, vaccinationData = null) => {
    const finalMsg = text.trim();
    if (!finalMsg && !imageUrl && !isPrescription && !selectedAttachmentUri && !isVaccination) return;

    if (socketRef.current && ourUserId) {
      socketRef.current.emit('send_message', {
        conversationId,
        senderId: ourUserId,
        message: finalMsg || null,
        imageUrl: imageUrl || selectedAttachmentUri || null,
        isPrescription,
        prescriptionData,
        isVaccination,
        vaccinationData
      });
      setInputText('');
      setSelectedAttachmentUri(null);
    } else {
        alert('Failed to send prescription');
    }
  };

  const handleSendText = () => {
    handleSendMessage(inputText);
  };

  const handleSendVaccination = () => {
    if (!vaccineName.trim()) {
      alert(t('Please enter vaccine name'));
      return;
    }
    const vaccinationData = {
      vaccineName: vaccineName.trim(),
      vaccineDate: vaccineDate.trim() || new Date().toISOString().split('T')[0],
      nextDueDate: nextDueDate.trim(),
      notes: vaccineNotes.trim()
    };
    handleSendMessage('', null, false, null, true, vaccinationData);
    setVaccinationModalVisible(false);
    setVaccineName(''); setVaccineDate(''); setNextDueDate(''); setVaccineNotes('');
  };

  const handleResolve = () => {
    handleSendMessage(inputText);
  };

  const handleAttachmentSelect = () => {
    Alert.alert(
      'Attach Image',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: () => {
            import('react-native-image-picker').then(({ launchCamera }) => {
              launchCamera({ mediaType: 'photo', quality: 0.8 }, (res) => {
                if (res.assets && res.assets.length > 0) setSelectedAttachmentUri(res.assets[0].uri);
              });
            }).catch(() => setImageModalVisible(true));
          }
        },
        {
          text: 'Gallery',
          onPress: () => {
            import('react-native-image-picker').then(({ launchImageLibrary }) => {
              launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
                if (res.assets && res.assets.length > 0) setSelectedAttachmentUri(res.assets[0].uri);
              });
            }).catch(() => setImageModalVisible(true));
          }
        },
        {
          text: 'Document',
          onPress: async () => {
            try {
              const res = await pick({
                type: [types.allFiles],
              });
              if (res && res.length > 0) {
                setSelectedAttachmentUri(res[0].uri);
              }
            } catch (err) {
              if (!isCancel(err)) {
                Alert.alert('Error', 'Failed to pick document');
              }
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleSendMockImage = (imageUrl) => {
    setImageModalVisible(false);
    setSelectedAttachmentUri(imageUrl);
  };

  
  const handleAddMedicineRow = () => {
    setPrescriptionMedicines([...prescriptionMedicines, { name: '', dosage: '', duration: '' }]);
  };

  const handleRemoveMedicineRow = (index) => {
    const updated = prescriptionMedicines.filter((_, i) => i !== index);
    setPrescriptionMedicines(updated);
  };

  const handleMedicineChange = (text, index, field) => {
    const updated = [...prescriptionMedicines];
    updated[index][field] = text;
    setPrescriptionMedicines(updated);
  };

  const handleSendPrescription = () => {
    if (!diagnosis.trim()) {
      alert(t('Please enter a diagnosis'));
      return;
    }
    const validMedicines = prescriptionMedicines.filter(m => m.name.trim());
    if (validMedicines.length === 0) {
      alert(t('Please add at least one medicine'));
      return;
    }

    const prescriptionData = {
      diagnosis: diagnosis.trim(),
      medicines: validMedicines,
      instructions: instructions.trim()
    };

    handleSendMessage('', null, true, prescriptionData);
    
    
    setDiagnosis('');
    setPrescriptionMedicines([{ name: '', dosage: '', duration: '' }]);
    setInstructions('');
    setPrescriptionModalVisible(false);
  };

  const handleResolveConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/chat/conversation/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      });

      if (response.ok) {
        setConversationStatus('resolved');
        
        handleSendMessage(t('📢 This consultation has been marked as RESOLVED.'));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to resolve consultation');
      }
    } catch (error) {
      console.error('Error resolving conversation:', error);
      alert('Network error. Could not resolve consultation.');
    } finally {
      setLoading(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.sender_id === ourUserId;
    const timeText = new Date(item.created_at).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
    const messageText = typeof item.message === 'string' ? item.message.trim() : '';
    const hasImage = typeof item.image_url === 'string' && item.image_url.trim().length > 0;
    const imageFailed = !!failedImageIds[item.id];

    if (item.is_prescription) {
      const data = parseMessageData(item.prescription_data);
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
              {data.medicines.map((med, index) => (
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
                onPress={handleResolveConversation}
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
      const data = parseMessageData(item.vaccination_data);
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
              onError={() => setFailedImageIds(prev => ({ ...prev, [item.id]: true }))}
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
  };

  const renderConsultationSummary = () => {
    if (consultationHistory.length === 0) return null;
    return (
      <View style={styles.consultationSummary}>
        <View style={styles.consultationSummaryHeader}>
          <View>
            <Text style={styles.consultationSummaryTitle}>Consultation history</Text>
            <Text style={styles.consultationSummarySubtitle}>
              {consultationHistory.length} {consultationHistory.length === 1 ? 'consultation' : 'consultations'} in this chat
            </Text>
          </View>
          <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={colors.primary} />
        </View>
        {consultationHistory.slice(0, 5).map((consultation, index) => {
          const resolved = consultation.status === 'completed' || consultation.status === 'resolved';
          const pending = consultation.status === 'pending';
          const statusLabel = pending ? 'Pending' : resolved ? 'Resolved' : 'Active';
          const statusColor = pending ? '#D97706' : resolved ? '#64748B' : colors.primary;
          return (
            <View key={consultation.id || index} style={styles.consultationHistoryRow}>
              <View style={styles.consultationHistoryText}>
                <Text style={styles.consultationHistoryReason} numberOfLines={1}>
                  {consultation.reason || 'General consultation'}
                </Text>
                <Text style={styles.consultationHistoryDate}>
                  {new Date(consultation.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.consultationHistoryStatus, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />

      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{(partnerName || 'F').trim().charAt(0).toUpperCase()}</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{partnerName}</Text>
          <View style={styles.headerStatusRow}>
            <View style={styles.headerStatusDot} />
            <Text style={styles.headerRole}>{partnerRole === 'vet' ? 'Large Animal Specialist' : t('Farmer')}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Feather name="phone" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Feather name="video" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#58D66D" />
          <Text style={styles.loadingText}>Fetching conversation...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={renderConsultationSummary}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <View style={styles.emptyChatIcon}>
                  <MaterialCommunityIcons name="message-text-outline" size={28} color={colors.primary} />
                </View>
                <Text style={styles.emptyChatTitle}>Start the consultation</Text>
                <Text style={styles.emptyChatText}>Send a clear message or attach a photo to help the farmer.</Text>
              </View>
            }
          />

          
          {conversationStatus === 'resolved' ? (
            <View style={[styles.resolvedBanner, { paddingBottom: Math.max(insets.bottom, 14) }]}>
              <MaterialCommunityIcons name="lock" size={18} color="#666" style={{ marginRight: 6 }} />
              <Text style={styles.resolvedBannerText}>{t('This consultation is resolved.')}</Text>
            </View>
          ) : (
            <View style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
              {selectedAttachmentUri && (
                <View style={styles.attachmentPreviewContainer}>
                  <Image source={{ uri: selectedAttachmentUri }} style={styles.attachmentPreviewImage} />
                  <TouchableOpacity 
                    style={styles.attachmentRemoveBtn} 
                    onPress={() => setSelectedAttachmentUri(null)}
                  >
                    <Feather name="x" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              {userRole === 'vet' && conversationStatus === 'active' && (
                <View style={styles.vetActionRow}>
                  <TouchableOpacity 
                    style={styles.vetActionBtnOutline} 
                    onPress={() => setPrescriptionModalVisible(true)}
                  >
                    <MaterialCommunityIcons name="pill" size={18} color="#58D66D" />
                    <Text style={styles.vetActionBtnTextOutline}>Rx</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.vetActionBtnOutline, { borderColor: '#3B82F6', flex: 0.8 }]} 
                    onPress={() => setVaccinationModalVisible(true)}
                  >
                    <MaterialCommunityIcons name="needle" size={18} color="#3B82F6" />
                    <Text style={[styles.vetActionBtnTextOutline, { color: '#3B82F6' }]}>Vaccine</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.vetActionBtnSolid} 
                    onPress={handleResolveConversation}
                  >
                    <Text style={styles.vetActionBtnSolidText}>✓ Mark Resolved</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputContainer}>
                <TouchableOpacity 
                  style={styles.iconButton} 
                  onPress={handleAttachmentSelect}
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
                onChangeText={setInputText}
                multiline
              />

                <TouchableOpacity 
                  style={[styles.sendButton, (!inputText.trim() && !selectedAttachmentUri) && styles.sendButtonDisabled]} 
                  onPress={handleSendText}
                  disabled={!inputText.trim() && !selectedAttachmentUri}
                >
                  <Feather name="send" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attach Symptom Photo</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Select a diagnostic symptom photo to send:</Text>

            <View style={styles.imageSelectorGrid}>
              {MOCK_SYMPTOM_IMAGES.map((img) => (
                <TouchableOpacity 
                  key={img.id} 
                  style={styles.imageOptionCard}
                  onPress={() => handleSendMockImage(img.url)}
                >
                  <Image source={{ uri: img.url }} style={styles.imageOptionThumbnail} />
                  <Text style={styles.imageOptionLabel}>{img.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      
      <Modal
        visible={prescriptionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrescriptionModalVisible(false)}
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
                <TouchableOpacity onPress={() => setPrescriptionModalVisible(false)}>
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
                  <TouchableOpacity style={styles.addButton} onPress={handleAddMedicineRow}>
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
                      onChangeText={(text) => handleMedicineChange(text, index, 'name')}
                    />
                    <TextInput
                      style={[styles.formInput, { flex: 1.2, marginRight: 6, marginBottom: 0 }]}
                      placeholder="Dosage"
                      placeholderTextColor="#999"
                      value={med.dosage}
                      onChangeText={(text) => handleMedicineChange(text, index, 'dosage')}
                    />
                    <TextInput
                      style={[styles.formInput, { flex: 1, marginRight: 6, marginBottom: 0 }]}
                      placeholder="Days"
                      placeholderTextColor="#999"
                      value={med.duration}
                      onChangeText={(text) => handleMedicineChange(text, index, 'duration')}
                    />
                    {prescriptionMedicines.length > 1 && (
                      <TouchableOpacity 
                        style={styles.deleteRowButton} 
                        onPress={() => handleRemoveMedicineRow(index)}
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
                  onPress={handleSendPrescription}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitPrescriptionButtonText}>{t('Send Prescription')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Vaccination Modal */}
      <Modal visible={vaccinationModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Vaccination</Text>
              <TouchableOpacity onPress={() => setVaccinationModalVisible(false)}>
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
              <TouchableOpacity style={[styles.submitPrescriptionButton, { backgroundColor: '#3B82F6' }]} onPress={handleSendVaccination}>
                <Text style={styles.submitPrescriptionButtonText}>Send Schedule</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
