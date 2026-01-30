import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, Image, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert, Pressable, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { postsAPI } from '../../services/postsApi';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Linking from 'expo-linking';

interface CommentItem { id: string; author: string; text: string; likes?: number; liked?: boolean; }

export default function PostDetail() {
  const lastTapRef = useRef<number>(0);
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params as Record<string, string>;
  const [pTitle, setPTitle] = useState('');
  const [pAuthor, setPAuthor] = useState('');
  const [pContent, setPContent] = useState('');
  const [pImage, setPImage] = useState<string | undefined>(undefined);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const postRes = await postsAPI.get(id as string);
        const post = postRes.post;
        setPTitle(post.text?.slice(0, 80) || 'Post');
        setPAuthor(post.userName || '');
        setPContent(post.text || '');
        setPImage(post.imageUrl || post.imageBase64 || undefined);
      } catch (e) {
        // fallback remains empty
      }
      try {
        const data = await postsAPI.listComments(id as string);
        const mapped = (data.comments || []).map((c: any) => ({ id: c._id, author: c.userName, text: c.text, likes: (c.likes||[]).length, liked: false }));
        setComments(mapped);
      } catch (e) {}
    })();
  }, [id]);

  const card = isDark ? '#0F213A' : '#FFFFFF';
  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: bg }]}> 
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)' }]}> 
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={isDark ? '#64B5F6' : '#1976D2'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>Post</Text>
          <View style={{ width: 22 }} />
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={{ padding: 12 }}>
              <View style={[styles.card, { backgroundColor: card }]}> 
                <Text style={[styles.title, { color: textPrimary }]}>{pTitle}</Text>
                <Text style={{ color: muted, marginTop: 2 }}>{pAuthor}</Text>
                {!!pImage && (
                  <Pressable
                    onLongPress={async () => {
                      try {
                        if (!pImage) return;
                        const { status } = await MediaLibrary.requestPermissionsAsync();
                        if (status !== 'granted') {
                          Alert.alert('Permission needed', 'Please allow media library access to save images.');
                          return;
                        }
                        const fileName = `post_${id}_${Date.now()}.jpg`;
                        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
                        const download = await FileSystem.downloadAsync(pImage, fileUri);
                        const asset = await MediaLibrary.createAssetAsync(download.uri);
                        await MediaLibrary.createAlbumAsync('ADUSTECH', asset, false).catch(async () => {
                          await MediaLibrary.saveToLibraryAsync(download.uri);
                        });
                        Alert.alert('Saved', 'Image has been saved to your gallery.');
                      } catch (e: any) {
                        console.log('Download error', e);
                        Alert.alert('Error', e?.message || 'Failed to save image');
                      }
                    }}
                    onPress={() => {
                      // Double-tap detection for share
                      const now = Date.now();
                      if (lastTapRef.current && now - lastTapRef.current < 300) {
                        lastTapRef.current = 0;
                        // Double tap => share post link (deep link + optional web URL)
                        try {
                          const deepLink = Linking.createURL(`/post/${id}`);
                          const webUrl = `https://adustech.app/post/${id}`; // adjust if you have a real domain
                          const shareMessage = `${pTitle || 'ADUSTECH post'}\n${webUrl}`;
                          Share.share({
                            message: shareMessage,
                            url: deepLink,
                            title: 'Share post',
                          }).catch(() => {});
                        } catch {
                          Share.share({ message: pTitle || 'ADUSTECH post' }).catch(() => {});
                        }
                      } else {
                        lastTapRef.current = now;
                      }
                    }}
                  >
                    <Image source={{ uri: pImage }} style={styles.image} />
                  </Pressable>
                )}
                <Text style={{ color: muted, marginTop: 8 }}>{pContent}</Text>
              </View>
              <Text style={[styles.commentsHeading, { color: textPrimary }]}>Comments</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.comment, { backgroundColor: card }]}> 
              <View style={[styles.avatar, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{item.author.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.commentAuthor, { color: textPrimary }]}>{item.author}</Text>
                <Text style={{ color: muted }}>{item.text}</Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const res = await postsAPI.toggleLikeComment(id as string, item.id);
                    setComments(prev => prev.map(c => c.id === item.id ? { ...c, likes: res.likes, liked: res.liked } : c));
                  } catch {}
                }}
                style={{ padding: 8 }}
              >
                <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={18} color={item.liked ? (isDark ? '#FF8A80' : '#E53935') : (isDark ? '#FFCDD2' : '#C62828')} />
                <Text style={{ color: muted, fontSize: 12, textAlign: 'center' }}>{item.likes || 0}</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 88 }}
        />

        {/* Composer */}
        <View style={[styles.composerWrap, { backgroundColor: card, borderTopColor: isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)' }]}> 
          <TextInput
            style={[styles.composerInput, { color: textPrimary }]} value={text} onChangeText={setText}
            placeholder="Add a comment...." placeholderTextColor={muted}
          />
          <TouchableOpacity
            onPress={async () => {
              if (!text.trim()) return;
              try {
                const res = await postsAPI.addComment(id as string, text);
                const c = res.comment;
                setComments(prev => [...prev, { id: c._id, author: c.userName, text: c.text, likes: 0 }]);
                setText('');
              } catch (e) {}
            }}
            style={styles.sendBtn}
          >
            <Ionicons name="send" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  card: { borderRadius: 16, padding: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  image: { marginTop: 8, height: 220, borderRadius: 12, width: '100%' },
  commentsHeading: { marginTop: 8, fontSize: 16, fontWeight: '800' },
  comment: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  commentAuthor: { fontWeight: '700', marginBottom: 2 },
  composerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  composerInput: { flex: 1, height: 40 },
  sendBtn: { padding: 8 },
});
