import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView } from 'react-native';

export default function LeadersboardScreen() {
  const isDark = useColorScheme() === 'dark';
  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}> 
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>Leadersboard</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#90CAF9' : '#546E7A' }]}>Top performers and achievements.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14 },
});
