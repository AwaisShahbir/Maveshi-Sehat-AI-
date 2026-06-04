import React, { useState, useEffect } from 'react';
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
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CommunityForumScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const userName = params.userName || 'Awais shabbir ';
  const insets = useSafeAreaInsets();

  // States
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All Posts'); // 'All Posts' or 'Trending'
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Form States
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('All Posts');
  const [postDescription, setPostDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

  const fetchPosts = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const categoryParam = activeTab === 'All Posts' ? 'All' : 'Trending';
      const response = await fetch(`${baseUrl}/api/forum/posts?category=${categoryParam}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const handleRefresh = () => {
    fetchPosts(true);
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await fetch(`${baseUrl}/api/forum/posts/${postId}/like`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        // Update local state upvote count
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId ? { ...post, likes_count: data.likesCount } : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postDescription.trim()) {
      Alert.alert('Required Fields', 'Please enter a title and details for your post.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${baseUrl}/api/forum/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName,
          title: postTitle.trim(),
          description: postDescription.trim(),
          category: postCategory
        })
      });

      if (response.ok) {
        setPostTitle('');
        setPostDescription('');
        setPostCategory('All Posts');
        setCreateModalVisible(false);
        fetchPosts();
        Alert.alert('Success', 'Your post has been published to the forum!');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to submit post.');
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      Alert.alert('Network Error', 'Could not publish post. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSharePost = (post) => {
    Alert.alert('Share', `Post by ${post.author_name} link copied to clipboard!`);
  };

  const handleSelectPost = (postId) => {
    navigation.navigate('ForumPostDetail', {
      postId,
      userName
    });
  };

  const getUrduName = (name) => {
    if (name.toLowerCase().includes('awais')) return 'اویس شبیر';
    if (name.toLowerCase().includes('ahmed')) return 'احمد حسین';
    if (name.toLowerCase().includes('fatima')) return 'فاطمہ خان';
    if (name.toLowerCase().includes('areeba')) return 'اریبہ عارف';
    return name;
  };

  const getTimeAgo = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    let interval = Math.floor(seconds / 3600);
    if (interval >= 24) {
      const days = Math.floor(interval / 24);
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
    if (interval >= 1) return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    const mins = Math.floor(seconds / 60);
    if (mins >= 1) return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
    return 'just now';
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPostItem = ({ item }) => {
    const timeAgo = getTimeAgo(item.created_at);
    const isTrending = item.category === 'Trending' || item.likes_count >= 20;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleSelectPost(item.id)}
        activeOpacity={0.95}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.author_name ? item.author_name.trim().charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.authorName}>{item.author_name}</Text>
              {isTrending && (
                <Feather name="trending-up" size={14} color="#FFB020" style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text style={styles.authorUrdu}>{getUrduName(item.author_name)}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </View>

        <View style={styles.postContent}>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleLikePost(item.id)}
            >
              <Feather name="heart" size={18} color="#FF4D4D" style={{ marginRight: 6 }} />
              <Text style={styles.actionCount}>{item.likes_count}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { marginLeft: 20 }]}
              onPress={() => handleSelectPost(item.id)}
            >
              <Feather name="message-square" size={18} color="#58D66D" style={{ marginRight: 6 }} />
              <Text style={styles.actionCount}>{item.comments_count}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => handleSharePost(item)}>
            <Feather name="share-2" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      {/* Curved Green Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Community Forum</Text>
            <Text style={styles.headerSubtitle}>کمیونٹی فورم</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={24} color="#58D66D" />
          </TouchableOpacity>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'All Posts' && styles.activeTab]}
            onPress={() => setActiveTab('All Posts')}
          >
            <Text style={[styles.tabText, activeTab === 'All Posts' && styles.activeTabText]}>
              All Posts / تمام پوسٹس
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Trending' && styles.activeTab]}
            onPress={() => setActiveTab('Trending')}
          >
            <Text style={[styles.tabText, activeTab === 'Trending' && styles.activeTabText]}>
              Trending / مقبول
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search discussions... / تلاش کریں"
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

      {/* Discussions Feed */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#58D66D" />
          <Text style={styles.loadingText}>Fetching discussions...</Text>
        </View>
      ) : filteredPosts.length > 0 ? (
        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 110 }]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="forum-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No discussions found</Text>
          <Text style={styles.emptyUrduText}>کوئی گفتگو نہیں ملی</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh / تازہ کریں</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard', { userName })}>
          <Feather name="home" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('Coming Soon', 'Stay tuned!')}>
          <MaterialCommunityIcons name="line-scan" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>AI Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('Coming Soon', 'Stay tuned!')}>
          <Feather name="file-text" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="message-square" size={24} color="#FFE135" />
          <Text style={[styles.navText, { color: '#FFE135' }]}>Forum</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Welcome')}>
          <Feather name="user" size={24} color="#A3E6B2" />
          <Text style={[styles.navText, { color: '#A3E6B2' }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Create Post Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ask a Question / سوال پوچھیں</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Title / عنوان</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Brief summary of your question"
                placeholderTextColor="#999"
                value={postTitle}
                onChangeText={setPostTitle}
              />

              <Text style={styles.formLabel}>Category / زمرہ</Text>
              <View style={styles.categoryToggleRow}>
                <TouchableOpacity 
                  style={[styles.categoryPill, postCategory === 'All Posts' && styles.categoryPillActive]}
                  onPress={() => setPostCategory('All Posts')}
                >
                  <Text style={[styles.categoryPillText, postCategory === 'All Posts' && styles.categoryPillTextActive]}>
                    General / تمام پوسٹس
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.categoryPill, postCategory === 'Trending' && styles.categoryPillActive]}
                  onPress={() => setPostCategory('Trending')}
                >
                  <Text style={[styles.categoryPillText, postCategory === 'Trending' && styles.categoryPillTextActive]}>
                    Trending / مقبول
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>Details / تفصیل</Text>
              <TextInput
                style={[styles.formInput, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Describe your issue or share advice in English/Urdu"
                placeholderTextColor="#999"
                value={postDescription}
                onChangeText={setPostDescription}
                multiline
              />

              <TouchableOpacity 
                style={[styles.submitButton, submitting && { opacity: 0.7 }]} 
                onPress={handleCreatePost}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Publish / شائع کریں</Text>
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
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
    color: '#E8F8EA',
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
    shadowOpacity: 0.05,
    shadowRadius: 5,
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
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F2EC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#58D66D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  authorUrdu: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  postContent: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 14,
  },
  footerLeft: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    fontSize: 13,
    color: '#666',
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
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#FFF', marginTop: 4, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
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
    color: '#333',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F2EC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 14,
  },
  categoryToggleRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 10,
  },
  categoryPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
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
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#58D66D',
  },
  submitButton: {
    backgroundColor: '#58D66D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#58D66D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
