import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile, subscribeProfile } from '../../utils/profileStore';
import { t } from '../../utils/translate';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export default function ForumPostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(getProfile());
  const userName = profile.userName || params.userName || '';
  const { postId, userId } = params;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likedComments, setLikedComments] = useState(new Set());

  // Reply-to-comment state
  const [replyingTo, setReplyingTo] = useState(null); // { id, authorName }

  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  // Subscribe to profile updates
  useEffect(() => {
    const unsubscribeProfile = subscribeProfile((updatedProfile) => {
      setProfile(updatedProfile);
    });
    return () => unsubscribeProfile();
  }, []);

  const fetchPostDetails = useCallback(async () => {
    if (!postId) return;
    try {
      const response = await fetch(`${BASE_URL}/api/forum/posts/${postId}`);
      if (!response.ok) throw new Error('Failed to fetch post details');
      const data = await response.json();
      setPost(data.post);
      // Build threaded comment structure: top-level + nested
      const allComments = data.comments || [];
      setComments(allComments);
    } catch (error) {
      console.error('Error fetching post details:', error);
      Alert.alert(t('Error', 'خرابی'), t('Failed to load post details. Please try again.', 'پوسٹ کی تفصیلات لوڈ کرنے میں ناکامی۔ دوبارہ کوشش کریں۔'));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);

  const handleSendReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    if (!userName) {
      Alert.alert(t('Not Logged In', 'لاگ ان نہیں ہے'), t('Please log in to post a reply.', 'براہ کرم جواب پوسٹ کرنے کے لیے لاگ ان کریں۔'));
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        userName: userName.trim(),
        comment: trimmed,
      };
      if (userId) body.userId = userId;
      if (replyingTo) body.parentCommentId = replyingTo.id;

      const response = await fetch(`${BASE_URL}/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setReplyText('');
        setReplyingTo(null);
        await fetchPostDetails();
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 350);
      } else {
        Alert.alert(t('Error', 'خرابی'), data.error || t('Failed to post reply. Please try again.', 'جواب پوسٹ کرنے میں ناکامی۔ دوبارہ کوشش کریں۔'));
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert(t('Network Error', 'نیٹ ورک کی خرابی'), t('Could not post reply. Please check your connection.', 'جواب پوسٹ نہیں کیا جا سکا۔ اپنا کنکشن چیک کریں۔'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async () => {
    if (!post) return;
    if (isLiked) {
      Alert.alert(t('Already Liked', 'پہلے ہی پسند کیا گیا'), t('You have already liked this post.', 'آپ پہلے ہی اس پوسٹ کو پسند کر چکے ہیں۔'));
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/api/forum/posts/${post.id}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(true);
        setPost((prev) => ({ ...prev, likes_count: data.likesCount }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (likedComments.has(commentId)) {
      Alert.alert(t('Already Liked', 'پہلے ہی پسند کیا گیا'), t('You already liked this reply.', 'آپ پہلے ہی اس جواب کو پسند کر چکے ہیں۔'));
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/api/forum/comments/${commentId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setLikedComments((prev) => new Set([...prev, commentId]));
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, likes_count: data.likesCount } : c
          )
        );
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleReplyToComment = (comment) => {
    setReplyingTo({ id: comment.id, authorName: comment.author_name });
    setReplyText('');
    // Focus the input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    const days = Math.floor(seconds / 86400);
    if (days >= 1) return days === 1 ? t('1 day ago', '1 دن پہلے') : `${days} ${t('days ago', 'دن پہلے')}`;
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

  // Build a nested structure: top-level comments with their replies
  const buildThreadedComments = () => {
    const topLevel = comments.filter((c) => !c.parent_comment_id);
    const replies = comments.filter((c) => !!c.parent_comment_id);
    return topLevel.map((c) => ({
      ...c,
      replies: replies.filter((r) => r.parent_comment_id === c.id),
    }));
  };

  const renderReplyItem = (reply) => {
    const isLiked = likedComments.has(reply.id);
    const isVet = reply.author_role === 'vet';
    return (
      <View key={reply.id.toString()} style={styles.nestedReplyCard}>
        <View style={styles.commentHeader}>
          <View style={[styles.commentAvatar, styles.replyAvatar, { backgroundColor: isVet ? '#FFB020' : '#4CB85C' }]}>
            <Text style={styles.commentAvatarText}>{getAvatarLetter(reply.author_name)}</Text>
          </View>
          <View style={styles.commentAuthorInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={styles.commentAuthorName}>{reply.author_name}</Text>
              {isVet && (
                <View style={styles.vetBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={9} color="#FFF" style={{ marginRight: 2 }} />
                  <Text style={styles.vetBadgeText}>{t('Vet', 'ڈاکٹر')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.commentTime}>{getTimeAgo(reply.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.commentBodyText}>{reply.comment}</Text>
        {/* Like for nested reply */}
        <TouchableOpacity
          style={styles.commentActionRow}
          onPress={() => handleLikeComment(reply.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={12} color={isLiked ? '#FF4D4D' : '#CCC'} style={{ marginRight: 4 }} />
          <Text style={[styles.commentActionText, isLiked && { color: '#FF4D4D' }]}>
            {(reply.likes_count > 0 ? `${reply.likes_count} ` : '') + (isLiked ? t('Liked', 'پسند کیا گیا') : t('Like', 'پسند کریں'))}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCommentItem = ({ item }) => {
    const isVet = item.author_role === 'vet';
    const isCommentLiked = likedComments.has(item.id);

    return (
      <View style={styles.commentCard}>
        {/* Comment Header */}
        <View style={styles.commentHeader}>
          <View style={[styles.commentAvatar, { backgroundColor: isVet ? '#FFB020' : '#58D66D' }]}>
            <Text style={styles.commentAvatarText}>{getAvatarLetter(item.author_name)}</Text>
          </View>
          <View style={styles.commentAuthorInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={styles.commentAuthorName}>{item.author_name}</Text>
              {isVet && (
                <View style={styles.vetBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={10} color="#FFF" style={{ marginRight: 2 }} />
                  <Text style={styles.vetBadgeText}>{t('Verified Vet', 'تصدیق شدہ ڈاکٹر')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.commentTime}>{getTimeAgo(item.created_at)}</Text>
          </View>
        </View>

        {/* Comment Body */}
        <Text style={styles.commentBodyText}>{item.comment}</Text>

        {/* Like + Reply actions */}
        <View style={styles.commentActionsRow}>
          <TouchableOpacity
            style={styles.commentActionBtn}
            onPress={() => handleLikeComment(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather
              name="heart"
              size={14}
              color={isCommentLiked ? '#FF4D4D' : '#BBB'}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.commentActionText, isCommentLiked && { color: '#FF4D4D' }]}>
              {(item.likes_count > 0 ? `${item.likes_count} ` : '') + (isCommentLiked ? t('Liked', 'پسند کیا گیا') : t('Like', 'پسند کریں'))}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commentActionBtn, { marginLeft: 18 }]}
            onPress={() => handleReplyToComment(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="corner-down-right" size={14} color="#58D66D" style={{ marginRight: 5 }} />
            <Text style={[styles.commentActionText, { color: '#58D66D' }]}>
              {t('Reply', 'جواب دیں') + (item.replies && item.replies.length > 0 ? ` (${item.replies.length})` : '')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nested Replies */}
        {item.replies && item.replies.length > 0 && (
          <View style={styles.nestedRepliesContainer}>
            <View style={styles.nestedLine} />
            <View style={{ flex: 1 }}>
              {item.replies.map((reply) => renderReplyItem(reply))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHeaderComponent = () => {
    if (!post) return null;
    const isTrending = post.category === 'Trending' || post.likes_count >= 20;

    return (
      <View style={styles.postDetailContainer}>
        <View style={styles.originalPostCard}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getAvatarLetter(post.author_name)}</Text>
            </View>
            <View style={styles.authorInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.authorName}>{post.author_name}</Text>
                {isTrending && (
                  <Feather name="trending-up" size={13} color="#FFB020" style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text style={styles.timeAgo}>{getTimeAgo(post.created_at)}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{t(post.category, post.category === 'Trending' ? 'مقبول' : 'عام')}</Text>
            </View>
          </View>

          {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
          <Text style={styles.postDescription}>{post.description}</Text>

          <View style={styles.likesRow}>
            <TouchableOpacity style={styles.likeButton} onPress={handleLikePost}>
              <Feather
                name="heart"
                size={18}
                color={isLiked ? '#FF4D4D' : '#FF7B7B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.likesCountText, isLiked && { color: '#FF4D4D' }]}>
                {post.likes_count} {isLiked ? t('Liked!', 'پسند کیا گیا!') : t('Like', 'پسند کریں')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.repliesTitleRow}>
          <Feather name="message-square" size={15} color="#58D66D" style={{ marginRight: 6 }} />
          <Text style={styles.repliesTitle}>
            {t('Replies', 'جوابات')}{' '}
            <Text style={styles.repliesCount}>({comments.length})</Text>
          </Text>
        </View>

        {comments.length === 0 && (
          <View style={styles.noRepliesBox}>
            <MaterialCommunityIcons name="chat-outline" size={36} color="#CCC" />
            <Text style={styles.noRepliesText}>{t('No replies yet — be the first!', 'ابھی کوئی جواب نہیں — پہلے جواب دیں!')}</Text>
          </View>
        )}
      </View>
    );
  };

  const threadedComments = buildThreadedComments();
  const lang = profile.language || 'English';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="chevron-left" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {lang === 'English' && <Text style={styles.headerTitle}>Discussion</Text>}
          {lang === 'Urdu' && <Text style={styles.headerTitle}>گفتگو کی تفصیل</Text>}
          {lang === 'Both' && (
            <>
              <Text style={styles.headerTitle}>Discussion</Text>
              <Text style={styles.headerSubtitle}>گفتگو کی تفصیل</Text>
            </>
          )}
        </View>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#58D66D" />
          <Text style={styles.loadingText}>{t('Loading discussion...', 'گفتگو لوڈ ہو رہی ہے...')}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={threadedComments}
            renderItem={renderCommentItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderHeaderComponent}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: Math.max(insets.bottom, 12) + 8 },
            ]}
            showsVerticalScrollIndicator={false}
          />

          {/* Reply Banner — shows when replying to a specific comment */}
          {replyingTo && (
            <View style={styles.replyBanner}>
              <Feather name="corner-down-right" size={14} color="#58D66D" style={{ marginRight: 6 }} />
              <Text style={styles.replyBannerText} numberOfLines={1}>
                {t('Replying to', 'جواب دے رہے ہیں')} <Text style={{ fontWeight: 'bold' }}>{replyingTo.authorName}</Text>
              </Text>
              <TouchableOpacity onPress={cancelReply} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={16} color="#888" />
              </TouchableOpacity>
            </View>
          )}

          {/* Reply Input */}
          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <View style={styles.inputInner}>
              <View style={styles.inputAvatarSmall}>
                <Text style={styles.inputAvatarText}>{getAvatarLetter(userName)}</Text>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder={
                  replyingTo
                    ? t(`Reply to ${replyingTo.authorName}...`, `${replyingTo.authorName} کو جواب دیں...`)
                    : t('Write a reply...', 'جواب لکھیں...')
                }
                placeholderTextColor="#999"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!replyText.trim() || submitting) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendReply}
                disabled={!replyText.trim() || submitting}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Feather name="send" size={17} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
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
    fontSize: 11,
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
    color: '#555',
  },
  chatArea: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  postDetailContainer: {
    marginBottom: 8,
  },
  originalPostCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F2EC',
    marginBottom: 18,
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
  authorInfo: { flex: 1 },
  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  timeAgo: {
    fontSize: 11,
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
  postTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
    marginBottom: 10,
    lineHeight: 22,
  },
  postDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 16,
  },
  likesRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4F0',
    paddingTop: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesCountText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  repliesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  repliesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  repliesCount: {
    color: '#888',
    fontWeight: '500',
  },
  noRepliesBox: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F2EC',
    marginBottom: 14,
  },
  noRepliesText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    fontWeight: '500',
  },
  noRepliesUrdu: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 4,
  },
  // Top-level comment card
  commentCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E8F2EC',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentAvatarText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  commentAuthorInfo: { flex: 1 },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  vetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CB85C',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  vetBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  commentTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  commentBodyText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 19,
    marginBottom: 10,
  },
  commentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F4',
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  commentActionText: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '600',
  },
  // Nested replies
  nestedRepliesContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nestedLine: {
    width: 2,
    backgroundColor: '#E0EBE4',
    borderRadius: 1,
    marginRight: 10,
    marginLeft: 6,
  },
  nestedReplyCard: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F4',
  },
  // Reply banner
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FBF2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#D5EFD9',
  },
  replyBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
  },
  // Input area
  inputContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E8F2EC',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputAvatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#58D66D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputAvatarText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0EBE4',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#58D66D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#58D66D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#C8C8C8',
    shadowOpacity: 0,
    elevation: 0,
  },
});
