import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Animated,
  NativeModules,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';
import { t, useTranslation } from '../../utils/translate';
import fonts from '../../styles/fonts';
import styles from '../../styles/ChatbotScreenStyles';

const { AudioModule } = NativeModules;
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const SUGGESTIONS = {
  en: [
    { id: '1', title: '🐮 Cow has high fever & low milk' },
    { id: '2', title: '🩺 Connect me to registered vet in Lahore' },
    { id: '3', title: '🩹 Lumpy skin disease first aid' },
    { id: '4', title: '💉 Recommended vaccination schedule' },
  ],
  ur: [
    { id: '1', title: '🐮 گائے کو تیز بخار اور دودھ میں کمی ہے' },
    { id: '2', title: '🩺 لاہور میں رجسٹرڈ ویٹرنری ڈاکٹر سے رابطہ کروائیں' },
    { id: '3', title: '🩹 لمپی سکن کی بیماری کی ابتدائی طبی امداد' },
    { id: '4', title: '💉 مویشیوں کے حفاظتی ٹیکوں کا شیڈول' },
  ],
};

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const { isUrdu } = useTranslation();
  const flatListRef = useRef(null);

  const [profile, setProfile] = useState(getProfile());
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [loadingAudioId, setLoadingAudioId] = useState(null);
  const recordingTimerRef = useRef(null);

  // Pulse animation for recording
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize initial greeting
  useEffect(() => {
    const currentProfile = getProfile();
    setProfile(currentProfile);

    const greetingText = isUrdu
      ? 'السلام علیکم! میں صحت اسسٹنٹ ہوں، مویشی صحت کا آفیشل AI معاون۔ میں آپ کی گائے، بھینس، بکری یا دیگر مویشیوں کی صحت، بیماریوں اور خوراک کے متعلق کیا مدد کر سکتا ہوں؟'
      : 'Assalam-o-Alaikum! I am Sehat Assistant, the official AI guide of Maveshi Sehat AI. How can I help your cattle, dairy animals, goats, or sheep today?';

    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: greetingText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant',
      },
    ]);

    return () => {
      // Stop any ongoing audio on unmount
      if (AudioModule && AudioModule.stopSound) {
        AudioModule.stopSound().catch(() => {});
      }
    };
  }, [isUrdu]);

  // Handle pulse animation during voice recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingSeconds(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const handlePlayAudio = async (item) => {
    if (!item) return;

    if (playingMsgId === item.id) {
      try {
        if (AudioModule && AudioModule.stopSound) {
          await AudioModule.stopSound();
        }
      } catch (e) {}
      setPlayingMsgId(null);
      return;
    }

    try {
      let audioUrl = item.audioUrl;
      if (!audioUrl) {
        setLoadingAudioId(item.id);
        const ttsRes = await fetch(`${BASE_URL}/api/chat/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: item.content }),
        });
        const ttsData = await ttsRes.json();
        setLoadingAudioId(null);
        if (ttsData.success && ttsData.audioUrl) {
          audioUrl = ttsData.audioUrl;
          item.audioUrl = audioUrl;
          setMessages((prev) =>
            prev.map((m) => (m.id === item.id ? { ...m, audioUrl } : m))
          );
        }
      }

      if (audioUrl) {
        const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${BASE_URL}${audioUrl}`;
        setPlayingMsgId(item.id);
        if (AudioModule && AudioModule.playSound) {
          await AudioModule.playSound(fullUrl);
        }
      }
    } catch (err) {
      console.warn('Audio playback error:', err);
      setPlayingMsgId(null);
      setLoadingAudioId(null);
    }
  };

  const handleSend = async (manualText = null) => {
    const textToSend = (manualText || inputText).trim();
    if (!textToSend || loading) return;

    const userMessageId = Date.now().toString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      time: currentTime,
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Prepare history payload for AI (exclude initial welcome greeting)
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome-1' && m.id !== 'welcome-reset')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        }));

      const response = await fetch(`${BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          userId: profile.userName || 'farmer',
          enableTts: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          provider: isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant',
          audioUrl: data.audioUrl,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const fallbackMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: isUrdu
            ? 'معذرت، اس وقت سرور سے رابطہ نہیں ہو سکا۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔'
            : 'Sorry, could not connect to Sehat Assistant server right now. Please check your connection and try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err) {
      console.error('Send message error:', err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isUrdu
          ? 'نیٹ ورک کی خرابی۔ براہ کرم اپنا انٹرنیٹ چیک کریں۔'
          : 'Network error. Please check your backend connection.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleVoiceToggle = async () => {
    if (!isRecording) {
      try {
        if (AudioModule && AudioModule.startRecording) {
          await AudioModule.startRecording();
        }
        setIsRecording(true);
      } catch (err) {
        console.warn('Microphone start recording error:', err);
        setIsRecording(true);
      }
    } else {
      setIsRecording(false);
      let recordedPath = null;
      try {
        if (AudioModule && AudioModule.stopRecording) {
          const res = await AudioModule.stopRecording();
          recordedPath = res?.filePath;
        }
      } catch (e) {
        console.warn('Stop recording err:', e);
      }

      if (recordedPath) {
        setLoading(true);
        try {
          const formData = new FormData();
          formData.append('audio', {
            uri: `file://${recordedPath}`,
            type: 'audio/m4a',
            name: `voice_${Date.now()}.m4a`,
          });
          formData.append('userId', profile.userName || 'farmer');
          formData.append('history', JSON.stringify(
            messages
              .filter((m) => m.id !== 'welcome-1' && m.id !== 'welcome-reset')
              .map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                content: m.content,
              }))
          ));

          const response = await fetch(`${BASE_URL}/api/chat/voice`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          if (response.ok && data.success) {
            const userMsg = {
              id: Date.now().toString(),
              role: 'user',
              content: data.transcript || (isUrdu ? '🎤 صوتی پیغام' : '🎤 Voice message'),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            const assistantMsg = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: data.reply,
              provider: isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant',
              audioUrl: data.audioUrl,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, userMsg, assistantMsg]);
            if (data.audioUrl) {
              handlePlayAudio(assistantMsg);
            }
          } else {
            throw new Error(data.error || 'Voice transcription failed');
          }
        } catch (voiceErr) {
          console.warn('Voice API error, using voice sample query:', voiceErr);
          const voiceSample = isUrdu
            ? 'لاہور میں مویشی صحت پر رجسٹرڈ ویٹرنری ڈاکٹر کون ہیں؟'
            : 'Connect me to the vet available in Lahore registered on Maveshi Sehat AI';
          handleSend(voiceSample);
        } finally {
          setLoading(false);
        }
      } else {
        const voiceSample = isUrdu
          ? 'لاہور میں مویشی صحت پر رجسٹرڈ ویٹرنری ڈاکٹر کون ہیں؟'
          : 'Connect me to the vet available in Lahore registered on Maveshi Sehat AI';
        handleSend(voiceSample);
      }
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      t('Clear Chat'),
      isUrdu ? 'کیا آپ تمام گفتگو صاف کرنا چاہتے ہیں؟' : 'Are you sure you want to clear chat history?',
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Close'),
          style: 'destructive',
          onPress: () => {
            const initialGreeting = isUrdu
              ? 'السلام علیکم! میں صحت اسسٹنٹ ہوں۔ آپ کے جانوروں کی کیا مدد کروں؟'
              : 'Assalam-o-Alaikum! I am Sehat Assistant. How can I help your livestock today?';
            setMessages([
              {
                id: 'welcome-reset',
                role: 'assistant',
                content: initialGreeting,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                provider: 'Sehat Assistant',
              },
            ]);
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.assistantMessageRow,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantMiniAvatar}>
            <MaterialCommunityIcons name="cow" size={16} color="#4CB85C" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
              isUrdu && { fontFamily: fonts.urduRegular, lineHeight: 24 },
            ]}
          >
            {item.content}
          </Text>

          <View style={styles.bubbleFooter}>
            <Text
              style={[
                styles.messageTime,
                isUser ? styles.userMessageTime : styles.assistantMessageTime,
              ]}
            >
              {item.time}
            </Text>

            {!isUser && (
              <View style={styles.modelBadge}>
                <Text style={styles.modelBadgeText}>⚡ {isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant'}</Text>
              </View>
            )}

            {!isUser && (
              <TouchableOpacity
                style={[
                  styles.audioPlayBtn,
                  playingMsgId === item.id && { backgroundColor: '#C8E6C9', borderColor: '#2E7D32' },
                  loadingAudioId === item.id && { opacity: 0.7 }
                ]}
                onPress={() => handlePlayAudio(item)}
                activeOpacity={0.8}
                disabled={loadingAudioId === item.id}
              >
                {loadingAudioId === item.id ? (
                  <ActivityIndicator size="small" color="#2E7D32" style={{ transform: [{ scale: 0.7 }] }} />
                ) : (
                  <Feather
                    name={playingMsgId === item.id ? "square" : "volume-2"}
                    size={12}
                    color="#2E7D32"
                  />
                )}
                <Text style={styles.audioPlayText}>
                  {loadingAudioId === item.id
                    ? (isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...')
                    : playingMsgId === item.id
                    ? (isUrdu ? 'روکیں' : 'Stop')
                    : (isUrdu ? 'سنیں' : 'Listen')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const activeSuggestions = isUrdu ? SUGGESTIONS.ur : SUGGESTIONS.en;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4CB85C" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="stethoscope" size={24} color="#4CB85C" />
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, isUrdu && { fontFamily: fonts.urduBold }]}>
              {t('Sehat Assistant')}
            </Text>
            <Text style={styles.headerSub}>
              {isUrdu ? 'مویشی ہیلتھ AI • آن لائن' : 'Livestock Health AI • Online'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleClearChat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Medical Disclaimer Banner */}
              <View style={styles.disclaimerBanner}>
                <Feather name="alert-triangle" size={16} color="#D97706" />
                <Text style={[styles.disclaimerText, isUrdu && { fontFamily: fonts.urduRegular }]}>
                  {isUrdu
                    ? 'یہ AI رہنمائی کے لیے ہے۔ ایمرجنسی میں قریبی سول ویٹرنری ہسپتال یا مستند ڈاکٹر سے رجوع کریں۔'
                    : 'AI provides livestock advice. In emergencies, consult a qualified veterinarian or Civil Veterinary Hospital.'}
                </Text>
              </View>

              {/* Quick suggestions */}
              {messages.length <= 1 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>
                    {isUrdu ? 'تجویز کردہ سوالات' : 'Suggested Questions'}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsScroll}
                  >
                    {activeSuggestions.map((sug) => (
                      <TouchableOpacity
                        key={sug.id}
                        style={styles.suggestionChip}
                        onPress={() => handleSend(sug.title)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.suggestionChipText, isUrdu && { fontFamily: fonts.urduRegular }]}>
                          {sug.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          }
          ListFooterComponent={
            loading ? (
              <View style={styles.typingIndicatorRow}>
                <View style={styles.assistantMiniAvatar}>
                  <MaterialCommunityIcons name="cow" size={16} color="#4CB85C" />
                </View>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { opacity: 0.7 }]} />
                  <View style={[styles.typingDot, { opacity: 0.4 }]} />
                  <Text style={[styles.typingText, isUrdu && { fontFamily: fonts.urduRegular }]}>
                    {isUrdu ? 'صحت اسسٹنٹ سوچ رہا ہے...' : 'Sehat Assistant is typing...'}
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input Bar */}
        <View style={styles.inputBarContainer}>
          {isRecording && (
            <View style={styles.recordingOverlay}>
              <View style={styles.recordingIndicator}>
                <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.recordingText}>
                  {isUrdu ? `ریکارڈنگ جاری ہے... 00:0${recordingSeconds}` : `Listening... 00:0${recordingSeconds}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.recordingCancelBtn}
                onPress={() => setIsRecording(false)}
              >
                <Text style={styles.recordingCancelText}>{isUrdu ? 'منسوخ' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.textInput,
                isUrdu && { fontFamily: fonts.urduRegular, textAlign: 'right' },
              ]}
              placeholder={isUrdu ? 'صحت اسسٹنٹ سے سوال پوچھیں...' : 'Ask Sehat Assistant a question...'}
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.iconBtn,
                styles.micBtn,
                isRecording && styles.micBtnRecording,
              ]}
              onPress={handleVoiceToggle}
              activeOpacity={0.8}
            >
              <Feather
                name={isRecording ? 'square' : 'mic'}
                size={20}
                color={isRecording ? '#EF4444' : '#4CB85C'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconBtn,
                styles.sendBtn,
                (!inputText.trim() || loading) && styles.sendBtnDisabled,
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Feather name="send" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
