import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
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
  Platform 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import io from 'socket.io-client';

// Public demo images for animal symptom attachments
const MOCK_SYMPTOM_IMAGES = [
  { id: '1', title: 'Cow Close-up', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600' },
  { id: '2', title: 'Goat Symptom', url: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=600' },
  { id: '3', title: 'Cow Skin/Wound', url: 'https://images.unsplash.com/photo-1546445317-29f4545e6d5a?w=600' },
];

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  const { conversationId, partnerName, partnerRole, userName, userRole, vetId } = params;

  // States
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationStatus, setConversationStatus] = useState('active'); // active or resolved
  const [loading, setLoading] = useState(true);
  const [ourUserId, setOurUserId] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);

  // Prescription Form States
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([{ name: '', dosage: '', duration: '' }]);
  const [instructions, setInstructions] = useState('');

  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

  useEffect(() => {
    // 1. Fetch conversation details to know farmer_id/vet_id and status
    const initChat = async () => {
      try {
        // Fetch or create conversation to get the farmer_id and vet_id
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

        // Fetch message logs
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

    // 2. Establish Socket.io connection
    socketRef.current = io(baseUrl);

    socketRef.current.emit('join_room', conversationId.toString());

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => {
        // Avoid duplicates if any
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      // Scroll to end
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

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [loading]);

  const handleSendMessage = (text = '', imageUrl = null, isPrescription = false, prescriptionData = null) => {
    const finalMsg = text.trim();
    if (!finalMsg && !imageUrl && !isPrescription) return;

    if (socketRef.current && ourUserId) {
      socketRef.current.emit('send_message', {
        conversationId,
        senderId: ourUserId,
        message: finalMsg || null,
        imageUrl: imageUrl || null,
        isPrescription,
        prescriptionData
      });
      setInputText('');
    }
  };

  const handleSendText = () => {
    handleSendMessage(inputText);
  };

  const handleSendMockImage = (imageUrl) => {
    setImageModalVisible(false);
    handleSendMessage('', imageUrl);
  };

  // Prescription Form Actions
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
      alert('Please enter a diagnosis / بیماری کی تشخیص لکھیں');
      return;
    }
    const validMedicines = prescriptionMedicines.filter(m => m.name.trim());
    if (validMedicines.length === 0) {
      alert('Please add at least one medicine / کم از کم ایک دوا لکھیں');
      return;
    }

    const prescriptionData = {
      diagnosis: diagnosis.trim(),
      medicines: validMedicines,
      instructions: instructions.trim()
    };

    handleSendMessage('', null, true, prescriptionData);
    
    // Reset and Close
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
        // Broadcast standard message about resolution
        handleSendMessage('📢 This consultation has been marked as RESOLVED. / یہ مشورہ مکمل نشان زد کر دیا گیا ہے۔');
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

    if (item.is_prescription) {
      const data = typeof item.prescription_data === 'string' 
        ? JSON.parse(item.prescription_data) 
        : item.prescription_data;

      return (
        <View style={[styles.prescriptionWrapper, isMe ? styles.alignRight : styles.alignLeft]}>
          <View style={styles.prescriptionCard}>
            <View style={styles.prescriptionHeader}>
              <MaterialCommunityIcons name="file-document-edit" size={24} color="#FFF" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.prescriptionHeaderTitle}>Rx Prescription / طبی نسخہ</Text>
                <Text style={styles.prescriptionHeaderSubtitle}>Maveshi Sehat Vet Advice</Text>
              </View>
            </View>

            <View style={styles.prescriptionBody}>
              <Text style={styles.prescriptionLabel}>Diagnosis / بیماری کی تشخیص:</Text>
              <Text style={styles.prescriptionValue}>{data.diagnosis}</Text>

              <Text style={[styles.prescriptionLabel, { marginTop: 12 }]}>Medicines / ادویات:</Text>
              {data.medicines.map((med, index) => (
                <View key={index} style={styles.medicineItem}>
                  <Text style={styles.medicineName}>• {med.name}</Text>
                  <Text style={styles.medicineDosage}>{med.dosage} ({med.duration})</Text>
                </View>
              ))}

              {data.instructions ? (
                <>
                  <Text style={[styles.prescriptionLabel, { marginTop: 12 }]}>Special Instructions / خصوصی ہدایات:</Text>
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
                <Text style={styles.resolveButtonText}>Mark Resolved / مشورہ مکمل کریں</Text>
              </TouchableOpacity>
            )}

            {conversationStatus === 'resolved' && (
              <View style={styles.resolvedLabel}>
                <Feather name="check" size={14} color="#4CB85C" style={{ marginRight: 4 }} />
                <Text style={styles.resolvedLabelText}>Case Resolved / حل شدہ کیس</Text>
              </View>
            )}
          </View>
          <Text style={styles.messageTime}>{timeText}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.alignRight : styles.alignLeft]}>
        <View style={[
          styles.bubble, 
          isMe ? styles.bubbleMe : styles.bubblePartner
        ]}>
          {item.image_url && (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.bubbleImage} 
              resizeMode="cover"
            />
          )}
          {item.message && (
            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextPartner]}>
              {item.message}
            </Text>
          )}
        </View>
        <Text style={styles.messageTime}>{timeText}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{partnerName}</Text>
          <Text style={styles.headerRole}>
            {partnerRole === 'vet' ? 'Veterinarian / جانوروں کا ڈاکٹر' : 'Farmer / مویشی پال'}
          </Text>
        </View>
        <View style={[
          styles.statusPill, 
          { backgroundColor: conversationStatus === 'active' ? '#E8F8EA' : '#F0F0F0' }
        ]}>
          <Text style={[
            styles.statusPillText, 
            { color: conversationStatus === 'active' ? '#58D66D' : '#888' }
          ]}>
            {conversationStatus === 'active' ? 'Active' : 'Resolved'}
          </Text>
        </View>
      </View>

      {/* Main Chat Area */}
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
          />

          {/* Input Area / Resolved Block */}
          {conversationStatus === 'resolved' ? (
            <View style={[styles.resolvedBanner, { paddingBottom: Math.max(insets.bottom, 14) }]}>
              <MaterialCommunityIcons name="lock" size={18} color="#666" style={{ marginRight: 6 }} />
              <Text style={styles.resolvedBannerText}>
                This consultation is resolved. / یہ گفتگو مکمل ہو چکی ہے۔
              </Text>
            </View>
          ) : (
            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => setImageModalVisible(true)}
              >
                <Feather name="image" size={22} color="#4CB85C" />
              </TouchableOpacity>

              {userRole === 'vet' && (
                <TouchableOpacity 
                  style={styles.iconButton} 
                  onPress={() => setPrescriptionModalVisible(true)}
                >
                  <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#4CB85C" />
                </TouchableOpacity>
              )}

              <TextInput
                style={styles.textInput}
                placeholder="Type message... / یہاں لکھیں..."
                placeholderTextColor="#888"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />

              <TouchableOpacity 
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
                onPress={handleSendText}
                disabled={!inputText.trim()}
              >
                <Feather name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      {/* Image Selection Modal */}
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

      {/* Prescription Builder Modal */}
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
                {/* Diagnosis */}
                <Text style={styles.formLabel}>Diagnosis / بیماری کی تشخیص</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Foot and Mouth Disease (FMD)"
                  placeholderTextColor="#999"
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                />

                {/* Medicines List */}
                <View style={styles.formHeaderRow}>
                  <Text style={styles.formLabel}>Medicines / ادویات</Text>
                  <TouchableOpacity style={styles.addButton} onPress={handleAddMedicineRow}>
                    <Feather name="plus" size={14} color="#58D66D" />
                    <Text style={styles.addButtonText}>Add / شامل کریں</Text>
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

                {/* Instructions */}
                <Text style={[styles.formLabel, { marginTop: 14 }]}>Special Instructions / خصوصی ہدایات</Text>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="e.g. Isolate the sick cow, wash hooves with antiseptic twice daily."
                  placeholderTextColor="#999"
                  value={instructions}
                  onChangeText={setInstructions}
                  multiline
                />

                {/* Send Button */}
                <TouchableOpacity 
                  style={styles.submitPrescriptionButton} 
                  onPress={handleSendPrescription}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitPrescriptionButtonText}>Send Prescription / نسخہ بھیجیں</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    backgroundColor: '#58D66D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRole: {
    color: '#E8F8EA',
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  chatArea: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleWrapper: {
    marginBottom: 14,
    maxWidth: '80%',
  },
  alignRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  alignLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: '#58D66D',
    borderBottomRightRadius: 2,
  },
  bubblePartner: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E8F2EC',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFF',
  },
  messageTextPartner: {
    color: '#333',
  },
  bubbleImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 4,
  },
  prescriptionWrapper: {
    marginBottom: 16,
    width: '90%',
  },
  prescriptionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#58D66D',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  prescriptionHeader: {
    backgroundColor: '#58D66D',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  prescriptionHeaderTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  prescriptionHeaderSubtitle: {
    color: '#E8F8EA',
    fontSize: 10,
  },
  prescriptionBody: {
    padding: 14,
  },
  prescriptionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  prescriptionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    lineHeight: 18,
  },
  medicineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  medicineName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  medicineDosage: {
    fontSize: 12,
    color: '#666',
  },
  resolveButton: {
    backgroundColor: '#58D66D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8F2EC',
  },
  resolveButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  resolvedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAF9',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  resolvedLabelText: {
    color: '#4CB85C',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E8F2EC',
  },
  resolvedBannerText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E8F2EC',
  },
  iconButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E8F2EC',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#58D66D',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  imageSelectorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageOptionCard: {
    width: '30%',
    alignItems: 'center',
  },
  imageOptionThumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
  },
  imageOptionLabel: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
    textAlign: 'center',
  },
  prescriptionModalContainer: {
    height: '80%',
    justifyContent: 'flex-end',
  },
  prescriptionModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flex: 1,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8F2EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    marginBottom: 12,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#58D66D',
    marginLeft: 4,
  },
  medicineFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteRowButton: {
    padding: 6,
  },
  submitPrescriptionButton: {
    backgroundColor: '#58D66D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#58D66D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitPrescriptionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
