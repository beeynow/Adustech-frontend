import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, FlatList, Image, ScrollView, Platform, StatusBar, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { postsAPI } from '../../services/postsApi';
import { useAuth } from '../../context/AuthContext';
import { canPostToHome, getPermissionErrorMessage, getRoleBadgeColor, getRoleDisplayName } from '../../utils/permissions';
import NotificationModal from '../../components/NotificationModal';
import type { UserRole } from '../../utils/permissions';
import { useFocusEffect } from '@react-navigation/native';

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
}

const CATEGORIES = ['All','Level','Department','Exam','Timetable','Event'];

import { useRouter } from 'expo-router';

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
  
  // Mock notifications - Replace with actual API
  const [notifications] = useState([
    { id: '1', title: 'New Comment', message: 'Someone commented on your post', timestamp: new Date(Date.now() - 300000), read: false, type: 'info' as const },
    { id: '2', title: 'Post Liked', message: 'Your post received 10 likes', timestamp: new Date(Date.now() - 3600000), read: false, type: 'success' as const },
    { id: '3', title: 'New Event', message: 'Check out the upcoming campus event', timestamp: new Date(Date.now() - 86400000), read: true, type: 'info' as const },
  ]);

  // Load posts function
  const loadPosts = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      const data = await postsAPI.list({ 
        page: 1, 
        limit: 10, 
        category: activeCat !== 'All' ? activeCat : undefined, 
        q: search || undefined 
      });
      const mapped = (data.posts || []).map((p: any) => ({
        id: p.id || p._id,
        author: p.userName,
        category: p.category || 'All',
        title: p.text?.slice(0,40) || 'Post',
        content: p.text || '',
        image: p.imageUrl || p.imageBase64 || undefined,
        likes: (p.likes || []).length,
        reposts: (p.reposts || []).length || 0,
        comments: (p.comments || []).length,
        liked: false,
      }));
      setPosts(mapped);
      setPage(1); // Reset to page 1
    } catch (e) {
      console.log('Error loading posts:', e);
    } finally {
      if (showLoading) setRefreshing(false);
    }
  }, [activeCat, search]);

  // Load on mount and when category/search changes
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Reload posts when screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Home screen focused - refreshing posts');
      loadPosts();
    }, [loadPosts])
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (activeCat !== 'All') list = list.filter(p => p.category === activeCat);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    }
    return list;
  }, [posts, activeCat, search]);

  const toggleLike = async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));
    try { await postsAPI.toggleLike(id); } catch {}
  };
  const toggleRepost = async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, reposts: (p as any).reposted ? p.reposts - 1 : p.reposts + 1, reposted: !(p as any).reposted } as any : p));
    try {
      await postsAPI.toggleRepost(id);
    } catch (e) {
      console.log('Repost error:', e);
    }
  };
  const incComment = (id: string) => setPosts(prev => prev.map(p => p.id === id ? { ...p, comments: p.comments + 1 } : p));

  const headerBg = isDark ? '#0A1929' : '#FFFFFF';
  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  const goToDetail = (item: Post) => {
    router.push({ pathname: '/post/[id]', params: { id: item.id, title: item.title, author: item.author, content: item.content, image: item.image || '' } });
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => goToDetail(item)} activeOpacity={0.8} style={[styles.post, { backgroundColor: card, borderColor: border }]}>
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>{item.author.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.postTitle, { color: textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={{ color: muted, fontSize: 12 }}>{item.author} • {item.category}</Text>
        </View>
      </View>
      <Text style={{ color: muted, marginTop: 6 }}>{item.content}</Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}
      <View style={styles.postActions} onStartShouldSetResponder={() => true}>
        {/* prevent parent touch from triggering navigation when pressing actions */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id)}>
          <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={18} color={item.liked ? '#E53935' : muted} />
          <Text style={[styles.count, { color: muted }]}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleRepost(item.id)}>
          <Ionicons name="repeat" size={18} color={muted} />
          <Text style={[styles.count, { color: muted }]}>{item.reposts}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item.id)}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={muted} />
          <Text style={[styles.count, { color: muted }]}>{item.comments}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [sheetComments, setSheetComments] = useState<Array<{ id: string; author: string; text: string; likes?: number }>>([]);
  const [sheetText, setSheetText] = useState('');

  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentsVisible(true);
    try {
      const data = await postsAPI.listComments(postId);
      const mapped = (data.comments || []).map((c: any) => ({ id: c._id, author: c.userName, text: c.text, likes: (c.likes||[]).length }));
      setSheetComments(mapped);
    } catch (e) { setSheetComments([]); }
  };

  const addSheetComment = async () => {
    if (!sheetText.trim() || !activePostId) return;
    try {
      const res = await postsAPI.addComment(activePostId, sheetText);
      const c = res.comment;
      setSheetComments(prev => [...prev, { id: c._id, author: c.userName, text: c.text, likes: 0 }]);
      setSheetText('');
      setPosts(prev => prev.map(p => p.id === activePostId ? { ...p, comments: p.comments + 1 } : p));
    } catch (e) {}
  };

  // Handle create post with permission check
  const handleCreatePost = () => {
    const userRole = user?.role as UserRole | undefined;
    
    if (!canPostToHome(userRole)) {
      Alert.alert(
        'Permission Denied',
        getPermissionErrorMessage('post-home', userRole),
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Learn More', 
            style: 'cancel',
            onPress: () => {
              Alert.alert(
                'Posting Permissions',
                `Your role: ${getRoleDisplayName(userRole)}\n\nOnly Power Admins and Admins can post to the home feed. Department Admins can post to their department channels.\n\nContact an administrator if you need posting privileges.`,
                [{ text: 'Got it' }]
              );
            }
          }
        ]
      );
      return;
    }
    
    // Navigate to upload/create post screen
    router.push('/upload' as any);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}> 
      {/* Header (non-scroll) */}
      <View style={{ height: (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 12) }} />
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: border }]}> 
        <Text style={[styles.logo, { color: textPrimary }]}>ADUSTECH</Text>
        <View style={styles.headerRight}>
          {user?.role && (user.role === 'power' || user.role === 'admin' || user.role === 'd-admin') && (
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role as UserRole) }]}>
              <Text style={styles.roleBadgeText}>{user.role === 'power' ? 'PA' : user.role === 'admin' ? 'A' : 'DA'}</Text>
            </View>
          )}
          <TouchableOpacity 
            accessibilityRole="button"
            style={styles.notificationButton}
            onPress={() => setNotificationsVisible(true)}
          >
            <Ionicons name="notifications-outline" size={22} color={isDark ? '#64B5F6' : '#1976D2'} />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Modal */}
      <NotificationModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        notifications={notifications}
        onMarkAsRead={(id) => console.log('Mark as read:', id)}
        onMarkAllAsRead={() => console.log('Mark all as read')}
        onClearAll={() => console.log('Clear all')}
      />

      {/* Search + categories (sticky header for list) */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 96 }}
        refreshing={refreshing}
        onRefresh={() => loadPosts(true)}
        onEndReachedThreshold={0.4}
        onEndReached={async () => {
          // Load next page from backend
          const nextPage = page + 1;
          setPage(nextPage);
          try {
            const data = await postsAPI.list({ page: nextPage, limit: 10, category: activeCat !== 'All' ? activeCat : undefined, q: search || undefined });
            const mapped = (data.posts || []).map((p: any) => ({
              id: p._id,
              author: p.userName,
              category: p.category || 'All',
              title: p.text?.slice(0,40) || 'Post',
              content: p.text || '',
              image: p.imageUrl || p.imageBase64 || undefined,
              likes: (p.likes || []).length,
              reposts: (p.reposts || []).length || 0,
              comments: (p.comments || []).length,
              liked: false,
            }));
            setPosts(prev => [...prev, ...mapped]);
          } catch (e) {}
        }}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View style={{ backgroundColor: headerBg }}> 
            <View style={[styles.searchWrap, { backgroundColor: headerBg, borderColor: border }]}> 
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.chipsRow, { paddingRight: 8 }]}
            >
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setActiveCat(cat)} style={[styles.chip, activeCat === cat && styles.chipActive, { borderColor: border }]}
                >
                  <Text style={[styles.chipText, { color: activeCat === cat ? (isDark ? '#FFFFFF' : '#1976D2') : muted }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
      />

      {/* Comment Bottom Sheet */}
      {commentsVisible && (
        <View style={[styles.sheetWrap, { backgroundColor: card }]}>
          <View style={[styles.sheetHeader, { backgroundColor: card, borderBottomColor: isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)' }]}>
            <Text style={[styles.sheetTitle, { color: textPrimary }]}>Comments</Text>
            <TouchableOpacity onPress={() => setCommentsVisible(false)}>
              <Ionicons name="close" size={22} color={isDark ? '#64B5F6' : '#1976D2'} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={sheetComments}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={[styles.sheetComment, { backgroundColor: card }]}>
                <View style={[styles.avatar, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{item.author.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textPrimary, fontWeight: '700' }}>{item.author}</Text>
                  <Text style={{ color: muted }}>{item.text}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="heart-outline" size={18} color={isDark ? '#FFCDD2' : '#C62828'} />
                  <Text style={{ color: muted, fontSize: 12 }}>{item.likes || 0}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 64 }}
          />
          <View style={[styles.sheetComposer, { borderTopColor: border }]}> 
            <TextInput value={sheetText} onChangeText={setSheetText} placeholder="Add a comment..." placeholderTextColor={muted} style={[styles.sheetInput, { color: textPrimary }]} />
            <TouchableOpacity onPress={addSheetComment}>
              <Ionicons name="send" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
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
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchWrap: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, borderWidth: 1, backgroundColor: 'transparent' },
  chipActive: { backgroundColor: 'rgba(25,118,210,0.12)' },
  chipText: { fontSize: 13, fontWeight: '600' },

  post: { borderRadius: 16, padding: 12, borderWidth: 1, marginBottom: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  postTitle: { fontWeight: '800', fontSize: 15 },
  postImage: { marginTop: 8, height: 200, borderRadius: 12, width: '100%' },
  postActions: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 },
  count: { fontSize: 12 },

  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '30%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 12 },
  sheetHeader: { height: 50, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  sheetTitle: { fontWeight: '800' },
  sheetComment: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  sheetComposer: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, borderTopWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' },
  sheetInput: { flex: 1, height: 40 },
});
