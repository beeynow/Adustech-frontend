/**
 * ============================================================================
 * DEPARTMENT LEVEL POSTS PAGE
 * Isolated post room for specific department level (100-500)
 * Shows only posts for this level
 * ============================================================================
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { academicApi, AcademicPostRecord, LevelRecord } from '@/services/academicApi';
import { showToast } from '@/utils/toast';

const normalizeRole = (role?: string) => role?.trim().toLowerCase().replace(/_/g, '-') || '';

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'urgent':
      return '#d32f2f';
    case 'high':
      return '#f57c00';
    case 'low':
      return '#388e3c';
    default:
      return '#1976d2';
  }
};

export default function LevelPostsPage() {
  const params = useLocalSearchParams<{ levelId?: string | string[] }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<AcademicPostRecord[]>([]);
  const [level, setLevel] = useState<LevelRecord | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const levelId = useMemo(
    () => (Array.isArray(params.levelId) ? params.levelId[0] : params.levelId),
    [params.levelId]
  );

  const canPost = ['admin', 'power', 'd-admin'].includes(normalizeRole(user?.role));

  const loadLevelData = useCallback(async (pageToLoad = 1) => {
    if (!levelId) {
      setLevel(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      if (pageToLoad === 1) {
        setLoading(true);
      }

      const [levelData, postsData] = await Promise.all([
        pageToLoad === 1 ? academicApi.getLevel(levelId) : Promise.resolve(null),
        academicApi.getLevelPosts(levelId, { page: pageToLoad, limit: 20 }),
      ]);

      if (levelData?.level) {
        setLevel(levelData.level);
      }

      setPosts((currentPosts) => (
        pageToLoad === 1
          ? (postsData.posts || [])
          : [...currentPosts, ...(postsData.posts || [])]
      ));
      setPage(pageToLoad);
      setHasMore(postsData.pagination?.hasMore || false);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        Alert.alert(
          'Access Denied',
          'You can only view posts from your department level.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        showToast.error(error?.message || 'Unable to load this level room right now.');
      }
    } finally {
      setLoading(false);
    }
  }, [levelId, router]);

  useEffect(() => {
    void loadLevelData(1);
  }, [loadLevelData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLevelData(1);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!levelId || !hasMore || loading) {
      return;
    }

    await loadLevelData(page + 1);
  };

  const handleLikePost = async (postId: string) => {
    try {
      const result = await academicApi.likePost(postId);

      setPosts((currentPosts) => currentPosts.map((post) => (
        post.id === postId
          ? { ...post, isLiked: result.isLiked, likesCount: result.likesCount }
          : post
      )));
    } catch {
      showToast.error('Failed to like post.');
    }
  };

  const renderPost = ({ item }: { item: AcademicPostRecord }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => router.push({
        pathname: '/post/[id]',
        params: { id: item.id },
      })}
    >
      {item.priority && item.priority !== 'normal' ? (
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      ) : null}

      {item.isPinned ? (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={16} color="#fff" />
          <Text style={styles.pinnedText}>PINNED</Text>
        </View>
      ) : null}

      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <Ionicons name="person-circle" size={40} color="#1e88e5" />
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{item.author?.fullName || item.author?.name || 'Unknown'}</Text>
            <Text style={styles.authorRole}>{item.author?.role || 'user'}</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
        </Text>
      </View>

      {item.title ? (
        <Text style={styles.postTitle}>{item.title}</Text>
      ) : null}

      <Text style={styles.postContent} numberOfLines={4}>
        {item.content || item.text || 'No content available.'}
      </Text>

      {item.imageUrl || item.image_url ? (
        <View style={styles.imageContainer}>
          <Ionicons name="image" size={24} color="#666" />
          <Text style={styles.imageText}>Image attached</Text>
        </View>
      ) : null}

      <View style={styles.engagementBar}>
        <TouchableOpacity
          style={styles.engagementButton}
          onPress={() => {
            void handleLikePost(item.id);
          }}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={item.isLiked ? '#e91e63' : '#666'}
          />
          <Text style={styles.engagementText}>{item.likesCount || 0}</Text>
        </TouchableOpacity>

        <View style={styles.engagementButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.engagementText}>{item.commentsCount || 0}</Text>
        </View>

        <View style={styles.engagementButton}>
          <Ionicons name="eye-outline" size={20} color="#666" />
          <Text style={styles.engagementText}>{item.viewsCount || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Loading level posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {level ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{level.displayName}</Text>
            <Text style={styles.headerSubtitle}>
              {level.department?.name} ({level.department?.code})
            </Text>
            <Text style={styles.headerFaculty}>
              {level.department?.faculty?.name || 'Academic room'}
            </Text>
          </View>
        </View>
      ) : null}

      {canPost && levelId ? (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push({
            pathname: '/create-academic-post',
            params: { levelId },
          } as never)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Create Post</Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          void loadMore();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet in this level</Text>
            {canPost ? (
              <Text style={styles.emptySubtext}>Be the first to post!</Text>
            ) : null}
          </View>
        }
        contentContainerStyle={posts.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1e88e5',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  headerFaculty: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  pinnedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  authorRole: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  imageText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  engagementBar: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  engagementText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
