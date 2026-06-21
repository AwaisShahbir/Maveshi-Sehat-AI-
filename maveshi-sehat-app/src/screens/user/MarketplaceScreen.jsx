import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, 
  TouchableOpacity, StatusBar, ActivityIndicator, Platform, Image 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { addToCart, getCartCount, subscribeCart } from '../../utils/cartStore';

const getImageUrl = (url) => {
  if (!url) return null;
  if (Platform.OS === 'android') {
    return url.replace('localhost:5000', '10.0.2.2:5000').replace('127.0.0.1:5000', '10.0.2.2:5000');
  }
  return url;
};

export default function MarketplaceScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const [profile] = useState(getProfile());
  const userName = profile.userName || params.userName || 'Muhammad Ahmed';
  const userId = params.userId || null;

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartCount, setCartCount] = useState(getCartCount());

  
  useEffect(() => {
    const unsubscribe = subscribeCart(() => {
      setCartCount(getCartCount());
    });
    return () => unsubscribe();
  }, []);

  const fetchMedicines = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/admin/medicines`);
      if (!response.ok) throw new Error('Failed to fetch medicines');
      const data = await response.json();
      
      const activeMeds = data.filter(med => med.status !== 'inactive');
      setMedicines(activeMeds);
    } catch (error) {
      console.error('Error fetching medicines:', error);
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

  
  const categories = ['All', 'Medicines', 'Vaccines', 'Supplements'];

  const filteredMedicines = medicines.filter(med => {
    
    const matchesSearch = 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.name_urdu && med.name_urdu.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (med.manufacturer && med.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));

    
    let matchesCategory = true;
    if (selectedCategory === 'Medicines') {
      
      matchesCategory = med.category.toLowerCase() !== 'vaccine' && med.category.toLowerCase() !== 'vitamin';
    } else if (selectedCategory === 'Vaccines') {
      matchesCategory = med.category.toLowerCase() === 'vaccine';
    } else if (selectedCategory === 'Supplements') {
      matchesCategory = med.category.toLowerCase() === 'vitamin' || med.category.toLowerCase() === 'supplements';
    }

    return matchesSearch && matchesCategory;
  });

  
  const getMedIcon = (med) => {
    const form = (med.dosage_form || '').toLowerCase();
    const cat = med.category.toLowerCase();
    
    if (form.includes('injection') || form.includes('vial') || form.includes('ampoule')) {
      return <MaterialCommunityIcons name="needle" size={36} color="#58D66D" />;
    }
    if (cat === 'vaccine') {
      return <MaterialCommunityIcons name="pill" size={36} color="#FF5252" />;
    }
    if (form.includes('syrup') || form.includes('suspension') || form.includes('liquid') || form.includes('bottle')) {
      return <MaterialCommunityIcons name="bottle-tonic-plus" size={36} color="#FFB020" />;
    }
    return <MaterialCommunityIcons name="pill" size={36} color="#58D66D" />;
  };

  const renderMedicineCard = ({ item }) => {
    const isOutOfStock = item.stock <= 0;
    
    
    const rating = (4.0 + (item.id % 10) * 0.1).toFixed(1);
    
    return (
      <View style={styles.card}>
        
        <View style={styles.cardImgBox}>
          {item.image_url ? (
            <Image source={{ uri: getImageUrl(item.image_url) }} style={styles.cardImg} />
          ) : (
            getMedIcon(item)
          )}
        </View>

        
        <View style={styles.cardBody}>
          <Text style={styles.medNameEn} numberOfLines={1}>{item.name}</Text>
          {item.name_urdu && (
            <Text style={styles.medNameUr} numberOfLines={1} className="urdu">
              {item.name_urdu}
            </Text>
          )}

          
          <View style={styles.medMetaRow}>
            <Text style={styles.ratingText}>★ {rating}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.strengthText} numberOfLines={1}>{item.strength || 'dose'}</Text>
          </View>

          
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>Rs. {Math.round(item.price)}</Text>
            <View style={[
              styles.stockBadge, 
              { backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }
            ]}>
              <Text style={[
                styles.stockBadgeText, 
                { color: isOutOfStock ? '#ef4444' : '#10b981' }
              ]}>
                {isOutOfStock ? t('Out Stock', 'ختم') : t('In Stock', 'دستیاب')}
              </Text>
            </View>
          </View>

          
          <TouchableOpacity 
            style={[styles.addBtn, isOutOfStock && styles.addBtnDisabled]} 
            onPress={() => !isOutOfStock && addToCart(item)}
            disabled={isOutOfStock}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>{t('Add to Cart', 'کارٹ میں شامل کریں')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const lang = profile.language || 'English';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Marketplace</Text>
            <Text style={styles.headerSubtitle} className="urdu">دوا خانہ</Text>
          </View>
          
          
          <TouchableOpacity 
            style={styles.cartButton} 
            onPress={() => navigation.navigate('Cart', { userName, userId })}
          >
            <Feather name="shopping-cart" size={22} color="#4CB85C" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search medicines...', 'دوائیں تلاش کریں...')}
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item;
            
            
            let urduLabel = '';
            if (item === 'All') urduLabel = 'سب';
            else if (item === 'Medicines') urduLabel = 'دوائیں';
            else if (item === 'Vaccines') urduLabel = 'ویکسین';
            else if (item === 'Supplements') urduLabel = 'سپلیمنٹس';

            return (
              <TouchableOpacity
                style={isActive ? styles.catPillActive : styles.catPill}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={isActive ? styles.catPillTextActive : styles.catPillText}>
                  {lang === 'Urdu' ? urduLabel : (lang === 'Both' ? `${item} / ${urduLabel}` : item)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#58D66D" />
          <Text style={styles.loadingText}>{t('Loading medicines...', 'دوائیں لوڈ کی جا رہی ہیں...')}</Text>
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
          <MaterialCommunityIcons name="pill-off" size={64} color="#CCC" />
          <Text style={styles.emptyText}>{t('No medicines found', 'کوئی دوا نہیں ملی')}</Text>
        </View>
      )}

      
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Feather name="home" size={22} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Home', 'ہوم')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan')}>
          <MaterialCommunityIcons name="line-scan" size={22} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('AI Scan', 'اسکین')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords')}>
          <Feather name="file-text" size={22} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Records', 'ریکارڈز')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum')}>
          <Feather name="message-square" size={22} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Forum', 'فورم')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Feather name="user" size={22} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Profile', 'پروفائل')}</Text>
        </TouchableOpacity>
      </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF7A5C',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
    color: '#FFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFF',
    height: '100%',
  },
  categoriesContainer: {
    marginVertical: 14,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#4CB85C',
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  catPillTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFF',
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1.5,
    overflow: 'hidden',
  },
  cardImgBox: {
    height: 100,
    backgroundColor: '#F3FBF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  medNameEn: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  medNameUr: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  medMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFB020',
  },
  metaDivider: {
    fontSize: 11,
    color: '#94A3B8',
  },
  strengthText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: '#4CB85C',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CB85C',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 5,
  },
  navItem: { 
    alignItems: 'center',
  },
  navText: { 
    fontSize: 10, 
    color: '#FFF', 
    marginTop: 4, 
    fontWeight: '600',
  }
});
