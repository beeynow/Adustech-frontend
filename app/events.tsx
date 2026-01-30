import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { eventsAPI } from '../services/eventsApi';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function EventsScreen() {
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try {
    const data = await eventsAPI.list(); setEvents(data.events||[]);
  } catch {} finally { setLoading(false); } })(); }, []);

  const groups = useMemo(() => {
    const byDay: Record<string, any[]> = {};
    for (const ev of events) {
      const d = new Date(ev.startsAt);
      const key = d.toDateString();
      (byDay[key] ||= []).push(ev);
    }
    Object.values(byDay).forEach(arr => arr.sort((a,b)=> new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime()));
    return byDay;
  }, [events]);

  const fmtTime = (iso:string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const fmtDay = (key:string) => {
    const d = new Date(key);
    const today = new Date();
    const diff = Math.floor((d.setHours(0,0,0,0)-today.setHours(0,0,0,0))/(24*3600*1000));
    if (diff===0) return 'Today'; if (diff===1) return 'Tomorrow'; if (diff===-1) return 'Yesterday';
    return new Date(key).toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}> 
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.title, { color: textPrimary }]}>Events</Text>
        {loading && <Text style={{ color: muted }}>Loading...</Text>}
        {!loading && Object.keys(groups).length===0 && (
          <View style={[styles.emptyWrap, { backgroundColor: card, borderColor: border }]}> 
            <View style={{ height: 140, width: '100%', borderRadius: 12, overflow:'hidden', marginBottom: 10 }}>
              <Image source={require('../assets/images/partial-react-logo.png')} style={{ width: '100%', height: '100%' }} contentFit="contain" />
            </View>
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No events yet</Text>
            <Text style={{ color: muted, textAlign: 'center' }}>Stay tuned for upcoming activities and announcements.</Text>
            {user && ['power','admin','d-admin'].includes(user.role || 'user') && (
              <TouchableOpacity style={[styles.emptyCta, { backgroundColor: isDark ? '#64B5F6' : '#1976D2' }]} onPress={() => (require('expo-router').router.push('/create-event'))}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={{ color:'#fff', fontWeight:'800' }}>Create event</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {!loading && Object.entries(groups).map(([day, items]) => (
          <View key={day} style={[styles.dayWrap, { borderColor: border }]}> 
            <Text style={[styles.dayTitle, { color: textPrimary }]}>{fmtDay(day)}</Text>
            {items.map(ev => (
              <View key={ev._id} style={[styles.eventCard, { backgroundColor: card, borderColor: border }]}> 
                <View style={styles.timeBadge}><Ionicons name="time-outline" size={14} color="#fff" /><Text style={styles.timeText}>{fmtTime(ev.startsAt)}</Text></View>
                <Text style={[styles.eventTitle, { color: textPrimary }]}>{ev.title}</Text>
                {!!ev.location && <Text style={{ color: muted }}>{ev.location}</Text>}
                {!!ev.details && <Text style={{ color: muted }} numberOfLines={2}>{ev.details}</Text>}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      {user && ['power','admin','d-admin'].includes(user.role || 'user') && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: isDark ? '#64B5F6' : '#1976D2' }]} onPress={() => (require('expo-router').router.push('/create-event'))}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  fab: { position: 'absolute', right: 16, bottom: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  dayWrap: { marginTop: 10, paddingTop: 8, borderTopWidth: 1 },
  dayTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  eventCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, overflow:'hidden' },
  timeBadge: { position: 'absolute', right: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1976D2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  timeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  eventTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptyWrap: { borderWidth: 1, borderRadius: 16, padding: 16, alignItems:'center', justifyContent:'center', marginTop: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptyCta: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, flexDirection:'row', alignItems:'center', gap:6 },
});
