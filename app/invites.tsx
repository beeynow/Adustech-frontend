import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView } from 'react-native';

export default function InvitesScreen() {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}> 
      <View style={{ padding: 16 }}>
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
          <Text style={[styles.title, { color: textPrimary }]}>Invites</Text>
          <Text style={{ color: muted }}>Your group and committee invites will appear here.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
});
