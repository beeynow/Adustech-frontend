import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, useMemo } from 'react';
import { timetablesAPI } from '../services/timetablesApi';

export default function TimetableScreen() {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const data = await timetablesAPI.list(); setRows(data.timetables||[]); } catch {} finally { setLoading(false); } })(); }, []);

  const groups = useMemo(() => {
    const byDay: Record<string, any[]> = {};
    for (const tt of rows) {
      const d = new Date(tt.effectiveDate);
      const key = d.toDateString();
      (byDay[key] ||= []).push(tt);
    }
    Object.values(byDay).forEach(arr => arr.sort((a,b)=> new Date(a.effectiveDate).getTime()-new Date(b.effectiveDate).getTime()));
    return byDay;
  }, [rows]);

  const fmtDay = (key:string) => {
    const d = new Date(key);
    return d.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric'});
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}> 
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.title, { color: textPrimary }]}>Timetable</Text>
        {loading && <Text style={{ color: muted }}>Loading...</Text>}
        {!loading && Object.keys(groups).length===0 && (
          <View style={[styles.emptyWrap, { backgroundColor: card, borderColor: border }]}> 
            <View style={{ height: 140, width: '100%', borderRadius: 12, overflow:'hidden', marginBottom: 10 }}>
              <Image source={require('../assets/images/partial-react-logo.png')} style={{ width: '100%', height: '100%' }} contentFit="contain" />
            </View>
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No timetables yet</Text>
            <Text style={{ color: muted, textAlign: 'center' }}>New schedules will appear here.</Text>
          </View>
        )}
        {!loading && Object.entries(groups).map(([day, items]) => (
          <View key={day} style={[styles.dayWrap, { borderColor: border }]}> 
            <Text style={[styles.dayTitle, { color: textPrimary }]}>{fmtDay(day)}</Text>
            {items.map(tt => (
              <TouchableOpacity key={tt._id} activeOpacity={0.85} onPress={() => (require('expo-router').router.push({ pathname: '/timetable/[id]', params: { id: tt._id } }))} style={[styles.ttCard, { backgroundColor: card, borderColor: border }]}> 
                <Text style={[styles.ttTitle, { color: textPrimary }]}>{tt.title}</Text>
                {!!tt.imageUrl && (
                  <View style={{ height: 140, borderRadius: 12, overflow:'hidden', marginTop: 8 }}>
                    <Image source={{ uri: tt.imageUrl }} style={{ width: '100%', height: '100%' }} />
                  </View>
                )}
                {!!tt.details && <Text style={{ color: muted, marginTop: 6 }} numberOfLines={3}>{tt.details}</Text>}
                <View style={{ flexDirection:'row', alignItems:'center', gap: 8, marginTop: 8 }}>
                  {!!tt.pdfUrl && (
                    <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(tt.pdfUrl)} style={[styles.badge, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
                      <Ionicons name="document-outline" size={14} color={isDark ? '#FFFFFF' : '#1976D2'} />
                      <Text style={{ color: isDark ? '#FFFFFF' : '#1976D2', fontWeight:'800' }}>Open PDF</Text>
                    </TouchableOpacity>
                  )}
                  <View style={[styles.badge, { backgroundColor: '#1976D233' }]}>
                    <Ionicons name="calendar-outline" size={14} color={isDark ? '#64B5F6' : '#1976D2'} />
                    <Text style={{ color: isDark ? '#64B5F6' : '#1976D2', fontWeight:'800' }}>Effective</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={[styles.fab, { backgroundColor: isDark ? '#64B5F6' : '#1976D2' }]} onPress={() => (require('expo-router').router.push('/create-timetable'))}>
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  fab: { position: 'absolute', right: 16, bottom: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  dayWrap: { marginTop: 10, paddingTop: 8, borderTopWidth: 1 },
  dayTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  ttCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10 },
  ttTitle: { fontSize: 16, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection:'row', alignItems:'center', gap:6 },
  emptyWrap: { borderWidth: 1, borderRadius: 16, padding: 16, alignItems:'center', justifyContent:'center', marginTop: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
});
