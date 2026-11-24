import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, SafeAreaView, ScrollView, 
  TouchableOpacity, StatusBar, Alert, Platform, Image, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView,
  Clipboard
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { getProfile, updateProfile } from '../../utils/profileStore';
import { useTranslation } from '../../utils/translate';
import { 
  getCart, getCartTotal, updateQuantity, removeFromCart, clearCart, subscribeCart 
} from '../../utils/cartStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/CartScreenStyles';

const getImageUrl = (url) => {
  if (!url) return null;
  if (Platform.OS === 'android') {
    return url.replace('localhost:5000', 'maveshi-sehat-api.onrender.com').replace('127.0.0.1:5000', 'maveshi-sehat-api.onrender.com');
  }
  return url;
};

export default function CartScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  const profile = getProfile();
  const [cartItems, setCartItems] = useState(getCart());
  const [subtotal, setSubtotal] = useState(getCartTotal());
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' or 'Online'
  const [loading, setLoading] = useState(false);

  // Delivery Address State (clean, dynamic user profile)
  const [buyerName, setBuyerName] = useState(profile.userName || profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [streetAddress, setStreetAddress] = useState(profile.deliveryAddress || '');
  const [district, setDistrict] = useState(profile.location || profile.district || '');

  // Address Edit Modal State
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editDistrict, setEditDistrict] = useState('');

  // Online Payment (JazzCash / EasyPaisa) Sheet & Receipt State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('JazzCash'); // 'JazzCash' or 'EasyPaisa'
  const [walletPhone, setWalletPhone] = useState(profile.phone || '');
  const [walletMpin, setWalletMpin] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderProofImage, setOrderProofImage] = useState(null);
  const [orderTransactionId, setOrderTransactionId] = useState('');
  const [orderSenderPhone, setOrderSenderPhone] = useState(profile.phone || '');

  // Pharmacy Direct Payment & Lock Status State
  const [pharmacyPaymentInfo, setPharmacyPaymentInfo] = useState(null);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);

  const activePayNumber = pharmacyPaymentInfo?.accountNumber || pharmacyPaymentInfo?.phone || '03054758667';
  const activePayTitle = pharmacyPaymentInfo?.accountTitle || pharmacyPaymentInfo?.pharmacyName || 'Pharmacy Official';
  const activePayWallet = pharmacyPaymentInfo?.walletType || 'JazzCash';
  const isStoreLocked = Boolean(pharmacyPaymentInfo?.isLocked);

  const copyPaymentNumber = () => {
    Clipboard.setString(activePayNumber);
    Alert.alert(t('Copied!'), `${activePayWallet} ${t('Number')} ${activePayNumber} ${t('copied to clipboard.')}`);
  };

  const handlePickOrderProof = (fromCamera = false) => {
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
        setOrderProofImage({
          uri: asset.uri,
          base64: asset.base64,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `order-proof-${Date.now()}.jpg`
        });
      }
    });
  };

  // Success Receipt Modal State
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const deliveryCharges = 150;
  const total = subtotal > 0 ? subtotal + deliveryCharges : 0;

  useEffect(() => {
    const unsubscribe = subscribeCart((updatedCart) => {
      setCartItems(updatedCart);
      setSubtotal(getCartTotal());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const primaryPharmacyId = cartItems[0]?.pharmacyId;
    if (!primaryPharmacyId) {
      setPharmacyPaymentInfo(null);
      return;
    }

    const fetchPharmacyPayment = async () => {
      try {
        setPharmacyLoading(true);
        const res = await fetch(`https://maveshi-sehat-api.onrender.com/api/pharmacy/${primaryPharmacyId}/payment-info`);
        if (res.ok) {
          const data = await res.json();
          setPharmacyPaymentInfo(data);
        }
      } catch (err) {
        console.warn('Failed to load pharmacy payment info:', err);
      } finally {
        setPharmacyLoading(false);
      }
    };

    fetchPharmacyPayment();
  }, [cartItems]);

  const handleIncrement = (item) => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemoveItem = (item) => {
    Alert.alert(
      t('Remove Item'),
      `${t('Are you sure you want to remove')} ${item.name} ${t('from your cart?')}`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Remove'),
          style: 'destructive',
          onPress: () => removeFromCart(item.id)
        }
      ]
    );
  };

  // Open Address Edit Modal
  const handleOpenAddressModal = () => {
    setEditName(buyerName);
    setEditPhone(phone);
    setEditStreet(streetAddress);
    setEditDistrict(district);
    setIsAddressModalVisible(true);
  };

  // Save Address
  const handleSaveAddress = () => {
    if (!editName.trim() || editName.trim().length < 3) {
      Alert.alert(t('Validation Error'), t('Please enter recipient full name (minimum 3 characters)'));
      return;
    }
    const cleanPhone = editPhone.trim().replace(/[\s\-]/g, '');
    const pkPhoneRegex = /^(03\d{9}|\+923\d{9})$/;
    if (!pkPhoneRegex.test(cleanPhone)) {
      Alert.alert(t('Validation Error'), t('Please enter a valid Pakistani mobile number (e.g. 03001234567)'));
      return;
    }
    if (!editStreet.trim() || editStreet.trim().length < 5) {
      Alert.alert(t('Validation Error'), t('Please enter delivery address / street / village (minimum 5 characters)'));
      return;
    }

    setBuyerName(editName.trim());
    setPhone(cleanPhone);
    setStreetAddress(editStreet.trim());
    setDistrict(editDistrict.trim() || 'Lahore');

    // Persist to profile store
    updateProfile({
      deliveryAddress: editStreet.trim(),
      phone: cleanPhone,
      location: editDistrict.trim() || district
    });

    setIsAddressModalVisible(false);
  };

  // Main Checkout Button Press
  const handleCheckoutPress = () => {
    if (cartItems.length === 0) {
      Alert.alert(t('Empty Cart'), t('Please add medicines to place an order.'));
      return;
    }

    if (isStoreLocked) {
      Alert.alert(
        t('Pharmacy Store Paused'),
        `${pharmacyPaymentInfo?.pharmacyName || t('This pharmacy')} ${t('is temporarily paused due to platform commission settlement. Orders cannot be placed at this time.')}`
      );
      return;
    }

    // Require complete address
    if (!streetAddress.trim()) {
      Alert.alert(
        t('Address Required'),
        t('Please enter your complete delivery street address / village to proceed with the order.'),
        [
          { text: t('Add Address'), onPress: handleOpenAddressModal }
        ]
      );
      return;
    }

    if (paymentMethod === 'Online') {
      // Open Pakistani Mobile Wallet payment sheet
      setWalletPhone(phone || '');
      setWalletMpin('');
      setIsPaymentModalVisible(true);
    } else {
      // Place COD Order directly
      submitOrder({
        method: 'COD',
        paymentStatus: 'unpaid',
        transactionId: null
      });
    }
  };

  // Process Online Mobile Wallet (JazzCash / EasyPaisa) with Payment Proof Upload
  const handleAuthorizeOnlinePayment = async () => {
    const cleanSenderPhone = (orderSenderPhone || phone || '').trim().replace(/[\s\-]/g, '');
    const pkPhoneRegex = /^(03\d{9}|\+923\d{9})$/;
    if (!pkPhoneRegex.test(cleanSenderPhone)) {
      Alert.alert(t('Invalid Phone'), t('Please enter a valid Pakistani sender phone number (e.g. 03001234567)'));
      return;
    }
    if (!orderTransactionId || !orderTransactionId.trim()) {
      Alert.alert(t('TID Required'), t('Please enter the JazzCash Transaction ID (TID) from the confirmation SMS.'));
      return;
    }
    if (!orderProofImage) {
      Alert.alert(t('Proof Required'), t('Please attach a screenshot or photo of your JazzCash payment receipt.'));
      return;
    }

    setIsProcessingPayment(true);

    try {
      await submitOrder({
        method: selectedWallet,
        paymentStatus: 'pending_verification',
        transactionId: orderTransactionId.trim(),
        senderPhone: cleanSenderPhone,
        paymentProofBase64: orderProofImage.base64
      });

      setIsPaymentModalVisible(false);
      setOrderProofImage(null);
      setOrderTransactionId('');
    } catch (err) {
      Alert.alert(t('Payment Submission Failed'), err.message || t('Could not submit payment proof'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Submit Order to Backend
  const submitOrder = async ({ method, paymentStatus, transactionId, senderPhone, paymentProofBase64 }) => {
    try {
      setLoading(true);
      const baseUrl = 'https://maveshi-sehat-api.onrender.com';
      const primaryPharmacyId = cartItems[0].pharmacyId;

      const fullDeliveryAddress = `${streetAddress}${district ? `, ${district}` : ''}`;

      const orderPayload = {
        userId: profile?.userId || (route.params && route.params.userId) || null,
        buyerName: buyerName,
        pharmacyId: primaryPharmacyId,
        totalPrice: total,
        paymentMethod: method,
        paymentStatus: paymentStatus,
        transactionId: transactionId,
        senderPhone: senderPhone || phone,
        paymentProofBase64: paymentProofBase64 || null,
        deliveryAddress: fullDeliveryAddress,
        phone: phone,
        items: cartItems.map(item => ({
          medicineId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await fetch(`${baseUrl}/api/pharmacy/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Store completed order info and show receipt modal
      setCompletedOrder({
        id: data.id,
        total: total,
        paymentMethod: method,
        paymentStatus: paymentStatus,
        transactionId: transactionId,
        deliveryAddress: fullDeliveryAddress,
        phone: phone,
        itemsCount: cartItems.length
      });

      setIsSuccessModalVisible(true);
      clearCart();
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(t('Order Error'), error.message || t('Failed to place order. Check connection.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFinishAndNavigate = () => {
    setIsSuccessModalVisible(false);
    navigation.navigate('Dashboard');
  };

  const renderCartItem = (item) => {
    return (
      <View key={item.id} style={styles.itemCard}>
        <View style={styles.itemImgBox}>
          {item.image_url ? (
            <Image source={{ uri: getImageUrl(item.image_url) }} style={styles.itemImg} />
          ) : (
            <Image 
              source={{ 
                uri: item.category && item.category.toLowerCase() === 'vaccine' 
                  ? 'https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&q=80&w=200' 
                  : 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=200' 
              }} 
              style={styles.itemImg} 
            />
          )}
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemNameText} numberOfLines={1}>{t(item.name, item.nameUrdu || item.name)}</Text>
          {item.strength ? (
            <View style={styles.itemStrengthBadge}>
              <Text style={styles.itemStrengthText}>{item.strength}</Text>
            </View>
          ) : null}
          <Text style={styles.itemPriceText}>Rs. {Math.round(item.price * item.quantity)}</Text>
        </View>

        <View style={styles.itemControls}>
          <View style={styles.counterRow}>
            <TouchableOpacity 
              style={styles.counterBtn} 
              onPress={() => handleDecrement(item)}
              activeOpacity={0.7}
            >
              <Feather name="minus" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <Text style={styles.counterVal}>{item.quantity}</Text>
            
            <TouchableOpacity 
              style={styles.counterBtn} 
              onPress={() => handleIncrement(item)}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => handleRemoveItem(item)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={15} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={isDark ? colors.headerBackground : colors.primary} 
      />

      {/* Modern Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>{t('Shopping Cart')}</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{cartItems.length} {t('Items')}</Text>
        </View>
      </View>

      {/* Main Surface Body Container */}
      <View style={styles.mainContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="shopping-bag" size={42} color={colors.primary} />
              </View>
              <Text style={styles.emptyText}>{t('Your cart is empty')}</Text>
              <Text style={styles.emptySubtext}>
                {t('Explore veterinary medicines, supplements, and vaccines in the marketplace.')}
              </Text>
              <TouchableOpacity 
                style={styles.shopNowBtn}
                onPress={() => navigation.navigate('Marketplace')}
                activeOpacity={0.8}
              >
                <Text style={styles.shopNowBtnText}>{t('Browse Medicines')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Pharmacy Store & Fulfillment Info Card */}
              {pharmacyPaymentInfo && (
                <View style={{
                  backgroundColor: isStoreLocked ? '#FEF2F2' : (isDark ? '#1E293B' : '#F0FDF4'),
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: isStoreLocked ? '#F87171' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#BBF7D0'),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    <MaterialCommunityIcons 
                      name={isStoreLocked ? "store-off" : "storefront"} 
                      size={20} 
                      color={isStoreLocked ? "#DC2626" : "#059669"} 
                      style={{ marginRight: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: isStoreLocked ? "#991B1B" : (isDark ? '#FFF' : '#065F46') }}>
                        {pharmacyPaymentInfo.pharmacyName}
                      </Text>
                      <Text style={{ fontSize: 11, color: isStoreLocked ? "#B91C1C" : (isDark ? '#94A3B8' : '#047857'), marginTop: 2 }}>
                        {isStoreLocked 
                          ? t('Store temporarily paused for commission settlement') 
                          : t('Responsible for order fulfillment & delivery')}
                      </Text>
                    </View>
                  </View>
                  <View style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: isStoreLocked ? '#FEE2E2' : '#DCFCE7'
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isStoreLocked ? '#DC2626' : '#16A34A' }}>
                      {isStoreLocked ? t('Paused') : t('Active')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Cart Items List */}
              <View style={styles.itemsWrapper}>
                {cartItems.map((item) => renderCartItem(item))}
              </View>

              {/* Delivery Address Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <Feather name="map-pin" size={16} color={colors.primary} />
                    <Text style={styles.cardHeaderTitle}>{t('Delivery Address')}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.changeAddressChip}
                    onPress={handleOpenAddressModal}
                    activeOpacity={0.7}
                  >
                    <Feather name="edit-2" size={12} color={isDark ? '#34D399' : '#047857'} />
                    <Text style={styles.changeAddressChipText}>{streetAddress ? t('Change') : t('Add')}</Text>
                  </TouchableOpacity>
                </View>

                {streetAddress ? (
                  <View style={styles.addressBody}>
                    <View style={styles.addressRow}>
                      <View style={styles.addressIconBox}>
                        <Feather name="user" size={14} color={colors.primary} />
                      </View>
                      <View style={styles.addressInfo}>
                        <Text style={styles.buyerNameText}>{buyerName}</Text>
                        <Text style={styles.phoneText}>{phone}</Text>
                      </View>
                    </View>

                    <View style={styles.addressRow}>
                      <View style={styles.addressIconBox}>
                        <Feather name="navigation" size={14} color={colors.primary} />
                      </View>
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressText}>
                          {streetAddress}{district ? `, ${district}` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.addressEmptyNotice}>
                    <Text style={styles.addressEmptyText}>
                      {t('Recipient:')} <Text style={{ fontWeight: '700' }}>{buyerName}</Text> ({phone})
                    </Text>
                    <Text style={styles.addressEmptyText}>
                      {t('Please specify your street address or village to ensure timely delivery.')}
                    </Text>
                    <TouchableOpacity 
                      style={styles.addAddressBtn}
                      onPress={handleOpenAddressModal}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addAddressBtnText}>{t('+ Enter Delivery Address')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Order Summary Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <Feather name="file-text" size={16} color={colors.primary} />
                    <Text style={styles.cardHeaderTitle}>{t('Order Summary')}</Text>
                  </View>
                </View>

                <View style={styles.summaryTable}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t('Items Subtotal')}</Text>
                    <Text style={styles.summaryValue}>Rs. {Math.round(subtotal)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.summaryLabel}>{t('Delivery Charges')}</Text>
                      <View style={styles.deliveryFreeBadge}>
                        <Text style={styles.deliveryFreeText}>{t('Standard')}</Text>
                      </View>
                    </View>
                    <Text style={styles.summaryValue}>Rs. {deliveryCharges}</Text>
                  </View>
                  
                  <View style={styles.divider} />

                  <View style={styles.summaryRowTotal}>
                    <Text style={styles.totalLabel}>{t('Grand Total')}</Text>
                    <Text style={styles.totalValue}>Rs. {Math.round(total)}</Text>
                  </View>
                </View>
              </View>

              {/* Payment Method Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <Feather name="credit-card" size={16} color={colors.primary} />
                    <Text style={styles.cardHeaderTitle}>{t('Payment Method')}</Text>
                  </View>
                </View>

                <View style={styles.paymentOptions}>
                  {/* Cash on Delivery */}
                  <TouchableOpacity 
                    style={[styles.paymentCard, paymentMethod === 'COD' && styles.paymentCardSelected]}
                    onPress={() => setPaymentMethod('COD')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.paymentIconCircle, paymentMethod === 'COD' && styles.paymentIconCircleSelected]}>
                      <MaterialCommunityIcons 
                        name="cash-multiple" 
                        size={22} 
                        color={paymentMethod === 'COD' ? colors.primary : colors.textSecondary} 
                      />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>{t('Cash on Delivery')}</Text>
                      <Text style={styles.paymentDesc}>{t('Pay in cash upon doorstep delivery to your farm')}</Text>
                    </View>
                    <View style={[styles.radioDotOuter, paymentMethod === 'COD' && styles.radioDotOuterSelected]}>
                      {paymentMethod === 'COD' && <View style={styles.radioDotInner} />}
                    </View>
                  </TouchableOpacity>

                  {/* JazzCash / EasyPaisa Online */}
                  <TouchableOpacity 
                    style={[styles.paymentCard, paymentMethod === 'Online' && styles.paymentCardSelected]}
                    onPress={() => setPaymentMethod('Online')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.paymentIconCircle, paymentMethod === 'Online' && styles.paymentIconCircleSelected]}>
                      <MaterialCommunityIcons 
                        name="cellphone-check" 
                        size={22} 
                        color={paymentMethod === 'Online' ? colors.primary : colors.textSecondary} 
                      />
                    </View>
                    <View style={styles.paymentInfo}>
                      <View style={styles.paymentHeaderLine}>
                        <Text style={styles.paymentName}>{t('JazzCash / EasyPaisa')}</Text>
                        <View style={styles.instantBadge}>
                          <Text style={styles.instantBadgeText}>{t('Instant')}</Text>
                        </View>
                      </View>
                      <Text style={styles.paymentDesc}>{t('Pay securely online via your mobile wallet account')}</Text>
                    </View>
                    <View style={[styles.radioDotOuter, paymentMethod === 'Online' && styles.radioDotOuterSelected]}>
                      {paymentMethod === 'Online' && <View style={styles.radioDotInner} />}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Sticky Fixed Bottom Checkout Action Bar */}
        {cartItems.length > 0 && (
          <View style={styles.bottomBarContainer}>
            <View style={styles.bottomBarContent}>
              <View style={styles.bottomTotalBlock}>
                <Text style={styles.bottomTotalLabel}>{t('Total Payable')}</Text>
                <Text style={styles.bottomTotalValue}>Rs. {Math.round(total)}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]}
                onPress={handleCheckoutPress}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather 
                      name={paymentMethod === 'Online' ? 'shield' : 'check-circle'} 
                      size={18} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.checkoutBtnText}>
                      {paymentMethod === 'Online' ? t('Pay Online') : t('Place Order')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Address Edit / Entry Modal */}
      <Modal
        visible={isAddressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAddressModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Delivery Address')}</Text>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {t('Enter your accurate farm or residence address for medicine delivery.')}
            </Text>

            <Text style={styles.modalFieldLabel}>{t('Recipient Full Name')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('Enter full name')}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.modalFieldLabel}>{t('Contact Phone Number')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="03XXXXXXXXX"
              keyboardType="phone-pad"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.modalFieldLabel}>{t('Delivery Address / Village / Street')}</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              value={editStreet}
              onChangeText={setEditStreet}
              placeholder="e.g. House # 14, Street 5, Near Main Market"
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
            />

            <Text style={styles.modalFieldLabel}>{t('Tehsil / City / District')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editDistrict}
              onChangeText={setEditDistrict}
              placeholder="e.g. Depalpur, Okara / Lahore"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.modalBtnSecondary}
                onPress={() => setIsAddressModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnSecondaryText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalBtnPrimary}
                onPress={handleSaveAddress}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnPrimaryText}>{t('Save Address')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Online Mobile Wallet Payment Sheet (JazzCash & EasyPaisa) */}
      <Modal
        visible={isPaymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isProcessingPayment && setIsPaymentModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.payModalCard}>
            <View style={styles.payModalHeader}>
              <View style={styles.payModalTitleRow}>
                <Feather name="shield" size={20} color={colors.primary} />
                <Text style={styles.payModalTitle}>{t('JazzCash Payment Checkout')}</Text>
              </View>
              {!isProcessingPayment && (
                <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                  <Feather name="x" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Payable Amount Banner */}
              <View style={styles.payAmountBanner}>
                <Text style={styles.payAmountLabel}>{t('Amount Payable')}</Text>
                <Text style={styles.payAmountValue}>Rs. {Math.round(total)}</Text>
              </View>

              {/* Wallet Transfer Details Box */}
              <View style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FEF2F2',
                borderRadius: 14,
                padding: 14,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: '#FCA5A5'
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Pharmacy Name')}:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{pharmacyPaymentInfo?.pharmacyName || t('Official Pharmacy')}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('Account Title')}:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{activePayTitle}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{activePayWallet} {t('Number')}:</Text>
                  <TouchableOpacity onPress={copyPaymentNumber} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#DC2626', marginRight: 6 }}>
                      {activePayNumber}
                    </Text>
                    <Feather name="copy" size={13} color="#DC2626" />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                  {t('Transfer Rs.')} {Math.round(total)} {t('directly to the pharmacy account above. The pharmacy is responsible for verifying your payment and managing delivery.')}
                </Text>
              </View>

              {/* Sender Phone Input */}
              <Text style={styles.modalFieldLabel}>
                {t('Sender JazzCash Phone Number')} *
              </Text>
              <TextInput
                style={styles.modalInput}
                value={orderSenderPhone}
                onChangeText={setOrderSenderPhone}
                placeholder="03XXXXXXXXX"
                keyboardType="phone-pad"
                maxLength={11}
                placeholderTextColor={colors.textMuted}
                editable={!isProcessingPayment}
              />

              {/* TID Input */}
              <Text style={styles.modalFieldLabel}>
                {t('Transaction ID (TID)')} *
              </Text>
              <TextInput
                style={styles.modalInput}
                value={orderTransactionId}
                onChangeText={setOrderTransactionId}
                placeholder="e.g. 01847583920"
                placeholderTextColor={colors.textMuted}
                editable={!isProcessingPayment}
              />

              {/* Proof Image Upload */}
              <Text style={styles.modalFieldLabel}>
                {t('Payment Receipt Screenshot')} *
              </Text>

              {orderProofImage ? (
                <View style={{ marginBottom: 14, position: 'relative' }}>
                  <Image
                    source={{ uri: orderProofImage.uri }}
                    style={{ width: '100%', height: 140, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: 14,
                      padding: 5
                    }}
                    onPress={() => setOrderProofImage(null)}
                  >
                    <Feather name="trash-2" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                      borderStyle: 'dashed'
                    }}
                    onPress={() => handlePickOrderProof(false)}
                  >
                    <Feather name="image" size={18} color="#059669" style={{ marginBottom: 2 }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>
                      {t('Gallery Receipt')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                      borderStyle: 'dashed'
                    }}
                    onPress={() => handlePickOrderProof(true)}
                  >
                    <Feather name="camera" size={18} color="#0284C7" style={{ marginBottom: 2 }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>
                      {t('Take Photo')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Authorize & Submit Order Button */}
              <TouchableOpacity
                style={[
                  styles.paySubmitBtn,
                  { backgroundColor: '#059669' },
                  isProcessingPayment && { opacity: 0.7 }
                ]}
                onPress={handleAuthorizeOnlinePayment}
                disabled={isProcessingPayment}
                activeOpacity={0.85}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.paySubmitBtnText}>
                      {t('Submit Order with Payment Proof')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Order & Payment Success Receipt Modal */}
      <Modal
        visible={isSuccessModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptCheckCircle}>
              <Feather name="check" size={38} color="#15803D" />
            </View>
            <Text style={styles.receiptTitle}>
              {completedOrder?.paymentStatus === 'pending_verification'
                ? t('Order Placed - Payment Under Review')
                : (completedOrder?.paymentMethod === 'COD' 
                  ? t('Order Placed Successfully!') 
                  : t('Payment & Order Confirmed!'))
              }
            </Text>
            <Text style={styles.receiptSubtitle}>
              {completedOrder?.paymentStatus === 'pending_verification'
                ? t('Your JazzCash payment proof has been submitted. The pharmacy and admin will verify the receipt and dispatch your medicines.')
                : t('Your medicine order has been sent to the pharmacy for packaging and dispatch.')
              }
            </Text>

            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>{t('Order ID')}</Text>
                <Text style={styles.receiptRowValue}>{completedOrder?.id}</Text>
              </View>

              {completedOrder?.transactionId ? (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>{t('Transaction ID')}</Text>
                  <Text style={styles.receiptTidValue}>{completedOrder.transactionId}</Text>
                </View>
              ) : null}

              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>{t('Payment Method')}</Text>
                <Text style={styles.receiptRowValue}>{completedOrder?.paymentMethod}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>{t('Payment Status')}</Text>
                <Text style={[
                  styles.receiptRowValue, 
                  completedOrder?.paymentStatus === 'paid' ? { color: '#059669' } : { color: '#D97706' }
                ]}>
                  {(completedOrder?.paymentStatus || 'unpaid').toUpperCase()}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>{t('Total Paid')}</Text>
                <Text style={[styles.receiptRowValue, { fontWeight: '900', color: colors.primary }]}>
                  Rs. {Math.round(completedOrder?.total || 0)}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>{t('Deliver To')}</Text>
                <Text style={[styles.receiptRowValue, { maxWidth: '65%', textAlign: 'right' }]} numberOfLines={2}>
                  {completedOrder?.deliveryAddress}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.receiptDoneBtn, { backgroundColor: '#059669', marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.navigate('OrderHistory', { userId: profile?.userId, phone: phone });
              }}
              activeOpacity={0.85}
            >
              <Feather name="package" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.receiptDoneBtnText}>{t('Track My Orders')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.receiptDoneBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={handleFinishAndNavigate}
              activeOpacity={0.85}
            >
              <Text style={[styles.receiptDoneBtnText, { color: colors.textSecondary }]}>{t('Back to Dashboard')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
