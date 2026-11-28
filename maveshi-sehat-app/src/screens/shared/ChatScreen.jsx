import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Image, 
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

// Custom Hooks & Sub-Components
import useAgoraCall from '../../hooks/useAgoraCall';
import ClinicalCaseBar from '../../components/chat/ClinicalCaseBar';
import ConsultationPickerModal from '../../components/chat/ConsultationPickerModal';
import ChatMessageItem from '../../components/chat/ChatMessageItem';
import ChatInputBar from '../../components/chat/ChatInputBar';
import PrescriptionModal from '../../components/chat/PrescriptionModal';
import VaccinationModal from '../../components/chat/VaccinationModal';
import AiScanDetailsModal from '../../components/chat/AiScanDetailsModal';
import VideoCallModal from '../../components/chat/VideoCallModal';
import IncomingCallModal from '../../components/chat/IncomingCallModal';
import ClinicalResolutionModal from '../../components/chat/ClinicalResolutionModal';
import RatingReviewModal from '../../components/chat/RatingReviewModal';

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
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  const { conversationId, partnerName, partnerRole, userName, userRole, vetId } = params;
  const isUrdu = getProfile()?.language === 'Urdu';
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const consultationHistory = Array.isArray(params.consultations) ? params.consultations : [];

  const [selectedConsultationId, setSelectedConsultationId] = useState(() => {
    return params.consultationId || params.consultation?.id || (Array.isArray(params.consultations) && params.consultations[0]?.id) || null;
  });

  const getConsultationName = (consultId = selectedConsultationId) => {
    const consultation = consultationHistory.find(item => String(item.id) === String(consultId));
    return consultation?.reason?.trim() || 'Consultation';
  };

  // Chat Data States
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationStatus, setConversationStatus] = useState(() => {
    if (params.consultation?.status === 'resolved' || params.consultation?.status === 'completed') {
      return 'resolved';
    }
    return 'active';
  }); 
  const [loading, setLoading] = useState(true);
  const [ourUserId, setOurUserId] = useState(null);
  const [partnerUserId, setPartnerUserId] = useState(null);
  const [selectedAttachmentUri, setSelectedAttachmentUri] = useState(null);
  const [failedImageIds, setFailedImageIds] = useState({});

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

  // Phone Contact & Video Mode States
  const [partnerPhone, setPartnerPhone] = useState(
    params.partnerPhone || params.consultation?.vet_phone || params.consultation?.farmer_phone || null
  );
  const [partnerConsultationMode, setPartnerConsultationMode] = useState(
    params.consultationMode || params.consultation?.vet_consultation_mode || params.consultation?.consultation_mode || 'Chat + Video'
  );

  // Video Call State Machine
  const [videoCallVisible, setVideoCallVisible] = useState(false);
  const [callStatus, setCallStatus] = useState('calling'); // 'calling' | 'connected'
  const videoCallVisibleRef = useRef(false);
  const callStatusRef = useRef('calling');

  useEffect(() => {
    videoCallVisibleRef.current = videoCallVisible;
  }, [videoCallVisible]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  const [incomingCallVisible, setIncomingCallVisible] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);

  // Prescription States
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([{ name: '', dosage: '', duration: '' }]);
  const [instructions, setInstructions] = useState('');

  // Vaccination States
  const [vaccinationModalVisible, setVaccinationModalVisible] = useState(false);
  const [vaccineName, setVaccineName] = useState('');
  const [vaccineDate, setVaccineDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [vaccineNotes, setVaccineNotes] = useState('');

  // Clinical Resolution States
  const [resolutionModalVisible, setResolutionModalVisible] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('fully_recovered');
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [followUpDays, setFollowUpDays] = useState('3');
  
  // Post-Consultation Rating States
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [starRating, setStarRating] = useState(5);
  const [farmerReview, setFarmerReview] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const baseUrl = 'https://maveshi-sehat-api.onrender.com';

  const handleSendMessage = useCallback((textToSend = null, imageUrl = null, isPrescription = false, prescriptionData = null, isVaccination = false, vaccinationData = null, isSystemDischarge = false) => {
    if (conversationStatus === 'resolved' && !isSystemDischarge) {
      Alert.alert(t('Consultation Closed'), t('This consultation has been marked as resolved and closed. Chat is read-only.'));
      return;
    }
    const finalMsg = textToSend !== null ? textToSend : inputText.trim();
    if (!finalMsg && !imageUrl && !isPrescription && !selectedAttachmentUri && !isVaccination) return;

    const storedProfile = getProfile();
    const currentSenderId = ourUserId || storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);

    const payload = {
      conversationId: Number(conversationId),
      senderId: currentSenderId,
      message: finalMsg,
      imageUrl: imageUrl || selectedAttachmentUri || null,
      isPrescription: !!isPrescription,
      prescriptionData: prescriptionData || null,
      isVaccination: !!isVaccination,
      vaccinationData: vaccinationData || null,
      consultationId: selectedConsultationId || params.consultationId || null
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', payload);
    }

    if (textToSend === null) {
      setInputText('');
      setSelectedAttachmentUri(null);
    }
  }, [conversationId, conversationStatus, inputText, ourUserId, params.consultationId, selectedAttachmentUri, selectedConsultationId, userRole, vetId]);

  // Agora Live HD RTC Engine Hook
  const {
    callDuration,
    formatCallDuration,
    isMuted,
    isVideoDisabled,
    isFrontCamera,
    isTorchOn,
    snapshotToastVisible,
    remoteUid,
    isAgoraReady,
    isCameraInMainStage,
    setIsCameraInMainStage,
    handleToggleMute,
    handleToggleVideo,
    handleToggleCamera,
    handleToggleTorch,
    handleCaptureSnapshot,
    handleEndVideoCall,
    resetCallSession
  } = useAgoraCall({
    conversationId,
    videoCallVisible,
    setVideoCallVisible,
    callStatus,
    setCallStatus,
    socketRef,
    partnerName,
    onCallEndedNotice: (formattedDuration) => {
      handleSendMessage(
        `📹 ${t('Live Video Consultation completed.')} (${formattedDuration})`
      );
    }
  });

  useEffect(() => {
    const initChat = async () => {
      try {
        const storedProfile = getProfile();
        const activeConsultId = params.consultationId || params.consultation?.id || selectedConsultationId;
        const convResponse = await fetch(`${baseUrl}/api/chat/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversationId,
            consultationId: activeConsultId,
            farmerName: userRole === 'farmer' ? userName : partnerName,
            vetId: vetId || (userRole === 'vet' ? (storedProfile?.userId || 1) : 1)
          })
        });

        const convData = await convResponse.json();
        if (convResponse.ok && convData) {
          const isItemResolved = convData.status === 'resolved' || 
            convData.status === 'completed' || 
            convData.latest_consultation?.status === 'resolved' || 
            convData.latest_consultation?.status === 'completed' || 
            params.consultation?.status === 'resolved' || 
            params.consultation?.status === 'completed';

          setConversationStatus(isItemResolved ? 'resolved' : (convData.status || 'active'));
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
          const resolvedPartnerId = userRole === 'farmer' ? convData.vet_id : convData.farmer_id;
          const finalUid = resolvedUserId || storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);
          setOurUserId(finalUid);
          setPartnerUserId(resolvedPartnerId || (userRole === 'farmer' ? (vetId || params.consultation?.vet_id) : (params.consultation?.farmer_id)));
          socketRef.current?.emit('join_user', finalUid);
        } else {
          const fallbackUid = storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);
          setOurUserId(fallbackUid);
          setPartnerUserId(userRole === 'farmer' ? (vetId || params.consultation?.vet_id) : (params.consultation?.farmer_id));
          socketRef.current?.emit('join_user', fallbackUid);
        }

        const msgUrl = activeConsultId 
          ? `${baseUrl}/api/chat/messages?consultationId=${activeConsultId}`
          : `${baseUrl}/api/chat/messages?conversationId=${conversationId}`;
        const msgResponse = await fetch(msgUrl);
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
      if (videoCallVisibleRef.current || callStatusRef.current === 'connected') {
        console.log('Suppressed incoming call popup because call session is already active');
        return;
      }
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
    if (params?.autoAcceptCall) {
      resetCallSession();
      setCallStatus('connected');
      setVideoCallVisible(true);
      setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('accept_call', {
            conversationId: Number(conversationId),
            responderId: Number(ourUserId || 1),
            responderName: userName
          });
        }
      }, 500);
    }
  }, [params?.autoAcceptCall, conversationId, ourUserId, resetCallSession, userName]);

  useEffect(() => {
    if (selectedConsultationId && consultationHistory.length > 0) {
      const matched = consultationHistory.find(c => String(c.id) === String(selectedConsultationId));
      if (matched) {
        if (matched.status === 'resolved' || matched.status === 'completed') {
          setConversationStatus('resolved');
        } else if (matched.status === 'approved') {
          setConversationStatus('active');
          setIsPendingApproval(false);
        } else if (matched.status === 'pending' && userRole === 'farmer') {
          setIsPendingApproval(true);
        }
      }
    }
  }, [selectedConsultationId, consultationHistory, userRole]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [loading, messages.length]);

  const handlePhoneCall = () => {
    if (conversationStatus === 'resolved') {
      Alert.alert(t('Consultation Closed'), t('This consultation has been marked as resolved and closed.'));
      return;
    }

    const targetPhone = partnerPhone;
    if (!targetPhone) {
      Alert.alert(t('Phone Unavailable'), t('No contact number is available for this user.'));
      return;
    }
    Alert.alert(
      t('Voice Call'),
      `${t('Call')} ${partnerName} (${targetPhone})?`,
      [
        { text: t('Cancel'), style: 'cancel' },
        { 
          text: t('Dial Now'), 
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
    if (conversationStatus === 'resolved') {
      Alert.alert(t('Consultation Closed'), t('This consultation has been marked as resolved and closed.'));
      return;
    }

    if (userRole === 'farmer' && partnerConsultationMode === 'Chat Only') {
      Alert.alert(
        t('Video Call Unavailable'),
        `${partnerName || t('This veterinarian')} ${t('has set consultation mode to Chat Only. Video calling is disabled.')}`
      );
      return;
    }
    const storedProfile = getProfile();
    const myId = ourUserId || storedProfile?.userId || (userRole === 'vet' ? (vetId || 1) : 1);
    const targetRecipientId = partnerUserId || (userRole === 'farmer' 
      ? (vetId || params.consultation?.vet_id || 1) 
      : (params.consultation?.farmer_id || 1));

    resetCallSession();
    setCallStatus('calling');
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
    resetCallSession();
    setCallStatus('connected');
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

  const handleSendText = () => {
    if (conversationStatus === 'resolved') {
      Alert.alert(t('Consultation Closed'), t('This consultation has been marked as resolved and closed. Chat is read-only.'));
      return;
    }
    if (isPendingApproval) {
      Alert.alert(
        t('Pending Doctor Approval'),
        t('Awaiting doctor approval. Chat will unlock once approved.')
      );
      return;
    }
    handleSendMessage();
  };

  const handleAttachmentSelect = async () => {
    if (conversationStatus === 'resolved') {
      Alert.alert(t('Consultation Closed'), t('This consultation has been marked as resolved and closed. Chat is read-only.'));
      return;
    }
    try {
      const results = await pick({
        type: [types.images],
        allowMultiSelection: false,
      });

      if (results && results.length > 0) {
        setSelectedAttachmentUri(results[0].uri);
      }
    } catch (err) {
      if (!isCancel(err)) {
        Alert.alert(t('Error'), 'Could not select the attachment.');
      }
    }
  };

  // Prescription Handlers
  const handleMedicineChange = (text, index, field) => {
    const updated = [...prescriptionMedicines];
    updated[index][field] = text;
    setPrescriptionMedicines(updated);
  };

  const handleAddMedicineRow = () => {
    setPrescriptionMedicines([...prescriptionMedicines, { name: '', dosage: '', duration: '' }]);
  };

  const handleRemoveMedicineRow = (index) => {
    if (prescriptionMedicines.length > 1) {
      const updated = prescriptionMedicines.filter((_, i) => i !== index);
      setPrescriptionMedicines(updated);
    }
  };

  const handleSendPrescription = () => {
    if (!diagnosis.trim() || diagnosis.trim().length < 3) {
      Alert.alert(t('Missing Field'), t('Please enter a clinical diagnosis (at least 3 characters).'));
      return;
    }

    const validMedicines = prescriptionMedicines.filter(m => m.name && m.name.trim() !== '');
    if (validMedicines.length === 0) {
      Alert.alert(t('Missing Field'), t('Please enter at least one medicine with its name.'));
      return;
    }

    const prescriptionPayload = {
      diagnosis: diagnosis.trim(),
      medicines: validMedicines,
      instructions: instructions.trim()
    };

    handleSendMessage('💊 Prescription Issued', null, true, prescriptionPayload);

    setDiagnosis('');
    setPrescriptionMedicines([{ name: '', dosage: '', duration: '' }]);
    setInstructions('');
    setPrescriptionModalVisible(false);
  };

  const handleSendVaccination = () => {
    if (!vaccineName.trim() || vaccineName.trim().length < 2) {
      Alert.alert(t('Missing Information'), t('Please provide a valid Vaccine Name.'));
      return;
    }

    const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
    if (!vaccineDate.trim() || !dateRegex.test(vaccineDate.trim()) || isNaN(new Date(vaccineDate.trim()).getTime())) {
      Alert.alert(t('Invalid Date'), t('Please enter a valid vaccination date (e.g. YYYY-MM-DD).'));
      return;
    }

    if (nextDueDate.trim()) {
      if (!dateRegex.test(nextDueDate.trim()) || isNaN(new Date(nextDueDate.trim()).getTime())) {
        Alert.alert(t('Invalid Date'), t('Next due date must be a valid date in YYYY-MM-DD format.'));
        return;
      }
      if (new Date(nextDueDate.trim()).getTime() < new Date(vaccineDate.trim()).getTime()) {
        Alert.alert(t('Invalid Date'), t('Next due date cannot be earlier than vaccination date.'));
        return;
      }
    }

    const vaccinationPayload = {
      vaccineName: vaccineName.trim(),
      vaccineDate: vaccineDate.trim(),
      nextDueDate: nextDueDate.trim(),
      notes: vaccineNotes.trim()
    };

    handleSendMessage('💉 Vaccination Scheduled', null, false, null, true, vaccinationPayload);

    setVaccineName('');
    setVaccineDate('');
    setNextDueDate('');
    setVaccineNotes('');
    setVaccinationModalVisible(false);
  };

  // Case Resolution & Rating Handlers (Veterinarian ONLY)
  const handleOpenResolutionModal = () => {
    if (userRole !== 'vet') {
      return; // Farmers cannot discharge/resolve cases; only the attending vet can.
    }
    setResolutionModalVisible(true);
  };

  const handleConfirmResolution = async () => {
    if (!selectedOutcome) {
      Alert.alert(t('Required'), t('Please select a clinical outcome.'));
      return;
    }
    if (!dischargeNotes.trim() || dischargeNotes.trim().length < 5) {
      Alert.alert(t('Required'), t('Please enter discharge instructions & recovery advice (minimum 5 characters).'));
      return;
    }

    try {
      setLoading(true);
      const activeConsultId = selectedConsultationId || params.consultationId || params.consultation?.id;
      const res = await fetch(`${baseUrl}/api/chat/conversation/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId,
          consultationId: activeConsultId,
          outcome: selectedOutcome,
          dischargeNotes: dischargeNotes.trim(),
          followUpDays: followUpDays === 'none' ? null : Number(followUpDays)
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.allResolved !== false) {
          setConversationStatus('resolved');
        }

        setResolutionModalVisible(false);

        const outcomeLabel = selectedOutcome === 'fully_recovered'
          ? t('Fully Recovered / Treated')
          : selectedOutcome === 'improving'
          ? t('Improving (Home Care Continued)')
          : t('Referred to Field Veterinary Hospital');

        const followUpLabel = followUpDays === 'none'
          ? t('No follow-up needed')
          : `${t('Follow-up in')} ${followUpDays} ${t('Days')}`;

        const summaryMessage = `📋 **${t('CLINICAL CASE DISCHARGE SUMMARY')}**\n` +
          `• **${t('Case ID')}**: #${activeConsultId || 'General'}\n` +
          `• **${t('Clinical Outcome')}**: ${outcomeLabel}\n` +
          (dischargeNotes.trim() ? `• **${t('Discharge Notes')}**: ${dischargeNotes.trim()}\n` : '') +
          `• **${t('Follow-up Check')}**: ${followUpLabel}`;

        handleSendMessage(summaryMessage, null, false, null, false, null, true);

        if (userRole === 'farmer') {
          setTimeout(() => {
            setRatingModalVisible(true);
          }, 800);
        } else {
          Alert.alert(
            t('Case Resolved'),
            t('The clinical consultation case has been successfully discharged.')
          );
        }
      } else {
        Alert.alert(t('Error'), data.error || 'Failed to mark case as resolved.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('Error'), 'Could not connect to resolve consultation.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    try {
      setRatingSubmitting(true);
      const activeConsultId = selectedConsultationId || params.consultationId || params.consultation?.id;
      if (!activeConsultId) {
        setRatingModalVisible(false);
        return;
      }

      const res = await fetch(`${baseUrl}/api/consultations/${activeConsultId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: starRating,
          review: farmerReview.trim()
        })
      });

      if (res.ok) {
        setRatingModalVisible(false);
        Alert.alert(
          t('Thank You!'),
          `${t('Your feedback and rating have been recorded for Dr.')} ${partnerName}.`
        );
      } else {
        setRatingModalVisible(false);
      }
    } catch (e) {
      setRatingModalVisible(false);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleReopenConversation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/chat/conversation/reopen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      });

      if (res.ok) {
        setConversationStatus('active');
        handleSendMessage(t('📢 Conversation reopened for follow-up questions.'));
      } else {
        Alert.alert(t('Error'), 'Failed to reopen conversation.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('Error'), 'Could not connect to reopen conversation.');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Top Header */}
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
        {conversationStatus !== 'resolved' && (
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
        )}
      </View>

      {/* Case Picker Modal */}
      <ConsultationPickerModal
        visible={(consultationHistory.length > 0 && !selectedConsultationId) || pickerModalOpen}
        consultationHistory={consultationHistory}
        selectedConsultationId={selectedConsultationId}
        userRole={userRole}
        partnerName={partnerName}
        colors={colors}
        styles={styles}
        onSelectConsultation={(id) => {
          setSelectedConsultationId(id);
          setPickerModalOpen(false);
        }}
        onClose={() => {
          if (selectedConsultationId) setPickerModalOpen(false);
          else navigation.goBack();
        }}
      />

      {/* Clinical Case Context Bar */}
      <ClinicalCaseBar
        selectedConsultationId={selectedConsultationId || params.consultationId || (Array.isArray(params.consultations) && params.consultations[0]?.id)}
        consultationHistory={consultationHistory}
        conversationStatus={conversationStatus}
        getConsultationName={getConsultationName}
        isUrdu={isUrdu}
        isDark={isDark}
        colors={colors}
        userRole={userRole}
        onOpenPicker={() => setPickerModalOpen(true)}
        onOpenResolution={handleOpenResolutionModal}
      />

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

      {/* Main Messages Area */}
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
            renderItem={({ item }) => (
              <ChatMessageItem
                item={item}
                ourUserId={ourUserId}
                conversationStatus={conversationStatus}
                userRole={userRole}
                failedImageIds={failedImageIds}
                onImageError={(id) => setFailedImageIds(prev => ({ ...prev, [id]: true }))}
                onOpenResolution={handleOpenResolutionModal}
                getConsultationName={getConsultationName}
                parseMessageData={parseMessageData}
                colors={colors}
                styles={styles}
              />
            )}
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

          {/* Bottom Chat Input & Action Bar */}
          <ChatInputBar
            isPendingApproval={isPendingApproval}
            conversationStatus={conversationStatus}
            partnerName={partnerName}
            userRole={userRole}
            selectedAttachmentUri={selectedAttachmentUri}
            onRemoveAttachment={() => setSelectedAttachmentUri(null)}
            onOpenPrescription={() => setPrescriptionModalVisible(true)}
            onOpenVaccination={() => setVaccinationModalVisible(true)}
            onOpenResolution={handleOpenResolutionModal}
            onAttachmentSelect={handleAttachmentSelect}
            inputText={inputText}
            onChangeInputText={setInputText}
            onSendText={handleSendText}
            onReopenConversation={handleReopenConversation}
            insets={insets}
            isDark={isDark}
            colors={colors}
            styles={styles}
          />
        </KeyboardAvoidingView>
      )}

      {/* Prescription Modal */}
      <PrescriptionModal
        visible={prescriptionModalVisible}
        diagnosis={diagnosis}
        setDiagnosis={setDiagnosis}
        prescriptionMedicines={prescriptionMedicines}
        onAddMedicineRow={handleAddMedicineRow}
        onRemoveMedicineRow={handleRemoveMedicineRow}
        onChangeMedicine={handleMedicineChange}
        instructions={instructions}
        setInstructions={setInstructions}
        onSendPrescription={handleSendPrescription}
        onClose={() => setPrescriptionModalVisible(false)}
        styles={styles}
      />

      {/* Vaccination Modal */}
      <VaccinationModal
        visible={vaccinationModalVisible}
        vaccineName={vaccineName}
        setVaccineName={setVaccineName}
        vaccineDate={vaccineDate}
        setVaccineDate={setVaccineDate}
        nextDueDate={nextDueDate}
        setNextDueDate={setNextDueDate}
        vaccineNotes={vaccineNotes}
        setVaccineNotes={setVaccineNotes}
        onSendVaccination={handleSendVaccination}
        onClose={() => setVaccinationModalVisible(false)}
        styles={styles}
      />

      {/* Attached AI Report Modal */}
      <AiScanDetailsModal
        visible={showAiDetailsModal}
        attachedAiRecord={attachedAiRecord}
        onClose={() => setShowAiDetailsModal(false)}
        styles={styles}
      />

      {/* Live Video Consultation Modal (Agora RTC) */}
      <VideoCallModal
        visible={videoCallVisible}
        callStatus={callStatus}
        callDuration={callDuration}
        formatCallDuration={formatCallDuration}
        isCameraInMainStage={isCameraInMainStage}
        onToggleStageSwap={() => setIsCameraInMainStage(!isCameraInMainStage)}
        isAgoraReady={isAgoraReady}
        remoteUid={remoteUid}
        isVideoDisabled={isVideoDisabled}
        isMuted={isMuted}
        isFrontCamera={isFrontCamera}
        isTorchOn={isTorchOn}
        partnerName={partnerName}
        partnerRole={partnerRole}
        snapshotToastVisible={snapshotToastVisible}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleCamera={handleToggleCamera}
        onCaptureSnapshot={handleCaptureSnapshot}
        onToggleTorch={handleToggleTorch}
        onEndCall={handleEndVideoCall}
      />

      {/* Incoming Video Call Modal */}
      <IncomingCallModal
        visible={incomingCallVisible}
        incomingCallData={incomingCallData}
        partnerName={partnerName}
        onAccept={handleAcceptIncomingCall}
        onReject={handleRejectIncomingCall}
      />

      {/* Clinical Case Resolution & Discharge Modal */}
      <ClinicalResolutionModal
        visible={resolutionModalVisible}
        selectedConsultationId={selectedConsultationId || params.consultationId}
        consultationName={getConsultationName()}
        selectedOutcome={selectedOutcome}
        setSelectedOutcome={setSelectedOutcome}
        dischargeNotes={dischargeNotes}
        setDischargeNotes={setDischargeNotes}
        followUpDays={followUpDays}
        setFollowUpDays={setFollowUpDays}
        onConfirmResolution={handleConfirmResolution}
        onClose={() => setResolutionModalVisible(false)}
        isUrdu={isUrdu}
        isDark={isDark}
        colors={colors}
      />

      {/* Farmer Star Rating & Review Modal */}
      <RatingReviewModal
        visible={ratingModalVisible}
        partnerName={partnerName}
        starRating={starRating}
        setStarRating={setStarRating}
        farmerReview={farmerReview}
        setFarmerReview={setFarmerReview}
        ratingSubmitting={ratingSubmitting}
        onSubmitRating={handleRatingSubmit}
        onClose={() => setRatingModalVisible(false)}
        isUrdu={isUrdu}
        isDark={isDark}
        colors={colors}
      />
    </SafeAreaView>
  );
}
