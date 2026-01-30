import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CARDS = [
  { key: 'channels', title: 'Channels', desc: 'Browse and join discussions', icon: 'chatbubbles-outline', color: '#1976D2' },
  { key: 'events', title: 'Events', desc: 'Upcoming campus & dept. events', icon: 'calendar-outline', color: '#8E24AA' },
  { key: 'timetable', title: 'Timetable', desc: 'Lectures and exam schedules', icon: 'time-outline', color: '#00897B' },
  { key: 'invites', title: 'Invites', desc: 'Group and committee invites', icon: 'person-add-outline', color: '#F57C00' },
  { key: 'info', title: 'Info', desc: 'Announcements & resources', icon: 'information-circle-outline', color: '#455A64' },
  { key: 'support', title: 'Support', desc: 'Get help and report issues', icon: 'help-buoy-outline', color: '#D81B60' },
];

export default function ChannelsScreen() {
  const STORAGE_KEY = 'channels_pins_v1';
  const [order, setOrder] = useState<string[] | null>(null);

  // Load saved order
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const arr = JSON.parse(raw) as string[];
          setOrder(arr);
        } else {
          setOrder(CARDS.map(c => c.key));
        }
      } catch {
        setOrder(CARDS.map(c => c.key));
      }
    })();
  }, []);

  const saveOrder = async (arr: string[]) => {
    setOrder(arr);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch {}
  };

  const isDark = useColorScheme() === 'dark';

  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  const router = useRouter();
  const onPressCard = (key: string) => {
    const map: Record<string, string> = {
      channels: '/channels-list',
      events: '/events',
      timetable: '/timetable',
      invites: '/invites',
      info: '/info',
      support: '/support',
    };
    const path = map[key] || '/channels-list';
    router.push(path as any);
  };

  const orderedCards = useMemo(() => {
    const dict = Object.fromEntries(CARDS.map(c => [c.key, c] as const));
    const base = order && order.length ? order : CARDS.map(c => c.key);
    return base.map(k => dict[k]).filter(Boolean);
  }, [order]);

  const [reorderMode, setReorderMode] = useState(false);
  const toastAnim = useState(new Animated.Value(0))[0];
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const onLongPressCard = (key: string) => {
    if (!order) return;
    const next = [key, ...order.filter(k => k !== key)];
    saveOrder(next);
    showToast('Pinned to top');
  };

  if (reorderMode && orderedCards.length) {
    const data = orderedCards.map(c => ({ key: c.key, ...c }));
    const renderItem = ({ item, drag, isActive }: RenderItemParams<(typeof data)[number]>) => (
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[styles.reorderRow, { backgroundColor: card, borderColor: border }]}
        activeOpacity={0.8}
      >
        <Ionicons name="reorder-three-outline" size={22} color={muted} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>{item.title}</Text>
          <Text style={[styles.cardDesc, { color: muted }]}>{item.desc}</Text>
        </View>
        <Ionicons name={item.icon as any} size={20} color={muted} />
      </TouchableOpacity>
    );

    return (
      <View style={[styles.container, { backgroundColor: bg }]}> 
        <View style={styles.heroWrap}>
          <Text style={[styles.heroTitle, { color: textPrimary }]}>Reorder</Text>
          <Text style={[styles.heroSub, { color: muted }]}>Drag items to change their order.</Text>
        </View>
        <DraggableFlatList
          key="reorder-list"
          data={data}
          keyExtractor={(item) => item.key}
          onDragEnd={({ data: newData }) => saveOrder(newData.map(d => d.key))}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        />
        <TouchableOpacity style={[styles.fab, { backgroundColor: isDark ? '#64B5F6' : '#1976D2' }]} onPress={() => setReorderMode(false)}>
          <Ionicons name="checkmark" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}> 
      <View style={styles.heroWrap}>
        <Text style={[styles.heroTitle, { color: textPrimary }]}>Discover</Text>
        <Text style={[styles.heroSub, { color: muted }]}>Explore channels, events, timetable, and more.</Text>
      </View>

      <View style={styles.grid}> 
        {orderedCards.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.card, { backgroundColor: card, borderColor: border }]}
            activeOpacity={0.85}
            onPress={() => onPressCard(c.key)}
            onLongPress={() => onLongPressCard(c.key)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${c.color}22`, borderColor: `${c.color}55` }]}> 
              <Ionicons name={c.icon as any} size={22} color={c.color} />
            </View>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>{c.title}</Text>
            <Text style={[styles.cardDesc, { color: muted }]}>{c.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.tip, { backgroundColor: card, borderColor: border }]}> 
        <Ionicons name="sparkles-outline" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
        <Text style={{ color: muted, marginLeft: 8, flex: 1 }}>Long press a card to pin it to the top</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  heroSub: { marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: '800', fontSize: 16 },
  cardDesc: { fontSize: 12 },
  tip: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
