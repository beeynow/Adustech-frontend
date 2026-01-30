import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { timetablesAPI } from '../../services/timetablesApi';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';

export default function TimetableDetail() {
  const isDark = useColorScheme() === 'dark';
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  useEffect(() => {
    (async () => { try { const data = await timetablesAPI.get(String(id)); setRow(data.timetable); } catch { setRow(null); } finally { setLoading(false); } })();
  }, [id]);

  const fmtDate = (iso:string) => new Date(iso).toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric'});

  if (loading) return <View style={[styles.container, { backgroundColor: bg, alignItems:'center', justifyContent:'center' }]}><Text style={{ color: textPrimary }}>Loading...</Text></View>;
  if (!row) return <View style={[styles.container, { backgroundColor: bg, alignItems:'center', justifyContent:'center' }]}><Text style={{ color: textPrimary }}>Timetable not found</Text></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}> 
      <View style={{ padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 10, flexDirection:'row', alignItems:'center', gap:8 }}>
          <Ionicons name="arrow-back" size={20} color={isDark ? '#64B5F6' : '#1976D2'} />
          <Text style={{ color: isDark ? '#64B5F6' : '#1976D2', fontWeight:'700' }}>Back</Text>
        </TouchableOpacity>
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
          <Text style={[styles.title, { color: textPrimary }]}>{row.title}</Text>
          <Text style={{ color: muted, marginTop: 2 }}>Effective: {fmtDate(row.effectiveDate)}</Text>
          {!!row.imageUrl && (
            <View style={{ height: 220, borderRadius: 12, overflow:'hidden', marginTop: 12 }}>
              <Image source={{ uri: row.imageUrl }} style={{ width:'100%', height:'100%' }} />
            </View>
          )}
          {!!row.details && <Text style={{ color: muted, marginTop: 10 }}>{row.details}</Text>}
          <View style={{ flexDirection:'row', gap: 10, marginTop: 12 }}>
            {!!row.pdfUrl && (
              <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(row.pdfUrl)} style={[styles.btn, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
                <Ionicons name="document-outline" size={16} color={isDark ? '#FFFFFF' : '#1976D2'} />
                <Text style={{ color: isDark ? '#FFFFFF' : '#1976D2', fontWeight:'800' }}>Open PDF</Text>
              </TouchableOpacity>
            )}
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
});
