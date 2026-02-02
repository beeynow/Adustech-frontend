import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { channelsAPI, Channel } from '../services/channelsApi';
import { useRouter } from 'expo-router';

export default function ChannelsListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await channelsAPI.list();
      setChannels(data.channels || []);
    } catch (e) { 
      console.error('Failed to load channels:', e);
      setChannels([]); 
    } finally { 
      setLoading(false); 
    }
  };

  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  const handleChannelPress = (channel: Channel) => {
    // Navigate to channel detail/chat screen
    // For now, show a basic alert
    alert(`Opening channel: ${channel.name}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}> 
      <ScrollView 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
          <Text style={[styles.title, { color: textPrimary }]}>Channels</Text>
          <Text style={[styles.subtitle, { color: muted, marginBottom: 12 }]}>
            Join channels to collaborate and stay updated
          </Text>
          
          {loading && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={isDark ? '#64B5F6' : '#1976D2'} />
            </View>
          )}
          
          {!loading && channels.length === 0 && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Ionicons name="chatbubbles-outline" size={48} color={muted} style={{ opacity: 0.3 }} />
              <Text style={{ color: muted, marginTop: 12, textAlign: 'center' }}>
                No channels yet. {user?.role === 'power' ? 'Tap + to create one.' : 'Check back soon!'}
              </Text>
            </View>
          )}
          
          {!loading && channels.map((ch) => {
            const channelId = ch.id || ch._id || '';
            return (
              <TouchableOpacity 
                key={channelId} 
                style={[styles.channelItem, { borderTopColor: border }]}
                onPress={() => handleChannelPress(ch)}
                activeOpacity={0.7}
              >
                <View style={[styles.channelIcon, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
                  <Ionicons 
                    name={ch.visibility === 'private' ? 'lock-closed' : 'chatbubbles'} 
                    size={20} 
                    color={isDark ? '#64B5F6' : '#1976D2'} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={[styles.channelName, { color: textPrimary }]}>{ch.name}</Text>
                    {ch.departmentId && (
                      <View style={[styles.badge, { backgroundColor: isDark ? '#2E7D32' : '#C8E6C9' }]}>
                        <Text style={[styles.badgeText, { color: isDark ? '#A5D6A7' : '#2E7D32' }]}>
                          Dept
                        </Text>
                      </View>
                    )}
                    {ch.level && (
                      <View style={[styles.badge, { backgroundColor: isDark ? '#7B1FA2' : '#E1BEE7', marginLeft: 4 }]}>
                        <Text style={[styles.badgeText, { color: isDark ? '#CE93D8' : '#7B1FA2' }]}>
                          {ch.level}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!!ch.description && (
                    <Text style={{ color: muted, fontSize: 13 }} numberOfLines={1}>
                      {ch.description}
                    </Text>
                  )}
                  {ch.members && ch.members.length > 0 && (
                    <Text style={{ color: muted, fontSize: 11, marginTop: 4 }}>
                      {ch.members.length} {ch.members.length === 1 ? 'member' : 'members'}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={muted} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      {(user?.role === 'power' || user?.role === 'admin' || user?.role === 'd-admin') && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: isDark ? '#64B5F6' : '#1976D2' }]} 
          onPress={() => router.push('/create-channel' as any)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 8 },
  channelItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, 
    borderTopWidth: 1,
    gap: 12,
  },
  channelIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelName: { 
    fontSize: 16, 
    fontWeight: '700',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fab: { 
    position: 'absolute', 
    right: 16, 
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
});
