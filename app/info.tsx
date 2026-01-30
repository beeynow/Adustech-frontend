import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';

export default function InfoScreen() {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  const appName = Constants.expoConfig?.name || 'ADUSTECH';
  const version = Constants.expoConfig?.version || Constants.nativeAppVersion || '1.0.0';
  const build = Constants.nativeBuildVersion || '-';

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={{ padding: 16 }}> 
      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
        <Text style={[styles.title, { color: textPrimary }]}>{appName}</Text>
        <Text style={{ color: muted, marginBottom: 10 }}>ADUSTECH community app</Text>
        <View style={[styles.row, { borderColor: border }]}> 
          <Text style={[styles.rowLabel, { color: muted }]}>Version</Text>
          <Text style={[styles.rowValue, { color: textPrimary }]}>{version} ({build})</Text>
        </View>
        <View style={[styles.row, { borderColor: border }]}> 
          <Text style={[styles.rowLabel, { color: muted }]}>Website</Text>
          <Text style={[styles.rowValue, { color: isDark ? '#64B5F6' : '#1976D2' }]}>adustech.app</Text>
        </View>
        <View style={[styles.row, { borderColor: border }]}> 
          <Text style={[styles.rowLabel, { color: muted }]}>Contact</Text>
          <Text style={[styles.rowValue, { color: textPrimary }]}>support@adustech.app</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: card, borderColor: border, marginTop: 12 }]}> 
        <Text style={[styles.title, { color: textPrimary }]}>About</Text>
        <Text style={{ color: muted, marginTop: 6 }}>
          This app connects the ADUSTECH community with channels, events, timetables, and updates. Built with Expo/React Native.
        </Text>
        <View style={{ flexDirection:'row', gap:10, marginTop: 12 }}>
          <TouchableOpacity style={[styles.cta, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]} onPress={() => (require('expo-linking').openURL('https://adustech.app'))}>
            <Ionicons name="globe-outline" size={16} color={isDark ? '#FFFFFF' : '#1976D2'} />
            <Text style={{ color: isDark ? '#FFFFFF' : '#1976D2', fontWeight:'800' }}>Visit site</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cta, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]} onPress={() => (require('expo-linking').openURL('mailto:support@adustech.app'))}>
            <Ionicons name="mail-outline" size={16} color={isDark ? '#FFFFFF' : '#1976D2'} />
            <Text style={{ color: isDark ? '#FFFFFF' : '#1976D2', fontWeight:'800' }}>Contact support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  row: { borderTopWidth: 1, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  cta: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, flexDirection:'row', alignItems:'center', gap:6 },
});
