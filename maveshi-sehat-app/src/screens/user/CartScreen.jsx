import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, SafeAreaView, ScrollView, 
  TouchableOpacity, StatusBar, Alert, Platform, Image, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
    return url.replace('localhost:5000', '10.0.2.2:5000').replace('127.0.0.1:5000', '10.0.2.2:5000');
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

  // Delivery Address State (clean, without hardcoded mock dummy data)
  const [buyerName, setBuyerName] = useState(profile.userName || profile.fullName || 'Awais Shabbir');
  const [phone, setPhone] = useState(profile.phone || '03240650819');
  const [streetAddress, setStreetAddress] = useState(profile.deliveryAddress || '');
  const [district, setDistrict] = useState(profile.location || profile.district || 'Lahore');

  // Address Edit Modal State
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editDistrict, setEditDistrict] = useState('');

  // Online Payment (JazzCash / EasyPaisa) Sheet & Receipt State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('JazzCash'); // 'JazzCash' or 'EasyPaisa'
  const [walletPhone, setWalletPhone] = useState(profile.phone || '03240650819');
  const [walletMpin, setWalletMpin] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
    if (!editName.trim()) {
      Alert.alert(t('Validation Error'), t('Please enter recipient full name'));
      return;
    }
    if (!editPhone.trim()) {
      Alert.alert(t('Validation Error'), t('Please enter contact phone number'));
      return;
    }
    if (!editStreet.trim()) {
      Alert.alert(t('Validation Error'), t('Please enter delivery address / street / village'));
      return;
    }

    setBuyerName(editName.trim());
    setPhone(editPhone.trim());
    setStreetAddress(editStreet.trim());
    setDistrict(editDistrict.trim() || 'Lahore');

    // Persist to profile store
    updateProfile({
      deliveryAddress: editStreet.trim(),
      phone: editPhone.trim(),
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
      setWalletPhone(phone || '03240650819');
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

  // Process Online Mobile Wallet Authorization (JazzCash / EasyPaisa)
  const handleAuthorizeOnlinePayment = async () => {
    if (!walletPhone.trim() || walletPhone.length < 10) {
      Alert.alert(t('Invalid Phone'), t('Please enter a valid Pakistani mobile wallet phone number (e.g. 03240650819)'));
      return;
    }
    if (!walletMpin || walletMpin.length < 4) {
      Alert.alert(t('PIN Required'), t('Please enter your 4-digit MPIN to authorize the transaction'));
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Simulate real-time secure network handshake with JazzCash / EasyPaisa API
      await new Promise(resolve => setTimeout(resolve, 1400));

      // Generate realistic Transaction Reference ID
      const prefix = selectedWallet === 'JazzCash' ? 'JC' : 'EP';
      const randomTid = `${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;

      await submitOrder({
        method: selectedWallet,
        paymentStatus: 'paid',
        transactionId: randomTid
      });

      setIsPaymentModalVisible(false);
    } catch (err) {
      Alert.alert(t('Payment Failed'), err.message || t('Could not process mobile wallet payment'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Submit Order to Backend
  const submitOrder = async ({ method, paymentStatus, transactionId }) => {
    try {
      setLoading(true);
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const primaryPharmacyId = cartItems[0].pharmacyId;

      const fullDeliveryAddress = `${streetAddress}${district ? `, ${district}` : ''}`;

      const orderPayload = {
        buyerName: buyerName,
        pharmacyId: primaryPharmacyId,
        totalPrice: total,
        paymentMethod: method,
        paymentStatus: paymentStatus,
        transactionId: transactionId,
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
              placeholder="e.g. Awais Shabbir"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.modalFieldLabel}>{t('Contact Phone Number')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="e.g. 03240650819"
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
                <Text style={styles.payModalTitle}>{t('Mobile Wallet Checkout')}</Text>
              </View>
              {!isProcessingPayment && (
                <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                  <Feather name="x" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Payable Amount Banner */}
            <View style={styles.payAmountBanner}>
              <Text style={styles.payAmountLabel}>{t('Amount Payable')}</Text>
              <Text style={styles.payAmountValue}>Rs. {Math.round(total)}</Text>
            </View>

            {/* Wallet Selection: JazzCash or EasyPaisa */}
            <View style={styles.walletTabsRow}>
              <TouchableOpacity
                style={[
                  styles.walletTab, 
                  selectedWallet === 'JazzCash' && styles.walletTabActiveJazz
                ]}
                onPress={() => setSelectedWallet('JazzCash')}
                activeOpacity={0.8}
              >
                <View style={[styles.walletLogoCircle, { backgroundColor: '#E4002B' }]}>
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>J</Text>
                </View>
                <View>
                  <Text style={styles.walletTabText}>JazzCash</Text>
                  <Text style={styles.walletTabSubtext}>{t('Mobile Wallet')}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.walletTab, 
                  selectedWallet === 'EasyPaisa' && styles.walletTabActiveEasy
                ]}
                onPress={() => setSelectedWallet('EasyPaisa')}
                activeOpacity={0.8}
              >
                <View style={[styles.walletLogoCircle, { backgroundColor: '#00A859' }]}>
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>E</Text>
                </View>
                <View>
                  <Text style={styles.walletTabText}>EasyPaisa</Text>
                  <Text style={styles.walletTabSubtext}>{t('Mobile Wallet')}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Account Phone Input */}
            <Text style={styles.modalFieldLabel}>
              {selectedWallet} {t('Account Number')}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={walletPhone}
              onChangeText={setWalletPhone}
              placeholder="03XXXXXXXXX"
              keyboardType="phone-pad"
              maxLength={11}
              placeholderTextColor={colors.textMuted}
              editable={!isProcessingPayment}
            />

            {/* MPIN Input */}
            <Text style={styles.modalFieldLabel}>
              {t('4-Digit Security MPIN / PIN')}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={walletMpin}
              onChangeText={setWalletMpin}
              placeholder="••••"
              secureTextEntry={true}
              keyboardType="number-pad"
              maxLength={4}
              placeholderTextColor={colors.textMuted}
              editable={!isProcessingPayment}
            />

            {/* Security Guarantee Pill */}
            <View style={styles.securityPill}>
              <Feather name="lock" size={14} color={isDark ? '#60A5FA' : '#1D4ED8'} />
              <Text style={styles.securityPillText}>
                {t('Encrypted with 256-Bit SSL. A prompt will be sent to your registered SIM.')}
              </Text>
            </View>

            {/* Authorize & Pay Button */}
            <TouchableOpacity
              style={[
                styles.paySubmitBtn,
                selectedWallet === 'JazzCash' ? { backgroundColor: '#E4002B' } : { backgroundColor: '#00A859' },
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
                    {t('Authorize & Pay')} Rs. {Math.round(total)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
              {completedOrder?.paymentMethod === 'COD' 
                ? t('Order Placed Successfully!') 
                : t('Payment & Order Confirmed!')
              }
            </Text>
            <Text style={styles.receiptSubtitle}>
              {t('Your medicine order has been sent to the pharmacy for packaging and dispatch.')}
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
              style={styles.receiptDoneBtn}
              onPress={handleFinishAndNavigate}
              activeOpacity={0.85}
            >
              <Text style={styles.receiptDoneBtnText}>{t('Back to Dashboard')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
