import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { channelsAPI } from '../services/channelsApi';

import { useAuth } from '../context/AuthContext';

export default function CreateChannelScreen() {
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) { Alert.alert('Channel name required', 'Please enter a name'); return; }
    try {
      setSubmitting(true);
      const res = await channelsAPI.create({ name, description: desc });
      setSubmitting(false);
      setName(''); setDesc('');
      Alert.alert('Channel created', res?.message || 'Channel created');
      try { require('expo-router').router.replace('/channels-list'); } catch {}
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create channel');
    }
  };

  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  if (user?.role !== 'power') {
    return (
      <View style={[styles.container, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}> 
        <Text style={{ color: textPrimary, fontWeight: '800', fontSize: 16 }}>Only power admin can create channels.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
        <Text style={[styles.title, { color: textPrimary }]}>Create Channel</Text>
        <Text style={{ color: muted, marginBottom: 10 }}>Create a space for specific topics or groups.</Text>

        <View style={[styles.inputWrap, { borderColor: border }]}>
          <Ionicons name="chatbubbles-outline" size={18} color={muted} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Channel name"
            placeholderTextColor={muted}
            style={[styles.input, { color: textPrimary }]}
          />
        </View>

        <View style={[styles.textAreaWrap, { borderColor: border }]}>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Short description"
            placeholderTextColor={muted}
            style={[styles.textArea, { color: textPrimary }]
          }
            multiline
          />
        </View>

        <TouchableOpacity disabled={submitting} style={[styles.submitBtn, { opacity: submitting ? 0.6 : 1 }]} onPress={submit}>
          <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Channel'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '800' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, height: 44, marginBottom: 12 },
  input: { flex: 1 },
  textAreaWrap: { borderWidth: 1, borderRadius: 12, padding: 10, minHeight: 120, marginBottom: 12 },
  textArea: { flex: 1, minHeight: 100 },
  submitBtn: { marginTop: 8, backgroundColor: '#1976D2', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  submitText: { color: '#FFFFFF', fontWeight: '800' },
});
