import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, ScrollView, 
  TouchableOpacity, StatusBar, Alert, Platform, Image, TextInput, Modal 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, updateProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { 
  getCart, getCartTotal, updateQuantity, removeFromCart, clearCart, subscribeCart 
} from '../../utils/cartStore';

const getImageUrl = (url) => {
  if (!url) return null;
  if (Platform.OS === 'android') {
    return url.replace('localhost:5000', '10.0.2.2:5000').replace('127.0.0.1:5000', '10.0.2.2:5000');
  }
  return url;
};

export default function CartScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [profile] = useState(getProfile());
  const [cartItems, setCartItems] = useState(getCart());
  const [subtotal, setSubtotal] = useState(getCartTotal());
  const [paymentMethod, setPaymentMethod] = useState('COD'); 
  const [loading, setLoading] = useState(false);

  
  const [buyerName, setBuyerName] = useState(profile.userName || 'Muhammad Ahmed');
  const [buyerNameUrdu, setBuyerNameUrdu] = useState(profile.userNameUrdu || 'محمد احمد');
  const [phone, setPhone] = useState(profile.phone || '+92 300 1234567');
  const [location, setLocation] = useState(
    profile.location === 'Okara, Punjab' 
      ? 'Village Chak 123, Tehsil Depalpur, District Okara, Punjab' 
      : profile.location
  );
  const [isEditingAddress, setIsEditingAddress] = useState(false);

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

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert(t('Empty Cart', 'خالی ٹوکری'), t('Please add medicines to place an order.', 'براہ کرم آرڈر کرنے کے لیے دوائیں شامل کریں۔'));
      return;
    }

    try {
      setLoading(true);
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      
      
      const primaryPharmacyId = cartItems[0].pharmacyId;

      const orderPayload = {
        buyerName: buyerName,
        buyerNameUrdu: buyerNameUrdu,
        pharmacyId: primaryPharmacyId,
        totalPrice: total,
        paymentMethod: paymentMethod === 'COD' ? 'COD' : 'JazzCash / EasyPaisa',
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

      Alert.alert(
        t('Success', 'کامیابی'), 
        t(`Order ${data.id} placed successfully!`, `آرڈر ${data.id} کامیابی سے موصول ہو گیا ہے!`),
        [
          { 
            text: 'OK', 
            onPress: () => {
              clearCart();
              navigation.navigate('Dashboard');
            } 
          }
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(t('Error', 'خرابی'), t('Failed to place order. Check connection.', 'آرڈر دینے میں ناکامی۔ انٹرنیٹ چیک کریں۔'));
    } finally {
      setLoading(false);
    }
  };

  
  const getMedIcon = (item) => {
    const form = (item.dosageForm || '').toLowerCase();
    const cat = item.category.toLowerCase();
    
    if (form.includes('injection') || form.includes('vial')) {
      return <MaterialCommunityIcons name="needle" size={28} color="#58D66D" />;
    }
    if (cat === 'vaccine') {
      return <MaterialCommunityIcons name="pill" size={28} color="#FF5252" />;
    }
    return <MaterialCommunityIcons name="bottle-tonic-plus" size={28} color="#FFB020" />;
  };

  const renderCartItem = ({ item }) => {
    return (
      <View style={styles.itemCard}>
        
        <View style={styles.itemImgBox}>
          {item.image_url ? (
            <Image source={{ uri: getImageUrl(item.image_url) }} style={styles.itemImg} />
          ) : (
            <Image 
              source={{ 
                uri: item.category.toLowerCase() === 'vaccine' 
                  ? 'https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&q=80&w=200' 
                  : 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=200' 
              }} 
              style={styles.itemImg} 
            />
          )}
        </View>

        
        <View style={styles.itemDetails}>
          <Text style={styles.itemNameText}>{item.name}</Text>
          {item.nameUrdu ? (
            <Text style={styles.itemNameUrdu} className="urdu">{item.nameUrdu}</Text>
          ) : null}
          <Text style={styles.itemStrengthText}>{item.strength}</Text>
          <Text style={styles.itemPriceText}>Rs. {Math.round(item.price * item.quantity)}</Text>
        </View>

        
        <View style={styles.itemControls}>
          <View style={styles.counterRow}>
            <TouchableOpacity 
              style={styles.counterBtn} 
              onPress={() => handleDecrement(item)}
              activeOpacity={0.7}
            >
              <Feather name="minus" size={14} color="#64748B" />
            </TouchableOpacity>
            
            <Text style={styles.counterVal}>{item.quantity}</Text>
            
            <TouchableOpacity 
              style={styles.counterBtn} 
              onPress={() => handleIncrement(item)}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => removeFromCart(item.id)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={16} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.headerSubtitle} className="urdu">خریداری کی ٹوکری</Text>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="shopping-bag" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>{t('Your cart is empty', 'آپ کی ٹوکری خالی ہے')}</Text>
            <TouchableOpacity 
              style={styles.shopNowBtn}
              onPress={() => navigation.navigate('Marketplace')}
            >
              <Text style={styles.shopNowBtnText}>{t('Shop Now', 'خریداری کریں')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemsWrapper}>
            {cartItems.map((item) => (
              <View key={item.id}>
                {renderCartItem({ item })}
              </View>
            ))}
          </View>
        )}

        {cartItems.length > 0 && (
          <>
            
            <View style={styles.cardContainer}>
              <View style={styles.cardHeaderRow}>
                <Feather name="map-pin" size={16} color="#4CB85C" />
                <Text style={styles.cardHeaderTitle}>{t('Delivery Address', 'ڈیلیوری ایڈریس')}</Text>
              </View>

              <View style={styles.addressBody}>
                <Text style={styles.buyerNameText}>{profile.userName}</Text>
                
                
                <Text style={styles.addressText}>
                  {profile.location === 'Okara, Punjab' 
                    ? 'Village Chak 123, Tehsil Depalpur, District Okara, Punjab' 
                    : profile.location}
                </Text>
                
                <Text style={styles.phoneText}>{profile.phone}</Text>

                <TouchableOpacity style={styles.changeAddressLink}>
                  <Text style={styles.changeAddressLinkText}>{t('Change Address', 'پتہ تبدیل کریں')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            
            <View style={styles.cardContainer}>
              <View style={styles.cardHeaderRow}>
                <Feather name="file-text" size={16} color="#4CB85C" />
                <Text style={styles.cardHeaderTitle}>{t('Order Summary', 'آرڈر کی تفصیل')}</Text>
              </View>

              <View style={styles.summaryTable}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('Subtotal', 'ذیلی کل')}</Text>
                  <Text style={styles.summaryValue}>Rs. {Math.round(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('Delivery Charges', 'ڈیلیوری چارجز')}</Text>
                  <Text style={styles.summaryValue}>Rs. {deliveryCharges}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRowTotal}>
                  <Text style={styles.totalLabel}>{t('Total', 'کل رقم')}</Text>
                  <Text style={styles.totalValue}>Rs. {Math.round(total)}</Text>
                </View>
              </View>
            </View>

            
            <View style={styles.cardContainer}>
              <View style={styles.cardHeaderRow}>
                <Feather name="credit-card" size={16} color="#4CB85C" />
                <Text style={styles.cardHeaderTitle}>{t('Payment Method', 'ادائیگی کا طریقہ')}</Text>
              </View>

              <View style={styles.paymentOptions}>
                
                <TouchableOpacity 
                  style={[styles.paymentCard, paymentMethod === 'COD' && styles.paymentCardSelected]}
                  onPress={() => setPaymentMethod('COD')}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioDotOuter}>
                    {paymentMethod === 'COD' && <View style={styles.radioDotInner} />}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>{t('Cash on Delivery', 'کیش آن ڈیلیوری')}</Text>
                    <Text style={styles.paymentDesc}>{t('Pay when you receive', 'پہنچنے پر نقد رقم ادا کریں')}</Text>
                  </View>
                </TouchableOpacity>

                
                <TouchableOpacity 
                  style={[styles.paymentCard, paymentMethod === 'Online' && styles.paymentCardSelected]}
                  onPress={() => setPaymentMethod('Online')}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioDotOuter}>
                    {paymentMethod === 'Online' && <View style={styles.radioDotInner} />}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>{t('JazzCash / EasyPaisa', 'جاز کیش / ایزی پیسہ')}</Text>
                    <Text style={styles.paymentDesc}>{t('Pay online securely', 'آن لائن ادائیگی کریں')}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            
            <TouchableOpacity 
              style={[styles.placeOrderBtn, loading && styles.placeOrderBtnDisabled]}
              onPress={handlePlaceOrder}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.placeOrderBtnText}>
                {loading 
                  ? t('Processing...', 'عمل ہو رہا ہے...') 
                  : `${t('Place Order', 'آرڈر کریں')} - Rs. ${Math.round(total)}`
                }
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 14,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 2,
  },
  headerTitleBlock: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
  },
  headerSubtitle: {
    color: '#E8F8EA',
    fontSize: 12,
    marginTop: 2,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  shopNowBtn: {
    backgroundColor: '#4CB85C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  shopNowBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemsWrapper: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8F2EC',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImgBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3FBF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  itemNameUrdu: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  itemStrengthText: {
    fontSize: 11,
    color: '#64748B',
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4CB85C',
    marginTop: 2,
  },
  itemControls: {
    alignItems: 'flex-end',
    gap: 10,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    height: 28,
  },
  counterBtn: {
    width: 26,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  counterVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    paddingHorizontal: 10,
  },
  deleteBtn: {
    padding: 2,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    textTransform: 'uppercase',
  },
  addressBody: {
    gap: 4,
  },
  buyerNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  phoneText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  changeAddressLink: {
    marginTop: 8,
  },
  changeAddressLinkText: {
    fontSize: 12,
    color: '#4CB85C',
    fontWeight: 'bold',
  },
  summaryTable: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4CB85C',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  paymentOptions: {
    gap: 10,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  paymentCardSelected: {
    borderColor: '#4CB85C',
    backgroundColor: '#F3FBF5',
  },
  radioDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CB85C',
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  paymentDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  placeOrderBtn: {
    backgroundColor: '#58D66D',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4CB85C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  placeOrderBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  placeOrderBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  }
});
