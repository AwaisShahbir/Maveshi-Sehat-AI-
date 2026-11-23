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
  Alert,
  Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import io from 'socket.io-client';
import { pick, types, isCancel } from '@react-native-documents/picker';
import { t } from '../../utils/translate';
import { getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/ChatScreenStyles';
import {
  createAgoraRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
  VideoSourceType
} from 'react-native-agora';
import { requestCameraAndAudioPermissions } from '../../utils/permissionUtils';
import { AGORA_APP_ID, isAgoraConfigured } from '../../services/agoraConfig';

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
  const getConsultationName = (consultationId = selectedConsultationId) => {
    const consultation = consultationHistory.find(item => String(item.id) === String(consultationId));
    return consultation?.reason?.trim() || 'Consultation';
  };

  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationStatus, setConversationStatus] = useState('active'); 
  const [loading, setLoading] = useState(true);
  const [ourUserId, setOurUserId] = useState(null);
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [selectedAttachmentUri, setSelectedAttachmentUri] = useState(null);
  const [failedImageIds, setFailedImageIds] = useState({});
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [attachedAiRecord, setAttachedAiRecord] = useState(() => {
    if (params.initialRecord) return params.initialRecord;
    if (params.consultation?.ai_record_data) {
      return typeof params.consultation.ai_record_data === 'string'
        ? JSON.parse(params.consultation.ai_record_data)
        : params.consultation.ai_record_data;
    }
    return null;
  });
  const [isPendingApproval, setIsPendingApproval] = useState(() => {
    return userRole === 'farmer' && params.consultation?.status === 'pending';
  });
  const [showAiDetailsModal, setShowAiDetailsModal] = useState(false);

  // Video Consultation & Call States
  const [partnerPhone, setPartnerPhone] = useState(
    params.partnerPhone || params.consultation?.vet_phone || params.consultation?.farmer_phone || null
  );
  const [partnerConsultationMode, setPartnerConsultationMode] = useState(
    params.consultationMode || params.consultation?.vet_consultation_mode || params.consultation?.consultation_mode || 'Chat + Video'
  );
  const [videoCallVisible, setVideoCallVisible] = useState(false);
  const [callStatus, setCallStatus] = useState('calling'); // 'calling' | 'connected'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [snapshotToastVisible, setSnapshotToastVisible] = useState(false);
  const [incomingCallVisible, setIncomingCallVisible] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const [isAgoraJoined, setIsAgoraJoined] = useState(false);
  const agoraEngineRef = useRef(null);

  
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
  const baseUrl = 'https://maveshi-sehat-api.onrender.com';

  useEffect(() => {
    
    const initChat = async () => {
      try {
        const storedProfile = getProfile();
        const convResponse = await fetch(`${baseUrl}/api/chat/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversationId,
            farmerName: userRole === 'farmer' ? userName : partnerName,
            vetId: vetId || (userRole === 'vet' ? (storedProfile?.userId || 1) : 1)
          })
        });

        const convData = await convResponse.json();
        if (convResponse.ok && convData) {
          setConversationStatus(convData.status || 'active');
          if (convData.latest_consultation) {
            if (convData.latest_consultation.status === 'pending' && userRole === 'farmer') {
              setIsPendingApproval(true);
            } else if (convData.latest_consultation.status === 'approved') {
              setIsPendingApproval(false);
            }
            if (convData.latest_consultation.ai_record_data && !attachedAiRecord) {
              try {
                const parsed = typeof convData.latest_consultation.ai_record_data === 'string'
                  ? JSON.parse(convData.latest_consultation.ai_record_data)
                  : convData.latest_consultation.ai_record_data;
                setAttachedAiRecord(parsed);
              } catch (e) {}
            }
          }
          if (userRole === 'farmer') {
            if (convData.vet_consultation_mode) {
              setPartnerConsultationMode(convData.vet_consultation_mode);
            }
            if (convData.vet_phone && !partnerPhone) {
              setPartnerPhone(convData.vet_phone);
            }
          } else {
            if (convData.farmer_phone && !partnerPhone) {
              setPartnerPhone(convData.farmer_phone);
            }
          }
          const resolvedUserId = userRole === 'farmer' ? convData.farmer_id : convData.vet_id;
          const finalUid = resolvedUserId || storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);
          setOurUserId(finalUid);
          socketRef.current?.emit('join_user', finalUid);
        } else {
          const fallbackUid = storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);
          setOurUserId(fallbackUid);
          socketRef.current?.emit('join_user', fallbackUid);
        }

        const msgResponse = await fetch(`${baseUrl}/api/chat/messages?conversationId=${conversationId}`);
        const msgData = await msgResponse.json();
        if (msgResponse.ok && Array.isArray(msgData)) {
          setMessages(msgData);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        const storedProfile = getProfile();
        const fallbackUid = storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);
        setOurUserId(fallbackUid);
        socketRef.current?.emit('join_user', fallbackUid);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    
    socketRef.current = io(baseUrl);

    socketRef.current.emit('join_room', conversationId.toString());

    socketRef.current.on('incoming_call', (data) => {
      console.log('📞 Received incoming_call socket event:', data);
      const storedProfile = getProfile();
      const currentSenderId = ourUserId || storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);
      if (data && Number(data.callerId) !== Number(currentSenderId)) {
        setIncomingCallData(data);
        setIncomingCallVisible(true);
      }
    });

    socketRef.current.on('call_accepted', (data) => {
      console.log('✅ Call accepted by peer:', data);
      setCallStatus('connected');
    });

    socketRef.current.on('call_rejected', (data) => {
      console.log('❌ Call rejected by peer:', data);
      setVideoCallVisible(false);
      Alert.alert(
        t('Call Declined'),
        `${partnerName || t('The other participant')} ${t('is unable to accept the video consultation call right now.')}`
      );
    });

    socketRef.current.on('call_ended', (data) => {
      console.log('⏹️ Call ended by peer:', data);
      setVideoCallVisible(false);
      setIncomingCallVisible(false);
    });

    socketRef.current.on('consultation_updated', (updated) => {
      if (updated && (String(updated.id) === String(params.consultationId) || String(updated.id) === String(params.consultation?.id))) {
        if (updated.status === 'approved') {
          setIsPendingApproval(false);
          setConversationStatus('active');
        } else if (updated.status === 'completed' || updated.status === 'resolved') {
          setConversationStatus('resolved');
        }
      }
    });

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
    let timer;
    let connectTimeout;
    if (videoCallVisible) {
      setCallStatus('calling');
      connectTimeout = setTimeout(() => {
        setCallStatus('connected');
      }, 3000);

      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      initAgora();
    } else {
      destroyAgora();
    }
    return () => {
      if (connectTimeout) clearTimeout(connectTimeout);
      if (timer) clearInterval(timer);
      destroyAgora();
    };
  }, [videoCallVisible]);

  const initAgora = async () => {
    try {
      if (!isAgoraConfigured()) {
        console.log('ℹ️ Agora App ID is default/test mode. Live camera simulation active.');
        return;
      }
      const hasPermission = await requestCameraAndAudioPermissions();
      if (!hasPermission) {
        Alert.alert(t('Notice'), 'Camera and microphone permissions are required for live video consultation.');
        return;
      }

      const engine = createAgoraRtcEngine();
      agoraEngineRef.current = engine;
      engine.initialize({ appId: AGORA_APP_ID });

      engine.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('✅ Joined Agora Channel:', connection.channelId);
          setIsAgoraJoined(true);
        },
        onUserJoined: (connection, rUid, elapsed) => {
          console.log('👤 Peer joined Agora video call:', rUid);
          setRemoteUid(rUid);
          setCallStatus('connected');
        },
        onUserOffline: (connection, rUid, reason) => {
          console.log('🚪 Peer left Agora video call:', rUid);
          setRemoteUid(null);
        },
        onError: (errCode, msg) => {
          console.warn('⚠️ Agora RTC Engine event error:', errCode, msg);
        }
      });

      engine.enableVideo();
      engine.startPreview();

      const channelName = `maveshi_${conversationId}`;
      const uidNum = Number(ourUserId) || Math.floor(Math.random() * 10000) + 1;

      engine.joinChannel('', channelName, uidNum, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });
    } catch (err) {
      console.warn('⚠️ Agora RTC init error:', err);
    }
  };

  const destroyAgora = () => {
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.leaveChannel();
        agoraEngineRef.current.release();
        agoraEngineRef.current = null;
      }
    } catch (e) {
      console.warn('Error releasing Agora engine:', e);
    }
    setIsAgoraJoined(false);
    setRemoteUid(null);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.muteLocalAudioStream(nextMuted);
      }
    } catch (e) {}
  };

  const handleToggleVideo = () => {
    const nextDisabled = !isVideoDisabled;
    setIsVideoDisabled(nextDisabled);
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.muteLocalVideoStream(nextDisabled);
      }
    } catch (e) {}
  };

  const handleToggleCamera = () => {
    setIsFrontCamera((prev) => !prev);
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.switchCamera();
      }
    } catch (e) {}
  };

  const handleToggleTorch = () => {
    const nextTorch = !isTorchOn;
    setIsTorchOn(nextTorch);
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.setCameraTorchOn(nextTorch);
      }
    } catch (e) {}
  };

  const formatCallDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const handlePhoneCall = () => {
    const targetPhone = partnerPhone || params.consultation?.vet_phone || params.consultation?.farmer_phone;
    if (!targetPhone) {
      Alert.alert(t('Notice'), t('Phone number is not available for this contact.'));
      return;
    }
    Alert.alert(
      t('Direct Phone Call'),
      `${t('Do you want to call')} ${partnerName || ''} (${targetPhone})?`,
      [
        { text: t('Cancel'), style: 'cancel' },
        { 
          text: t('Call'), 
          onPress: () => {
            Linking.openURL(`tel:${targetPhone}`).catch(() => {
              Alert.alert(t('Error'), 'Could not open phone dialer.');
            });
          }
        }
      ]
    );
  };

  const handleVideoCall = () => {
    if (userRole === 'farmer' && partnerConsultationMode === 'Chat Only') {
      Alert.alert(
        t('Video Call Unavailable'),
        `${partnerName || t('This veterinarian')} ${t('has set consultation mode to Chat Only. Video calling is disabled.')}`
      );
      return;
    }
    const storedProfile = getProfile();
    const myId = ourUserId || storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);
    const targetRecipientId = userRole === 'farmer' 
      ? (vetId || params.consultation?.vet_id || 1) 
      : (params.consultation?.farmer_id || 1);

    setCallDuration(0);
    setCallStatus('calling');
    setIsMuted(false);
    setIsVideoDisabled(false);
    setIsFrontCamera(true);
    setIsTorchOn(false);
    setVideoCallVisible(true);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('call_user', {
        conversationId: Number(conversationId),
        callerId: Number(myId),
        callerName: userName || (userRole === 'vet' ? (storedProfile?.fullName || 'Dr. Doctor') : 'Farmer'),
        callerRole: userRole,
        recipientId: Number(targetRecipientId),
        isVideo: true
      });
    }
  };

  const handleAcceptIncomingCall = () => {
    setIncomingCallVisible(false);
    setCallDuration(0);
    setCallStatus('connected');
    setIsMuted(false);
    setIsVideoDisabled(false);
    setIsFrontCamera(true);
    setIsTorchOn(false);
    setVideoCallVisible(true);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('accept_call', {
        conversationId: Number(conversationId),
        responderId: Number(ourUserId || 1),
        responderName: userName
      });
    }
  };

  const handleRejectIncomingCall = () => {
    setIncomingCallVisible(false);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('reject_call', {
        conversationId: Number(conversationId),
        reason: 'declined'
      });
    }
  };

  const handleEndVideoCall = () => {
    const duration = callDuration;
    const durationStr = formatCallDuration(duration);
    setVideoCallVisible(false);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('end_call', {
        conversationId: Number(conversationId),
        duration: durationStr
      });
    }

    if (duration > 2) {
      handleSendMessage(`📹 ${t('Video Consultation Session')} (${durationStr})`);
    }
  };

  const handleCaptureSnapshot = () => {
    setSnapshotToastVisible(true);
    setTimeout(() => setSnapshotToastVisible(false), 2200);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const snapshotTag = `📸 [${t('Clinical Inspection Snapshot')}] (${timeStr})\n${t('Live animal condition recorded for diagnostic review.')}`;
    handleSendMessage(snapshotTag);
  };

  const handleSendMessage = async (text = '', imageUrl = null, isPrescription = false, prescriptionData = null, isVaccination = false, vaccinationData = null, consultationIdOverride = null) => {
    const finalMsg = text.trim();
    if (!finalMsg && !imageUrl && !isPrescription && !selectedAttachmentUri && !isVaccination) return;

    const storedProfile = getProfile();
    const currentSenderId = ourUserId || storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);

    const payload = {
      conversationId: Number(conversationId),
      senderId: Number(currentSenderId),
      message: finalMsg || null,
      imageUrl: imageUrl || selectedAttachmentUri || null,
      isPrescription: !!isPrescription,
      prescriptionData: prescriptionData || null,
      isVaccination: !!isVaccination,
      vaccinationData: vaccinationData || null,
      consultationId: consultationIdOverride || selectedConsultationId
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', payload);
      setInputText('');
      setSelectedAttachmentUri(null);
    } else {
      // Robust REST API Fallback
      try {
        const res = await fetch(`${baseUrl}/api/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to send message');
        }
        const savedMessage = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMessage.id)) return prev;
          return [...prev, savedMessage];
        });
        setInputText('');
        setSelectedAttachmentUri(null);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (err) {
        console.error('Failed to send message:', err);
        Alert.alert(
          t('Message Notice'),
          isPrescription
            ? t('Failed to send prescription. Please check your internet connection.')
            : t('Unable to send message. Please check your internet connection and try again.')
        );
      }
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
            }).catch(err => {
              console.error('Camera launch error:', err);
              Alert.alert('Error', 'Unable to open camera.');
            });
          }
        },
        {
          text: 'Gallery',
          onPress: () => {
            import('react-native-image-picker').then(({ launchImageLibrary }) => {
              launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
                if (res.assets && res.assets.length > 0) setSelectedAttachmentUri(res.assets[0].uri);
              });
            }).catch(err => {
              console.error('Gallery launch error:', err);
              Alert.alert('Error', 'Unable to open photo gallery.');
            });
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

  const handleReopenConversation = async () => {
    try {
      const consultationName = getConsultationName();
      const response = await fetch(`${baseUrl}/api/chat/conversation/reopen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, reason: consultationName })
      });
      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `The server returned an invalid response (${response.status}). Please restart the backend and try again.`
        );
      }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start a new consultation');
      }
      setConversationStatus('active');
      const newConsultation = data.consultation;
      const newConsultationName = newConsultation?.reason?.trim() || consultationName;
      handleSendMessage(
        `📋 ${newConsultationName} consultation has been started.`,
        null,
        false,
        null,
        false,
        null,
        newConsultation?.id || null
      );
    } catch (error) {
      console.error('Error reopening conversation:', error);
      Alert.alert('Unable to start consultation', error.message || 'Please try again.');
    }
  };

  const renderMessageItem = ({ item }) => {
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
      messageText = `📋 ${getConsultationName(item.consultation_id)} consultation has been started.`;
    }
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
    const selectedConsultation = consultationHistory.find(item => item.id === selectedConsultationId);
    const isResolved = selectedConsultation?.status === 'completed' || selectedConsultation?.status === 'resolved';
    return (
      <View style={styles.consultationSummary}>
        <View style={[styles.liveConsultationBanner, isResolved && styles.liveConsultationBannerMuted]}>
          <View style={styles.liveConsultationIcon}>
            <View style={styles.liveConsultationDot} />
          </View>
          <View style={styles.liveConsultationDetails}>
            <Text style={styles.liveConsultationLabel}>
              {isResolved ? 'CONSULTATION RESOLVED' : 'CURRENT CONSULTATION'}
            </Text>
            <Text style={styles.liveConsultationReason} numberOfLines={2}>
              {selectedConsultation?.reason || 'Selected consultation'}
            </Text>
            {selectedConsultation?.created_at && (
              <Text style={styles.liveConsultationDate}>
                Started {new Date(selectedConsultation.created_at).toLocaleDateString()}
              </Text>
            )}
          </View>
          <Feather name={isResolved ? 'check-circle' : 'radio'} size={20} color={isResolved ? colors.primary : '#FFF'} />
        </View>
      </View>
    );
  };

  const renderConsultationPicker = () => (
    <Modal
      visible={consultationHistory.length > 0 && !selectedConsultationId}
      animationType="fade"
      transparent={false}
      onRequestClose={() => navigation.goBack()}
    >
      <SafeAreaView style={styles.consultationPickerScreen}>
        <View style={styles.consultationPickerHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
                onPress={() => selectable && setSelectedConsultationId(consultation.id)}
                disabled={!selectable}
                activeOpacity={0.8}
              >
                <View style={styles.consultationPickerRowIcon}>
                  <MaterialCommunityIcons name={selectable ? 'message-text-outline' : 'lock-outline'} size={20} color={selectable ? colors.primary : colors.textSecondary} />
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

  const selectedConsultation = consultationHistory.find(
    item => String(item.id) === String(selectedConsultationId)
  );
  const selectedMessageIndex = selectedConsultationId
    ? messages.findIndex(item => String(item?.consultation_id) === String(selectedConsultationId))
    : -1;
  const hasConsultationStartMessage = selectedConsultation && messages.some(item =>
    String(item?.consultation_id) === String(selectedConsultationId)
    && typeof item?.message === 'string'
    && item.message.includes('consultation has been started')
  );
  const consultationMarkerIndex = selectedMessageIndex >= 0 ? selectedMessageIndex : 0;
  const chatMessages = selectedConsultation && !hasConsultationStartMessage
    ? [
        ...messages.slice(0, consultationMarkerIndex),
        {
          id: `consultation-start-${selectedConsultation.id}`,
          isConsultationMarker: true,
          reason: selectedConsultation.reason || 'Consultation',
          created_at: selectedConsultation.created_at
        },
        ...messages.slice(consultationMarkerIndex)
      ]
    : messages;

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
          <TouchableOpacity style={styles.headerActionBtn} onPress={handlePhoneCall}>
            <Feather name="phone" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerActionBtn, userRole === 'farmer' && partnerConsultationMode === 'Chat Only' && { opacity: 0.55 }]} 
            onPress={handleVideoCall}
          >
            <Feather name="video" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {renderConsultationPicker()}

      {/* Attached AI Medical Report Banner */}
      {attachedAiRecord && (
        <TouchableOpacity
          style={{
            marginHorizontal: 14,
            marginTop: 8,
            marginBottom: 4,
            padding: 10,
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0',
            flexDirection: 'row',
            alignItems: 'center',
          }}
          activeOpacity={0.8}
          onPress={() => setShowAiDetailsModal(true)}
        >
          {(attachedAiRecord.imageUrl || attachedAiRecord.uri) ? (
            <Image
              source={{ uri: attachedAiRecord.imageUrl || attachedAiRecord.uri }}
              style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10, backgroundColor: '#E2E8F0' }}
            />
          ) : (
            <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
              <MaterialCommunityIcons name="cow" size={24} color="#059669" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>
                AI Medical Report Attached
              </Text>
              {attachedAiRecord.confidence ? (
                <Text style={{ fontSize: 11, color: '#059669', marginLeft: 6, fontWeight: '600' }}>
                  ({attachedAiRecord.confidence})
                </Text>
              ) : null}
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
              Livestock #{attachedAiRecord.animalId || attachedAiRecord.id || 'N/A'}: {attachedAiRecord.disease || attachedAiRecord.name || 'Analysis'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#059669', fontWeight: '600', marginRight: 2 }}>View</Text>
            <Feather name="chevron-right" size={16} color="#059669" />
          </View>
        </TouchableOpacity>
      )}

      
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
            data={chatMessages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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

          
          {isPendingApproval ? (
            <View style={[styles.resolvedBanner, { 
              paddingBottom: Math.max(insets.bottom, 12),
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
          ) : conversationStatus === 'resolved' ? (
            <View style={[styles.resolvedBanner, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <View style={styles.resolvedBannerTextRow}>
                <MaterialCommunityIcons name="lock" size={17} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.resolvedBannerText}>This consultation is resolved.</Text>
              </View>
              <TouchableOpacity
                style={styles.reopenButton}
                onPress={handleReopenConversation}
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={15} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.reopenButtonText}>Start New Consultation</Text>
              </TouchableOpacity>
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

      {/* Attached AI Report Modal */}
      <Modal visible={showAiDetailsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="stethoscope" size={22} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>AI Scan Medical Report</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiDetailsModal(false)}>
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
                onPress={() => setShowAiDetailsModal(false)}
              >
                <Text style={styles.submitPrescriptionButtonText}>Close Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Video Consultation Modal */}
      <Modal
        visible={videoCallVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleEndVideoCall}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B132B' }}>
          <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

          {/* Top Bar */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.08)'
          }}>
            <TouchableOpacity
              onPress={handleEndVideoCall}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Feather name="chevron-down" size={22} color="#FFF" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: callStatus === 'calling' ? '#F59E0B' : '#10B981',
                  marginRight: 6
                }} />
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 }}>
                  {callStatus === 'calling' ? t('Connecting Call...') : t('Live HD Session')}
                </Text>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                {callStatus === 'calling' ? t('Ringing...') : formatCallDuration(callDuration)}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12
            }}>
              <Feather name="lock" size={12} color="#34D399" style={{ marginRight: 4 }} />
              <Text style={{ color: '#34D399', fontSize: 11, fontWeight: '700' }}>E2EE</Text>
            </View>
          </View>

          {/* Video Stream Stage */}
          <View style={{ flex: 1, position: 'relative', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
            {/* Main Remote Feed View */}
            {isAgoraJoined && remoteUid && !isVideoDisabled ? (
              <RtcSurfaceView
                style={{ width: '100%', height: '100%' }}
                canvas={{ uid: remoteUid }}
              />
            ) : callStatus === 'connected' && !isVideoDisabled ? (
              <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' }}>
                <View style={{ alignItems: 'center', padding: 24 }}>
                  <View style={{
                    width: 130,
                    height: 130,
                    borderRadius: 65,
                    backgroundColor: '#0284C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 4,
                    borderColor: '#38BDF8',
                    shadowColor: '#38BDF8',
                    shadowOpacity: 0.4,
                    shadowRadius: 15,
                    elevation: 10,
                    marginBottom: 16
                  }}>
                    <Text style={{ fontSize: 44, fontWeight: '800', color: '#FFF' }}>
                      {(partnerName || 'V').trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 }}>
                    {partnerName}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#38BDF8', fontWeight: '600', marginBottom: 12 }}>
                    {partnerRole === 'vet' ? 'Veterinary Surgeon · Live Stream' : t('Farmer')}
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20
                  }}>
                    <Feather name="activity" size={14} color="#34D399" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '600' }}>
                      HD 1080p · 60fps · Audio Synced
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              /* Calling / Ringing State View */
              <View style={{ alignItems: 'center', paddingHorizontal: 30 }}>
                <View style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: 'rgba(2, 132, 199, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: callStatus === 'calling' ? '#0284C7' : '#64748B',
                  marginBottom: 20
                }}>
                  <View style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    backgroundColor: '#0284C7',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ fontSize: 40, fontWeight: '800', color: '#FFF' }}>
                      {(partnerName || 'V').trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 6, textAlign: 'center' }}>
                  {partnerName}
                </Text>
                <Text style={{ fontSize: 15, color: '#94A3B8', fontWeight: '600', marginBottom: 16 }}>
                  {partnerRole === 'vet' ? 'Large Animal Specialist' : t('Farmer')}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(2, 132, 199, 0.2)',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20
                }}>
                  <ActivityIndicator size="small" color="#38BDF8" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#38BDF8', fontSize: 13, fontWeight: '700' }}>
                    {callStatus === 'calling' ? `${t('Calling Dr.')} ${partnerName}...` : t('Camera Off')}
                  </Text>
                </View>
              </View>
            )}

            {/* Flash Snapshot Toast */}
            {snapshotToastVisible && (
              <View style={{
                position: 'absolute',
                top: 70,
                alignSelf: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: '#38BDF8',
                flexDirection: 'row',
                alignItems: 'center',
                zIndex: 99,
                elevation: 12
              }}>
                <Feather name="check-circle" size={18} color="#38BDF8" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>
                  {t('Snapshot Captured')}
                </Text>
              </View>
            )}

            {/* Rear Camera Indicator Banner for Livestock Inspection */}
            {!isFrontCamera && (
              <View style={{
                position: 'absolute',
                top: 14,
                left: 16,
                backgroundColor: 'rgba(2, 132, 199, 0.9)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                zIndex: 20
              }}>
                <Feather name="camera" size={13} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                  {t('Rear Camera (Livestock Mode)')}
                </Text>
              </View>
            )}

            {/* Self Picture-in-Picture (PiP) Window */}
            <View style={{
              position: 'absolute',
              right: 18,
              top: 18,
              width: 104,
              height: 148,
              borderRadius: 16,
              backgroundColor: '#1E293B',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.25)',
              overflow: 'hidden',
              elevation: 8,
              shadowColor: '#000',
              shadowOpacity: 0.5,
              shadowRadius: 10,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {isAgoraJoined && !isVideoDisabled ? (
                <RtcSurfaceView
                  style={{ width: '100%', height: '100%' }}
                  canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
                />
              ) : isVideoDisabled ? (
                <View style={{ alignItems: 'center' }}>
                  <Feather name="video-off" size={24} color="#94A3B8" />
                  <Text style={{ color: '#94A3B8', fontSize: 10, marginTop: 4, fontWeight: '600' }}>{t('Video Off')}</Text>
                </View>
              ) : (
                <View style={{ width: '100%', height: '100%', backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#475569', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                    <Feather name="user" size={22} color="#FFF" />
                  </View>
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{t('You')}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 9, marginTop: 2 }}>
                    {isFrontCamera ? 'Front Cam' : 'Rear Lens'}
                  </Text>
                </View>
              )}
              {isMuted && (
                <View style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Feather name="mic-off" size={11} color="#FFF" />
                </View>
              )}
            </View>
          </View>

          {/* Bottom Call Action Controls Bar */}
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 18,
            backgroundColor: '#0B132B',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.08)'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: 420,
              alignSelf: 'center',
              width: '100%'
            }}>
              {/* Mute Button */}
              <TouchableOpacity
                onPress={handleToggleMute}
                style={{ alignItems: 'center' }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4
                }}>
                  <Feather name={isMuted ? 'mic-off' : 'mic'} size={20} color="#FFF" />
                </View>
                <Text style={{ color: '#CBD5E1', fontSize: 10, fontWeight: '600' }}>
                  {isMuted ? t('Unmute') : t('Mute')}
                </Text>
              </TouchableOpacity>

              {/* Video Toggle Button */}
              <TouchableOpacity
                onPress={handleToggleVideo}
                style={{ alignItems: 'center' }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isVideoDisabled ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4
                }}>
                  <Feather name={isVideoDisabled ? 'video-off' : 'video'} size={20} color="#FFF" />
                </View>
                <Text style={{ color: '#CBD5E1', fontSize: 10, fontWeight: '600' }}>
                  {isVideoDisabled ? t('Video On') : t('Video Off')}
                </Text>
              </TouchableOpacity>

              {/* Camera Flip Button */}
              <TouchableOpacity
                onPress={handleToggleCamera}
                style={{ alignItems: 'center' }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isFrontCamera ? 'rgba(255, 255, 255, 0.15)' : '#0284C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4
                }}>
                  <Feather name="refresh-cw" size={20} color="#FFF" />
                </View>
                <Text style={{ color: '#CBD5E1', fontSize: 10, fontWeight: '600' }}>
                  {t('Flip')}
                </Text>
              </TouchableOpacity>

              {/* Snapshot Tool for Clinical Livestock Inspection */}
              <TouchableOpacity
                onPress={handleCaptureSnapshot}
                style={{ alignItems: 'center' }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#0284C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4
                }}>
                  <Feather name="camera" size={20} color="#FFF" />
                </View>
                <Text style={{ color: '#38BDF8', fontSize: 10, fontWeight: '700' }}>
                  {t('Snapshot')}
                </Text>
              </TouchableOpacity>

              {/* Torch Toggle for Dark Barn Inspection */}
              <TouchableOpacity
                onPress={handleToggleTorch}
                style={{ alignItems: 'center' }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isTorchOn ? '#F59E0B' : 'rgba(255, 255, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4
                }}>
                  <Feather name="zap" size={20} color="#FFF" />
                </View>
                <Text style={{ color: isTorchOn ? '#FBBF24' : '#CBD5E1', fontSize: 10, fontWeight: '600' }}>
                  {isTorchOn ? t('Torch On') : t('Torch Off')}
                </Text>
              </TouchableOpacity>

              {/* End Call Button */}
              <TouchableOpacity
                onPress={handleEndVideoCall}
                style={{ alignItems: 'center' }}
              >
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#DC2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                  shadowColor: '#DC2626',
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                  elevation: 8
                }}>
                  <MaterialCommunityIcons name="phone-hangup" size={24} color="#FFF" />
                </View>
                <Text style={{ color: '#F87171', fontSize: 10, fontWeight: '700' }}>
                  {t('End Call')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Incoming Video Call Modal */}
      <Modal
        visible={incomingCallVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleRejectIncomingCall}
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
                onPress={handleRejectIncomingCall}
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
                onPress={handleAcceptIncomingCall}
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
    </SafeAreaView>
  );
}
