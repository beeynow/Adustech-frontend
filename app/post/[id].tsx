import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PostComment, PostItem, postsAPI } from '@/services/postsApi';
import { showToast } from '@/utils/toast';
import { useAppTheme } from '@/utils/theme';
import { PostCard } from '@/components/posts/PostCard';
import { PostCommentCard } from '@/components/posts/PostCommentCard';
import { PostAvatar } from '@/components/posts/PostAvatar';
import { useAuth } from '@/context/AuthContext';

export default function PostDetail() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const inputRef = useRef<TextInput | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params as Record<string, string>;

  const [post, setPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');
  const [detailImageAspectRatio, setDetailImageAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadPost = async () => {
      if (!id) {
        return;
      }

      setLoading(true);

      try {
        const response = await postsAPI.get(id);
        if (!active) {
          return;
        }

        setPost(response.post);
        setComments(response.post.comments || []);
      } catch {
        if (active) {
          showToast.error('Unable to load this post.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadPost();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    setDetailImageAspectRatio(null);
  }, [post?.imageUrl]);

  const handleShare = async () => {
    try {
      const deepLink = Linking.createURL(`/post/${id}`);
      const webUrl = `https://adustech.app/post/${id}`;
      await Share.share({
        message: `${post?.title || 'ADUSTECH post'}\n\n${post?.text || ''}\n\n${webUrl}`,
        url: deepLink,
        title: 'Share post',
      });
    } catch {
      showToast.error('Unable to share this post right now.');
    }
  };

  const saveImage = async () => {
    try {
      if (!post?.imageUrl) {
        return;
      }

      if (!FileSystem.cacheDirectory) {
        Alert.alert('Error', 'File storage is not available on this device right now.');
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow media library access to save images.');
        return;
      }

      const fileName = `post_${id}_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const download = await FileSystem.downloadAsync(post.imageUrl, fileUri);
      const asset = await MediaLibrary.createAssetAsync(download.uri);

      await MediaLibrary.createAlbumAsync('ADUSTECH', asset, false).catch(async () => {
        await MediaLibrary.saveToLibraryAsync(download.uri);
      });

      showToast.success('Image has been saved to your gallery.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save image');
    }
  };

  const toggleLike = async () => {
    if (!post) {
      return;
    }

    const previousPost = post;

    setPost({
      ...post,
      isLiked: !post.isLiked,
      likesCount: Math.max(0, post.likesCount + (post.isLiked ? -1 : 1)),
    });

    try {
      const response = await postsAPI.toggleLike(post.id);
      setPost((current) => (
        current
          ? { ...current, isLiked: response.liked, likesCount: response.likesCount }
          : current
      ));
    } catch {
      setPost(previousPost);
      showToast.error('Unable to update likes right now.');
    }
  };

  const addComment = async () => {
    if (!id || !text.trim() || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await postsAPI.addComment(id, text.trim());
      setComments((current) => [response.comment, ...current]);
      setPost((current) => (
        current
          ? { ...current, commentsCount: response.commentsCount || current.commentsCount + 1 }
          : current
      ));
      setText('');
    } catch (error: any) {
      showToast.error(error?.message || 'Unable to add your comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    const previousComments = comments;

    setComments((current) => current.map((comment) => (
      comment.id === commentId
        ? {
            ...comment,
            isLiked: !comment.isLiked,
            likesCount: Math.max(0, comment.likesCount + (comment.isLiked ? -1 : 1)),
          }
        : comment
    )));

    try {
      const response = await postsAPI.toggleLikeComment(id, commentId);
      setComments((current) => current.map((comment) => (
        comment.id === commentId
          ? { ...comment, likesCount: response.likesCount, isLiked: response.liked }
          : comment
      )));
    } catch {
      setComments(previousComments);
      showToast.error('Unable to react to this comment.');
    }
  };

  const detailImageWidth = Math.max(240, screenWidth - 56);
  const detailImageHeight = detailImageAspectRatio
    ? Math.max(220, Math.min(detailImageWidth / detailImageAspectRatio, 560))
    : 320;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <LinearGradient colors={theme.backdropGradient} style={StyleSheet.absoluteFillObject} />
      <View pointerEvents="none" style={styles.ambientWrap}>
        <View style={[styles.orb, styles.orbOne, { backgroundColor: theme.accentSoft }]} />
        <View style={[styles.orb, styles.orbTwo, { backgroundColor: theme.successSoft }]} />
      </View>

      <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 12 }} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerButton, { backgroundColor: theme.surfaceMuted }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            Post
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSoft }]} numberOfLines={1}>
            Thread and community replies
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          style={[styles.headerButton, { backgroundColor: theme.surfaceMuted }]}
        >
          <Ionicons name="share-social-outline" size={20} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {loading && !post ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={(
            <View style={styles.listHeader}>
              {post ? (
                <PostCard
                  post={post}
                  variant="detail"
                  showImage={false}
                  onPressComments={() => inputRef.current?.focus()}
                  onPressLike={toggleLike}
                  onPressShare={handleShare}
                />
              ) : null}

              {post?.imageUrl ? (
                <View
                  style={[
                    styles.fullImageCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      shadowColor: theme.shadow,
                    },
                  ]}
                >
                  <View style={styles.fullImageHeader}>
                    <View style={[styles.fullImageBadge, { backgroundColor: theme.accentSoft }]}>
                      <Ionicons name="image-outline" size={15} color={theme.accent} />
                      <Text style={[styles.fullImageBadgeText, { color: theme.accent }]}>Full image</Text>
                    </View>
                    <Text style={[styles.fullImageHint, { color: theme.textSoft }]}>
                      Original framing preserved
                    </Text>
                  </View>

                  <View style={[styles.fullImageFrame, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                    <Image
                      source={{ uri: post.imageUrl }}
                      style={[
                        styles.fullImage,
                        {
                          height: detailImageHeight,
                        },
                      ]}
                      resizeMode="contain"
                      onLoad={({ nativeEvent }) => {
                        const width = nativeEvent.source?.width || 0;
                        const height = nativeEvent.source?.height || 0;

                        if (width > 0 && height > 0) {
                          setDetailImageAspectRatio(width / height);
                        }
                      }}
                    />
                  </View>
                </View>
              ) : null}

              <View
                style={[
                  styles.detailActionsCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                  },
                ]}
              >
                <View style={styles.detailActionsHeader}>
                  <Text style={[styles.detailActionsTitle, { color: theme.text }]}>
                    Post details
                  </Text>
                  <Text style={[styles.detailActionsSubtitle, { color: theme.textSoft }]}>
                    Share, save media and jump into the discussion.
                  </Text>
                </View>

                <View style={styles.detailActionsRow}>
                  <TouchableOpacity
                    style={[styles.detailActionButton, { backgroundColor: theme.accentSoft }]}
                    onPress={() => inputRef.current?.focus()}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.accent} />
                    <Text style={[styles.detailActionText, { color: theme.accent }]}>Reply now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailActionButton, { backgroundColor: theme.surfaceMuted }]}
                    onPress={handleShare}
                  >
                    <Ionicons name="share-social-outline" size={18} color={theme.textMuted} />
                    <Text style={[styles.detailActionText, { color: theme.textMuted }]}>Share</Text>
                  </TouchableOpacity>

                  {post?.imageUrl ? (
                    <TouchableOpacity
                      style={[styles.detailActionButton, { backgroundColor: theme.successSoft }]}
                      onPress={saveImage}
                    >
                      <Ionicons name="download-outline" size={18} color={theme.success} />
                      <Text style={[styles.detailActionText, { color: theme.success }]}>Save image</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <View style={styles.commentsHeading}>
                <Text style={[styles.commentsTitle, { color: theme.text }]}>Replies</Text>
                <Text style={[styles.commentsSubtitle, { color: theme.textSoft }]}>
                  Follow the thread and add your own perspective.
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.surfaceMuted }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No replies yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                Be the first to respond to this post.
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.commentWrap}>
              <PostCommentCard
                comment={item}
                onPressLike={() => toggleCommentLike(item.id)}
              />
            </View>
          )}
        />
      )}

      <View
        style={[
          styles.composer,
          {
            backgroundColor: theme.surfaceStrong,
            borderTopColor: theme.border,
          },
        ]}
      >
        <PostAvatar name={user?.name || 'You'} size={40} />

        <View
          style={[
            styles.composerInputWrap,
            {
              backgroundColor: theme.input,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Post your reply..."
            placeholderTextColor={theme.textSoft}
            style={[styles.composerInput, { color: theme.text }]}
            multiline
          />
        </View>

        <TouchableOpacity
          onPress={addComment}
          disabled={submitting || !text.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: text.trim() ? theme.accent : theme.surfaceMuted,
              opacity: submitting ? 0.75 : 1,
            },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="send-outline"
              size={20}
              color={text.trim() ? '#FFFFFF' : theme.textSoft}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.8,
  },
  orbOne: {
    width: 210,
    height: 210,
    top: -70,
    right: -40,
  },
  orbTwo: {
    width: 170,
    height: 170,
    bottom: 120,
    left: -50,
  },
  header: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 118,
    flexGrow: 1,
  },
  listHeader: {
    gap: 16,
    marginBottom: 14,
  },
  fullImageCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  fullImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  fullImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  fullImageBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  fullImageHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  fullImageFrame: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  fullImage: {
    width: '100%',
  },
  detailActionsCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  detailActionsHeader: {
    gap: 4,
  },
  detailActionsTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  detailActionsSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  detailActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  detailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  detailActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  commentsHeading: {
    gap: 4,
    paddingHorizontal: 4,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  commentsSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 42,
    gap: 10,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  commentWrap: {
    marginBottom: 12,
  },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 88,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  composerInputWrap: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    marginBottom: 6,
  },
  composerInput: {
    fontSize: 15,
    minHeight: 24,
    maxHeight: 94,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
