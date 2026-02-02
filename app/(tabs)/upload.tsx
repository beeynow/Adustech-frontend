import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { postsAPI } from '../../services/postsApi';
import { showToast } from '../../utils/toast';

const CATEGORIES = ['All','Level','Department','Exam','Timetable','Event'];

export default function UploadScreen() {
  const isDark = useColorScheme() === 'dark';
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [category, setCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { 
      showToast.warning('Please allow photo access to upload images', 'Permission Required'); 
      return; 
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.7 });
    if (!res.canceled && res.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${res.assets[0].base64}`);
      showToast.success('Image selected successfully!', 'Success');
    }
  };

  const submit = async () => {
    if (!text && !image) { 
      showToast.warning('Add some text or an image to your post', 'Nothing to Post'); 
      return; 
    }
    try {
      setSubmitting(true);
      await postsAPI.create({ text, imageBase64: image, category });
      setSubmitting(false);
      setText(''); setImage(undefined);
      showToast.success('Your post has been published! 🎉', 'Posted');
    } catch (e:any) {
      setSubmitting(false);
      showToast.error(e?.response?.data?.message || 'Failed to publish post', 'Error');
    }
  };

  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]} contentContainerStyle={{ padding: 12 }}>
      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
        <Text style={[styles.title, { color: textPrimary }]}>Create Post</Text>

        <View style={[styles.inputWrap, { borderColor: border }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="What's happening?"
            placeholderTextColor={muted}
            style={[styles.textInput, { color: textPrimary }]}
            multiline
          />
        </View>

        {image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image }} style={styles.preview} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(undefined)}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.pickBtn, { borderColor: border }]} onPress={pickImage}>
            <Ionicons name="image" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
            <Text style={[styles.pickText, { color: isDark ? '#64B5F6' : '#1976D2' }]}>Add image</Text>
          </TouchableOpacity>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive, { borderColor: border }]} onPress={() => setCategory(cat)}>
              <Text style={[styles.chipText, { color: category === cat ? (isDark ? '#FFFFFF' : '#1976D2') : muted }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity disabled={submitting} style={[styles.submitBtn, { opacity: submitting ? 0.6 : 1 }]} onPress={submit}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
          <Text style={styles.submitText}>{submitting ? 'Publishing...' : 'Publish'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 12 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  inputWrap: { borderWidth: 1, borderRadius: 12, padding: 8 },
  textInput: { minHeight: 100 },
  pickBtn: { marginTop: 10, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  pickText: { fontWeight: '700' },
  previewWrap: { position: 'relative', marginTop: 10 },
  preview: { width: '100%', height: 220, borderRadius: 12 },
  removeBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, borderWidth: 1, backgroundColor: 'transparent' },
  chipActive: { backgroundColor: 'rgba(25,118,210,0.12)' },
  chipText: { fontSize: 13, fontWeight: '600' },
  submitBtn: { marginTop: 12, backgroundColor: '#1976D2', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  submitText: { color: '#FFFFFF', fontWeight: '800' },
});
