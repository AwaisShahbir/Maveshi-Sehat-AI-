import React, { useState, useEffect } from 'react';
import { 
  View, Text, SafeAreaView, FlatList, TextInput, 
  TouchableOpacity, StatusBar, ActivityIndicator, Platform, Image 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile } from '../../utils/profileStore';
import { useTranslation } from '../../utils/translate';
import { addToCart, getCartCount, subscribeCart } from '../../utils/cartStore';
import styles from '../../styles/MarketplaceScreenStyles';

const getImageUrl = (url) => {
  if (!url) return null;
  if (Platform.OS === 'android') {
    return url.replace('localhost:5000', '10.0.2.2:5000').replace('127.0.0.1:5000', '10.0.2.2:5000');
  }
  return url;
};

export default function MarketplaceScreen() {
  const { t } = useTranslation();
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
            <Image 
              source={{ 
                uri: item.category.toLowerCase() === 'vaccine' 
                  ? 'https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&q=80&w=200' 
                  : 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=200' 
              }} 
              style={styles.cardImg} 
            />
          )}
        </View>

        
        <View style={styles.cardBody}>
          <Text style={styles.medName} numberOfLines={2}>
          {t(item.name, item.name_urdu || item.name)}
        </Text>  

          
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
                {isOutOfStock ? t('Out of Stock', 'ختم') : t('In Stock', 'دستیاب')}
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
            
            
            return (
              <TouchableOpacity
                style={isActive ? styles.catPillActive : styles.catPill}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={isActive ? styles.catPillTextActive : styles.catPillText}>
                  {t(item)}
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
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AiScan')}>
          <MaterialCommunityIcons name="line-scan" size={22} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('AI Scan')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthRecords')}>
          <Feather name="file-text" size={22} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Records')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityForum')}>
          <Feather name="message-square" size={22} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Forum')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Feather name="user" size={22} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Profile')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
