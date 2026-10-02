import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
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
import styles from '../../styles/ForumPostDetailScreenStyles';

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

  
  const [replyingTo, setReplyingTo] = useState(null); 

  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  
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

        
        <Text style={styles.commentBodyText}>{item.comment}</Text>

        
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
          
          {lang === 'Both' && (
            <>
              <Text style={styles.headerTitle}>Discussion</Text>
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
