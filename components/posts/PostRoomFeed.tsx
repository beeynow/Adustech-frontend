import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { PostItem } from '@/services/postsApi';
import { postsAPI } from '@/services/postsApi';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/utils/toast';
import { useAppTheme } from '@/utils/theme';
import { ActionButton, Chip, EmptyState, HeroCard } from '@/components/ui/AppChrome';
import { PostCard } from './PostCard';

type RoomChip = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
};

type PostRoomFeedProps = {
  title: string;
  subtitle: string;
  heroIcon: keyof typeof Ionicons.glyphMap;
  filters: {
    category?: string;
    departmentId?: string;
    level?: string;
    levelId?: string;
  };
  emptyTitle: string;
  emptySubtitle: string;
  chips?: RoomChip[];
  heroActions?: React.ReactNode;
  showNavCreateButton?: boolean;
};

const mergePosts = (currentPosts: PostItem[], incomingPosts: PostItem[]) => {
  const currentIds = new Set(currentPosts.map((post) => post.id));
  const nextPosts = incomingPosts.filter((post) => !currentIds.has(post.id));
  return [...currentPosts, ...nextPosts];
};

export function PostRoomFeed({
  title,
  subtitle,
  heroIcon,
  filters,
  emptyTitle,
  emptySubtitle,
  chips = [],
  heroActions,
  showNavCreateButton = true,
}: PostRoomFeedProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [posts, setPosts] = useState<PostItem[]>([]);

  const { category, departmentId, level, levelId } = filters;
  const stableFilters = useMemo(() => ({
    ...(category ? { category } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(level ? { level } : {}),
    ...(levelId ? { levelId } : {}),
  }), [category, departmentId, level, levelId]);

  const canCreatePosts = ['power', 'admin', 'd-admin'].includes(user?.role || '');

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
        ...stableFilters,
      });

      setPosts((currentPosts) => (
        append ? mergePosts(currentPosts, data.posts) : data.posts
      ));
      setPage(pageToLoad);
      setHasMore(Boolean(data.pagination.hasMore));
    } catch {
      showToast.error(append ? 'Unable to load more posts.' : 'Unable to load this room right now.');
    } finally {
      setInitialLoading(false);

      if (append) {
        setLoadingMore(false);
      }

      if (showRefresh) {
        setRefreshing(false);
      }
    }
  }, [stableFilters]);

  useEffect(() => {
    void loadPosts({ pageToLoad: 1 });
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      void loadPosts({ pageToLoad: 1 });
    }, [loadPosts])
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

  const goToDetail = useCallback((post: PostItem) => {
    router.push({
      pathname: '/post/[id]',
      params: {
        id: post.id,
      },
    });
  }, [router]);

  const handleEndReached = useCallback(() => {
    if (loadingMore || refreshing || !hasMore) {
      return;
    }

    void loadPosts({
      pageToLoad: page + 1,
      append: true,
    });
  }, [hasMore, loadPosts, loadingMore, page, refreshing]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => goToDetail(item)}
            onPressComments={() => goToDetail(item)}
            onPressLike={() => {
              void handleToggleLike(item.id);
            }}
            onPressShare={() => {
              void handleSharePost(item);
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.postGap} />}
        contentContainerStyle={styles.content}
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

            <View style={styles.navRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={18} color={theme.text} />
              </TouchableOpacity>

              {canCreatePosts && showNavCreateButton ? (
                <View style={styles.createButtonWrap}>
                  <ActionButton
                    label="Create"
                    icon="add"
                    onPress={() => router.push('/(tabs)/upload')}
                  />
                </View>
              ) : null}
            </View>

            <HeroCard
              eyebrow="Post Room"
              title={title}
              subtitle={subtitle}
              icon={heroIcon}
              actions={heroActions}
            >
              <View style={styles.chipsRow}>
                {chips.map((chip) => (
                  <Chip
                    key={`${chip.label}-${chip.icon || 'none'}`}
                    label={chip.label}
                    icon={chip.icon}
                    tone={chip.tone || 'neutral'}
                  />
                ))}
                <Chip
                  label={`${posts.length} loaded`}
                  icon="document-text-outline"
                  tone="accent"
                />
              </View>
            </HeroCard>
          </View>
        )}
        ListFooterComponent={loadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={theme.accent} />
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )}
        ListEmptyComponent={initialLoading ? (
          <View style={[styles.loadingState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.loadingLabel, { color: theme.textMuted }]}>Loading room posts…</Text>
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              title={emptyTitle}
              subtitle={emptySubtitle}
              icon="newspaper-outline"
              action={canCreatePosts ? (
                <View style={styles.emptyActionWrap}>
                  <ActionButton
                    label="Create post"
                    icon="add"
                    onPress={() => router.push('/(tabs)/upload')}
                  />
                </View>
              ) : undefined}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerBlock: {
    gap: 14,
    paddingBottom: 18,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonWrap: {
    width: 124,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  postGap: {
    height: 14,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSpacer: {
    height: 20,
  },
  loadingState: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingTop: 8,
  },
  emptyActionWrap: {
    width: 150,
    marginTop: 8,
  },
});
