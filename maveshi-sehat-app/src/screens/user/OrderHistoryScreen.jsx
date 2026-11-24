import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform, 
  Alert, 
  StatusBar, 
  Image, 
  Linking, 
  RefreshControl 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';
import { useTheme } from '../../utils/themeContext';
import { useTranslation } from '../../utils/translate';
import { getStyles } from '../../styles/OrderHistoryScreenStyles';

const BASE_URL = 'https://maveshi-sehat-api.onrender.com';

const getCleanImageUrl = (url) => {
  if (!url) return null;
  if (Platform.OS === 'android') {
    return url.replace('localhost:5000', 'maveshi-sehat-api.onrender.com').replace('127.0.0.1:5000', 'maveshi-sehat-api.onrender.com');
  }
  return url;
};

export default function OrderHistoryScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  const profile = getProfile();
  const userId = route.params?.userId || profile.userId;
  const userPhone = route.params?.phone || profile.phone;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'active', 'completed'
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const fetchOrders = useCallback(async (isPullRefresh = false) => {
    if (!isPullRefresh) setLoading(true);
    try {
      const targetUserId = userId || 0;
      const cleanPhone = (userPhone || '').trim();
      const url = `${BASE_URL}/api/pharmacy/orders/user/${targetUserId}?phone=${encodeURIComponent(cleanPhone)}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, userPhone, t]);

  useEffect(() => {
    fetchOrders();
    const unsub = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsub;
  }, [navigation, fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const activeOrders = useMemo(() => {
    return orders.filter(o => {
      const st = (o.status || '').toLowerCase();
      return st === 'pending' || st === 'processing' || st === 'dispatched';
    });
  }, [orders]);

  const completedOrders = useMemo(() => {
    return orders.filter(o => {
      const st = (o.status || '').toLowerCase();
      return st === 'completed' || st === 'delivered' || st === 'cancelled';
    });
  }, [orders]);

  const displayedOrders = useMemo(() => {
    if (selectedTab === 'active') return activeOrders;
    if (selectedTab === 'completed') return completedOrders;
    return orders;
  }, [selectedTab, activeOrders, completedOrders, orders]);

  // Order Condition / Step Tracker
  const renderConditionTracker = (status) => {
    const st = (status || '').toLowerCase();

    if (st === 'cancelled') {
      return (
        <View style={[styles.trackerContainer, { backgroundColor: isDark ? '#450A0A' : '#FEF2F2', borderColor: '#FECACA' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="x-circle" size={18} color="#DC2626" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#DC2626' }}>
              {t('Order Cancelled')}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: '#991B1B', marginTop: 4 }}>
            {t('This order was cancelled. Contact the pharmacy for any questions.')}
          </Text>
        </View>
      );
    }

    // Progression: 1: Placed, 2: Processing, 3: Dispatched, 4: Delivered
    let currentStep = 1;
    if (st === 'processing') currentStep = 2;
    if (st === 'dispatched') currentStep = 3;
    if (st === 'completed' || st === 'delivered') currentStep = 4;

    const steps = [
      { id: 1, label: t('Placed'), icon: 'shopping-cart' },
      { id: 2, label: t('Confirmed'), icon: 'check' },
      { id: 3, label: t('In Transit'), icon: 'truck' },
      { id: 4, label: t('Delivered'), icon: 'package' }
    ];

    return (
      <View style={styles.trackerContainer}>
        <View style={styles.trackerHeader}>
          <Text style={styles.trackerTitle}>{t('Order Condition')}</Text>
          <Text style={[
            styles.trackerCurrentStatus,
            { color: currentStep === 4 ? '#059669' : (currentStep === 3 ? '#0284C7' : '#D97706') }
          ]}>
            {st === 'pending' && t('Waiting for Confirmation')}
            {st === 'processing' && t('Packing at Pharmacy')}
            {st === 'dispatched' && t('On The Way')}
            {(st === 'completed' || st === 'delivered') && t('Delivered & Completed')}
          </Text>
        </View>

        <View style={styles.trackerStepsRow}>
          {/* Progress bar line */}
          <View style={[
            styles.trackerStepLine,
            { backgroundColor: isDark ? colors.border : '#E2E8F0' }
          ]}>
            <View style={{
              height: '100%',
              width: `${((currentStep - 1) / 3) * 100}%`,
              backgroundColor: '#059669',
              borderRadius: 2
            }} />
          </View>

          {steps.map((step) => {
            const isCompleted = step.id <= currentStep;
            const isCurrent = step.id === currentStep;
            return (
              <View key={step.id} style={styles.trackerStepItem}>
                <View style={[
                  styles.trackerStepNode,
                  {
                    backgroundColor: isCompleted ? '#059669' : (isDark ? colors.surface : '#FFFFFF'),
                    borderColor: isCompleted ? '#059669' : (isDark ? colors.border : '#CBD5E1')
                  }
                ]}>
                  <Feather 
                    name={step.icon} 
                    size={13} 
                    color={isCompleted ? '#FFFFFF' : (isDark ? colors.textMuted : '#94A3B8')} 
                  />
                </View>
                <Text style={[
                  styles.trackerStepLabel,
                  {
                    color: isCurrent ? colors.primary : (isCompleted ? '#059669' : colors.textMuted),
                    fontWeight: isCurrent ? '800' : '600'
                  }
                ]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Payment Status Badge
  const renderPaymentBadge = (method, payStatus, tid) => {
    const isPaid = (payStatus || '').toLowerCase() === 'paid';
    const isPending = (payStatus || '').toLowerCase() === 'pending_verification';
    const isRejected = (payStatus || '').toLowerCase() === 'rejected';

    let badgeBg = '#FEF3C7';
    let badgeColor = '#92400E';
    let badgeText = t('Cash on Delivery');

    if (method === 'JazzCash' || method === 'Online') {
      if (isPaid) {
        badgeBg = '#D1FAE5';
        badgeColor = '#065F46';
        badgeText = t('JazzCash Paid');
      } else if (isRejected) {
        badgeBg = '#FEE2E2';
        badgeColor = '#991B1B';
        badgeText = t('Payment Rejected');
      } else {
        badgeBg = '#EFF6FF';
        badgeColor = '#1E40AF';
        badgeText = t('JazzCash Under Review');
      }
    } else {
      if (isPaid) {
        badgeBg = '#D1FAE5';
        badgeColor = '#065F46';
        badgeText = t('Paid (COD)');
      }
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
            {badgeText}
          </Text>
        </View>
        {tid ? (
          <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
            TID: {tid}
          </Text>
        ) : null}
      </View>
    );
  };

  // Order Card Item
  const renderOrderItem = ({ item }) => {
    const isExpanded = Boolean(expandedOrders[item.id]);
    const itemsList = Array.isArray(item.items) ? item.items : [];
    const formattedDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';

    return (
      <View style={styles.orderCard}>
        {/* Card Header */}
        <View style={styles.orderCardHeader}>
          <View>
            <Text style={styles.orderIdText}>{item.id}</Text>
            <Text style={styles.orderDateText}>{formattedDate}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === 'completed' || item.status === 'delivered'
                ? '#DCFCE7' 
                : (item.status === 'cancelled' ? '#FEE2E2' : '#EFF6FF')
            }
          ]}>
            <Feather 
              name={item.status === 'completed' || item.status === 'delivered' ? 'check-circle' : (item.status === 'cancelled' ? 'x-circle' : 'clock')} 
              size={12} 
              color={item.status === 'completed' || item.status === 'delivered' ? '#15803D' : (item.status === 'cancelled' ? '#DC2626' : '#0284C7')} 
            />
            <Text style={[
              styles.statusBadgeText,
              {
                color: item.status === 'completed' || item.status === 'delivered' 
                  ? '#15803D' 
                  : (item.status === 'cancelled' ? '#DC2626' : '#0284C7')
              }
            ]}>
              {item.status ? item.status.toUpperCase() : 'PENDING'}
            </Text>
          </View>
        </View>

        {/* Condition Tracker */}
        {renderConditionTracker(item.status)}

        {/* Pharmacy Details Box */}
        {item.pharmacy_name ? (
          <View style={styles.pharmacyInfoBox}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="shield" size={14} color="#15803D" />
                <Text style={styles.pharmacyName}>{item.pharmacy_name}</Text>
              </View>
              {item.pharmacy_city ? (
                <Text style={styles.pharmacyLocation}>
                  <Feather name="map-pin" size={10} color={colors.textSecondary} /> {item.pharmacy_city}
                </Text>
              ) : null}
            </View>

            {item.pharmacy_phone ? (
              <TouchableOpacity 
                style={styles.callPharmacyBtn}
                onPress={() => Linking.openURL(`tel:${item.pharmacy_phone}`)}
                activeOpacity={0.8}
              >
                <Feather name="phone" size={12} color="#FFFFFF" />
                <Text style={styles.callPharmacyBtnText}>{t('Call')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Ordered Medicines Section */}
        <View style={styles.itemsSection}>
          <TouchableOpacity 
            style={styles.itemsHeader}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.itemsSectionTitle}>
              {t('Ordered Medicines')} ({itemsList.length} {itemsList.length === 1 ? t('item') : t('items')})
            </Text>
            <Feather 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          {/* Show first item or all if expanded */}
          {(isExpanded ? itemsList : itemsList.slice(0, 2)).map((med, idx) => (
            <View key={med.id || idx} style={styles.itemRow}>
              {med.image_url ? (
                <Image 
                  source={{ uri: getCleanImageUrl(med.image_url) }} 
                  style={styles.itemThumb} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.itemThumbPlaceholder}>
                  <Feather name="package" size={20} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>{med.name}</Text>
                <Text style={styles.itemMeta}>
                  {t('Qty')}: {med.quantity} × Rs. {Math.round(med.price || 0)}
                </Text>
              </View>
              <Text style={styles.itemPriceText}>
                Rs. {Math.round((med.quantity || 1) * (med.price || 0))}
              </Text>
            </View>
          ))}

          {!isExpanded && itemsList.length > 2 && (
            <TouchableOpacity 
              onPress={() => toggleExpand(item.id)}
              style={{ paddingTop: 6, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>
                + {itemsList.length - 2} {t('more items (tap to view all)')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Card Footer: Payment & Total */}
        <View style={styles.orderFooter}>
          <View style={styles.footerInfoRow}>
            <Text style={styles.footerLabel}>{t('Payment')}</Text>
            {renderPaymentBadge(item.payment_method, item.payment_status, item.transaction_id)}
          </View>

          {item.delivery_address ? (
            <View style={styles.footerInfoRow}>
              <Text style={styles.footerLabel}>{t('Delivery Address')}</Text>
              <Text style={[styles.footerValue, { maxWidth: '65%', textAlign: 'right' }]} numberOfLines={2}>
                {item.delivery_address}
              </Text>
            </View>
          ) : null}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('Total Amount')}</Text>
            <Text style={styles.totalAmount}>
              Rs. {Math.round(parseFloat(item.total_price) || 0).toLocaleString()}
            </Text>
          </View>
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

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>{t('My Orders')}</Text>
            <Text style={styles.headerSubtitle}>{t('Live Condition & Order Tracking')}</Text>
          </View>

          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={() => fetchOrders()}
            activeOpacity={0.8}
          >
            <Feather name="rotate-cw" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Surface Container */}
      <View style={styles.mainContainer}>
        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'all' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              {t('All Orders')}
            </Text>
            <View style={[styles.tabBadge, selectedTab === 'all' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'all' && styles.tabBadgeTextActive]}>
                {orders.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'active' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('active')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
              {t('Active')}
            </Text>
            <View style={[styles.tabBadge, selectedTab === 'active' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'active' && styles.tabBadgeTextActive]}>
                {activeOrders.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'completed' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('completed')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
              {t('Completed')}
            </Text>
            <View style={[styles.tabBadge, selectedTab === 'completed' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'completed' && styles.tabBadgeTextActive]}>
                {completedOrders.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              {t('Loading your orders...')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[colors.primary]} 
                tintColor={colors.primary} 
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="package" size={40} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>
                  {selectedTab === 'active' 
                    ? t('No Active Orders') 
                    : (selectedTab === 'completed' ? t('No Completed Orders') : t('No Orders Yet'))
                  }
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedTab === 'active'
                    ? t('You currently have no orders in progress or in transit.')
                    : t('Browse our medicine marketplace to buy authentic livestock medicines, vaccines, and supplements.')
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.shopNowBtn}
                  onPress={() => navigation.navigate('Marketplace')}
                  activeOpacity={0.85}
                >
                  <Feather name="shopping-bag" size={16} color="#FFFFFF" />
                  <Text style={styles.shopNowBtnText}>{t('Browse Marketplace')}</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
