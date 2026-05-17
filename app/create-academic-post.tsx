import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { academicApi, LevelRecord } from '@/services/academicApi';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/utils/toast';

const PRIORITIES = ['normal', 'high', 'urgent'] as const;
const CATEGORIES = ['General', 'Exam', 'Timetable', 'Event'] as const;

const normalizeRole = (role?: string) => role?.trim().toLowerCase().replace(/_/g, '-') || '';

export default function CreateAcademicPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ levelId?: string | string[] }>();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('normal');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('General');
  const [submitting, setSubmitting] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  const [level, setLevel] = useState<LevelRecord | null>(null);

  const levelId = useMemo(
    () => (Array.isArray(params.levelId) ? params.levelId[0] : params.levelId),
    [params.levelId]
  );

  const canPost = ['admin', 'power', 'd-admin'].includes(normalizeRole(user?.role));

  useEffect(() => {
    const loadLevel = async () => {
      if (!levelId) {
        setLoadingContext(false);
        return;
      }

      try {
        const response = await academicApi.getLevel(levelId);
        setLevel(response.level);
      } catch (error: any) {
        showToast.error(error?.message || 'Unable to load the selected academic room.');
      } finally {
        setLoadingContext(false);
      }
    };

    void loadLevel();
  }, [levelId]);

  const handleSubmit = async () => {
    if (!canPost) {
      showToast.error('Your role is not allowed to create academic posts here.');
      return;
    }

    if (!levelId) {
      showToast.error('Missing academic room context for this post.');
      return;
    }

    if (title.trim().length < 3) {
      showToast.warning('Add a clear title with at least 3 characters.');
      return;
    }

    if (content.trim().length < 10) {
      showToast.warning('Add a fuller post body with at least 10 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await academicApi.createPost({
        title: title.trim(),
        content: content.trim(),
        level_id: levelId,
        category,
        priority,
      });

      showToast.success(response.message || 'Academic post created successfully.');
      router.replace({
        pathname: '/academic/level/[levelId]',
        params: { levelId },
      });
    } catch (error: any) {
      showToast.error(error?.message || 'Unable to create the academic post right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canPost) {
    return (
      <View style={styles.blockedWrap}>
        <Ionicons name="shield-outline" size={44} color="#1976D2" />
        <Text style={styles.blockedTitle}>Admin access required</Text>
        <Text style={styles.blockedText}>Only eligible admin roles can create academic room posts.</Text>
        <TouchableOpacity style={styles.backGhostButton} onPress={() => router.back()}>
          <Text style={styles.backGhostLabel}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <LinearGradient colors={['#EAF5FF', '#DCEEFF', '#C7E4FF']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color="#0F172A" />
              </TouchableOpacity>
              <View style={styles.headerTextWrap}>
                <Text style={styles.eyebrow}>Academic Room</Text>
                <Text style={styles.title}>Create a level post</Text>
              </View>
            </View>

            {loadingContext ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color="#1976D2" />
                <Text style={styles.loadingText}>Loading room details…</Text>
              </View>
            ) : (
              <View style={styles.contextCard}>
                <Text style={styles.contextLabel}>Posting into</Text>
                <Text style={styles.contextTitle}>{level?.displayName || 'Selected level room'}</Text>
                <Text style={styles.contextText}>
                  {level?.department?.name || 'Department room'}{level?.department?.faculty?.name ? ` • ${level.department.faculty.name}` : ''}
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Exam update for 300 level students"
                placeholderTextColor="#70839A"
                value={title}
                onChangeText={setTitle}
                editable={!submitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Write the exact academic update students need to act on."
                placeholderTextColor="#70839A"
                value={content}
                onChangeText={setContent}
                editable={!submitting}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((item) => {
                  const selected = category === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, selected && styles.chipActive]}
                      onPress={() => setCategory(item)}
                      disabled={submitting}
                    >
                      <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.chipRow}>
                {PRIORITIES.map((item) => {
                  const selected = priority === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, selected && styles.chipActive]}
                      onPress={() => setPriority(item)}
                      disabled={submitting}
                    >
                      <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Pressable disabled={submitting} onPress={handleSubmit}>
              <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.submitButton}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitLabel}>Publish post</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(25,118,210,0.12)',
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 4,
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '900',
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  loadingText: {
    color: '#5F7288',
    fontWeight: '600',
  },
  contextCard: {
    backgroundColor: '#F3F9FF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  contextLabel: {
    color: '#5F7288',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  contextTitle: {
    marginTop: 6,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  contextText: {
    marginTop: 4,
    color: '#60758A',
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '500',
  },
  textarea: {
    minHeight: 144,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(25,118,210,0.16)',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  chipLabel: {
    color: '#37506A',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    minHeight: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  blockedWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F4FAFF',
  },
  blockedTitle: {
    marginTop: 12,
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
  },
  blockedText: {
    marginTop: 8,
    color: '#5F7288',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  backGhostButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#E6F4FF',
  },
  backGhostLabel: {
    color: '#1976D2',
    fontWeight: '800',
  },
});
