import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { eventsAPI } from '../services/eventsApi';
import { useAuth } from '../context/AuthContext';

export default function CreateEventScreen() {
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState(''); // YYYY-MM-DD HH:mm
  const [dateChoice, setDateChoice] = useState<'today'|'tomorrow'|'custom'>('custom');
  const [timeChoice, setTimeChoice] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Please allow photo access'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.7 });
    if (!res.canceled && res.assets[0].base64) {
      setImageBase64(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const submit = async () => {
    if (!title.trim() && !details.trim() && !imageBase64) { Alert.alert('Add content', 'Enter a title, details, or image'); return; }
    try {
      setSubmitting(true);
      let isoStr = startsAt.trim();
      if (!isoStr) {
        // build from choices
        const base = new Date();
        if (dateChoice==='tomorrow') base.setDate(base.getDate()+1);
        const datePart = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')}`;
        const timePart = timeChoice || '12:00';
        isoStr = `${datePart} ${timePart}`;
      }
      const iso = new Date(isoStr.replace(' ', 'T')).toISOString();
      await eventsAPI.create({ title, details, imageBase64, location, startsAt: iso });
      Alert.alert('Event posted', 'Your event has been created.');
      setTitle(''); setDetails(''); setImageBase64(undefined);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to post event');
    } finally { setSubmitting(false); }
  };

  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  if (!(user && ['power','admin','d-admin'].includes(user.role || 'user'))) {
    return (
      <View style={[styles.container, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}> 
        <Text style={{ color: textPrimary, fontWeight: '800', fontSize: 16 }}>Only admins can create events.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
        <Text style={[styles.title, { color: textPrimary }]}>Create Event</Text>
        <Text style={{ color: muted, marginBottom: 10 }}>Share upcoming activities, conferences, or meetups.</Text>

        <View style={[styles.inputWrap, { borderColor: border }]}>
          <Ionicons name="pricetag-outline" size={18} color={muted} />
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor={muted}
            style={[styles.input, { color: textPrimary }]}
          />
        </View>

        <View style={[styles.inputWrap, { borderColor: border }]}>
          <Ionicons name="location-outline" size={18} color={muted} />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Location"
            placeholderTextColor={muted}
            style={[styles.input, { color: textPrimary }]}
          />
        </View>

        <View style={[styles.inputWrap, { borderColor: border }]}>
          <Ionicons name="time-outline" size={18} color={muted} />
          <TextInput
            value={startsAt}
            onChangeText={setStartsAt}
            placeholder="YYYY-MM-DD HH:mm"
            placeholderTextColor={muted}
            style={[styles.input, { color: textPrimary }]}
          />
        </View>

        <View style={[styles.textAreaWrap, { borderColor: border }]}>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Event details (time, venue, description)"
            placeholderTextColor={muted}
            style={[styles.textArea, { color: textPrimary }]
          }
            multiline
          />
        </View>

        <TouchableOpacity style={[styles.pickBtn, { borderColor: border }]} onPress={pickImage}>
          <Ionicons name="image-outline" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
          <Text style={{ color: isDark ? '#64B5F6' : '#1976D2', fontWeight: '700' }}>{imageBase64 ? 'Change image' : 'Add image'}</Text>
        </TouchableOpacity>

        <TouchableOpacity disabled={submitting} style={[styles.submitBtn, { opacity: submitting ? 0.6 : 1 }]} onPress={submit}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
          <Text style={styles.submitText}>{submitting ? 'Posting...' : 'Post Event'}</Text>
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
  pickBtn: { height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 12 },
  submitBtn: { marginTop: 8, backgroundColor: '#1976D2', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  submitText: { color: '#FFFFFF', fontWeight: '800' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
});
