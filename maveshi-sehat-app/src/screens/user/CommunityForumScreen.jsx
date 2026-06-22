import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
  Share,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';

const BASE_URL = Platform.OS === 'android' ? 'http://localhost:5000' : 'http://localhost:5000';

export default function CommunityForumScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(getProfile());
  const userName = profile.userName || params.userName || '';
  const userId = params.userId || null;

  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All Posts');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());

  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('All Posts');
  const [postDescription, setPostDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  
  useEffect(() => {
    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
    });
    return () => unsubscribeProfile();
  }, []);

  const fetchPosts = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const categoryParam = activeTab === 'Trending' ? 'Trending' : 'All';
      const response = await fetch(`${BASE_URL}/api/forum/posts?category=${categoryParam}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Connection Error', 'Could not load posts. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const handleLikePost = async (postId) => {
    const alreadyLiked = likedPosts.has(postId);
    if (alreadyLiked) {
      Alert.alert(t('Already Liked', 'پہلے ہی پسند کیا گیا'), t('You have already liked this post.', 'آپ پہلے ہی اس پوسٹ کو پسند کر چکے ہیں۔'));
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/forum/posts/${postId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setLikedPosts((prev) => new Set([...prev, postId]));
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, likes_count: data.likesCount } : post
          )
        );
      } else {
        Alert.alert(t('Error', 'خرابی'), t('Could not like this post. Try again.', 'اس پوسٹ کو پسند نہیں کیا جا سکا۔ دوبارہ کوشش کریں۔'));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert(t('Network Error', 'نیٹ ورک کی خرابی'), t('Could not like post. Check your connection.', 'پوسٹ کو پسند نہیں کیا جا سکا۔ اپنا کنکشن چیک کریں۔'));
    }
  };

  const handleCreatePost = async () => {
    if (!userName) {
      Alert.alert(t('Not Logged In', 'لاگ ان نہیں ہے'), t('Please log in to post a discussion.', 'براہ کرم گفتگو پوسٹ کرنے کے لیے لاگ ان کریں۔'));
      return;
    }
    if (!postTitle.trim()) {
      Alert.alert(t('Required', 'ضروری ہے'), t('Please enter a title for your post.', 'براہ کرم اپنی پوسٹ کا عنوان درج کریں۔'));
      return;
    }
    if (!postDescription.trim()) {
      Alert.alert(t('Required', 'ضروری ہے'), t('Please enter details for your post.', 'براہ کرم اپنی پوسٹ کی تفصیلات درج کریں۔'));
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        userName: userName.trim(),
        title: postTitle.trim(),
        description: postDescription.trim(),
        category: postCategory,
      };
      if (userId) body.userId = userId;

      const response = await fetch(`${BASE_URL}/api/forum/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setPostTitle('');
        setPostDescription('');
        setPostCategory('All Posts');
        setCreateModalVisible(false);
        await fetchPosts();
        Alert.alert(t('Published!', 'شائع ہو گیا!'), t('Your post has been shared with the community.', 'آپ کی پوسٹ کمیونٹی کے ساتھ شیئر کر دی گئی ہے۔'));
      } else {
        Alert.alert(t('Error', 'خرابی'), data.error || t('Failed to publish post. Please try again.', 'پوسٹ شائع کرنے میں ناکامی۔ دوبارہ کوشش کریں۔'));
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      Alert.alert(t('Network Error', 'نیٹ ورک کی خرابی'), t('Could not publish post. Please check your connection.', 'پوسٹ شائع نہیں کی جا سکی۔ اپنا کنکشن چیک کریں۔'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSharePost = async (post) => {
    try {
      const shareMsg = t(
        `Check out this discussion on Maveshi Sehat:\n\n"${post.title}"\n\nby ${post.author_name}`,
        `مویشی صحت پر یہ گفتگو دیکھیں:\n\n"${post.title}"\n\nبذریعہ ${post.author_name}`
      );
      await Share.share({
        message: shareMsg,
        title: t('Share Discussion', 'گفتگو شیئر کریں'),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSelectPost = (postId) => {
    navigation.navigate('ForumPostDetail', {
      postId,
      userName,
      userId,
    });
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    const interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval === 1 ? t('1 day ago', '1 دن پہلے') : `${interval} ${t('days ago', 'دن پہلے')}`;
    const hours = Math.floor(seconds / 3600);
    if (hours >= 1) return hours === 1 ? t('1 hour ago', '1 گھنٹہ پہلے') : `${hours} ${t('hours ago', 'گھنٹے پہلے')}`;
    const mins = Math.floor(seconds / 60);
    if (mins >= 1) return mins === 1 ? t('1 minute ago', '1 منٹ پہلے') : `${mins} ${t('minutes ago', 'منٹ پہلے')}`;
    return t('just now', 'ابھی ابھی');
  };

  const getAvatarLetter = (name) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (post.title && post.title.toLowerCase().includes(q)) ||
      (post.description && post.description.toLowerCase().includes(q)) ||
      (post.author_name && post.author_name.toLowerCase().includes(q))
    );
  });

  const renderPostItem = ({ item }) => {
    const isTrending = item.category === 'Trending' || item.likes_count >= 20;
    const isLiked = likedPosts.has(item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectPost(item.id)}
        activeOpacity={0.92}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAvatarLetter(item.author_name)}</Text>
          </View>
          <View style={styles.authorInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.authorName}>{item.author_name}</Text>
              {isTrending && (
                <Feather name="trending-up" size={13} color="#FFB020" style={{ marginLeft: 6 }} />
              )}
              {item.author_role === 'vet' && (
                <View style={styles.vetBadgeSmall}>
                  <Text style={styles.vetBadgeSmallText}>{t('Vet', 'ڈاکٹر')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
          </View>
        </View>

        {item.title ? (
          <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
        ) : null}

        <Text style={styles.descriptionText} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLikePost(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name={isLiked ? 'heart' : 'heart'}
                size={17}
                color={isLiked ? '#FF4D4D' : '#FF7B7B'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.actionCount, isLiked && { color: '#FF4D4D' }]}>
                {item.likes_count}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { marginLeft: 18 }]}
              onPress={() => handleSelectPost(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="message-square" size={17} color="#58D66D" style={{ marginRight: 5 }} />
              <Text style={styles.actionCount}>{item.comments_count || 0}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => handleSharePost(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="share-2" size={17} color="#888" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="forum-outline" size={64} color="#CCC" />
      <Text style={styles.emptyText}>
        {searchQuery 
          ? t('No matching discussions', 'کوئی نتیجہ نہیں ملا') 
          : t('No discussions yet', 'ابھی کوئی گفتگو نہیں ہے')}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.retryButton} onPress={() => setCreateModalVisible(true)}>
          <Text style={styles.retryButtonText}>
            {t('Start a Discussion', 'گفتگو شروع کریں')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const lang = profile.language || 'English';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View>
            {lang === 'English' && <Text style={styles.headerTitle}>Community Forum</Text>}
            {lang === 'Urdu' && <Text style={styles.headerTitle}>کمیونٹی فورم</Text>}
            {lang === 'Both' && (
              <>
                <Text style={styles.headerTitle}>Community Forum</Text>
                <Text style={styles.headerSubtitle}>کمیونٹی فورم</Text>
              </>
            )}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={24} color="#58D66D" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'All Posts' && styles.activeTab]}
            onPress={() => setActiveTab('All Posts')}
          >
            <Text style={[styles.tabText, activeTab === 'All Posts' && styles.activeTabText]}>
              {t('All Posts', 'تمام پوسٹس')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'Trending' && styles.activeTab]}
            onPress={() => setActiveTab('Trending')}
          >
            <Text style={[styles.tabText, activeTab === 'Trending' && styles.activeTabText]}>
              {t('Trending', 'مقبول')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBarContainer}>
        <Feather name="search" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('Search discussions...', 'تلاش کریں...')}
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#58D66D" />
          <Text style={styles.loadingText}>{t('Loading discussions...', 'گفتگو لوڈ ہو رہی ہے...')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Math.max(insets.bottom, 12) + 90 },
          ]}
          refreshing={refreshing}
          onRefresh={() => fetchPosts(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard', { userName, userId })}
        >
          <Feather name="home" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Home', 'ہوم')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('AiScan', { userName, userId })}
        >
          <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('AI Scan', 'اسکین')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('HealthRecords', { userName, userId })}
        >
          <Feather name="file-text" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Records', 'ریکارڈز')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="message-square" size={24} color="#FFE135" />
          <Text style={[styles.navText, { color: '#FFE135' }]}>{t('Forum', 'فورم')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile', { userId })}
        >
          <Feather name="user" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>{t('Profile', 'پروفائل')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('New Discussion', 'نئی گفتگو')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setCreateModalVisible(false);
                  setPostTitle('');
                  setPostDescription('');
                  setPostCategory('All Posts');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>{t('Title *', 'عنوان *')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('Brief title for your discussion', 'گفتگو کا مختصر عنوان')}
                placeholderTextColor="#999"
                value={postTitle}
                onChangeText={setPostTitle}
                maxLength={200}
                returnKeyType="next"
              />

              <Text style={styles.formLabel}>{t('Category', 'زمرہ')}</Text>
              <View style={styles.categoryToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.categoryPill,
                    postCategory === 'All Posts' && styles.categoryPillActive,
                  ]}
                  onPress={() => setPostCategory('All Posts')}
                >
                  <Feather
                    name="list"
                    size={13}
                    color={postCategory === 'All Posts' ? '#58D66D' : '#888'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      postCategory === 'All Posts' && styles.categoryPillTextActive,
                    ]}
                  >
                    {t('General', 'عام')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.categoryPill,
                    postCategory === 'Trending' && styles.categoryPillActive,
                  ]}
                  onPress={() => setPostCategory('Trending')}
                >
                  <Feather
                    name="trending-up"
                    size={13}
                    color={postCategory === 'Trending' ? '#58D66D' : '#888'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      postCategory === 'Trending' && styles.categoryPillTextActive,
                    ]}
                  >
                    {t('Trending', 'مقبول')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>{t('Details *', 'تفصیل *')}</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder={t('Describe your issue or share advice (English/Urdu)', 'اپنے مسئلے کی وضاحت کریں یا مشورہ دیں (انگریزی/اردو)')}
                placeholderTextColor="#999"
                value={postDescription}
                onChangeText={setPostDescription}
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />
              <Text style={styles.charCount}>{postDescription.length}/2000</Text>

              {!userName && (
                <View style={styles.warningBox}>
                  <Feather name="alert-circle" size={14} color="#FF4D4D" />
                  <Text style={styles.warningText}>
                    {t('You must be logged in to post a discussion.', 'گفتگو پوسٹ کرنے کے لیے آپ کا لاگ ان ہونا ضروری ہے۔')}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (submitting || !userName) && { opacity: 0.6 },
                ]}
                onPress={handleCreatePost}
                disabled={submitting || !userName}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="send" size={16} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>{t('Publish', 'شائع کریں')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  headerContainer: {
    backgroundColor: '#58D66D',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#E8F8EA',
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  activeTabText: {
    color: '#58D66D',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F2EC',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F2EC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#58D66D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  timeAgo: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  vetBadgeSmall: {
    backgroundColor: '#E8F8EA',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  vetBadgeSmallText: {
    color: '#4CB85C',
    fontSize: 9,
    fontWeight: 'bold',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F0',
    paddingTop: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    fontSize: 13,
    color: '#777',
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  loadingUrduText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyUrduText: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#E8F8EA',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#58D66D',
  },
  retryButtonText: {
    color: '#58D66D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CB85C',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#FFF', marginTop: 4, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 14,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0EBE4',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#AAA',
    textAlign: 'right',
    marginBottom: 10,
  },
  categoryToggleRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 10,
  },
  categoryPill: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5D3',
    backgroundColor: '#FFF',
  },
  categoryPillActive: {
    backgroundColor: '#E8F8EA',
    borderColor: '#58D66D',
  },
  categoryPillText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#58D66D',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  warningText: {
    fontSize: 12,
    color: '#FF4D4D',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#58D66D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#58D66D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
