import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { channelsAPI } from '../services/channelsApi';

export default function ChannelsListScreen() {
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const [channels, setChannels] = useState<Array<{ _id: string; name: string; description?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await channelsAPI.list();
        setChannels(data.channels || []);
      } catch (e) { setChannels([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}> 
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
          <Text style={[styles.title, { color: textPrimary }]}>Channels</Text>
          {loading && <Text style={{ color: muted }}>Loading...</Text>}
          {!loading && channels.length === 0 && (
            <Text style={{ color: muted }}>No channels yet. Tap + to create one.</Text>
          )}
          {!loading && channels.map(ch => (
            <View key={ch._id} style={{ paddingVertical: 10, borderTopWidth: 1, borderColor: border }}>
              <Text style={[styles.title, { fontSize: 16, marginBottom: 2, color: textPrimary }]}>{ch.name}</Text>
              {!!ch.description && <Text style={{ color: muted, fontSize: 12 }}>{ch.description}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
      {user?.role === 'power' && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: isDark ? '#64B5F6' : '#1976D2' }]} onPress={() => (require('expo-router').router.push('/create-channel'))}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  fab: { position: 'absolute', right: 16, bottom: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
});
