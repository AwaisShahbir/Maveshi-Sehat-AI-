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
  NativeEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';
import { t, useTranslation } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import fonts from '../../styles/fonts';
import { getStyles } from '../../styles/ChatbotScreenStyles';

const { AudioModule } = NativeModules;
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

// High reliability fetcher with automatic host fallback for Android (10.0.2.2 <-> localhost <-> 127.0.0.1)
const tryFetch = async (endpoint, options = {}) => {
  const hosts = Platform.OS === 'android'
    ? ['http://10.0.2.2:5000', 'http://localhost:5000', 'http://127.0.0.1:5000']
    : ['http://localhost:5000'];

  let lastErr = null;
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}${endpoint}`, options);
      return res;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

const FARMER_SUGGESTIONS = {
  en: [
    { id: '1', title: '🐮 Cow has high fever & low milk yield' },
    { id: '2', title: '💉 Cow & buffalo seasonal vaccination schedule' },
    { id: '3', title: '☀️ How to prevent heat stress in dairy cows' },
    { id: '4', title: '🌾 Best feed formulation to boost milk yield' },
  ],
  ur: [
    { id: '1', title: '🐮 گائے کو تیز بخار ہے اور دودھ کم ہو گیا ہے' },
    { id: '2', title: '💉 گائے اور بھینس کے حفاظتی ٹیکوں کا شیڈول کیا ہے؟' },
    { id: '3', title: '☀️ گرمیوں میں مویشیوں کو ہیٹ سٹریس سے کیسے بچائیں؟' },
    { id: '4', title: '🌾 دودھ کی پیداوار بڑھانے کے لیے بہترین ونڈا اور خوراک' },
  ],
};

const VET_SUGGESTIONS = {
  en: [
    { id: '1', title: '🩺 Acute Mastitis: First-line antimicrobial & anti-inflammatory' },
    { id: '2', title: '⚖️ Oxytetracycline dosage & milk withdrawal in 450kg buffalo' },
    { id: '3', title: '🔬 Differential diagnosis: Petechial hemorrhages & acute fever' },
    { id: '4', title: '🐄 Post-calving hypocalcemia (Milk Fever) IV calcium infusion rates' },
  ],
  ur: [
    { id: '1', title: '🩺 ایکیوٹ ساڑو: فرسٹ لائن اینٹی بائیوٹک اور اینٹی انفلامیٹری پروٹوکول' },
    { id: '2', title: '⚖️ 450 کلو بھینس کے لیے آکسی ٹیٹراسائکلین ڈوز اور ملک وتھ ڈراول' },
    { id: '3', title: '🔬 تیز بخار اور جسم پر خون کے دھبوں کی تفریقی تشخیص (DDx)' },
    { id: '4', title: '🐄 سوئے کے بعد ملک فیور (Hypocalcemia) میں کیلشیم انفیوژن کی شرح' },
  ],
};

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const { isUrdu } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const flatListRef = useRef(null);

  const [profile, setProfile] = useState(getProfile());
  const isVet = profile.role === 'vet' || profile.role === 'veterinarian';
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({ enabled: true });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [loadingAudioId, setLoadingAudioId] = useState(null);
  const recordingTimerRef = useRef(null);

  // Pulse animation for recording
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check admin service status on mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const res = await tryFetch('/api/chat/status');
        if (res.ok) {
          const data = await res.json();
          if (data && data.enabled !== undefined) {
            setServiceStatus(data);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch AI assistant status:', err);
      }
    };
    checkServiceStatus();
  }, []);

  // Handle in-app deep navigation to screens
  const handleNavigate = (screenTarget) => {
    if (!screenTarget) return;
    const cleanTarget = screenTarget.trim();

    if (isVet) {
      const vetScreenMap = {
        'VetCases': 'VetCases',
        'cases': 'VetCases',
        'VetPrescriptions': 'VetPrescriptions',
        'prescriptions': 'VetPrescriptions',
        'VetHealthRecords': 'VetHealthRecords',
        'HealthRecords': 'VetHealthRecords',
        'healthrecords': 'VetHealthRecords',
        'records': 'VetHealthRecords',
        'VetConsultations': 'VetConsultations',
        'consultations': 'VetConsultations',
        'CommunityForum': 'CommunityForum',
        'forum': 'CommunityForum',
        'VetProfile': 'VetProfile',
        'Profile': 'VetProfile',
        'VetDashboard': 'VetDashboard',
        'Dashboard': 'VetDashboard',
      };
      const vetTarget = vetScreenMap[cleanTarget];
      if (vetTarget) {
        try {
          navigation.navigate(vetTarget);
        } catch (e) {
          console.warn('Vet navigation failed for screen:', cleanTarget, e);
        }
      }
      return;
    }

    const screenMap = {
      'VeterinariansList': 'VeterinariansList',
      'Veterinarians': 'VeterinariansList',
      'vets': 'VeterinariansList',
      'doctors': 'VeterinariansList',
      'AiScan': 'AiScan',
      'aiscan': 'AiScan',
      'scan': 'AiScan',
      'HealthRecords': 'HealthRecords',
      'healthrecords': 'HealthRecords',
      'records': 'HealthRecords',
      'Vaccination': 'Vaccination',
      'vaccination': 'Vaccination',
      'Marketplace': 'Marketplace',
      'marketplace': 'Marketplace',
      'pharmacy': 'Marketplace',
      'HeatAlert': 'HeatAlert',
      'heatalert': 'HeatAlert',
      'heat': 'HeatAlert',
      'CommunityForum': 'CommunityForum',
      'forum': 'CommunityForum',
      'MyConsultations': 'MyConsultations',
      'consultations': 'MyConsultations',
      'Dashboard': 'Dashboard',
      'Profile': 'Profile',
    };

    const target = screenMap[cleanTarget] || cleanTarget;
    try {
      navigation.navigate(target);
    } catch (e) {
      console.warn('Navigation failed for screen:', cleanTarget, e);
    }
  };

  // Initialize initial greeting dynamically based on user role (Farmer vs Vet)
  useEffect(() => {
    const currentProfile = getProfile();
    setProfile(currentProfile);
    const userIsVet = currentProfile.role === 'vet' || currentProfile.role === 'veterinarian';
    const userName = currentProfile.fullName || currentProfile.userName || '';

    let greetingText = '';
    if (userIsVet) {
      greetingText = isUrdu
        ? `السلام علیکم ڈاکٹر ${userName ? userName + ' صاحب' : ''}! میں مویشی صحت کا کلینیکل اسسٹنٹ ہوں۔ آپ کس کیس، ڈوزج (mg/kg) یا ڈیفرینشل ڈائیگنوسس پر مشاورت چاہتے ہیں؟`
        : `Assalam-o-Alaikum Dr. ${userName || 'Doctor'}! Welcome to Maveshi Sehat Clinical Assistant. Ready to support you with differential diagnoses, pharmacological dosages, or clinical case reviews.`;
    } else {
      greetingText = isUrdu
        ? `السلام علیکم ${userName ? userName + ' صاحب' : ''}! میں صحت اسسٹنٹ ہوں، مویشی صحت کا آفیشل AI معاون۔ میں آپ کی گائے یا بھینس کے متعلق کیا مدد کر سکتا ہوں؟`
        : `Assalam-o-Alaikum ${userName || ''}! I am Sehat Assistant, the official AI guide of Maveshi Sehat AI. How can I help with your cows or buffaloes today?`;
    }

    const welcomeMsg = {
      id: 'welcome-1',
      role: 'assistant',
      content: greetingText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: userIsVet
        ? (isUrdu ? 'کلینیکل معاون' : 'Clinical Co-Pilot')
        : (isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant'),
    };

    setMessages([welcomeMsg]);

    // Load persisted previous chat history for this user
    const loadChatHistory = async () => {
      try {
        const userId = currentProfile.userName || currentProfile.phone || 'farmer';
        const res = await tryFetch(`/api/chat/history?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages([welcomeMsg, ...data.messages]);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 250);
          }
        }
      } catch (err) {
        console.warn('Failed to load previous chat history:', err);
      }
    };

    loadChatHistory();

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

  // Listen for native audio playback completion to toggle "Listen" / "Stop" button state
  useEffect(() => {
    let sub = null;
    try {
      if (AudioModule) {
        const eventEmitter = new NativeEventEmitter(AudioModule);
        sub = eventEmitter.addListener('onAudioPlaybackFinished', () => {
          setPlayingMsgId(null);
        });
      }
    } catch (e) {
      console.warn('NativeEventEmitter setup error:', e);
    }

    return () => {
      if (sub && sub.remove) {
        sub.remove();
      }
    };
  }, []);

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
        const ttsRes = await tryFetch('/api/chat/tts', {
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

      const response = await tryFetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          userId: profile.userName || 'farmer',
          role: isVet ? 'vet' : 'farmer',
          userName: profile.fullName || profile.userName || '',
          isUrdu,
          enableTts: true,
        }),
      });

      const data = await response.json();

      if (response.status === 503 || data.isServicePaused) {
        setServiceStatus({
          enabled: false,
          messageUrdu: data.messageUrdu || 'ایڈمن نے AI اسسٹنٹ سروس کو عارضی طور پر مینٹیننس کے لیے معطل کیا ہے۔',
          messageEn: data.messageEn || 'AI Assistant service is temporarily paused for maintenance by the administrator.',
        });
        const pausedMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: isUrdu
            ? (data.messageUrdu || '⚠️ AI سروس عارضی طور پر بند ہے۔ ایڈمن جلد بحال کرے گا۔')
            : (data.messageEn || '⚠️ AI service is temporarily paused by admin for scheduled maintenance.'),
          provider: isVet ? (isUrdu ? 'کلینیکل معاون' : 'Clinical Co-Pilot') : (isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, pausedMsg]);
      } else if (response.ok && data.success) {
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          provider: isVet
            ? (isUrdu ? 'کلینیکل معاون' : 'Clinical Co-Pilot')
            : (isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant'),
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
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: isUrdu ? 'مائیکروفون کی اجازت' : 'Microphone Permission',
              message: isUrdu
                ? 'صوتی پیغام بھیجنے کے لیے مائیکروفون کی اجازت درکار ہے۔'
                : 'Microphone permission is required to send voice messages.',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              isUrdu ? 'اجازت درکار ہے' : 'Permission Required',
              isUrdu
                ? 'براہ کرم مائیکروفون کی اجازت دیں تاکہ آواز ریکارڈ ہو سکے۔'
                : 'Please allow microphone access to record voice.'
            );
            return;
          }
        } catch (permErr) {
          console.warn('Microphone permission error:', permErr);
        }
      }

      try {
        if (AudioModule && AudioModule.startRecording) {
          await AudioModule.startRecording();
        }
        setIsRecording(true);
      } catch (err) {
        console.warn('Microphone start recording error:', err);
        Alert.alert(
          isUrdu ? 'مائیک کی خرابی' : 'Microphone Error',
          isUrdu ? 'مائیک شروع کرنے میں مسئلہ پیش آیا۔' : 'Failed to start microphone recording.'
        );
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
          formData.append('role', isVet ? 'vet' : 'farmer');
          formData.append('userName', profile.fullName || profile.userName || '');
          formData.append('isUrdu', isUrdu ? 'true' : 'false');
          formData.append('history', JSON.stringify(
            messages
              .filter((m) => m.id !== 'welcome-1' && m.id !== 'welcome-reset')
              .map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                content: m.content,
              }))
          ));

          const response = await tryFetch('/api/chat/voice', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (response.status === 503 || data.isServicePaused) {
            setServiceStatus({
              enabled: false,
              messageUrdu: data.messageUrdu || 'ایڈمن نے AI اسسٹنٹ سروس کو عارضی طور پر معطل کیا ہے۔',
              messageEn: data.messageEn || 'AI Assistant service is temporarily paused for maintenance.',
            });
            const pausedMsg = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: isUrdu
                ? (data.messageUrdu || '⚠️ AI سروس عارضی طور پر بند ہے۔')
                : (data.messageEn || '⚠️ AI service is paused for maintenance.'),
              provider: isVet ? (isUrdu ? 'کلینیکل معاون' : 'Clinical Co-Pilot') : (isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant'),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, pausedMsg]);
          } else if (response.ok && data.success) {
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
              provider: isVet ? (isUrdu ? 'کلینیکل معاون' : 'Clinical Co-Pilot') : (isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant'),
              audioUrl: data.audioUrl,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, userMsg, assistantMsg]);

            // Automatically play voice response of Sehat Assistant immediately
            if (data.audioUrl) {
              setTimeout(() => {
                handlePlayAudio(assistantMsg);
              }, 300);
            }
          } else {
            throw new Error(data.error || 'Voice transcription failed');
          }
        } catch (voiceErr) {
          console.warn('Voice API error:', voiceErr);
          Alert.alert(
            isUrdu ? 'آواز ریکارڈ نہیں ہو سکی' : 'Voice Message Error',
            isUrdu 
              ? 'آواز کی منتقلی میں مسئلہ پیش آیا۔ براہ کرم مائیک کے قریب واضح بول کر دوبارہ کوشش کریں۔'
              : 'Could not transcribe your voice message. Please speak clearly into the microphone and try again.'
          );
        } finally {
          setLoading(false);
        }
      } else {
        Alert.alert(
          isUrdu ? 'ریکارڈنگ نہیں ہو سکی' : 'Recording Error',
          isUrdu 
            ? 'ریکارڈنگ بہت مختصر تھی یا محفوظ نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔'
            : 'Recording was too short or could not be saved. Please tap the mic and speak.'
        );
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
          onPress: async () => {
            const initialGreeting = isUrdu
              ? 'السلام علیکم! میں صحت اسسٹنٹ ہوں۔ آپ کی گائے یا بھینس کے متعلق کیا مدد کروں؟'
              : 'Assalam-o-Alaikum! I am Sehat Assistant. How can I help with your cows or buffaloes today?';
            setMessages([
              {
                id: 'welcome-reset',
                role: 'assistant',
                content: initialGreeting,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                provider: isVet
                  ? (isUrdu ? 'کلینیکل معاون' : 'Clinical Co-Pilot')
                  : (isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant'),
              },
            ]);

            try {
              const userId = profile.userName || profile.phone || 'farmer';
              await tryFetch(`/api/chat/history?userId=${encodeURIComponent(userId)}`, {
                method: 'DELETE',
              });
            } catch (clearErr) {
              console.warn('Failed to delete history on server:', clearErr);
            }
          },
        },
      ]
    );
  };

  // Renders inline bold text and action links within a line
  const renderInlineSpans = (text, lineKey) => {
    const tokenRegex = /(\[[^\]]+\]\((?:app:|nav:|action:)[^)]+\)|\*\*[^*]+\*\*)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, spanIdx) => {
      if (!part) return null;

      // Inline action link: [Button Label](app:ScreenName)
      const linkMatch = part.match(/^\[([^\]]+)\]\((?:app:|nav:|action:)([^)]+)\)$/);
      if (linkMatch) {
        const [, label, screenName] = linkMatch;
        return (
          <TouchableOpacity
            key={`span-link-${lineKey}-${spanIdx}`}
            style={styles.inlineActionBtn}
            onPress={() => handleNavigate(screenName)}
            activeOpacity={0.8}
          >
            <Feather name="arrow-up-right" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={[styles.inlineActionText, isUrdu && { fontFamily: fonts.urduBold }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      }

      // Bold span: **bold text**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const boldContent = part.slice(2, -2);
        return (
          <Text
            key={`span-b-${lineKey}-${spanIdx}`}
            style={[
              { fontWeight: '700', color: '#0F172A' },
              isUrdu && { fontFamily: fonts.urduBold },
            ]}
          >
            {boldContent}
          </Text>
        );
      }

      // Plain text span
      return (
        <Text
          key={`span-t-${lineKey}-${spanIdx}`}
          style={[
            styles.assistantMessageText,
            isUrdu && { fontFamily: fonts.urduRegular },
          ]}
        >
          {part}
        </Text>
      );
    });
  };

  // Parses raw message content into styled headers, list items, cards, and paragraphs
  const renderMessageContent = (item) => {
    const isUser = item.role === 'user';
    if (isUser) {
      return (
        <Text style={[styles.messageText, styles.userMessageText]}>
          {item.content}
        </Text>
      );
    }

    const lines = (item.content || '').split('\n');

    return (
      <View style={{ width: '100%' }}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <View key={`spacer-${lineIdx}`} style={{ height: 4 }} />;
          }

          // 1. Standalone Action Card Button: [Label](app:ScreenName)
          const actionCardMatch = trimmed.match(/^\[([^\]]+)\]\((?:app:|nav:|action:)([^)]+)\)$/);
          if (actionCardMatch) {
            const [, label, screenName] = actionCardMatch;
            return (
              <TouchableOpacity
                key={`card-${lineIdx}`}
                style={styles.actionCardBtn}
                onPress={() => handleNavigate(screenName)}
                activeOpacity={0.8}
              >
                <View style={styles.actionCardLeft}>
                  <Feather name="external-link" size={15} color="#166534" />
                  <Text style={[styles.actionCardText, isUrdu && { fontFamily: fonts.urduBold }]}>
                    {label}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#166534" />
              </TouchableOpacity>
            );
          }

          // 2. Markdown Headings: ###, ##, #
          if (trimmed.startsWith('#')) {
            const headingText = trimmed.replace(/^#+\s*/, '');
            return (
              <Text
                key={`h-${lineIdx}`}
                style={[
                  styles.markdownHeader,
                  isUrdu && { fontFamily: fonts.urduBold, textAlign: 'right' },
                ]}
              >
                {renderInlineSpans(headingText, lineIdx)}
              </Text>
            );
          }

          // 3. Bullet points: * or -
          if (/^[*•-]\s+/.test(trimmed)) {
            const bulletContent = trimmed.replace(/^[*•-]\s+/, '');
            return (
              <View key={`b-${lineIdx}`} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <View style={styles.bulletTextContainer}>
                  <Text style={[styles.bulletText, isUrdu && { fontFamily: fonts.urduRegular }]}>
                    {renderInlineSpans(bulletContent, lineIdx)}
                  </Text>
                </View>
              </View>
            );
          }

          // 4. Numbered list: 1. , 2. 
          const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numberedMatch) {
            const [, num, numContent] = numberedMatch;
            return (
              <View key={`n-${lineIdx}`} style={styles.bulletRow}>
                <Text style={styles.bulletNumber}>{num}.</Text>
                <View style={styles.bulletTextContainer}>
                  <Text style={[styles.bulletText, isUrdu && { fontFamily: fonts.urduRegular }]}>
                    {renderInlineSpans(numContent, lineIdx)}
                  </Text>
                </View>
              </View>
            );
          }

          // 5. Regular paragraph line
          return (
            <View key={`p-${lineIdx}`} style={styles.paragraphBlock}>
              <Text
                style={[
                  styles.messageText,
                  styles.assistantMessageText,
                  isUrdu && { fontFamily: fonts.urduRegular, lineHeight: 24 },
                ]}
              >
                {renderInlineSpans(trimmed, lineIdx)}
              </Text>
            </View>
          );
        })}
      </View>
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
          {renderMessageContent(item)}

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

  const activeSuggestions = isVet
    ? (isUrdu ? VET_SUGGESTIONS.ur : VET_SUGGESTIONS.en)
    : (isUrdu ? FARMER_SUGGESTIONS.ur : FARMER_SUGGESTIONS.en);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? '#1E293B' : '#065F46'} />

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
              <MaterialCommunityIcons
                name={isVet ? "doctor" : "stethoscope"}
                size={24}
                color="#059669"
              />
            </View>
            <View style={[styles.onlineBadge, !serviceStatus.enabled && { backgroundColor: '#EF4444' }]} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, isUrdu && { fontFamily: fonts.urduBold }]}>
              {isVet
                ? (isUrdu ? 'کلینیکل AI معاون' : 'Clinical Co-Pilot')
                : (isUrdu ? 'صحت اسسٹنٹ' : 'Sehat Assistant')}
            </Text>
            <Text style={styles.headerSub}>
              {!serviceStatus.enabled
                ? (isUrdu ? 'سروس عارضی طور پر بند' : 'Maintenance Mode')
                : isVet
                ? (isUrdu ? 'کلینیکل ڈیسیژن سپورٹ • آن لائن' : 'Clinical Decision Support • Online')
                : (isUrdu ? 'مویشی ہیلتھ AI • آن لائن' : 'Livestock Health AI • Online')}
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

      {/* Admin Service Paused Notice */}
      {!serviceStatus.enabled && (
        <View style={{
          marginHorizontal: 16,
          marginTop: 10,
          padding: 12,
          backgroundColor: '#FEF2F2',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#FCA5A5',
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}>
          <Feather name="alert-octagon" size={24} color="#DC2626" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: '#991B1B', fontSize: 13, fontFamily: isUrdu ? fonts.urduBold : undefined }}>
              {isUrdu ? 'سروس عارضی طور پر بند ہے' : 'Service Temporarily Paused'}
            </Text>
            <Text style={{ color: '#B91C1C', fontSize: 11, marginTop: 2, fontFamily: isUrdu ? fonts.urduRegular : undefined }}>
              {isUrdu
                ? (serviceStatus.messageUrdu || 'ایڈمن نے AI اسسٹنٹ سروس کو عارضی طور پر مینٹیننس کے لیے معطل کیا ہے۔')
                : (serviceStatus.messageEn || 'AI Assistant service has been temporarily paused for maintenance by administrator.')}
            </Text>
          </View>
        </View>
      )}

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
                  {isVet
                    ? (isUrdu
                      ? 'یہ نظام کلینیکل ریفرنس اور سیکنڈ اوپینین کے لیے ہے۔ حتمی فیصلہ آپ کے کلینیکل معائنے پر مبنی ہے۔'
                      : 'Clinical decision support for qualified veterinarians. Exercise professional judgment on all cases.')
                    : (isUrdu
                      ? 'یہ AI رہنمائی کے لیے ہے۔ ایمرجنسی میں قریبی سول ویٹرنری ہسپتال یا مستند ڈاکٹر سے رجوع کریں۔'
                      : 'AI provides livestock advice. In emergencies, consult a qualified veterinarian or Civil Veterinary Hospital.')}
                </Text>
              </View>

              {/* Quick suggestions */}
              {messages.length <= 1 && serviceStatus.enabled && (
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
                  <MaterialCommunityIcons name={isVet ? "doctor" : "cow"} size={16} color="#4CB85C" />
                </View>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { opacity: 0.7 }]} />
                  <View style={[styles.typingDot, { opacity: 0.4 }]} />
                  <Text style={[styles.typingText, isUrdu && { fontFamily: fonts.urduRegular }]}>
                    {isUrdu ? 'معاون جواب تیار کر رہا ہے...' : 'Assistant is preparing response...'}
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input Bar */}
        <View style={[styles.inputBarContainer, !serviceStatus.enabled && { opacity: 0.7 }]}>
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
                !serviceStatus.enabled && { backgroundColor: '#F1F5F9' },
              ]}
              placeholder={
                !serviceStatus.enabled
                  ? (isUrdu ? 'ایڈمن نے سروس عارضی طور پر بند کی ہے...' : 'Service temporarily paused by admin...')
                  : isVet
                  ? (isUrdu ? 'کیس کی تفصیل یا سوال پوچھیں...' : 'Ask clinical reference, dosage, diagnosis...')
                  : (isUrdu ? 'صحت اسسٹنٹ سے سوال پوچھیں...' : 'Ask Sehat Assistant a question...')
              }
              placeholderTextColor={colors.inputPlaceholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={serviceStatus.enabled && !loading}
            />

            <TouchableOpacity
              style={[
                styles.iconBtn,
                styles.micBtn,
                isRecording && styles.micBtnRecording,
                !serviceStatus.enabled && { opacity: 0.4 },
              ]}
              onPress={handleVoiceToggle}
              activeOpacity={0.8}
              disabled={!serviceStatus.enabled || loading}
            >
              <Feather
                name={isRecording ? 'square' : 'mic'}
                size={20}
                color={isRecording ? '#EF4444' : colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconBtn,
                styles.sendBtn,
                (!inputText.trim() || loading || !serviceStatus.enabled) && styles.sendBtnDisabled,
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading || !serviceStatus.enabled}
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
