import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Platform,
  StatusBar,
  Share,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { postsAPI } from '../../services/postsApi';
import { useAuth } from '../../context/AuthContext';
import { canPostToHome, getPermissionErrorMessage, getRoleBadgeColor, getRoleDisplayName } from '../../utils/permissions';
import NotificationModal from '../../components/NotificationModal';
import type { UserRole } from '../../utils/permissions';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { showToast } from '../../utils/toast';

interface Post {
  id: string;
  author: string;
  avatar?: string;
  category: string;
  title: string;
  content: string;
  image?: string;
  likes: number;
  reposts: number;
  comments: number;
  liked?: boolean;
  reposted?: boolean;
  createdAt?: string;
}

const CATEGORIES = ['All', 'Level', 'Department', 'Exam', 'Timetable', 'Event'];

const formatTimeAgo = (value?: string) => {
  if (!value) return 'now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'now';

  const diff = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
};

export default function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<Post[]>([] as any);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const [notifications] = useState([
    { id: '1', title: 'New Comment', message: 'Someone commented on your post', timestamp: new Date(Date.now() - 300000), read: false, type: 'info' as const },
    { id: '2', title: 'Post Liked', message: 'Your post received 10 likes', timestamp: new Date(Date.now() - 3600000), read: false, type: 'success' as const },
    { id: '3', title: 'New Event', message: 'Check out the upcoming campus event', timestamp: new Date(Date.now() - 86400000), read: true, type: 'info' as const },
  ]);

  const loadPosts = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      const data = await postsAPI.list({
        page: 1,
        limit: 10,
        category: activeCat !== 'All' ? activeCat : undefined,
        q: search || undefined,
      });
      const mapped = (data.posts || []).map((p: any) => ({
        id: p.id || p._id,
        author: p.userName,
        category: p.category || 'All',
        title: p.text?.slice(0, 40) || 'Post',
        content: p.text || '',
        image: p.imageUrl || p.imageBase64 || undefined,
        likes: (p.likes || []).length,
        reposts: (p.reposts || []).length || 0,
        comments: (p.comments || []).length,
        liked: false,
        reposted: false,
        createdAt: p.createdAt,
      }));
      setPosts(mapped);
      setPage(1);
    } catch (e) {
      showToast.error('Unable to refresh posts right now.');
    } finally {
      if (showLoading) setRefreshing(false);
    }
  }, [activeCat, search]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (activeCat !== 'All') list = list.filter((p) => p.category === activeCat);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, activeCat, search]);

  const toggleLike = async (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p))
    );
    try {
      await postsAPI.toggleLike(id);
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p))
      );
      showToast.error('Unable to update likes right now.');
    }
  };

  const toggleRepost = async (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, reposts: p.reposted ? p.reposts - 1 : p.reposts + 1, reposted: !p.reposted }
          : p
      )
    );
    try {
      await postsAPI.toggleRepost(id);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, reposts: p.reposted ? p.reposts - 1 : p.reposts + 1, reposted: !p.reposted }
            : p
        )
      );
      showToast.error('Unable to repost this post right now.');
    }
  };

  const handleSharePost = async (item: Post) => {
    try {
      await Share.share({
        message: `${item.author}: ${item.content || item.title}`,
      });
    } catch {}
  };

  const headerBg = isDark ? '#0A1929' : '#FFFFFF';
  const bg = isDark ? '#0A1929' : '#FFFFFF';
  const card = isDark ? '#0A1929' : '#FFFFFF';
  const textPrimary = isDark ? '#F3F7FF' : '#0F172A';
  const muted = isDark ? '#8AA4C8' : '#64748B';
  const border = isDark ? '#1D334F' : '#E2E8F0';

  const goToDetail = (item: Post) => {
    router.push({
      pathname: '/post/[id]',
      params: {
        id: item.id,
        title: item.title,
        author: item.author,
        content: item.content,
        image: item.image || '',
      },
    });
  };

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [sheetComments, setSheetComments] = useState<Array<{ id: string; author: string; text: string; likes?: number }>>([]);
  const [sheetText, setSheetText] = useState('');

  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentsVisible(true);
    try {
      const data = await postsAPI.listComments(postId);
      const mapped = (data.comments || []).map((c: any) => ({
        id: c._id,
        author: c.userName,
        text: c.text,
        likes: (c.likes || []).length,
      }));
      setSheetComments(mapped);
    } catch {
      setSheetComments([]);
    }
  };

  const addSheetComment = async () => {
    if (!sheetText.trim() || !activePostId) return;
    try {
      const res = await postsAPI.addComment(activePostId, sheetText);
      const c = res.comment;
      setSheetComments((prev) => [...prev, { id: c._id, author: c.userName, text: c.text, likes: 0 }]);
      setSheetText('');
      setPosts((prev) => prev.map((p) => (p.id === activePostId ? { ...p, comments: p.comments + 1 } : p)));
    } catch {}
  };

  const handleCreatePost = () => {
    const userRole = user?.role as UserRole | undefined;

    if (!canPostToHome(userRole)) {
      showToast.warning(getPermissionErrorMessage('post-home', userRole), `Role: ${getRoleDisplayName(userRole)}`);
      return;
    }

    router.push('/upload' as any);
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const renderAction = (icon: keyof typeof Ionicons.glyphMap, count: number | string, color: string, onPress: () => void) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.actionCount, { color }]}>{count}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Post }) => {
    const likeColor = item.liked ? '#E11D48' : muted;
    const repostColor = item.reposted ? '#16A34A' : muted;

    return (
      <View style={[styles.post, { backgroundColor: card, borderBottomColor: border }]}> 
        <View style={styles.postRow}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#1E40AF' : '#2563EB' }]}> 
            <Text style={styles.avatarText}>{item.author.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.postMain}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => goToDetail(item)}>
              <View style={styles.metaRow}>
                <Text style={[styles.displayName, { color: textPrimary }]} numberOfLines={1}>{item.author}</Text>
                <Text style={[styles.handle, { color: muted }]} numberOfLines={1}>@{item.author.toLowerCase().replace(/\s+/g, '')}</Text>
                <Text style={[styles.dot, { color: muted }]}>•</Text>
                <Text style={[styles.time, { color: muted }]}>{formatTimeAgo(item.createdAt)}</Text>
                <View style={[styles.categoryPill, { borderColor: border }]}> 
                  <Text style={[styles.categoryText, { color: muted }]}>{item.category}</Text>
                </View>
              </View>

              <Text style={[styles.postText, { color: textPrimary }]}>{item.content || item.title}</Text>

              {item.image ? <Image source={{ uri: item.image }} style={[styles.postImage, { borderColor: border }]} /> : null}
            </TouchableOpacity>

            <View style={styles.postActions}>
              {renderAction('chatbubble-outline', item.comments, muted, () => openComments(item.id))}
              {renderAction('repeat', item.reposts, repostColor, () => toggleRepost(item.id))}
              {renderAction(item.liked ? 'heart' : 'heart-outline', item.likes, likeColor, () => toggleLike(item.id))}
              {renderAction('bar-chart-outline', ' ', muted, () => goToDetail(item))}
              {renderAction('share-social-outline', ' ', muted, () => handleSharePost(item))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}> 
      <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 12 }} />

      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: border }]}> 
        <Text style={[styles.logo, { color: textPrimary }]}>ADUSTECH</Text>
        <View style={styles.headerRight}>
          {user?.role && (user.role === 'power' || user.role === 'admin' || user.role === 'd-admin') && (
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role as UserRole) }]}> 
              <Text style={styles.roleBadgeText}>{user.role === 'power' ? 'PA' : user.role === 'admin' ? 'A' : 'DA'}</Text>
            </View>
          )}
          <TouchableOpacity accessibilityRole="button" style={styles.notificationButton} onPress={() => setNotificationsVisible(true)}>
            <Ionicons name="notifications-outline" size={22} color={isDark ? '#93C5FD' : '#2563EB'} />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <NotificationModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        notifications={notifications}
        onMarkAsRead={() => showToast.info('Notification marked as read.')}
        onMarkAllAsRead={() => showToast.success('All notifications marked as read.')}
        onClearAll={() => showToast.success('Notifications cleared.')}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshing={refreshing}
        onRefresh={() => loadPosts(true)}
        onEndReachedThreshold={0.4}
        onEndReached={async () => {
          const nextPage = page + 1;
          setPage(nextPage);
          try {
            const data = await postsAPI.list({
              page: nextPage,
              limit: 10,
              category: activeCat !== 'All' ? activeCat : undefined,
              q: search || undefined,
            });
            const mapped = (data.posts || []).map((p: any) => ({
              id: p._id,
              author: p.userName,
              category: p.category || 'All',
              title: p.text?.slice(0, 40) || 'Post',
              content: p.text || '',
              image: p.imageUrl || p.imageBase64 || undefined,
              likes: (p.likes || []).length,
              reposts: (p.reposts || []).length || 0,
              comments: (p.comments || []).length,
              liked: false,
              reposted: false,
              createdAt: p.createdAt,
            }));
            setPosts((prev) => [...prev, ...mapped]);
          } catch {}
        }}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View style={{ backgroundColor: headerBg }}>
            <View style={[styles.searchWrap, { backgroundColor: isDark ? '#0F1F33' : '#F8FAFC', borderColor: border }]}> 
              <Ionicons name="search" color={muted} size={16} />
              <TextInput
                style={[styles.searchInput, { color: textPrimary }]}
                placeholder="Search posts, people, updates..."
                placeholderTextColor={muted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={muted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {CATEGORIES.map((cat) => {
                const active = activeCat === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCat(cat)}
                    style={[
                      styles.chip,
                      { borderColor: active ? (isDark ? '#60A5FA' : '#2563EB') : border, backgroundColor: active ? (isDark ? '#132A45' : '#EAF2FF') : 'transparent' },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? (isDark ? '#BFDBFE' : '#1D4ED8') : muted }]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: isDark ? '#2563EB' : '#1D4ED8' }]} onPress={handleCreatePost}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {commentsVisible && (
        <View style={[styles.sheetWrap, { backgroundColor: isDark ? '#0B1C2F' : '#FFFFFF', borderTopColor: border }]}> 
          <View style={[styles.sheetHeader, { borderBottomColor: border }]}> 
            <Text style={[styles.sheetTitle, { color: textPrimary }]}>Comments</Text>
            <TouchableOpacity onPress={() => setCommentsVisible(false)}>
              <Ionicons name="close" size={22} color={isDark ? '#93C5FD' : '#2563EB'} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={sheetComments}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={[styles.sheetComment, { borderBottomColor: border }]}> 
                <View style={[styles.avatar, { width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? '#1E40AF' : '#2563EB' }]}>
                  <Text style={styles.avatarText}>{item.author.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetAuthor, { color: textPrimary }]}>{item.author}</Text>
                  <Text style={[styles.sheetText, { color: muted }]}>{item.text}</Text>
                </View>
                <Text style={[styles.sheetLikes, { color: muted }]}>{item.likes || 0}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 64 }}
          />

          <View style={[styles.sheetComposer, { borderTopColor: border }]}> 
            <TextInput
              value={sheetText}
              onChangeText={setSheetText}
              placeholder="Add a comment..."
              placeholderTextColor={muted}
              style={[styles.sheetInput, { color: textPrimary }]}
            />
            <TouchableOpacity onPress={addSheetComment}>
              <Ionicons name="send" size={18} color={isDark ? '#93C5FD' : '#2563EB'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  logo: { fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  notificationButton: { position: 'relative', padding: 4 },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  searchWrap: {
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 8, paddingHorizontal: 12, paddingRight: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },

  post: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  postRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800' },
  postMain: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  displayName: { fontWeight: '800', fontSize: 15 },
  handle: { fontSize: 13, fontWeight: '500' },
  dot: { fontSize: 13 },
  time: { fontSize: 13, marginRight: 4 },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: { fontSize: 11, fontWeight: '600' },
  postText: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
  },
  postImage: {
    marginTop: 10,
    height: 220,
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
  },
  postActions: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionCount: { fontSize: 12, fontWeight: '600', minWidth: 10 },

  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },

  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '30%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
  },
  sheetHeader: {
    height: 50,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  sheetTitle: { fontWeight: '800', fontSize: 15 },
  sheetComment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sheetAuthor: { fontWeight: '700', fontSize: 14 },
  sheetText: { marginTop: 2, fontSize: 14, lineHeight: 20 },
  sheetLikes: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  sheetComposer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetInput: { flex: 1, height: 40, fontSize: 14 },
});
