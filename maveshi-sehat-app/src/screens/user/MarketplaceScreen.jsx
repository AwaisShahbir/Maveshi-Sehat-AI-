import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, SafeAreaView, FlatList, TextInput, 
  TouchableOpacity, StatusBar, ActivityIndicator, Platform, Image 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';
import { useTranslation } from '../../utils/translate';
import { addToCart, getCart, getCartCount, subscribeCart } from '../../utils/cartStore';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/MarketplaceScreenStyles';

const getImageUrl = (url) => {
  if (!url) return null;
  if (Platform.OS === 'android') {
    return url.replace('localhost:5000', '10.0.2.2:5000').replace('127.0.0.1:5000', '10.0.2.2:5000');
  }
  return url;
};

export default function MarketplaceScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const profile = getProfile();
  const userName = profile.userName || params.userName || 'Muhammad Ahmed';
  const userId = params.userId || null;

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartCount, setCartCount] = useState(getCartCount());
  const [cartItems, setCartItems] = useState(getCart());

  useEffect(() => {
    const unsubscribe = subscribeCart((updatedCart) => {
      setCartCount(getCartCount());
      setCartItems(updatedCart || getCart());
    });
    return () => unsubscribe();
  }, []);

  const fetchMedicines = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/admin/medicines`);
      if (!response.ok) throw new Error('Failed to fetch medicines');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const activeMeds = data.filter(med => med && med.status !== 'inactive');
        setMedicines(activeMeds);
      } else {
        setMedicines([]);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMedicines();
  };

  const categories = ['All', 'Medicines', 'Vaccines', 'Supplements', 'Antibiotics'];

  const safeMedicines = Array.isArray(medicines) ? medicines : [];
  const filteredMedicines = safeMedicines.filter(med => {
    if (!med) return false;
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch = !q || 
      (med.name && med.name.toLowerCase().includes(q)) ||
      (med.name_urdu && med.name_urdu.toLowerCase().includes(q)) ||
      (med.manufacturer && med.manufacturer.toLowerCase().includes(q)) ||
      (med.category && med.category.toLowerCase().includes(q));

    let matchesCategory = true;
    const cat = (med.category || '').toLowerCase();
    if (selectedCategory === 'Medicines') {
      matchesCategory = cat !== 'vaccine' && cat !== 'vaccines' && cat !== 'vitamin' && cat !== 'supplements';
    } else if (selectedCategory === 'Vaccines') {
      matchesCategory = cat.includes('vaccin');
    } else if (selectedCategory === 'Supplements') {
      matchesCategory = cat.includes('supplement') || cat.includes('vitamin');
    } else if (selectedCategory === 'Antibiotics') {
      matchesCategory = cat.includes('antibiotic') || (med.dosage_form || '').toLowerCase().includes('injection');
    }

    return matchesSearch && matchesCategory;
  });

  const getItemQuantityInCart = (id) => {
    const match = cartItems.find(item => item.id === id);
    return match ? match.quantity : 0;
  };

  const renderMedicineCard = ({ item }) => {
    const isOutOfStock = item.stock <= 0;
    const rating = (4.2 + (item.id % 8) * 0.1).toFixed(1);
    const quantityInCart = getItemQuantityInCart(item.id);

    const fallbackImg = item.category && item.category.toLowerCase().includes('vaccin')
      ? 'https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&q=80&w=400'
      : item.category && item.category.toLowerCase().includes('supplement')
      ? 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=400'
      : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400';

    return (
      <View style={styles.card}>
        {/* Product Image Box */}
        <View style={styles.cardImgBox}>
          <Image 
            source={{ uri: item.image_url ? getImageUrl(item.image_url) : fallbackImg }} 
            style={styles.cardImg} 
          />
          
          {/* Rx or OTC Badge */}
          {item.prescription_required ? (
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Rx</Text>
            </View>
          ) : (
            <View style={[styles.rxBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.rxBadgeText}>OTC</Text>
            </View>
          )}

          {/* Dosage Form Badge */}
          {item.dosage_form ? (
            <View style={styles.dosageFormBadge}>
              <Text style={styles.dosageFormBadgeText}>{item.dosage_form.trim()}</Text>
            </View>
          ) : null}
        </View>

        {/* Product Details Body */}
        <View style={styles.cardBody}>
          <Text style={styles.medName} numberOfLines={2}>
            {t(item.name, item.name_urdu || item.name)}
          </Text>

          {item.pharmacy_name ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 2 }}>
              <Feather name="home" size={11} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }} numberOfLines={1}>
                {item.pharmacy_name}
              </Text>
            </View>
          ) : item.manufacturer ? (
            <Text style={styles.manufacturerText} numberOfLines={1}>
              {item.manufacturer}
            </Text>
          ) : null}

          {/* Rating & Strength */}
          <View style={styles.medMetaRow}>
            <Text style={styles.ratingText}>★ {rating}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.strengthText} numberOfLines={1}>
              {item.strength || item.category || 'Standard'}
            </Text>
          </View>

          {/* Price & Stock Status */}
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>Rs. {Math.round(item.price)}</Text>
            <View style={[
              styles.stockBadge, 
              { backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.12)' : (item.stock && item.stock <= (item.min_stock || 10)) ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)' }
            ]}>
              <Text style={[
                styles.stockBadgeText, 
                { color: isOutOfStock ? '#EF4444' : (item.stock && item.stock <= (item.min_stock || 10)) ? '#F59E0B' : '#10B981' }
              ]}>
                {isOutOfStock ? t('Out of Stock') : (item.stock && item.stock <= (item.min_stock || 10)) ? t('Low Stock') : t('In Stock')}
              </Text>
            </View>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity 
            style={[
              styles.addBtn, 
              quantityInCart > 0 && styles.addBtnInCart,
              isOutOfStock && styles.addBtnDisabled
            ]} 
            onPress={() => !isOutOfStock && addToCart(item)}
            disabled={isOutOfStock}
            activeOpacity={0.8}
          >
            {isOutOfStock ? (
              <Text style={[styles.addBtnText, { color: colors.textMuted }]}>{t('Unavailable')}</Text>
            ) : quantityInCart > 0 ? (
              <>
                <Feather name="check" size={13} color={isDark ? '#34D399' : '#15803D'} />
                <Text style={styles.addBtnTextInCart}>{t('In Cart')} ({quantityInCart})</Text>
              </>
            ) : (
              <>
                <Feather name="shopping-bag" size={13} color="#FFFFFF" />
                <Text style={styles.addBtnText}>{t('Add to Cart')}</Text>
              </>
            )}
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

      {/* Header with Title, Cart Button & Embedded Search */}
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
            <Text style={styles.headerTitle}>{t('Marketplace')}</Text>
            <Text style={styles.headerSubtitle}>{t('Certified Vet Medicines & Vaccines')}</Text>
          </View>

          {/* Cart Icon with Counter Badge */}
          <TouchableOpacity 
            style={styles.cartButton} 
            onPress={() => navigation.navigate('Cart', { userName, userId })}
            activeOpacity={0.85}
          >
            <Feather name="shopping-bag" size={20} color={colors.primary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search medicines, vaccines, brands...')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Surface Body Container */}
      <View style={styles.mainContainer}>
        {/* Horizontal Category Filters */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => {
              const isActive = selectedCategory === item;
              return (
                <TouchableOpacity
                  style={isActive ? styles.catPillActive : styles.catPill}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.8}
                >
                  <Text style={isActive ? styles.catPillTextActive : styles.catPillText}>
                    {t(item)}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Quality Assurance Micro-Banner */}
        <View style={styles.trustBanner}>
          <View style={styles.trustBannerLeft}>
            <Feather name="shield" size={14} color={isDark ? '#34D399' : '#047857'} />
            <Text style={styles.trustBannerText}>
              {t('100% Genuine Supplies • Verified Pharmacies')}
            </Text>
          </View>
          <Text style={styles.itemsCountText}>
            {filteredMedicines.length} {t('Items')}
          </Text>
        </View>

        {/* Products Grid */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('Loading medicines...')}</Text>
          </View>
        ) : filteredMedicines.length > 0 ? (
          <FlatList
            data={filteredMedicines}
            numColumns={2}
            renderItem={renderMedicineCard}
            keyExtractor={(item) => item.id.toString()}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="pill-off" size={38} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>{t('No medicines found')}</Text>
            <Text style={styles.emptySubtext}>
              {t('Try searching with another keyword or select a different category.')}
            </Text>
          </View>
        )}

        {/* Elevated Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={20} color={colors.navInactive || '#94A3B8'} />
            <Text style={styles.navText}>{t('Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan')}>
            <MaterialCommunityIcons name="line-scan" size={20} color={colors.navInactive || '#94A3B8'} />
            <Text style={styles.navText}>{t('AI Scan')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords')}>
            <Feather name="file-text" size={20} color={colors.navInactive || '#94A3B8'} />
            <Text style={styles.navText}>{t('Records')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum')}>
            <Feather name="message-square" size={20} color={colors.navInactive || '#94A3B8'} />
            <Text style={styles.navText}>{t('Forum')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
            <Feather name="user" size={20} color={colors.navInactive || '#94A3B8'} />
            <Text style={styles.navText}>{t('Profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
