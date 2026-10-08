import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/CommunityForumScreenStyles';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export default function CommunityForumScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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
      Alert.alert(t('Already Liked'), t('You have already liked this post.'));
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
        Alert.alert(t('Error'), t('Could not like this post. Try again.'));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert(t('Network Error'), t('Could not like post. Check your connection.'));
    }
  };

  const handleCreatePost = async () => {
    if (!userName) {
      Alert.alert(t('Not Logged In'), t('Please log in to post a discussion.'));
      return;
    }
    if (!postTitle.trim()) {
      Alert.alert(t('Required'), t('Please enter a title for your post.'));
      return;
    }
    if (!postDescription.trim()) {
      Alert.alert(t('Required'), t('Please enter details for your post.'));
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
        Alert.alert(t('Published!'), t('Your post has been shared with the community.'));
      } else {
        Alert.alert(t('Error'), data.error || t('Failed to publish post. Please try again.'));
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      Alert.alert(t('Network Error'), t('Could not publish post. Please check your connection.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSharePost = async (post) => {
    try {
      const shareMsg = t(`Check out this discussion on Maveshi Sehat:\n\n"${post.title}"\n\nby ${post.author_name}`);
      await Share.share({
        message: shareMsg,
        title: t('Share Discussion'),
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
    if (interval >= 1) return interval === 1 ? t('1 day ago') : `${interval} ${t('days ago')}`;
    const hours = Math.floor(seconds / 3600);
    if (hours >= 1) return hours === 1 ? t('1 hour ago') : `${hours} ${t('hours ago')}`;
    const mins = Math.floor(seconds / 60);
    if (mins >= 1) return mins === 1 ? t('1 minute ago') : `${mins} ${t('minutes ago')}`;
    return t('just now');
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
                  <Text style={styles.vetBadgeSmallText}>{t('Vet')}</Text>
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
          ? t('No matching discussions') 
          : t('No discussions yet')}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.retryButton} onPress={() => setCreateModalVisible(true)}>
          <Text style={styles.retryButtonText}>
            {t('Start a Discussion')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const lang = profile.language || 'English';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.headerBackground : colors.primary} />

      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View>
            {lang === 'English' && <Text style={styles.headerTitle}>Community Forum</Text>}
            
            {lang === 'Both' && (
              <>
                <Text style={styles.headerTitle}>Community Forum</Text>
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
              {t('All Posts')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'Trending' && styles.activeTab]}
            onPress={() => setActiveTab('Trending')}
          >
            <Text style={[styles.tabText, activeTab === 'Trending' && styles.activeTabText]}>
              {t('Trending')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBarContainer}>
        <Feather name="search" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('Search discussions...')}
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
          <Text style={styles.loadingText}>{t('Loading discussions...')}</Text>
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
          <Feather name="home" size={24} color={colors.primaryLight} />
          <Text style={[styles.navText, { color: colors.primaryLight }]}>{t('Home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('AiScan', { userName, userId })}
        >
          <MaterialCommunityIcons name="line-scan" size={24} color={colors.primaryLight} />
          <Text style={[styles.navText, { color: colors.primaryLight }]}>{t('AI Scan')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('HealthRecords', { userName, userId })}
        >
          <Feather name="file-text" size={24} color={colors.primaryLight} />
          <Text style={[styles.navText, { color: colors.primaryLight }]}>{t('Records')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="message-square" size={24} color="#FFE135" />
          <Text style={[styles.navText, { color: '#FFE135' }]}>{t('Forum')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile', { userId })}
        >
          <Feather name="user" size={24} color={colors.primaryLight} />
          <Text style={[styles.navText, { color: colors.primaryLight }]}>{t('Profile')}</Text>
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
              <Text style={styles.modalTitle}>{t('New Discussion')}</Text>
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
              <Text style={styles.formLabel}>{t('Title *')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('Brief title for your discussion')}
                placeholderTextColor="#999"
                value={postTitle}
                onChangeText={setPostTitle}
                maxLength={200}
                returnKeyType="next"
              />

              <Text style={styles.formLabel}>{t('Category')}</Text>
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
                    {t('General')}
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
                    {t('Trending')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>{t('Details *')}</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder={t('Describe your issue or share advice (English/Urdu)')}
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
                    {t('You must be logged in to post a discussion.')}
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
                    <Text style={styles.submitButtonText}>{t('Publish')}</Text>
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
