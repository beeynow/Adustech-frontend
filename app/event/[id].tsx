import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { eventsAPI } from '../../services/eventsApi';
import * as Calendar from 'expo-calendar';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';

export default function EventDetail() {
  const isDark = useColorScheme() === 'dark';
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [ev, setEv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [recurrence, setRecurrence] = useState<'none'|'daily'|'weekly'|'monthly'>('none');
  const [reminder, setReminder] = useState<'none'|'10'|'30'|'60'>('30');

  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  useEffect(() => {
    (async () => {
      try { const data = await eventsAPI.get(String(id)); setEv(data.event); } catch { setEv(null); } finally { setLoading(false); }
    })();
  }, [id]);

  const fmtTime = (iso:string) => new Date(iso).toLocaleString();

  const addToCalendar = async () => {
    try {
      const perm = await Calendar.requestCalendarPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Permission', 'Calendar permission needed'); return; }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCal = calendars.find(c => c.allowsModifications) || calendars[0];
      if (!defaultCal) { Alert.alert('Calendar', 'No writable calendar found'); return; }
      const startDate = new Date(ev.startsAt);
      const endDate = new Date(startDate.getTime() + 60*60*1000);
      const alarms: Calendar.Alarm[] = [];
      if (reminder !== 'none') {
        const m = parseInt(reminder, 10);
        alarms.push({ relativeOffset: -m });
      }
      const recurrenceRule = recurrence === 'none' ? undefined : {
        frequency: recurrence === 'daily' ? Calendar.Frequency.DAILY : recurrence === 'weekly' ? Calendar.Frequency.WEEKLY : Calendar.Frequency.MONTHLY,
      } as Calendar.RecurrenceRule;
      await Calendar.createEventAsync(defaultCal.id, {
        title: ev.title,
        notes: ev.details || '',
        location: ev.location || undefined,
        startDate,
        endDate,
        timeZone: undefined,
        alarms,
        recurrenceRule,
      });
      Alert.alert('Added', 'Event added to your calendar');
    } catch (e:any) {
      Alert.alert('Error', e?.message || 'Failed to add to calendar');
    }
  };

  const shareEvent = () => {
    try {
      const deep = Linking.createURL(`/event/${ev._id}`);
      const web = `https://adustech.app/event/${ev._id}`;
      require('react-native').Share.share({ message: `${ev.title}\n${web}`, url: deep, title: 'Share event' });
    } catch {}
  };

  if (loading) return <View style={[styles.container, { backgroundColor: bg, alignItems:'center', justifyContent:'center' }]}><Text style={{ color: textPrimary }}>Loading...</Text></View>;
  if (!ev) return <View style={[styles.container, { backgroundColor: bg, alignItems:'center', justifyContent:'center' }]}><Text style={{ color: textPrimary }}>Event not found</Text></View>;

  const expired = new Date(ev.expireAt) <= new Date();

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}> 
      <View style={{ padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 10, flexDirection:'row', alignItems:'center', gap:8 }}>
          <Ionicons name="arrow-back" size={20} color={isDark ? '#64B5F6' : '#1976D2'} />
          <Text style={{ color: isDark ? '#64B5F6' : '#1976D2', fontWeight:'700' }}>Back</Text>
        </TouchableOpacity>
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
          {!!ev.imageUrl && (
            <View style={{ height: 220, borderRadius: 12, overflow:'hidden', marginBottom: 12 }}>
              <Image source={{ uri: ev.imageUrl }} style={{ width:'100%', height:'100%' }} />
            </View>
          )}
          <Text style={[styles.title, { color: textPrimary }]}>{ev.title}</Text>
          {!!ev.location && <Text style={{ color: muted, marginTop: 2 }}>{ev.location}</Text>}
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginTop: 6 }}>
            <Ionicons name="time-outline" size={16} color={isDark ? '#64B5F6' : '#1976D2'} />
            <Text style={{ color: muted }}>{fmtTime(ev.startsAt)}</Text>
          </View>
          {!!ev.details && <Text style={{ color: muted, marginTop: 10 }}>{ev.details}</Text>}

          <View style={{ marginTop: 12 }}>
            <Text style={{ color: textPrimary, fontWeight:'800', marginBottom: 6 }}>Reminders</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap: 8 }}>
              {(['none','10','30','60'] as const).map(r => (
                <TouchableOpacity key={r} onPress={() => setReminder(r)} style={[styles.chip, { backgroundColor: reminder===r ? (isDark ? '#1E3A5F' : '#E3F2FD') : 'transparent' }]}>
                  <Text style={{ color: reminder===r ? (isDark ? '#90CAF9' : '#1976D2') : muted, fontWeight:'700' }}>{r==='none' ? 'None' : `${r} min before`}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: textPrimary, fontWeight:'800', marginTop: 10, marginBottom: 6 }}>Repeat</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap: 8 }}>
              {(['none','daily','weekly','monthly'] as const).map(f => (
                <TouchableOpacity key={f} onPress={() => setRecurrence(f)} style={[styles.chip, { backgroundColor: recurrence===f ? (isDark ? '#1E3A5F' : '#E3F2FD') : 'transparent' }]}>
                  <Text style={{ color: recurrence===f ? (isDark ? '#90CAF9' : '#1976D2') : muted, fontWeight:'700' }}>{f.charAt(0).toUpperCase()+f.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection:'row', gap: 10, marginTop: 12 }}>
              {!expired && (
                <TouchableOpacity onPress={addToCalendar} style={[styles.btn, { backgroundColor: isDark ? '#64B5F6' : '#1976D2' }]}>
                  <Ionicons name="calendar-outline" size={16} color="#fff" />
                  <Text style={{ color:'#fff', fontWeight:'800' }}>Add to Calendar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={shareEvent} style={[styles.btn, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
                <Ionicons name="share-social-outline" size={16} color={isDark ? '#FFFFFF' : '#1976D2'} />
                <Text style={{ color: isDark ? '#FFFFFF' : '#1976D2', fontWeight:'800' }}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '800' },
  btn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems:'center', gap:6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100 },
});
