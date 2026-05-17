import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { PostComment, PostItem } from '../../services/postsApi';
import { postsAPI } from '../../services/postsApi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import NotificationModal from '../../components/NotificationModal';
import { getRoleBadgeColor } from '../../utils/permissions';
import type { UserRole } from '../../utils/permissions';
import { showToast } from '../../utils/toast';
import { useAppTheme } from '../../utils/theme';
import { PostCard } from '../../components/posts/PostCard';
import { PostCommentCard } from '../../components/posts/PostCommentCard';

const CATEGORIES = ['All', 'Level', 'Department', 'Exam', 'Timetable'] as const;

const mergePosts = (currentPosts: PostItem[], incomingPosts: PostItem[]) => {
  const currentIds = new Set(currentPosts.map((post) => post.id));
  const nextPosts = incomingPosts.filter((post) => !currentIds.has(post.id));
  return [...currentPosts, ...nextPosts];
};

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markNotificationAsRead,
    clearAll,
    refreshNotifications,
  } = useNotifications();

  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<(typeof CATEGORIES)[number]>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [sheetComments, setSheetComments] = useState<PostComment[]>([]);
  const [sheetText, setSheetText] = useState('');

  const loadPosts = useCallback(async ({
    pageToLoad = 1,
    append = false,
    showRefresh = false,
  }: {
    pageToLoad?: number;
    append?: boolean;
    showRefresh?: boolean;
  } = {}) => {
    if (append) {
      setLoadingMore(true);
    }

    if (showRefresh) {
      setRefreshing(true);
    }

    try {
      const data = await postsAPI.list({
        page: pageToLoad,
        limit: 10,
        category: activeCat !== 'All' ? activeCat : undefined,
        q: search || undefined,
      });
      const visiblePosts = data.posts.filter((post) => post.category !== 'Event');

      setPosts((currentPosts) => (
        append ? mergePosts(currentPosts, visiblePosts) : visiblePosts
      ));
      setPage(pageToLoad);
      setHasMore(Boolean(data.pagination.hasMore));
    } catch {
      showToast.error(append ? 'Unable to load more posts.' : 'Unable to refresh posts right now.');
    } finally {
      if (append) {
        setLoadingMore(false);
      }

      if (showRefresh) {
        setRefreshing(false);
      }
    }
  }, [activeCat, search]);

  useEffect(() => {
    void loadPosts({ pageToLoad: 1 });
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      void loadPosts({ pageToLoad: 1 });
      void refreshNotifications();
    }, [loadPosts, refreshNotifications])
  );

  const updatePost = useCallback((postId: string, updater: (post: PostItem) => PostItem) => {
    setPosts((currentPosts) => currentPosts.map((post) => (
      post.id === postId ? updater(post) : post
    )));
  }, []);

  const handleToggleLike = async (postId: string) => {
    const previousPost = posts.find((post) => post.id === postId);
    if (!previousPost) {
      return;
    }

    updatePost(postId, (post) => ({
      ...post,
      isLiked: !post.isLiked,
      likesCount: Math.max(0, post.likesCount + (post.isLiked ? -1 : 1)),
    }));

    try {
      const response = await postsAPI.toggleLike(postId);
      updatePost(postId, (post) => ({
        ...post,
        isLiked: response.liked,
        likesCount: response.likesCount,
      }));
    } catch {
      updatePost(postId, () => previousPost);
      showToast.error('Unable to update likes right now.');
    }
  };

  const handleSharePost = async (post: PostItem) => {
    try {
      await Share.share({
        message: `${post.author.name}: ${post.text || post.title}`,
      });
    } catch {
      showToast.error('Unable to share this post right now.');
    }
  };

  const goToDetail = (post: PostItem) => {
    router.push({
      pathname: '/post/[id]',
      params: {
        id: post.id,
      },
    });
  };

  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentsVisible(true);
    setLoadingComments(true);

    try {
      const response = await postsAPI.listComments(postId);
      setSheetComments(response.comments);
    } catch {
      setSheetComments([]);
      showToast.error('Unable to load comments right now.');
    } finally {
      setLoadingComments(false);
    }
  };

  const addSheetComment = async () => {
    if (!sheetText.trim() || !activePostId || submittingComment) {
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await postsAPI.addComment(activePostId, sheetText.trim());
      setSheetComments((currentComments) => [response.comment, ...currentComments]);
      updatePost(activePostId, (post) => ({
        ...post,
        commentsCount: response.commentsCount || post.commentsCount + 1,
      }));
      setSheetText('');
    } catch (error: any) {
      showToast.error(error?.message || 'Unable to add your comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleSheetCommentLike = async (commentId: string) => {
    if (!activePostId) {
      return;
    }

    const previousComments = sheetComments;

    setSheetComments((currentComments) => currentComments.map((comment) => (
      comment.id === commentId
        ? {
            ...comment,
            isLiked: !comment.isLiked,
            likesCount: Math.max(0, comment.likesCount + (comment.isLiked ? -1 : 1)),
          }
        : comment
    )));

    try {
      const response = await postsAPI.toggleLikeComment(activePostId, commentId);
      setSheetComments((currentComments) => currentComments.map((comment) => (
        comment.id === commentId
          ? {
              ...comment,
              isLiked: response.liked,
              likesCount: response.likesCount,
            }
          : comment
      )));
    } catch {
      setSheetComments(previousComments);
      showToast.error('Unable to react to this comment.');
    }
  };

  const handleEndReached = useCallback(() => {
    if (loadingMore || refreshing || !hasMore) {
      return;
    }

    void loadPosts({
      pageToLoad: page + 1,
      append: true,
    });
  }, [hasMore, loadPosts, loadingMore, page, refreshing]);

  const activePost = useMemo(
    () => posts.find((post) => post.id === activePostId) || null,
    [activePostId, posts]
  );

  const openNotifications = useCallback(() => {
    void refreshNotifications().finally(() => {
      setNotificationsVisible(true);
    });
  }, [refreshNotifications]);

  const handleOpenNotification = useCallback((notification: { id: string; actionPath?: string }) => {
    void markNotificationAsRead(notification.id)
      .catch(() => {
        showToast.error('Unable to update that notification right now.');
      })
      .finally(() => {
        setNotificationsVisible(false);
        if (notification.actionPath) {
          router.push(notification.actionPath as never);
        }
      });
  }, [markNotificationAsRead, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NotificationModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          void markNotificationAsRead(id).catch(() => {
            showToast.error('Unable to update that notification right now.');
          });
        }}
        onMarkAllAsRead={() => {
          void markAllAsRead()
            .then(() => {
              showToast.success('All notifications marked as read.');
            })
            .catch(() => {
              showToast.error('Unable to mark all notifications as read.');
            });
        }}
        onClearAll={() => {
          void clearAll()
            .then(() => {
              showToast.success('Notifications cleared.');
            })
            .catch(() => {
              showToast.error('Unable to clear notifications right now.');
            });
        }}
        onPressNotification={handleOpenNotification}
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => goToDetail(item)}
            onPressComments={() => {
              void openComments(item.id);
            }}
            onPressLike={() => {
              void handleToggleLike(item.id);
            }}
            onPressShare={() => {
              void handleSharePost(item);
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.postGap} />}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => {
          void loadPosts({ pageToLoad: 1, showRefresh: true });
        }}
        onEndReachedThreshold={0.35}
        onEndReached={handleEndReached}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={(
          <View style={styles.headerBlock}>
            <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 12 }} />

            <View
              style={[
                styles.header,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.headerBrand}>
                <Text style={[styles.logo, { color: theme.text }]}>ADUSTECH</Text>
                <Text style={[styles.logoSubtitle, { color: theme.textSoft }]}>
                  Campus pulse in one feed
                </Text>
              </View>

              <View style={styles.headerRight}>
                {user?.role && (user.role === 'power' || user.role === 'admin' || user.role === 'd-admin') ? (
                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor: getRoleBadgeColor(user.role as UserRole),
                      },
                    ]}
                  >
                    <Text style={styles.roleBadgeText}>
                      {user.role === 'power' ? 'PA' : user.role === 'admin' ? 'A' : 'DA'}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.notificationButton, { backgroundColor: theme.surfaceMuted }]}
                  onPress={openNotifications}
                >
                  <Ionicons name="notifications-outline" size={22} color={theme.accent} />
                  {unreadCount > 0 ? (
                    <View style={[styles.notificationBadge, { borderColor: theme.surface }]}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                styles.searchWrap,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <Ionicons name="search" color={theme.textSoft} size={20} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search posts, people, updates..."
                placeholderTextColor={theme.textSoft}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textSoft} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {CATEGORIES.map((category) => {
                const isActive = activeCat === category;
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setActiveCat(category)}
                    style={[
                      styles.chip,
                      {
                        borderColor: isActive ? theme.accent : theme.border,
                        backgroundColor: isActive ? theme.accentSoft : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isActive ? theme.accent : theme.textMuted },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        ListFooterComponent={loadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={theme.accent} />
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )}
        ListEmptyComponent={refreshing ? null : (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="newspaper-outline" size={22} color={theme.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No posts yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSoft }]}>
              Try a different search or category, or check back in a moment.
            </Text>
          </View>
        )}
      />

      {commentsVisible ? (
        <View style={styles.sheetOverlay}>
          <View
            style={[
              styles.sheetWrap,
              {
                backgroundColor: theme.surfaceStrong,
                borderTopColor: theme.border,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.borderStrong }]} />

            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.sheetHeaderText}>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>Comments</Text>
                <Text style={[styles.sheetSubtitle, { color: theme.textSoft }]}>
                  {activePost ? `${activePost.commentsCount} saved replies` : 'Join the conversation'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.sheetClose, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setCommentsVisible(false)}
              >
                <Ionicons name="close" size={18} color={theme.textSoft} />
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <View style={styles.sheetLoader}>
                <ActivityIndicator size="small" color={theme.accent} />
              </View>
            ) : (
              <FlatList
                data={sheetComments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.sheetCommentWrap}>
                    <PostCommentCard
                      comment={item}
                      onPressLike={() => {
                        void toggleSheetCommentLike(item.id);
                      }}
                    />
                  </View>
                )}
                contentContainerStyle={styles.sheetListContent}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={(
                  <View style={styles.sheetEmptyState}>
                    <Text style={[styles.sheetEmptyTitle, { color: theme.text }]}>
                      No comments yet
                    </Text>
                    <Text style={[styles.sheetEmptySubtitle, { color: theme.textSoft }]}>
                      Start the thread and your reply will be saved to this post.
                    </Text>
                  </View>
                )}
              />
            )}

            <View style={[styles.sheetComposer, { borderTopColor: theme.border }]}>
              <View
                style={[
                  styles.sheetInputWrap,
                  {
                    backgroundColor: theme.input,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TextInput
                  value={sheetText}
                  onChangeText={setSheetText}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.textSoft}
                  style={[styles.sheetInput, { color: theme.text }]}
                />
              </View>

              <TouchableOpacity
                onPress={addSheetComment}
                disabled={submittingComment || !sheetText.trim()}
                style={[
                  styles.sheetSend,
                  {
                    backgroundColor: sheetText.trim() ? theme.accent : theme.surfaceMuted,
                    opacity: submittingComment ? 0.75 : 1,
                  },
                ]}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name="send-outline"
                    size={18}
                    color={sheetText.trim() ? '#FFFFFF' : theme.textSoft}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 116,
    flexGrow: 1,
  },
  headerBlock: {
    gap: 14,
    marginBottom: 18,
  },
  header: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerBrand: {
    flex: 1,
    gap: 4,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderWidth: 2,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  searchWrap: {
    height: 58,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  chipsRow: {
    gap: 10,
    paddingRight: 6,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  postGap: {
    height: 14,
  },
  footerLoader: {
    paddingVertical: 18,
  },
  footerSpacer: {
    height: 10,
  },
  emptyState: {
    marginTop: 24,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  emptyIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5, 15, 26, 0.18)',
  },
  sheetWrap: {
    minHeight: '64%',
    maxHeight: '84%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  sheetHandle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetHeader: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  sheetHeaderText: {
    flex: 1,
    gap: 3,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 104,
  },
  sheetCommentWrap: {
    marginBottom: 12,
  },
  sheetEmptyState: {
    paddingTop: 36,
    alignItems: 'center',
    gap: 8,
  },
  sheetEmptyTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sheetEmptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  sheetComposer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetInputWrap: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  sheetInput: {
    fontSize: 15,
    minHeight: 24,
  },
  sheetSend: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
