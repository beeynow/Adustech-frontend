import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Keyboard } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postsAPI } from '../../services/postsApi';
import { departmentsAPI, Department } from '../../services/departmentsApi';
import { showToast } from '../../utils/toast';

const CATEGORIES = ['All','Level','Department','Exam','Timetable','Event'];
const MAX_CHARS = 500;
const DRAFT_KEY = 'post_draft';

interface PostDraft {
  text: string;
  category: string;
  timestamp: number;
}

export default function UploadScreen() {
  const isDark = useColorScheme() === 'dark';
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [category, setCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [imageSize, setImageSize] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
    loadDraft();
  }, []);

  // Auto-save draft
  useEffect(() => {
    const saveDraft = async () => {
      if (text.trim() || category !== 'All') {
        const draft: PostDraft = {
          text,
          category,
          timestamp: Date.now()
        };
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    };

    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [text, category]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await departmentsAPI.list({ isActive: true });
      setDepartments(response.departments || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadDraft = async () => {
    try {
      const draftStr = await AsyncStorage.getItem(DRAFT_KEY);
      if (draftStr) {
        const draft: PostDraft = JSON.parse(draftStr);
        // Only load draft if less than 24 hours old
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          Alert.alert(
            'Resume Draft?',
            'You have an unsaved draft. Would you like to continue editing it?',
            [
              { text: 'Discard', onPress: () => clearDraft(), style: 'destructive' },
              { 
                text: 'Resume', 
                onPress: () => {
                  setText(draft.text);
                  setCategory(draft.category);
                  showToast.success('Draft restored', 'Success');
                }
              }
            ]
          );
        } else {
          clearDraft();
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { 
      showToast.warning('Please allow photo access to upload images', 'Permission Required'); 
      return; 
    }
    
    const res = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      base64: true, 
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9]
    });
    
    if (!res.canceled && res.assets[0].base64) {
      const base64Img = `data:image/jpeg;base64,${res.assets[0].base64}`;
      setImage(base64Img);
      
      // Calculate approximate size
      const sizeInBytes = (base64Img.length * 3) / 4;
      setImageSize(Math.round(sizeInBytes / 1024)); // KB
      
      showToast.success('Image selected successfully!', 'Success');
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast.warning('Please allow camera access to take photos', 'Permission Required');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9]
    });

    if (!res.canceled && res.assets[0].base64) {
      const base64Img = `data:image/jpeg;base64,${res.assets[0].base64}`;
      setImage(base64Img);
      
      const sizeInBytes = (base64Img.length * 3) / 4;
      setImageSize(Math.round(sizeInBytes / 1024));
      
      showToast.success('Photo captured!', 'Success');
    }
  };

  const clearAll = () => {
    Alert.alert(
      'Clear Post?',
      'This will remove all content. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setText('');
            setImage(undefined);
            setCategory('All');
            setSelectedDepartment('');
            setSelectedLevel('');
            setImageSize(0);
            clearDraft();
            showToast.success('Post cleared', 'Success');
          }
        }
      ]
    );
  };

  const validatePost = (): boolean => {
    // Check if there's any content
    if (!text?.trim() && !image) {
      showToast.warning('Add some text or an image to your post', 'Nothing to Post');
      return false;
    }

    // Check character limit
    if (text && text.length > MAX_CHARS) {
      showToast.warning(`Post is too long. Maximum ${MAX_CHARS} characters allowed.`, 'Too Long');
      return false;
    }

    // Department posts must have a level
    if (selectedDepartment && !selectedLevel) {
      showToast.warning('Please select a level for department posts', 'Level Required');
      return false;
    }

    // Image must be valid base64
    if (image && !image.startsWith('data:image/')) {
      showToast.error('Invalid image format', 'Error');
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validatePost()) return;

    Keyboard.dismiss();

    try {
      setSubmitting(true);
      
      const payload: any = {
        category: category || 'All'
      };

      // Add text if present (trimmed)
      if (text && text.trim()) {
        payload.text = text.trim();
      }

      // Add image if present
      if (image) {
        payload.imageBase64 = image;
      }

      // Add department and level if selected
      if (selectedDepartment && selectedLevel) {
        payload.departmentId = selectedDepartment;
        payload.level = selectedLevel;
      }

      console.log('📤 Submitting post:', {
        hasText: !!payload.text,
        hasImage: !!payload.imageBase64,
        category: payload.category,
        departmentId: payload.departmentId || 'public',
        level: payload.level || 'all'
      });

      await postsAPI.create(payload);
      
      // Clear form and draft
      setText('');
      setImage(undefined);
      setCategory('All');
      setSelectedDepartment('');
      setSelectedLevel('');
      setImageSize(0);
      await clearDraft();
      
      setSubmitting(false);
      showToast.success('Your post has been published! 🎉', 'Posted');
    } catch (e: any) {
      setSubmitting(false);
      showToast.error(e?.response?.data?.message || 'Failed to publish post', 'Error');
    }
  };

  const charCount = text.length;
  const charPercentage = (charCount / MAX_CHARS) * 100;
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS * 0.8;

  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';
  const success = isDark ? '#66BB6A' : '#4CAF50';
  const warning = isDark ? '#FFA726' : '#FF9800';
  const danger = isDark ? '#EF5350' : '#F44336';

  const selectedDept = departments.find(d => d.id === selectedDepartment);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]} 
      contentContainerStyle={{ padding: 12 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textPrimary }]}>Create Post</Text>
          {(text || image) && (
            <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={18} color={danger} />
            </TouchableOpacity>
          )}
        </View>

        {/* Text Input with Character Counter */}
        <View style={[styles.inputWrap, { borderColor: isOverLimit ? danger : border }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="What's happening? Share your thoughts..."
            placeholderTextColor={muted}
            style={[styles.textInput, { color: textPrimary }]}
            multiline
            maxLength={MAX_CHARS + 50} // Allow slight overflow for warning
          />
          <View style={styles.charCounter}>
            <Text style={[
              styles.charCountText, 
              { color: isOverLimit ? danger : isNearLimit ? warning : muted }
            ]}>
              {charCount}/{MAX_CHARS}
            </Text>
          </View>
        </View>

        {/* Hint Text */}
        <Text style={[styles.hintText, { color: muted }]}>
          💡 Tip: Use hashtags (#exam #notes) and mentions (@username) to engage more
        </Text>

        {/* Image Preview */}
        {image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image }} style={styles.preview} />
            <View style={styles.imageActions}>
              <TouchableOpacity style={[styles.imageActionBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={() => setImage(undefined)}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.imageActionBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={pickImage}>
                <Ionicons name="refresh" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            {imageSize > 0 && (
              <View style={styles.imageSizeBadge}>
                <Text style={styles.imageSizeText}>{imageSize} KB</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePickerRow}>
            <TouchableOpacity style={[styles.pickBtn, { borderColor: border, flex: 1 }]} onPress={pickImage}>
              <Ionicons name="image" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
              <Text style={[styles.pickText, { color: isDark ? '#64B5F6' : '#1976D2' }]}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickBtn, { borderColor: border, flex: 1 }]} onPress={takePhoto}>
              <Ionicons name="camera" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
              <Text style={[styles.pickText, { color: isDark ? '#64B5F6' : '#1976D2' }]}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textPrimary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[
                  styles.chip, 
                  category === cat && styles.chipActive, 
                  { borderColor: category === cat ? '#1976D2' : border }
                ]} 
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, { color: category === cat ? (isDark ? '#FFFFFF' : '#1976D2') : muted }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Department Targeting (Optional) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>Target Audience (Optional)</Text>
            <Ionicons name="school-outline" size={16} color={muted} />
          </View>
          
          {loadingDepartments ? (
            <ActivityIndicator size="small" color="#1976D2" />
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 8 }}>
                <TouchableOpacity 
                  style={[
                    styles.chip, 
                    !selectedDepartment && styles.chipActive,
                    { borderColor: !selectedDepartment ? '#1976D2' : border }
                  ]} 
                  onPress={() => {
                    setSelectedDepartment('');
                    setSelectedLevel('');
                  }}
                >
                  <Text style={[styles.chipText, { color: !selectedDepartment ? (isDark ? '#FFFFFF' : '#1976D2') : muted }]}>
                    Everyone
                  </Text>
                </TouchableOpacity>
                {departments.map(dept => (
                  <TouchableOpacity 
                    key={dept.id} 
                    style={[
                      styles.chip, 
                      selectedDepartment === dept.id && styles.chipActive,
                      { borderColor: selectedDepartment === dept.id ? '#1976D2' : border }
                    ]} 
                    onPress={() => {
                      setSelectedDepartment(dept.id);
                      setSelectedLevel(''); // Reset level
                    }}
                  >
                    <Text style={[styles.chipText, { color: selectedDepartment === dept.id ? (isDark ? '#FFFFFF' : '#1976D2') : muted }]}>
                      {dept.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Level Selection (shown when department is selected) */}
              {selectedDepartment && selectedDept && selectedDept.levels.length > 0 && (
                <View style={styles.levelSection}>
                  <Text style={[styles.subLabel, { color: muted }]}>Select Level</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {selectedDept.levels.map(level => (
                      <TouchableOpacity 
                        key={level} 
                        style={[
                          styles.levelChip, 
                          selectedLevel === level && styles.levelChipActive,
                          { borderColor: selectedLevel === level ? success : border }
                        ]} 
                        onPress={() => setSelectedLevel(level)}
                      >
                        <Text style={[styles.chipText, { color: selectedLevel === level ? success : muted }]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>

        {/* Post Preview Toggle */}
        {(text || image) && (
          <TouchableOpacity 
            style={[styles.previewToggle, { borderColor: border }]} 
            onPress={() => setShowPreview(!showPreview)}
          >
            <Ionicons name={showPreview ? 'eye-off-outline' : 'eye-outline'} size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
            <Text style={[styles.previewToggleText, { color: isDark ? '#64B5F6' : '#1976D2' }]}>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Preview */}
        {showPreview && (text || image) && (
          <View style={[styles.previewCard, { backgroundColor: isDark ? '#1A2942' : '#F5F5F5', borderColor: border }]}>
            <Text style={[styles.previewLabel, { color: muted }]}>Preview</Text>
            {text && <Text style={[styles.previewText, { color: textPrimary }]}>{text}</Text>}
            {image && <Image source={{ uri: image }} style={styles.previewImage} />}
            <View style={styles.previewMeta}>
              <Text style={[styles.previewMetaText, { color: muted }]}>
                {category} {selectedDept && `• ${selectedDept.code}`} {selectedLevel && `• ${selectedLevel}`}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity 
          disabled={submitting || isOverLimit} 
          style={[
            styles.submitBtn, 
            { opacity: (submitting || isOverLimit) ? 0.6 : 1, backgroundColor: isOverLimit ? danger : '#1976D2' }
          ]} 
          onPress={submit}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitText}>Publishing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>Publish Post</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Helper Text */}
        <Text style={[styles.helperText, { color: muted, textAlign: 'center' }]}>
          {selectedDepartment && selectedLevel 
            ? `This post will be visible to ${selectedDept?.name} - ${selectedLevel} students`
            : selectedDepartment
            ? `Select a level to target specific students in ${selectedDept?.name}`
            : 'This post will be visible to everyone'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  
  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  title: { fontSize: 20, fontWeight: '800' },
  clearBtn: { 
    padding: 8, 
    borderRadius: 8 
  },
  
  // Text Input
  inputWrap: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 12,
    marginBottom: 8 
  },
  textInput: { 
    minHeight: 120,
    fontSize: 15,
    textAlignVertical: 'top'
  },
  charCounter: { 
    alignItems: 'flex-end', 
    marginTop: 4 
  },
  charCountText: { 
    fontSize: 12, 
    fontWeight: '600' 
  },
  hintText: { 
    fontSize: 12, 
    marginBottom: 12,
    fontStyle: 'italic'
  },
  
  // Image Picker
  imagePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  pickBtn: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row', 
    gap: 8 
  },
  pickText: { 
    fontWeight: '700',
    fontSize: 14 
  },
  
  // Image Preview
  previewWrap: { 
    position: 'relative', 
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden'
  },
  preview: { 
    width: '100%', 
    height: 240, 
    borderRadius: 12 
  },
  imageActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8
  },
  imageActionBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  imageSizeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  imageSizeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600'
  },
  
  // Sections
  section: { 
    marginBottom: 16 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionLabel: { 
    fontSize: 14, 
    fontWeight: '700',
    marginBottom: 8
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  
  // Chips
  chip: { 
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 100, 
    borderWidth: 1.5, 
    backgroundColor: 'transparent' 
  },
  chipActive: { 
    backgroundColor: 'rgba(25,118,210,0.12)' 
  },
  chipText: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  
  // Level Section
  levelSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(66,165,245,0.15)'
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1.5,
    backgroundColor: 'transparent'
  },
  levelChipActive: {
    backgroundColor: 'rgba(76,175,80,0.12)'
  },
  
  // Preview Toggle
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    borderStyle: 'dashed'
  },
  previewToggleText: {
    fontSize: 13,
    fontWeight: '600'
  },
  
  // Preview Card
  previewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  previewMetaText: {
    fontSize: 12,
    fontWeight: '500'
  },
  
  // Submit Button
  submitBtn: { 
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#1976D2', 
    height: 52, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row', 
    gap: 8,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  submitText: { 
    color: '#FFFFFF', 
    fontWeight: '800',
    fontSize: 15 
  },
  
  // Helper Text
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4
  }
});
