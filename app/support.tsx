import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';

export default function SupportScreen() {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  const openWhatsApp = async (number: string) => {
    const phone = number.replace(/\D/g, '');
    // Try deep link first, then fallback to wa.me without message
    try {
      await Linking.openURL(`whatsapp://send?phone=${phone}`);
    } catch {
      Linking.openURL(`https://wa.me/${phone}`).catch(() => {});
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={{ padding: 16 }}> 
      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
        <Text style={[styles.title, { color: textPrimary }]}>Support</Text>
        <Text style={{ color: muted, marginBottom: 10 }}>Get help and report issues</Text>

        <Text style={{ color: textPrimary, fontWeight: '800', marginTop: 6, marginBottom: 6 }}>WhatsApp</Text>
        <View style={styles.whatsRow}>
          {['+2347030158810', '+2348037769325', '+2349073471497'].map(n => (
            <TouchableOpacity key={n} style={[styles.whatsBtn, { borderColor: border }]} onPress={() => openWhatsApp(n)}>
              <Ionicons name="logo-whatsapp" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
              <Text style={{ marginLeft: 6, color: textPrimary, fontWeight: '700' }}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: textPrimary, fontWeight: '800', marginTop: 12, marginBottom: 6 }}>Other options</Text>
        <TouchableOpacity style={[styles.action, { borderColor: border }]} onPress={() => (Linking.openURL('mailto:support@adustech.app'))}>
          <Ionicons name="mail-outline" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
          <Text style={{ marginLeft: 8, color: textPrimary, fontWeight: '700' }}>Email Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, { borderColor: border }]} onPress={() => (Linking.openURL('https://adustech.app/help'))}>
          <Ionicons name="globe-outline" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
          <Text style={{ marginLeft: 8, color: textPrimary, fontWeight: '700' }}>Help Center</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, { borderColor: border }]} onPress={() => (Linking.openURL('tel:+2347030158810'))}>
          <Ionicons name="call-outline" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
          <Text style={{ marginLeft: 8, color: textPrimary, fontWeight: '700' }}>Call Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  action: { marginTop: 10, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  whatsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  whatsBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent:'center' },
});
