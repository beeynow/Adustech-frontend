import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { timetablesAPI } from '../services/timetablesApi';
import { useAuth } from '../context/AuthContext';

export default function CreateTimetableScreen() {
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const [course, setCourse] = useState('');
  const [info, setInfo] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [pdfBase64, setPdfBase64] = useState<string | undefined>();
  const [effectiveDate, setEffectiveDate] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Please allow photo access'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.7 });
    if (!res.canceled && res.assets[0].base64) {
      setImageBase64(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      setPdfBase64(`data:application/pdf;base64,${base64}`);
    }
  };

  const submit = async () => {
    if (!course.trim() && !info.trim() && !imageBase64) { Alert.alert('Add content', 'Enter a course info or image'); return; }
    try {
      setSubmitting(true);
      if (!(user && ['power','admin','d-admin'].includes(user.role || 'user'))) { setSubmitting(false); Alert.alert('Only admins', 'Only admins can create timetables.'); return; }
      if (!effectiveDate) { setSubmitting(false); Alert.alert('Date required', 'Pick the effective date'); return; }
      const iso = new Date(effectiveDate.replace(' ', 'T')).toISOString();
      await timetablesAPI.create({ title: course || 'Timetable', details: info, imageBase64, pdfBase64, effectiveDate: iso });
      Alert.alert('Posted', 'Your timetable has been posted.');
      setCourse(''); setInfo(''); setImageBase64(undefined);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to post timetable');
    } finally { setSubmitting(false); }
  };

  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
        <Text style={[styles.title, { color: textPrimary }]}>Create Timetable Post</Text>
        <Text style={{ color: muted, marginBottom: 10 }}>Share lecture/exam schedules or updates.</Text>

        <View style={[styles.inputWrap, { borderColor: border }]}>
          <Ionicons name="book-outline" size={18} color={muted} />
          <TextInput
            value={course}
            onChangeText={setCourse}
            placeholder="Course or subject"
            placeholderTextColor={muted}
            style={[styles.input, { color: textPrimary }]}
          />
        </View>

        <View style={[styles.inputWrap, { borderColor: border }]}>
          <Ionicons name="time-outline" size={18} color={muted} />
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickerVisible(true)}>
            <Text style={{ color: effectiveDate ? textPrimary : muted }}>{effectiveDate || 'Pick effective date'}</Text>
          </TouchableOpacity>
        </View>
        <DateTimePickerModal isVisible={pickerVisible} mode="date" onConfirm={(date)=>{setPickerVisible(false); const pad=(n:number)=>String(n).padStart(2,'0'); const s=`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} 00:00`; setEffectiveDate(s);}} onCancel={()=>setPickerVisible(false)} />

        <View style={[styles.textAreaWrap, { borderColor: border }]}>
          <TextInput
            value={info}
            onChangeText={setInfo}
            placeholder="Details (date, time, venue, notes)"
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
          <Text style={styles.submitText}>{submitting ? 'Posting...' : 'Post Timetable'}</Text>
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
});
