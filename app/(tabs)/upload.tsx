import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import {
  ActionButton,
  Chip,
  EmptyState,
  InfoBanner,
  ScreenShell,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { postsAPI } from '@/services/postsApi';
import { departmentsAPI, type Department } from '@/services/departmentsApi';
import { useAppTheme } from '@/utils/theme';
import { showToast } from '@/utils/toast';

const CATEGORY_OPTIONS = [
  { value: 'All', label: 'General', icon: 'sparkles-outline', description: 'For broad campus updates.' },
  { value: 'Level', label: 'Level', icon: 'school-outline', description: 'For level-based notices.' },
  { value: 'Department', label: 'Department', icon: 'business-outline', description: 'For departmental updates.' },
  { value: 'Exam', label: 'Exam', icon: 'newspaper-outline', description: 'For tests and exam notices.' },
  { value: 'Timetable', label: 'Timetable', icon: 'calendar-outline', description: 'For schedule changes.' },
  { value: 'Event', label: 'Event', icon: 'megaphone-outline', description: 'For campus or class events.' },
] as const;

type PostCategory = (typeof CATEGORY_OPTIONS)[number]['value'];

const MAX_CHARS = 1000;
const DRAFT_KEY = 'post_draft';

interface PostDraft {
  text: string;
  category: PostCategory;
  selectedDepartment: string;
  selectedLevelId: string;
  selectedLevelLabel: string;
  timestamp: number;
}

type LevelChoice = {
  id: string;
  label: string;
};

type ImageAttachmentMode = 'full' | 'crop';

const ROLE_LABELS: Record<string, string> = {
  power: 'Power Admin',
  admin: 'Admin',
  'd-admin': 'Department Admin',
};

export default function UploadScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { presetCategory } = useLocalSearchParams<{ presetCategory?: string }>();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [text, setText] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [category, setCategory] = useState<PostCategory>('All');
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedLevelLabel, setSelectedLevelLabel] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [imageSize, setImageSize] = useState(0);
  const [imageAttachmentMode, setImageAttachmentMode] = useState<ImageAttachmentMode>('full');
  const [showPreview, setShowPreview] = useState(false);

  const canCreate = !!user && ['power', 'admin', 'd-admin'].includes(user.role || '');
  const canCreateTimetableOrEventPosts = ['power', 'admin'].includes(user?.role || '');
  const requiresScopedAudience = user?.role === 'd-admin';
  const firstName = user?.name?.split(' ')[0] || 'there';
  const roleLabel = ROLE_LABELS[user?.role || ''] || 'Admin';

  const selectedDepartmentRecord = departments.find((department) => department.id === selectedDepartment);
  const availableCategoryOptions = CATEGORY_OPTIONS.filter((option) => (
    canCreateTimetableOrEventPosts || (option.value !== 'Timetable' && option.value !== 'Event')
  ));
  const selectedCategoryOption = availableCategoryOptions.find((option) => option.value === category) || availableCategoryOptions[0] || CATEGORY_OPTIONS[0];
  const availableLevels: LevelChoice[] = selectedDepartmentRecord?.levelRecords?.length
    ? selectedDepartmentRecord.levelRecords.map((level) => ({
        id: level.id,
        label: String(level.levelNumber),
      }))
    : (selectedDepartmentRecord?.levels || []).map((level) => ({
        id: '',
        label: level,
      }));

  const charCount = text.length;
  const hasContent = Boolean(text.trim() || image);
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS * 0.8;
  const audienceReady = !selectedDepartment || Boolean(selectedLevelLabel);
  const publishDisabled = submitting
    || !hasContent
    || isOverLimit
    || (requiresScopedAudience && !selectedDepartment)
    || !audienceReady;

  const selectedAudienceLabel = selectedDepartment && selectedLevelLabel
    ? `${selectedDepartmentRecord?.code || 'Dept'} ${selectedLevelLabel}`
    : selectedDepartment
      ? `${selectedDepartmentRecord?.code || 'Dept'} · choose level`
      : requiresScopedAudience
        ? 'Choose audience'
        : 'Everyone';

  const audienceSummary = selectedDepartment && selectedLevelLabel
    ? `${selectedDepartmentRecord?.name || 'Selected department'} students in ${selectedLevelLabel} Level will receive this post.`
    : selectedDepartment
      ? `Choose a level inside ${selectedDepartmentRecord?.name || 'the selected department'} before publishing.`
      : requiresScopedAudience
        ? 'Department admins must target a department and level before publishing.'
        : 'This post will publish to the main community feed.';

  const clearDraft = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch {
      showToast.error('Unable to clear the saved draft.');
    }
  }, []);

  const resetComposer = useCallback((options?: { keepPreview?: boolean }) => {
    setText('');
    setImage(undefined);
    setImageAttachmentMode('full');
    setCategory('All');
    setSelectedDepartment('');
    setSelectedLevelId('');
    setSelectedLevelLabel('');
    setImageSize(0);
    if (!options?.keepPreview) {
      setShowPreview(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      setLoadingDepartments(true);
      const response = await departmentsAPI.list({ isActive: true });
      setDepartments(response.departments || []);
    } catch {
      showToast.error('Unable to load departments right now.');
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const loadDraft = useCallback(async () => {
    try {
      const draftString = await AsyncStorage.getItem(DRAFT_KEY);
      if (!draftString) {
        return;
      }

      const draft = JSON.parse(draftString) as Partial<PostDraft>;
      if (!draft.timestamp || Date.now() - draft.timestamp >= 24 * 60 * 60 * 1000) {
        await clearDraft();
        return;
      }

      Alert.alert(
        'Resume Draft?',
        'A recent draft is available. Continue from where you stopped?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetComposer();
              void clearDraft();
            },
          },
          {
            text: 'Resume',
            onPress: () => {
              setText(typeof draft.text === 'string' ? draft.text : '');
              setCategory((CATEGORY_OPTIONS.find((option) => option.value === draft.category)?.value || 'All') as PostCategory);
              setSelectedDepartment(typeof draft.selectedDepartment === 'string' ? draft.selectedDepartment : '');
              setSelectedLevelId(typeof draft.selectedLevelId === 'string' ? draft.selectedLevelId : '');
              setSelectedLevelLabel(typeof draft.selectedLevelLabel === 'string' ? draft.selectedLevelLabel : '');
              setShowPreview(Boolean(draft.text));
              showToast.success('Draft restored.');
            },
          },
        ]
      );
    } catch {
      showToast.error('Unable to restore your saved draft.');
    }
  }, [clearDraft, resetComposer]);

  useEffect(() => {
    void loadDepartments();
    void loadDraft();
  }, [loadDepartments, loadDraft]);

  useEffect(() => {
    if (loadingDepartments || !selectedDepartment || !selectedLevelLabel) {
      return;
    }

    const stillValid = availableLevels.some((level) => level.label === selectedLevelLabel);
    if (!stillValid) {
      setSelectedLevelId('');
      setSelectedLevelLabel('');
    }
  }, [availableLevels, loadingDepartments, selectedDepartment, selectedLevelLabel]);

  useEffect(() => {
    if (!availableCategoryOptions.some((option) => option.value === category)) {
      setCategory('All');
    }
  }, [availableCategoryOptions, category]);

  useEffect(() => {
    if (!presetCategory) {
      return;
    }

    const normalizedPreset = CATEGORY_OPTIONS.find((option) => option.value === presetCategory)?.value;
    if (!normalizedPreset) {
      return;
    }

    if (!canCreateTimetableOrEventPosts && (normalizedPreset === 'Timetable' || normalizedPreset === 'Event')) {
      showToast.warning(`${normalizedPreset} posts are only available for power admins and admins.`);
      setCategory('All');
      return;
    }

    setCategory(normalizedPreset);
  }, [canCreateTimetableOrEventPosts, presetCategory]);

  useEffect(() => {
    const saveDraft = async () => {
      if (!text.trim() && category === 'All' && !selectedDepartment && !selectedLevelLabel) {
        await clearDraft();
        return;
      }

      const draft: PostDraft = {
        text,
        category,
        selectedDepartment,
        selectedLevelId,
        selectedLevelLabel,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    };

    const timer = setTimeout(() => {
      void saveDraft();
    }, 800);

    return () => clearTimeout(timer);
  }, [category, clearDraft, selectedDepartment, selectedLevelId, selectedLevelLabel, text]);

  const removeImage = () => {
    setImage(undefined);
    setImageSize(0);
    setImageAttachmentMode('full');
  };

  const attachImage = async (
    source: 'gallery' | 'camera',
    attachmentMode: ImageAttachmentMode = 'full'
  ) => {
    const permission = source === 'gallery'
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      showToast.warning(
        source === 'gallery'
          ? 'Please allow photo access to attach images.'
          : 'Please allow camera access to capture an image.'
      );
      return;
    }

    const result = source === 'gallery'
      ? await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: attachmentMode === 'crop' ? 0.78 : 0.85,
          allowsEditing: attachmentMode === 'crop',
          ...(attachmentMode === 'crop' ? { aspect: [16, 9] as [number, number] } : {}),
        })
      : await ImagePicker.launchCameraAsync({
          base64: true,
          quality: attachmentMode === 'crop' ? 0.78 : 0.85,
          allowsEditing: attachmentMode === 'crop',
          ...(attachmentMode === 'crop' ? { aspect: [16, 9] as [number, number] } : {}),
        });

    if (result.canceled || !result.assets[0]?.base64) {
      return;
    }

    const mimeType = result.assets[0].mimeType || 'image/jpeg';
    const encodedImage = `data:${mimeType};base64,${result.assets[0].base64}`;
    setImage(encodedImage);
    setImageSize(Math.round(((encodedImage.length * 3) / 4) / 1024));
    setImageAttachmentMode(attachmentMode);
    setShowPreview(true);
    showToast.success(
      attachmentMode === 'crop'
        ? 'Cropped image attached.'
        : source === 'gallery'
          ? 'Full image attached.'
          : 'Photo captured.'
    );
  };

  const confirmClear = () => {
    if (!hasContent && category === 'All' && !selectedDepartment && !selectedLevelLabel) {
      return;
    }

    Alert.alert(
      'Clear Post?',
      'This will remove your current draft from the composer.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            resetComposer();
            void clearDraft();
            showToast.success('Composer cleared.');
          },
        },
      ]
    );
  };

  const submit = async () => {
    if (!hasContent) {
      showToast.warning('Add some text or an image before publishing.');
      return;
    }

    if (isOverLimit) {
      showToast.warning(`Post text must stay within ${MAX_CHARS} characters.`);
      return;
    }

    if (requiresScopedAudience && !selectedDepartment) {
      showToast.warning('Department admins must choose their department before publishing.');
      return;
    }

    if (!canCreateTimetableOrEventPosts && (category === 'Timetable' || category === 'Event')) {
      showToast.warning(`${category} posts can only be published by power admins and admins.`);
      return;
    }

    if (selectedDepartment && !selectedLevelLabel) {
      showToast.warning('Select a level for department-targeted posts.');
      return;
    }

    try {
      setSubmitting(true);

      const payload: {
        text?: string;
        imageBase64?: string;
        category?: string;
        departmentId?: string;
        level?: string;
        levelId?: string;
      } = {
        category,
      };

      if (text.trim()) {
        payload.text = text.trim();
      }

      if (image) {
        payload.imageBase64 = image;
      }

      if (selectedDepartment && selectedLevelLabel) {
        payload.departmentId = selectedDepartment;
        payload.level = selectedLevelLabel;
        if (selectedLevelId) {
          payload.levelId = selectedLevelId;
        }
      }

      await postsAPI.create(payload);
      await refreshNotifications();
      resetComposer();
      await clearDraft();
      showToast.success('Post published successfully.');

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home' as any);
      }
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to publish post.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderComposerTool = ({
    label,
    icon,
    onPress,
    disabled = false,
    tone = 'accent',
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    disabled?: boolean;
    tone?: 'accent' | 'success' | 'warning' | 'danger';
  }) => {
    const palette = tone === 'success'
      ? { bg: theme.successSoft, border: theme.success, text: theme.success }
      : tone === 'warning'
        ? { bg: theme.warningSoft, border: theme.warning, text: theme.warning }
        : tone === 'danger'
          ? { bg: theme.dangerSoft, border: theme.danger, text: theme.danger }
          : { bg: theme.accentSoft, border: theme.accent, text: theme.accent };

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.toolPill,
          {
            backgroundColor: disabled ? theme.surfaceMuted : palette.bg,
            borderColor: disabled ? theme.border : palette.border,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <Ionicons name={icon} size={16} color={disabled ? theme.textSoft : palette.text} />
        <Text style={[styles.toolPillText, { color: disabled ? theme.textSoft : palette.text }]}>{label}</Text>
      </Pressable>
    );
  };

  const renderAudienceCard = ({
    label,
    subtitle,
    icon,
    active,
    onPress,
    disabled = false,
  }: {
    label: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    active: boolean;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.audienceCard,
        {
          backgroundColor: active ? theme.accentSoft : theme.surfaceMuted,
          borderColor: active ? theme.accent : theme.border,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <View style={styles.audienceCardTop}>
        <View style={[styles.audienceIcon, { backgroundColor: active ? theme.accentSoft : theme.input }]}>
          <Ionicons name={icon} size={16} color={active ? theme.accent : theme.textMuted} />
        </View>
        {active ? <Ionicons name="checkmark-circle" size={18} color={theme.accent} /> : null}
      </View>
      <Text style={[styles.audienceTitle, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.audienceSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>
    </Pressable>
  );

  if (!canCreate) {
    return (
      <ScreenShell>
        <EmptyState
          title="Admin access required"
          subtitle="Only admins can publish posts from this workspace."
          icon="lock-closed-outline"
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      scroll
      keyboard
      contentContainerStyle={styles.pageContent}
    >
      <View style={styles.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>Create Post</Text>
          <Text style={[styles.pageTitle, { color: theme.text }]}>What&apos;s on your mind, {firstName}?</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textMuted }]}>
            Share an update in a cleaner, more familiar flow. Drafts save while you type.
          </Text>
        </View>
        {hasContent ? (
          <Pressable
            onPress={confirmClear}
            style={[styles.clearButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
          >
            <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <SurfaceCard style={styles.composerCard}>
        <View style={styles.composerHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.authorName, { color: theme.text }]}>{user?.name || 'Admin'}</Text>
            <View style={styles.authorMetaRow}>
              <View style={[styles.metaBadge, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                <Ionicons name="shield-checkmark-outline" size={12} color={theme.textMuted} />
                <Text style={[styles.metaBadgeText, { color: theme.textMuted }]}>{roleLabel}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentSoft }]}>
                <Ionicons name="people-outline" size={12} color={theme.accent} />
                <Text style={[styles.metaBadgeText, { color: theme.accent }]}>{selectedAudienceLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.promptWrap, { backgroundColor: theme.input, borderColor: theme.borderStrong }]}>
          <TextInput
            multiline
            editable={!submitting}
            value={text}
            onChangeText={setText}
            maxLength={MAX_CHARS}
            placeholder={`What's on your mind, ${firstName}?`}
            placeholderTextColor={theme.textSoft}
            style={[styles.promptInput, { color: theme.text }]}
          />
          <View style={styles.promptFooter}>
            <Text style={[styles.promptHint, { color: theme.textMuted }]}>
              {isOverLimit
                ? `Reduce your text by ${charCount - MAX_CHARS} characters.`
                : 'Lead with the main update, then the next action students should take.'}
            </Text>
            <Text
              style={[
                styles.counterText,
                {
                  color: isOverLimit ? theme.danger : isNearLimit ? theme.warning : theme.textSoft,
                },
              ]}
            >
              {charCount}/{MAX_CHARS}
            </Text>
          </View>
        </View>

        <View style={styles.categoryWrap}>
          {availableCategoryOptions.map((option) => {
            const active = category === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setCategory(option.value)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: active ? theme.accentSoft : theme.surfaceMuted,
                    borderColor: active ? theme.accent : theme.border,
                  },
                ]}
              >
                <Ionicons name={option.icon} size={14} color={active ? theme.accent : theme.textMuted} />
                <Text style={[styles.categoryPillText, { color: active ? theme.accent : theme.textMuted }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

          {image ? (
          <View style={[styles.mediaFrame, { borderColor: theme.border }]}>
            <Image source={{ uri: image }} style={styles.mediaImage} resizeMode="contain" />
            <View style={styles.mediaControls}>
              <Pressable
                onPress={removeImage}
                style={[styles.mediaControl, { backgroundColor: 'rgba(6, 21, 35, 0.78)' }]}
              >
                <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => void attachImage('gallery', 'crop')}
                style={[styles.mediaControl, { backgroundColor: 'rgba(6, 21, 35, 0.78)' }]}
              >
                <Ionicons name="crop-outline" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={[styles.imageBadge, { backgroundColor: theme.surfaceStrong, borderColor: theme.border }]}>
              <Text style={[styles.imageBadgeText, { color: theme.text }]}>
                {imageSize > 0
                  ? `${imageSize} KB • ${imageAttachmentMode === 'crop' ? 'Cropped 16:9' : 'Full image'}`
                  : imageAttachmentMode === 'crop'
                    ? 'Cropped 16:9 image'
                    : 'Full image attached'}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.addPostWrap, { borderTopColor: theme.border }]}>
          <Text style={[styles.addPostTitle, { color: theme.text }]}>Add to your post</Text>
          <View style={styles.toolRow}>
            {renderComposerTool({
              label: image ? 'Replace photo' : 'Full photo',
              icon: 'image-outline',
              onPress: () => void attachImage('gallery', 'full'),
            })}
            {renderComposerTool({
              label: 'Crop 16:9',
              icon: 'crop-outline',
              onPress: () => void attachImage('gallery', 'crop'),
              tone: 'warning',
            })}
            {renderComposerTool({
              label: 'Camera',
              icon: 'camera-outline',
              onPress: () => void attachImage('camera', 'full'),
            })}
            {renderComposerTool({
              label: showPreview ? 'Hide preview' : 'Preview',
              icon: showPreview ? 'eye-off-outline' : 'eye-outline',
              onPress: () => setShowPreview((current) => !current),
              disabled: !hasContent,
              tone: 'success',
            })}
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <View style={styles.settingsHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingsTitle, { color: theme.text }]}>Choose your audience</Text>
            <Text style={[styles.settingsSubtitle, { color: theme.textMuted }]}>
              Keep it public for the main feed or target a department and level.
            </Text>
          </View>
          <Chip
            label={selectedAudienceLabel}
            icon="people-outline"
            tone={selectedDepartment && selectedLevelLabel ? 'success' : requiresScopedAudience ? 'warning' : 'accent'}
          />
        </View>

        {loadingDepartments ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading departments…</Text>
          </View>
        ) : (
          <>
            <View style={styles.audienceGrid}>
              {renderAudienceCard({
                label: 'Everyone',
                subtitle: requiresScopedAudience ? 'Unavailable for department admins.' : 'Publish to the main community feed.',
                icon: 'globe-outline',
                active: !selectedDepartment,
                onPress: () => {
                  setSelectedDepartment('');
                  setSelectedLevelId('');
                  setSelectedLevelLabel('');
                },
                disabled: requiresScopedAudience,
              })}
              {departments.map((department) => renderAudienceCard({
                label: department.code,
                subtitle: department.name,
                icon: 'business-outline',
                active: selectedDepartment === department.id,
                onPress: () => {
                  setSelectedDepartment(department.id);
                  setSelectedLevelId('');
                  setSelectedLevelLabel('');
                },
              }))}
            </View>

            {selectedDepartment ? (
              <View style={styles.levelSection}>
                <Text style={[styles.levelTitle, { color: theme.text }]}>Select level</Text>
                {availableLevels.length > 0 ? (
                  <View style={styles.levelWrap}>
                    {availableLevels.map((level) => {
                      const active = selectedLevelLabel === level.label;
                      return (
                        <Pressable
                          key={level.id || level.label}
                          onPress={() => {
                            setSelectedLevelId(level.id);
                            setSelectedLevelLabel(level.label);
                          }}
                          style={[
                            styles.levelChip,
                            {
                              backgroundColor: active ? theme.successSoft : theme.surfaceMuted,
                              borderColor: active ? theme.success : theme.border,
                            },
                          ]}
                        >
                          <Text style={[styles.levelChipText, { color: active ? theme.success : theme.textMuted }]}>
                            {level.label} Level
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <InfoBanner
                    tone="warning"
                    icon="alert-circle-outline"
                    message="This department has no active levels configured yet."
                  />
                )}
              </View>
            ) : null}
          </>
        )}
      </SurfaceCard>

      <InfoBanner
        tone={selectedDepartment && selectedLevelLabel ? 'success' : requiresScopedAudience ? 'warning' : 'info'}
        icon={selectedDepartment && selectedLevelLabel ? 'checkmark-circle-outline' : 'information-circle-outline'}
        message={audienceSummary}
      />

      {hasContent && showPreview ? (
        <SurfaceCard style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.avatarText, { color: theme.accent }]}>
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.previewAuthor, { color: theme.text }]}>{user?.name || 'Admin'}</Text>
              <Text style={[styles.previewContext, { color: theme.textMuted }]}>
                {roleLabel} • {selectedCategoryOption.label} • Just now
              </Text>
            </View>
          </View>

          {text.trim() ? (
            <Text style={[styles.previewBody, { color: theme.text }]}>{text.trim()}</Text>
          ) : null}

          {image ? <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" /> : null}

          <View style={[styles.previewDivider, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
            <Text style={[styles.previewStats, { color: theme.textSoft }]}>
              {image && imageAttachmentMode === 'full'
                ? 'Previewing the feed card. The full image stays available on the post details page.'
                : 'Previewing how this post will appear in the feed'}
            </Text>
          </View>

          <View style={styles.previewActions}>
            <View style={styles.previewAction}>
              <Ionicons name="heart-outline" size={16} color={theme.textSoft} />
              <Text style={[styles.previewActionText, { color: theme.textSoft }]}>Like</Text>
            </View>
            <View style={styles.previewAction}>
              <Ionicons name="chatbubble-outline" size={16} color={theme.textSoft} />
              <Text style={[styles.previewActionText, { color: theme.textSoft }]}>Comment</Text>
            </View>
            <View style={styles.previewAction}>
              <Ionicons name="share-social-outline" size={16} color={theme.textSoft} />
              <Text style={[styles.previewActionText, { color: theme.textSoft }]}>Share</Text>
            </View>
          </View>
        </SurfaceCard>
      ) : null}

      <View style={styles.footerRow}>
        <ActionButton
          label={showPreview ? 'Hide Preview' : 'Preview Post'}
          icon={showPreview ? 'eye-off-outline' : 'eye-outline'}
          variant="secondary"
          onPress={() => setShowPreview((current) => !current)}
          disabled={!hasContent}
          style={styles.flexButton}
        />
        <ActionButton
          label={submitting ? 'Publishing…' : 'Post Now'}
          icon={submitting ? undefined : 'send-outline'}
          onPress={submit}
          disabled={publishDisabled}
          style={styles.flexButton}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingTop: 8,
    paddingBottom: 140,
    gap: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pageTitle: {
    marginTop: 6,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  pageSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  clearButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerCard: {
    gap: 16,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '900',
  },
  authorName: {
    fontSize: 17,
    fontWeight: '900',
  },
  authorMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  promptWrap: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  promptInput: {
    minHeight: 152,
    fontSize: 18,
    lineHeight: 28,
    textAlignVertical: 'top',
  },
  promptFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  promptHint: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  mediaFrame: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 220,
  },
  mediaImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#091521',
  },
  mediaControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  mediaControl: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  addPostWrap: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 12,
  },
  addPostTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  toolRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toolPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  settingsSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  audienceGrid: {
    gap: 10,
  },
  audienceCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 8,
  },
  audienceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audienceIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  audienceSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  levelSection: {
    marginTop: 14,
    gap: 10,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  levelWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  previewCard: {
    gap: 14,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewAuthor: {
    fontSize: 16,
    fontWeight: '900',
  },
  previewContext: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  previewBody: {
    fontSize: 15,
    lineHeight: 24,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 18,
  },
  previewDivider: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  previewStats: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  previewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  previewActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
});
