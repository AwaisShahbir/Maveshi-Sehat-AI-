import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Clipboard
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../../utils/themeContext';
import { useTranslation, t } from '../../utils/translate';
import { getProfile } from '../../utils/profileStore';

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { isUrdu } = useTranslation();
  const profile = getProfile();
  const effectiveUserId = profile.userId || profile.id;

  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState(null);

  // JazzCash Payment Proof Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [senderPhone, setSenderPhone] = useState(profile.phone || '');
  const [transactionId, setTransactionId] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  const JAZZCASH_NUMBER = '03054758667';
  const JAZZCASH_TITLE = 'Maveshi Sehat Official';
  const MONTHLY_PRICE = '300';

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const res = await fetch(`${baseUrl}/api/subscriptions/status/${effectiveUserId || '0'}`);
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
      }
    } catch (e) {
      console.warn('Subscription status fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [effectiveUserId]);

  const copyJazzCashNumber = () => {
    Clipboard.setString(JAZZCASH_NUMBER);
    Alert.alert(t('Copied!'), `${t('JazzCash Number')} ${JAZZCASH_NUMBER} ${t('copied to clipboard.')}`);
  };

  const handleContactAdmin = () => {
    Alert.alert(
      t('Contact Admin for Lifetime Plan'),
      t('Choose how you would like to reach our administration team:'),
      [
        {
          text: t('WhatsApp'),
          onPress: () => {
            const url = `whatsapp://send?phone=923054758667&text=${encodeURIComponent('Assalam-o-Alaikum, I am inquiring about the Maveshi Sehat Lifetime Subscription Plan.')}`;
            Linking.canOpenURL(url).then(supported => {
              if (supported) Linking.openURL(url);
              else Linking.openURL(`https://wa.me/923054758667`);
            }).catch(() => Linking.openURL(`https://wa.me/923054758667`));
          }
        },
        {
          text: t('Phone Call'),
          onPress: () => Linking.openURL(`tel:${JAZZCASH_NUMBER}`)
        },
        { text: t('Cancel'), style: 'cancel' }
      ]
    );
  };

  const handlePickProofImage = (fromCamera = false) => {
    const options = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      includeBase64: true
    };

    const launcher = fromCamera ? launchCamera : launchImageLibrary;
    launcher(options, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert(t('Image Error'), response.errorMessage);
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setProofImage({
          uri: asset.uri,
          base64: asset.base64,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `proof-${Date.now()}.jpg`
        });
      }
    });
  };

  const handleSubmitProof = async () => {
    if (!senderPhone || !senderPhone.trim()) {
      Alert.alert(t('Validation Error'), t('Please enter the phone number from which payment was sent.'));
      return;
    }
    if (!transactionId || !transactionId.trim()) {
      Alert.alert(t('Validation Error'), t('Please enter the 6 to 12-digit JazzCash TID / Transaction ID.'));
      return;
    }
    if (!proofImage) {
      Alert.alert(t('Validation Error'), t('Please attach a screenshot or photo of the payment receipt.'));
      return;
    }

    try {
      setSubmittingProof(true);
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';

      const payload = {
        userId: effectiveUserId,
        planType: 'monthly_300',
        senderPhone: senderPhone.trim(),
        transactionId: transactionId.trim(),
        proofImageBase64: proofImage.base64
      };

      const res = await fetch(`${baseUrl}/api/subscriptions/submit-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment proof.');
      }

      setModalVisible(false);
      setProofImage(null);
      setTransactionId('');
      Alert.alert(
        t('Payment Proof Submitted!'),
        t('Your payment proof has been sent to the Admin team. Once verified, unlimited scans will be instantly unlocked on your account.')
      );
      fetchStatus();
    } catch (err) {
      Alert.alert(t('Submission Failed'), err.message);
    } finally {
      setSubmittingProof(false);
    }
  };

  const scansUsed = subStatus?.scansUsed || 0;
  const maxFree = subStatus?.maxFreeScans || 10;
  const scansRemaining = subStatus?.scansRemaining !== undefined ? subStatus.scansRemaining : Math.max(0, maxFree - scansUsed);
  const isUnlimited = subStatus?.isUnlimited;
  const isPending = subStatus?.subscriptionStatus === 'pending_approval' || subStatus?.hasPendingProof;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? colors.background : '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      {/* Top Header */}
      <View style={{
        backgroundColor: '#059669',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 22,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.22)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20
          }}>
            <MaterialCommunityIcons name="crown" size={18} color="#FDE047" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFF' }}>
              {t('Maveshi Sehat Pro')}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFF', textAlign: 'center' }}>
          {t('Upgrade Livestock Health')}
        </Text>
        <Text style={{ fontSize: 13, color: '#D1FAE5', textAlign: 'center', marginTop: 4 }}>
          {t('Get unlimited AI scans and continuous veterinary medical care.')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Usage & Status Overview Card */}
        <View style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 20,
          padding: 18,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isUnlimited ? '#D1FAE5' : (isPending ? '#FEF3C7' : '#E0F2FE'),
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10
              }}>
                <MaterialCommunityIcons
                  name={isUnlimited ? 'check-decagram' : (isPending ? 'clock-outline' : 'camera-metering-center')}
                  size={20}
                  color={isUnlimited ? '#059669' : (isPending ? '#D97706' : '#0284C7')}
                />
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' }}>
                  {t('Current Status')}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
                  {isUnlimited
                    ? t('Pro Plan Active')
                    : (isPending ? t('Payment Under Review') : t('Free Tier'))
                  }
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: isUnlimited ? '#059669' : (isPending ? '#F59E0B' : '#0284C7'),
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>
                {isUnlimited ? t('UNLIMITED') : (isPending ? t('PENDING') : `${scansRemaining} ${t('LEFT')}`)}
              </Text>
            </View>
          </View>

          {/* Progress Bar for Free Scans */}
          {!isUnlimited && (
            <View style={{ marginTop: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {t('Free AI Scans Allowance')}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
                  {scansUsed} / {maxFree} {t('Used')}
                </Text>
              </View>
              <View style={{
                height: 9,
                backgroundColor: isDark ? '#334155' : '#E2E8F0',
                borderRadius: 5,
                overflow: 'hidden'
              }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min(100, (scansUsed / maxFree) * 100)}%`,
                  backgroundColor: scansUsed >= maxFree ? '#EF4444' : '#059669',
                  borderRadius: 5
                }} />
              </View>
              {scansRemaining <= 0 && !isPending && (
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700', marginTop: 8 }}>
                  ⚠️ {t('You have used all 10 free scans. Subscribe to continue scanning.')}
                </Text>
              )}
              {isPending && (
                <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '700', marginTop: 8 }}>
                  ⏳ {t('Receipt uploaded. Admin review in progress. Access will activate shortly.')}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Plan 1: Free Tier Card */}
        <View style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
              {t('Free Starter')}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textSecondary }}>
              Rs. 0
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
            {t('Basic disease check for small livestock holders.')}
          </Text>

          {[
            t('10 Free AI Disease Scans total'),
            t('Multimodal symptom detection'),
            t('Urdu & English diagnostic first-aid'),
            t('Access to Community Discussion Forum')
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
              <Feather name="check" size={15} color="#059669" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: colors.textPrimary }}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Plan 2: Monthly Pro Plan (Featured) */}
        <View style={{
          backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: '#10B981',
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 4
        }}>
          <View style={{
            position: 'absolute',
            top: -12,
            right: 20,
            backgroundColor: '#059669',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12
          }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 }}>
              {t('MOST POPULAR')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <View>
              <Text style={{ fontSize: 19, fontWeight: '900', color: '#065F46' }}>
                {t('Monthly Pro')}
              </Text>
              <Text style={{ fontSize: 12, color: '#047857' }}>
                {t('Ideal for active dairy & livestock farms')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#065F46' }}>
                Rs. {MONTHLY_PRICE}
              </Text>
              <Text style={{ fontSize: 11, color: '#047857' }}>
                / {t('Month')}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(16, 185, 129, 0.3)', marginVertical: 12 }} />

          {[
            t('Unlimited AI Disease Scans for all cattle & herd'),
            t('Direct Telemedicine Online Chat & Video Consultations'),
            t('Automated Weather & Heat Stress Outbreak Alerts'),
            t('Digital Prescriptions & Direct Medicine Marketplace'),
            t('Priority Veterinary Case Resolution')
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#10B981',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8
              }}>
                <Feather name="check" size={12} color="#FFF" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#065F46', flex: 1 }}>{item}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={{
              backgroundColor: '#059669',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              marginTop: 14,
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4
            }}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="wallet-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>
              {t('Pay via JazzCash (Rs. 300)')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plan 3: Lifetime Enterprise Plan */}
        <View style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
              {t('Lifetime Access')}
            </Text>
            <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>
                {t('ENTERPRISE')}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
            {t('Permanent full access for commercial livestock farms.')}
          </Text>

          {[
            t('Permanent Lifetime unlimited AI scans'),
            t('VIP dedicated veterinarian hotline access'),
            t('Commercial herd management & analytics'),
            t('Direct consultation with veterinary specialists')
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
              <Feather name="star" size={14} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: colors.textPrimary }}>{item}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={{
              backgroundColor: isDark ? '#334155' : '#F1F5F9',
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 12,
              borderWidth: 1,
              borderColor: isDark ? '#475569' : '#CBD5E1',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
            onPress={handleContactAdmin}
          >
            <Feather name="phone-call" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
              {t('Contact Admin to Activate')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* JazzCash Payment & Proof Submission Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            padding: 22,
            maxHeight: '92%'
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#E4002B',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10
                }}>
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>JC</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                    {t('JazzCash Payment')}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {t('Pay Rs. 300 & upload proof for approval')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Payment Details Card */}
              <View style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FEF2F2',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#FCA5A5'
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#991B1B', textTransform: 'uppercase', marginBottom: 8 }}>
                  {t('JazzCash Account Details')}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Account Title')}:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{JAZZCASH_TITLE}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Account Number')}:</Text>
                  <TouchableOpacity onPress={copyJazzCashNumber} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#DC2626', marginRight: 6 }}>
                      {JAZZCASH_NUMBER}
                    </Text>
                    <Feather name="copy" size={14} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Amount')}:</Text>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#059669' }}>Rs. {MONTHLY_PRICE}</Text>
                </View>
              </View>

              {/* Instructions */}
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 14 }}>
                {t('1. Open your JazzCash App or dial *786# and transfer Rs. 300 to 03054758667.\n2. Note the Transaction ID (TID) from the SMS.\n3. Take a screenshot or photo of the receipt and upload below.')}
              </Text>

              {/* Sender Phone Input */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                {t('Sender JazzCash Phone Number')} *
              </Text>
              <TextInput
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  marginBottom: 12
                }}
                placeholder="e.g. 03001234567"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={senderPhone}
                onChangeText={setSenderPhone}
              />

              {/* TID Input */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                {t('Transaction ID (TID)')} *
              </Text>
              <TextInput
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  marginBottom: 14
                }}
                placeholder="e.g. 01847583920"
                placeholderTextColor={colors.textSecondary}
                value={transactionId}
                onChangeText={setTransactionId}
              />

              {/* Proof Image Picker */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                {t('Payment Receipt Screenshot')} *
              </Text>

              {proofImage ? (
                <View style={{ marginBottom: 16, position: 'relative' }}>
                  <Image
                    source={{ uri: proofImage.uri }}
                    style={{ width: '100%', height: 180, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: 16,
                      padding: 6
                    }}
                    onPress={() => setProofImage(null)}
                  >
                    <Feather name="trash-2" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                      borderStyle: 'dashed'
                    }}
                    onPress={() => handlePickProofImage(false)}
                  >
                    <Feather name="image" size={20} color="#059669" style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
                      {t('Choose from Gallery')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                      borderStyle: 'dashed'
                    }}
                    onPress={() => handlePickProofImage(true)}
                  >
                    <Feather name="camera" size={20} color="#0284C7" style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
                      {t('Take Photo')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#059669',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  marginBottom: Platform.OS === 'ios' ? 24 : 10,
                  opacity: submittingProof ? 0.7 : 1
                }}
                onPress={handleSubmitProof}
                disabled={submittingProof}
              >
                {submittingProof ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>
                    {t('Submit Payment Proof')}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
