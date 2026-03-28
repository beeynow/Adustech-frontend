import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useRouter } from 'expo-router';
import { timetablesAPI } from '@/services/timetablesApi';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/utils/toast';
import {
  ActionButton,
  Chip,
  EmptyState,
  HeroCard,
  InfoBanner,
  InputField,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useAppTheme } from '@/utils/theme';

const MAX_TITLE_LENGTH = 200;
const MAX_DETAILS_LENGTH = 2000;

const formatDisplayDate = (date: Date | null) => {
  if (!date) {
    return 'Pick effective date';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function CreateTimetableScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useAppTheme();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imageLabel, setImageLabel] = useState('');
  const [pdfBase64, setPdfBase64] = useState<string | undefined>();
  const [pdfLabel, setPdfLabel] = useState('');
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = !!user && ['power', 'admin'].includes(user.role || '');
  const attachmentCount = Number(Boolean(imageBase64)) + Number(Boolean(pdfBase64));
  const pickerDate = effectiveDate || new Date();

  const publishSummary = useMemo(() => {
    return [
      {
        icon: 'document-text-outline' as const,
        label: 'Title',
        value: title.trim() || 'Untitled timetable draft',
      },
      {
        icon: 'calendar-outline' as const,
        label: 'Effective date',
        value: effectiveDate ? formatDisplayDate(effectiveDate) : 'Not selected yet',
      },
      {
        icon: 'attach-outline' as const,
        label: 'Attachments',
        value: attachmentCount === 0 ? 'No attachments added' : `${attachmentCount} file${attachmentCount === 1 ? '' : 's'} attached`,
      },
    ];
  }, [attachmentCount, effectiveDate, title]);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast.warning('Please allow photo access to attach timetable images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
        quality: 0.82,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType?.startsWith('image/') ? asset.mimeType : 'image/jpeg';

        setImageBase64(`data:${mimeType};base64,${asset.base64}`);
        setImageLabel(asset.fileName || 'Timetable cover image');
        showToast.success('Image attached.');
      }
    } catch {
      showToast.error('Unable to attach the timetable image right now.');
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });

        setPdfBase64(`data:application/pdf;base64,${base64}`);
        setPdfLabel(asset.name || 'Timetable PDF');
        showToast.success('PDF attached.');
      }
    } catch {
      showToast.error('Unable to attach the PDF right now.');
    }
  };

  const submit = async () => {
    if (!canCreate) {
      showToast.error('Only power admins and admins can publish timetable updates.');
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      showToast.warning('Add a timetable title with at least 3 characters.');
      return;
    }

    if (!effectiveDate) {
      showToast.warning('Pick the effective date for this timetable.');
      return;
    }

    try {
      setSubmitting(true);

      const effectiveDateIso = new Date(
        effectiveDate.getFullYear(),
        effectiveDate.getMonth(),
        effectiveDate.getDate(),
        0,
        0,
        0,
        0
      ).toISOString();

      const response = await timetablesAPI.create({
        title: title.trim(),
        details: details.trim() || undefined,
        imageBase64,
        pdfBase64,
        effectiveDate: effectiveDateIso,
      });

      showToast.success('Timetable published successfully.');
      router.replace(`/timetable/${response.timetable.id}`);
    } catch (error: any) {
      showToast.error(error?.message || error?.response?.data?.message || 'Failed to post timetable');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <ScreenShell>
        <EmptyState
          title="Admin access required"
          subtitle="Only power admins and admins can publish timetable updates from this page."
          icon="lock-closed-outline"
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell scroll keyboard edges={['top', 'bottom']}>
      <HeroCard
        eyebrow="Create Timetable"
        title="Publish a polished timetable update"
        subtitle="Use the dedicated timetable workflow to share schedules with an effective date, cleaner notes, and optional downloadable files."
        icon="calendar-clear-outline"
      >
        <View style={styles.heroChips}>
          <Chip label="Power/Admin only" icon="shield-checkmark-outline" tone="warning" />
          <Chip label="Image + PDF support" icon="attach-outline" tone="accent" />
          <Chip
            label={effectiveDate ? 'Date selected' : 'Choose a date'}
            icon="time-outline"
            tone={effectiveDate ? 'success' : 'neutral'}
          />
        </View>
      </HeroCard>

      <SectionHeading
        title="Core Details"
        subtitle="Start with a strong title, then add the context students should see before opening any attachment."
        action={(
          <Text style={[styles.counterText, { color: theme.textSoft }]}>
            {title.length}/{MAX_TITLE_LENGTH}
          </Text>
        )}
      />

      <SurfaceCard>
        <View style={styles.stackLarge}>
          <View>
            <Text style={[styles.fieldLabel, { color: theme.textSoft }]}>
              Title
            </Text>
            <InputField
              icon="book-outline"
              value={title}
              onChangeText={setTitle}
              placeholder="Exam timetable, lecture schedule, or course title"
              maxLength={MAX_TITLE_LENGTH}
              editable={!submitting}
            />
          </View>

          <View>
            <Text style={[styles.fieldLabel, { color: theme.textSoft }]}>
              Effective Date
            </Text>
            <ActionButton
              label={formatDisplayDate(effectiveDate)}
              icon="calendar-outline"
              variant="secondary"
              onPress={() => setPickerVisible(true)}
            />
          </View>

          <DateTimePickerModal
            isVisible={pickerVisible}
            mode="date"
            date={pickerDate}
            onConfirm={(date) => {
              setPickerVisible(false);
              setEffectiveDate(date);
            }}
            onCancel={() => setPickerVisible(false)}
          />

          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={[styles.previewIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="calendar-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.previewContent}>
              <Text style={[styles.previewTitle, { color: theme.text }]}>Schedule effective date</Text>
              <Text style={[styles.previewSubtitle, { color: theme.textMuted }]}>
                {effectiveDate
                  ? `Students will see this update grouped under ${formatDisplayDate(effectiveDate)}.`
                  : 'Choose the date this timetable becomes valid so it lands in the right day bucket.'}
              </Text>
            </View>
          </View>

          <View>
            <View style={styles.rowBetween}>
              <Text style={[styles.fieldLabel, styles.fieldLabelTight, { color: theme.textSoft }]}>
                Details
              </Text>
              <Text style={[styles.counterText, { color: theme.textSoft }]}>
                {details.length}/{MAX_DETAILS_LENGTH}
              </Text>
            </View>
            <InputField
              multiline
              icon="document-text-outline"
              value={details}
              onChangeText={setDetails}
              placeholder="Add venue, session time, exam instructions, or note what changed from the previous timetable"
              editable={!submitting}
              maxLength={MAX_DETAILS_LENGTH}
            />
          </View>
        </View>
      </SurfaceCard>

      <SectionHeading
        title="Attachments"
        subtitle="Add a quick image preview, a downloadable PDF, or both for the best student experience."
        action={(
          <Text style={[styles.counterText, { color: theme.textSoft }]}>
            {attachmentCount}/2 attached
          </Text>
        )}
      />

      <SurfaceCard>
        <View style={styles.stackLarge}>
          <View style={styles.stackSmall}>
            <ActionButton
              label={imageBase64 ? 'Replace image cover' : 'Add image cover'}
              icon="image-outline"
              variant="secondary"
              onPress={pickImage}
            />
            <ActionButton
              label={pdfBase64 ? 'Replace PDF file' : 'Add PDF file'}
              icon="document-outline"
              variant="secondary"
              onPress={pickPdf}
            />
          </View>

          {!imageBase64 && !pdfBase64 ? (
            <View
              style={[
                styles.emptyAttachmentState,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={theme.textMuted} />
              <Text style={[styles.previewSubtitle, { color: theme.textMuted }]}>
                No attachments added yet. You can still publish a clean text-first timetable update.
              </Text>
            </View>
          ) : null}

          {imageBase64 ? (
            <View
              style={[
                styles.attachmentCard,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.attachmentInfo}>
                <View style={[styles.attachmentIcon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="image-outline" size={16} color={theme.accent} />
                </View>
                <View style={styles.previewContent}>
                  <Text style={[styles.previewTitle, { color: theme.text }]}>Image cover ready</Text>
                  <Text style={[styles.previewSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
                    {imageLabel || 'Timetable cover image'}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => {
                setImageBase64(undefined);
                setImageLabel('');
              }}>
                <Text style={[styles.clearText, { color: theme.danger }]}>Remove</Text>
              </Pressable>
            </View>
          ) : null}

          {pdfBase64 ? (
            <View
              style={[
                styles.attachmentCard,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.attachmentInfo}>
                <View style={[styles.attachmentIcon, { backgroundColor: theme.warningSoft }]}>
                  <Ionicons name="document-text-outline" size={16} color={theme.warning} />
                </View>
                <View style={styles.previewContent}>
                  <Text style={[styles.previewTitle, { color: theme.text }]}>PDF attached</Text>
                  <Text style={[styles.previewSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
                    {pdfLabel || 'Timetable PDF'}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => {
                setPdfBase64(undefined);
                setPdfLabel('');
              }}>
                <Text style={[styles.clearText, { color: theme.danger }]}>Remove</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </SurfaceCard>

      <InfoBanner
        message="Use the details field for fast mobile reading, then attach the PDF when students need the full official schedule."
        tone="info"
        icon="sparkles-outline"
      />

      <SectionHeading
        title="Publish Check"
        subtitle="Review the essentials before you send this timetable live."
      />

      <SurfaceCard>
        <View style={styles.stackSmall}>
          {publishSummary.map((item) => (
            <View
              key={item.label}
              style={[
                styles.summaryRow,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={[styles.summaryIcon, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name={item.icon} size={16} color={theme.accent} />
              </View>
              <View style={styles.previewContent}>
                <Text style={[styles.summaryLabel, { color: theme.textSoft }]}>{item.label}</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]} numberOfLines={2}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <ActionButton
        label={submitting ? 'Publishing Timetable…' : 'Publish Timetable'}
        icon={submitting ? undefined : 'send-outline'}
        onPress={submit}
        disabled={submitting}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stackLarge: {
    gap: 16,
  },
  stackSmall: {
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabelTight: {
    marginBottom: 0,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  previewIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  previewSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  emptyAttachmentState: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachmentCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachmentIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
});
