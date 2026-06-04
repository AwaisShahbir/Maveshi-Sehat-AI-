import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar, 
  Platform,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForumPostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const { postId, userName } = params;
  const insets = useSafeAreaInsets();

  // States
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const flatListRef = useRef(null);
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

  const fetchPostDetails = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/forum/posts/${postId}`);
      if (!response.ok) throw new Error('Failed to fetch post details');
      const data = await response.json();
      setPost(data.post);
      setComments(data.comments);
    } catch (error) {
      console.error('Error fetching post details:', error);
      Alert.alert('Error', 'Failed to load post details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${baseUrl}/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName,
          comment: replyText.trim()
        })
      });

      if (response.ok) {
        setReplyText('');
        fetchPostDetails();
        // Scroll to end of list to show new comment
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 300);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to submit comment.');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Network Error', 'Could not post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async () => {
    if (!post) return;
    try {
      const response = await fetch(`${baseUrl}/api/forum/posts/${post.id}/like`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setPost(prev => ({ ...prev, likes_count: data.likesCount }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
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

  const renderCommentItem = ({ item }) => {
    const isVet = item.author_role === 'vet';
    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={[styles.commentAvatar, { backgroundColor: isVet ? '#FFB020' : '#58D66D' }]}>
            <Text style={styles.commentAvatarText}>
              {item.author_name ? item.author_name.trim().charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.commentAuthorInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.commentAuthorName}>{item.author_name}</Text>
              {isVet && (
                <View style={styles.vetBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={12} color="#FFF" style={{ marginRight: 2 }} />
                  <Text style={styles.vetBadgeText}>Verified Vet / تصدیق شدہ ڈاکٹر</Text>
                </View>
              )}
            </View>
            <Text style={styles.commentAuthorUrdu}>{getUrduName(item.author_name)}</Text>
            <Text style={styles.commentTime}>{getTimeAgo(item.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.commentBodyText}>{item.comment}</Text>
      </View>
    );
  };

  const renderHeaderComponent = () => {
    if (!post) return null;
    const isTrending = post.category === 'Trending' || post.likes_count >= 20;

    return (
      <View style={styles.postDetailContainer}>
        {/* Original Post Card */}
        <View style={styles.originalPostCard}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.author_name ? post.author_name.trim().charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.authorName}>{post.author_name}</Text>
                {isTrending && (
                  <Feather name="trending-up" size={14} color="#FFB020" style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text style={styles.authorUrdu}>{getUrduName(post.author_name)}</Text>
              <Text style={styles.timeAgo}>{getTimeAgo(post.created_at)}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{post.category}</Text>
            </View>
          </View>

          <Text style={styles.postDescription}>{post.description}</Text>

          <View style={styles.likesRow}>
            <TouchableOpacity style={styles.likeButton} onPress={handleLikePost}>
              <Feather name="heart" size={18} color="#FF4D4D" style={{ marginRight: 6 }} />
              <Text style={styles.likesCountText}>{post.likes_count} Likes / پسندیدگی</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.repliesTitle}>Replies / جوابات ({comments.length})</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Discussion Detail</Text>
          <Text style={styles.headerSubtitle}>گفتگو کی تفصیل</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#58D66D" />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <FlatList
            ref={flatListRef}
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderHeaderComponent}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />

          {/* Quick Reply Bar */}
          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Write a reply... / جواب لکھیں..."
              placeholderTextColor="#888"
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />

            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!replyText.trim() || submitting) && styles.sendButtonDisabled
              ]} 
              onPress={handleSendReply}
              disabled={!replyText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Feather name="send" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 14,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#E8F8EA',
    fontSize: 12,
    marginTop: 2,
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
  chatArea: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  postDetailContainer: {
    marginBottom: 16,
  },
  originalPostCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
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
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#58D66D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
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
  categoryBadge: {
    backgroundColor: '#E8F8EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryBadgeText: {
    color: '#58D66D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  postDescription: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 16,
  },
  likesRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesCountText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  repliesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  commentCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: '#E8F2EC',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  commentAuthorInfo: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  commentAuthorUrdu: {
    fontSize: 11,
    color: '#777',
  },
  vetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CB85C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  vetBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  commentTime: {
    fontSize: 9,
    color: '#999',
    marginTop: 1,
  },
  commentBodyText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    paddingLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8F2EC',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8F2EC',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#58D66D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});
