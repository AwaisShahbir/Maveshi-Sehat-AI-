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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/CommunityForumScreenStyles';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const CATEGORIES = [
  { id: 'All Posts', label: 'All Discussions', labelUrdu: 'تمام', icon: 'message-square' },
  { id: 'Trending', label: 'Trending', labelUrdu: 'مقبول', icon: 'trending-up' },
  { id: 'Disease & Health', label: 'Disease & Health', labelUrdu: 'صحت و امراض', icon: 'activity' },
  { id: 'Breeding', label: 'Breeding & Calving', labelUrdu: 'نسل کشی', icon: 'heart' },
  { id: 'Feed & Nutrition', label: 'Feed & Nutrition', labelUrdu: 'خوراک و چارہ', icon: 'feather' },
  { id: 'General', label: 'General Advice', labelUrdu: 'عام سوالات', icon: 'help-circle' },
];

const MODAL_CATEGORIES = [
  { id: 'General', label: 'General Advice', icon: 'help-circle' },
  { id: 'Disease & Health', label: 'Disease & Health', icon: 'activity' },
  { id: 'Breeding', label: 'Breeding & Calving', icon: 'heart' },
  { id: 'Feed & Nutrition', label: 'Feed & Nutrition', icon: 'feather' },
];

export default function CommunityForumScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(getProfile());
  const userName = profile.userName || params.userName || '';
  const userRole = profile.role || 'farmer';
  const userId = params.userId || null;

  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Posts');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());

  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('General');
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
      const categoryParam = activeCategory === 'All Posts' ? 'All' : activeCategory;
      const response = await fetch(`${BASE_URL}/api/forum/posts?category=${encodeURIComponent(categoryParam)}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : (data?.posts || []));
    } catch (error) {
      console.log('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

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
        setPostCategory('General');
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
      const shareMsg = `Check out this discussion on Maveshi Sehat AI:\n\n"${post.title}"\n\nby ${post.author_name}\n\nJoin the livestock community to help and learn.`;
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
    if (mins >= 1) return mins === 1 ? t('1 min ago') : `${mins} ${t('mins ago')}`;
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
    const isTrending = item.category === 'Trending' || (item.likes_count || 0) >= 20;
    const isLiked = likedPosts.has(item.id);
    const commentsCount = item.comments_count || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectPost(item.id)}
        activeOpacity={0.94}
      >
        <View style={styles.cardHeader}>
          <View style={styles.authorSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getAvatarLetter(item.author_name)}</Text>
            </View>
            <View style={styles.authorDetails}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{item.author_name || 'Farmer'}</Text>
                {item.author_role === 'vet' ? (
                  <View style={styles.vetBadge}>
                    <Feather name="check-circle" size={10} color={colors.primary} />
                    <Text style={styles.vetBadgeText}>{t('Verified Vet')}</Text>
                  </View>
                ) : (
                  <View style={styles.farmerBadge}>
                    <Feather name="user" size={10} color="#2563EB" />
                    <Text style={styles.farmerBadgeText}>{t('Farmer')}</Text>
                  </View>
                )}
              </View>
              <View style={styles.timeRow}>
                <Feather name="clock" size={10} color={colors.textMuted} />
                <Text style={styles.timeText}>{getTimeAgo(item.created_at)}</Text>
              </View>
            </View>
          </View>

          {item.category ? (
            <View style={styles.postCategoryBadge}>
              <Text style={styles.postCategoryBadgeText}>
                {isTrending ? '🔥 ' : ''}{item.category}
              </Text>
            </View>
          ) : null}
        </View>

        {item.title ? (
          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title}
          </Text>
        ) : null}

        <Text style={styles.descriptionText} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <TouchableOpacity
              style={[styles.actionChip, isLiked && styles.actionChipLiked]}
              onPress={() => handleLikePost(item.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={isLiked ? '#EF4444' : colors.textSecondary}
              />
              <Text style={[styles.actionChipText, isLiked && styles.actionChipTextLiked]}>
                {item.likes_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => handleSelectPost(item.id)}
              activeOpacity={0.8}
            >
              <Feather name="message-square" size={14} color={colors.textSecondary} />
              <Text style={styles.actionChipText}>{commentsCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => handleSharePost(item)}
              activeOpacity={0.8}
            >
              <Feather name="share-2" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.viewMoreRow}>
            <Text style={styles.viewMoreText}>{t('View')}</Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Feather name="message-circle" size={38} color={colors.primary} />
      </View>
      <Text style={styles.emptyText}>{t('No Discussions Found')}</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? t('No results match your search. Try different keywords.')
          : t('Be the first in your farming community to ask a question or share advice!')}
      </Text>
      <TouchableOpacity
        style={styles.emptyCtaButton}
        onPress={() => setCreateModalVisible(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus-circle" size={16} color="#FFFFFF" />
        <Text style={styles.emptyCtaButtonText}>{t('Ask a Question')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={isDark ? colors.headerBackground : colors.primary}
      />

      {/* Modern Curved Branded Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            {navigation.canGoBack() && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Feather name="arrow-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.headerTitle}>{t('Community Forum')}</Text>
              <Text style={styles.headerSubtitle}>
                {t('Livestock Care & Vet Advice')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerNewPostBtn}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.85}
          >
            <Feather name="edit-3" size={14} color={colors.primary} />
            <Text style={styles.headerNewPostText}>{t('Ask')}</Text>
          </TouchableOpacity>
        </View>

        {/* Integrated Header Search Bar */}
        <View style={styles.searchBarContainer}>
          <Feather
            name="search"
            size={18}
            color="rgba(255, 255, 255, 0.8)"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search discussions, diseases, feed...')}
            placeholderTextColor="rgba(255, 255, 255, 0.65)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color="rgba(255, 255, 255, 0.85)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content Area with Clean Background */}
      <View style={styles.mainContainer}>
        {/* Horizontal Category Carousel Filter */}
        <View style={styles.categoryScroll}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={cat.icon}
                    size={13}
                    color={isActive ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      isActive && styles.categoryPillTextActive,
                    ]}
                  >
                    {t(cat.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Discussion Posts Feed */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('Loading discussions...')}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: Math.max(insets.bottom, 12) + 100 },
            ]}
            refreshing={refreshing}
            onRefresh={() => fetchPosts(true)}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        )}

        {/* Floating Action Button (FAB) */}
        <TouchableOpacity
          style={[styles.fabButton, { bottom: Math.max(insets.bottom, 12) + 68 }]}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.88}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.fabButtonText}>{t('New Post')}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard', { userName, userId })}
        >
          <Feather name="home" size={22} color={colors.navInactive} />
          <Text style={styles.navText}>{t('Home')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('AiScan', { userName, userId })}
        >
          <MaterialCommunityIcons name="line-scan" size={22} color={colors.navInactive} />
          <Text style={styles.navText}>{t('AI Scan')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('HealthRecords', { userName, userId })}
        >
          <Feather name="file-text" size={22} color={colors.navInactive} />
          <Text style={styles.navText}>{t('Records')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="forum" size={22} color={colors.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>
            {t('Forum')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile', { userName, userId })}
        >
          <Feather name="user" size={22} color={colors.navInactive} />
          <Text style={styles.navText}>{t('Profile')}</Text>
        </TouchableOpacity>
      </View>

      {/* Create Discussion Modal ("Form") */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('Start a Discussion')}</Text>
                <Text style={styles.modalSubtitle}>
                  {t('Ask questions or share livestock experience')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => {
                  setCreateModalVisible(false);
                  setPostTitle('');
                  setPostDescription('');
                  setPostCategory('General');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* User Posting Identity Banner */}
              <View style={styles.userPostingBanner}>
                <View style={styles.userPostingAvatar}>
                  <Text style={styles.userPostingAvatarText}>
                    {getAvatarLetter(userName || 'User')}
                  </Text>
                </View>
                <View>
                  <Text style={styles.userPostingLabel}>{t('Posting as')}</Text>
                  <Text style={styles.userPostingName}>
                    {userName || t('Guest Farmer')} ({userRole === 'vet' ? t('Doctor / Vet') : t('Farmer')})
                  </Text>
                </View>
              </View>

              {/* Title Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('Discussion Title *')}</Text>
                <View style={styles.formInputWrap}>
                  <TextInput
                    style={styles.formInput}
                    placeholder={t('e.g., Cow having high fever for 2 days')}
                    placeholderTextColor={colors.inputPlaceholder}
                    value={postTitle}
                    onChangeText={setPostTitle}
                    maxLength={150}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Topic Category Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('Topic Category *')}</Text>
                <View style={styles.categoryGrid}>
                  {MODAL_CATEGORIES.map((cat) => {
                    const isSelected = postCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryModalPill,
                          isSelected && styles.categoryModalPillActive,
                        ]}
                        onPress={() => setPostCategory(cat.id)}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name={cat.icon}
                          size={13}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.categoryModalPillText,
                            isSelected && styles.categoryModalPillTextActive,
                          ]}
                        >
                          {t(cat.label)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Details Textarea */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('Details / Symptoms *')}</Text>
                <View style={styles.formTextareaWrap}>
                  <TextInput
                    style={styles.formTextarea}
                    placeholder={t('Describe your issue, symptoms, duration, or advice in detail...')}
                    placeholderTextColor={colors.inputPlaceholder}
                    value={postDescription}
                    onChangeText={setPostDescription}
                    multiline
                    maxLength={2000}
                  />
                </View>
                <Text style={styles.charCount}>{postDescription.length}/2000</Text>
              </View>

              {/* Professional Guidance Tip */}
              <View style={styles.guidelineBox}>
                <Feather name="info" size={16} color={isDark ? '#93C5FD' : '#2563EB'} />
                <Text style={styles.guidelineText}>
                  {t('Advice from verified veterinarians carries a green badge. For critical life-threatening emergencies, please book an immediate telehealth consultation.')}
                </Text>
              </View>

              {!userName && (
                <View style={styles.warningBox}>
                  <Feather name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.warningText}>
                    {t('You must be logged in to publish a discussion.')}
                  </Text>
                </View>
              )}

              {/* Submit CTA */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (submitting || !userName) && { opacity: 0.6 },
                ]}
                onPress={handleCreatePost}
                disabled={submitting || !userName}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>{t('Publish Discussion')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
