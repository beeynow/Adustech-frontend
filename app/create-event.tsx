import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, type EventAudience, type EventCategory, type EventFormat } from '../services/eventsApi';
import { showToast } from '../utils/toast';
import { EVENT_AUDIENCE_OPTIONS, EVENT_CATEGORY_OPTIONS, EVENT_FORMAT_OPTIONS, formatEventCurrency, formatEventDateTime } from '../utils/events';
import { isValidEmail, normalizeEmail } from '../utils/validation';

type PickerTarget = 'start' | 'end' | 'close' | null;

const priceStringToCents = (value: string) => {
  const numeric = Number(value.replace(/,/g, '').trim());
  if (Number.isNaN(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.round(numeric * 100);
};

const SelectionRow = ({
  options,
  value,
  onChange,
  accent,
  text,
  border,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (next: string) => void;
  accent: string;
  text: string;
  border: string;
}) => {
  return (
    <View style={styles.selectionWrap}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.selectionChip,
              {
                backgroundColor: active ? accent : 'transparent',
                borderColor: active ? accent : border,
              },
            ]}
          >
            <Text style={[styles.selectionText, { color: active ? '#FFFFFF' : text }]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const SectionCard = ({
  title,
  subtitle,
  children,
  palette,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  palette: { card: string; border: string; text: string; subtext: string };
}) => {
  return (
    <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: palette.subtext }]}>{subtitle}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

export default function CreateEventScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const canCreateEvents = ['power', 'admin'].includes(user?.role || '');

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<EventCategory>('general');
  const [audience, setAudience] = useState<EventAudience>('all');
  const [format, setFormat] = useState<EventFormat>('in-person');
  const [location, setLocation] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [organizerName, setOrganizerName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [ticketInstructions, setTicketInstructions] = useState('');
  const [startsAt, setStartsAt] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    date.setMinutes(0, 0, 0);
    return date;
  });
  const [endsAt, setEndsAt] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 26);
    date.setMinutes(0, 0, 0);
    return date;
  });
  const [registrationClosesAt, setRegistrationClosesAt] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 23);
    date.setMinutes(30, 0, 0);
    return date;
  });
  const [isFree, setIsFree] = useState(true);
  const [ticketPrice, setTicketPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [maxTicketsPerUser, setMaxTicketsPerUser] = useState('1');
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const palette = {
    page: isDark ? '#06131F' : '#EAF5FF',
    card: isDark ? 'rgba(9, 28, 44, 0.94)' : 'rgba(255, 255, 255, 0.96)',
    border: isDark ? 'rgba(110, 166, 245, 0.18)' : 'rgba(34, 95, 160, 0.12)',
    text: isDark ? '#F4FAFF' : '#08253F',
    subtext: isDark ? '#A7C4E6' : '#5F748A',
    accent: '#1976D2',
    accentSoft: isDark ? 'rgba(25,118,210,0.18)' : 'rgba(25,118,210,0.08)',
  };

  const ticketPreview = useMemo(() => {
    return isFree ? 'Free entry' : formatEventCurrency(priceStringToCents(ticketPrice), 'NGN');
  }, [isFree, ticketPrice]);

  const openPicker = (target: PickerTarget) => {
    setPickerTarget(target);
    setPickerVisible(true);
  };

  const handlePickerConfirm = (date: Date) => {
    setPickerVisible(false);

    if (pickerTarget === 'start') {
      setStartsAt(date);
      if (endsAt <= date) {
        const adjustedEnd = new Date(date);
        adjustedEnd.setHours(adjustedEnd.getHours() + 2);
        setEndsAt(adjustedEnd);
      }
      if (registrationClosesAt >= date) {
        const adjustedClose = new Date(date);
        adjustedClose.setHours(adjustedClose.getHours() - 1);
        setRegistrationClosesAt(adjustedClose);
      }
      return;
    }

    if (pickerTarget === 'end') {
      setEndsAt(date);
      return;
    }

    if (pickerTarget === 'close') {
      setRegistrationClosesAt(date);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast.warning('Allow photo access to upload an event cover image.', 'Permission Required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      showToast.success('Cover image selected.');
    }
  };

  const submit = async () => {
    if (!title.trim() || title.trim().length < 3) {
      showToast.warning('Add a clear event title with at least 3 characters.');
      return;
    }

    if (format !== 'virtual' && !location.trim()) {
      showToast.warning('Set the event venue so students know where to go.');
      return;
    }

    if (format === 'virtual' && !streamUrl.trim()) {
      showToast.warning('Virtual events need a secure live link.');
      return;
    }

    if (!isValidEmail(contactEmail)) {
      showToast.error('Use a valid contact email for event questions.', 'Invalid Email');
      return;
    }

    if (startsAt <= new Date()) {
      showToast.warning('Choose a start time in the future.');
      return;
    }

    if (endsAt <= startsAt) {
      showToast.error('The event end time must be after the start time.');
      return;
    }

    if (registrationClosesAt >= startsAt) {
      showToast.error('Registration must close before the event starts.');
      return;
    }

    if (!isFree && priceStringToCents(ticketPrice) <= 0) {
      showToast.error('Paid events need a valid ticket price greater than zero.');
      return;
    }

    const capacityNumber = capacity.trim() ? Number(capacity) : null;
    const maxTicketsNumber = Number(maxTicketsPerUser || '1');

    if (capacityNumber !== null && (Number.isNaN(capacityNumber) || capacityNumber < 1)) {
      showToast.error('Capacity must be at least 1.');
      return;
    }

    if (Number.isNaN(maxTicketsNumber) || maxTicketsNumber < 1 || maxTicketsNumber > 10) {
      showToast.error('Max tickets per user must be between 1 and 10.');
      return;
    }

    if (capacityNumber !== null && maxTicketsNumber > capacityNumber) {
      showToast.error('Max tickets per user cannot exceed the event capacity.');
      return;
    }

    try {
      setSubmitting(true);

      await eventsAPI.create({
        title: title.trim(),
        summary: summary.trim(),
        details: details.trim(),
        category,
        audience,
        format,
        location: location.trim(),
        streamUrl: streamUrl.trim(),
        organizerName: organizerName.trim() || user?.name || '',
        contactEmail: normalizeEmail(contactEmail),
        contactPhone: contactPhone.trim(),
        ticketInstructions: ticketInstructions.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        registrationClosesAt: registrationClosesAt.toISOString(),
        isFree,
        ticketPriceCents: isFree ? 0 : priceStringToCents(ticketPrice),
        currency: 'NGN',
        capacity: capacityNumber,
        maxTicketsPerUser: maxTicketsNumber,
        isFeatured,
        imageBase64,
        timezone: 'Africa/Lagos',
      });

      showToast.success('Event published successfully.');
      router.replace('/events');
    } catch (error: any) {
      showToast.error(error?.message || error?.response?.data?.message || 'Unable to create the event right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreateEvents) {
    return (
      <LinearGradient colors={isDark ? ['#06131F', '#0C2035'] : ['#F4FAFF', '#E4F1FF']} style={styles.flex}>
        <View style={styles.lockedWrap}>
          <View style={[styles.lockedCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Ionicons name="shield-checkmark-outline" size={34} color={palette.accent} />
            <Text style={[styles.lockedTitle, { color: palette.text }]}>Only campus admins can create events</Text>
            <Text style={[styles.lockedSubtitle, { color: palette.subtext }]}>
              Faculty and department admins can manage their announcement channels, but campus-wide events are restricted to main admin roles.
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={[styles.primaryButton, { backgroundColor: palette.accent }]}>
              <Text style={styles.primaryButtonText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={isDark ? ['#06131F', '#0B2034', '#102A44'] : ['#F4FAFF', '#E5F2FF', '#D7EBFF']} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} style={styles.flex}>
        <Animated.View entering={FadeInUp.duration(420)} style={[styles.heroCard, { borderColor: palette.border }]}>
          <LinearGradient colors={isDark ? ['rgba(11,32,52,0.98)', 'rgba(23,77,130,0.95)'] : ['#FFFFFF', '#EDF6FF']} style={styles.heroGradient}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
              <Ionicons name="arrow-back" size={18} color={palette.accent} />
              <Text style={[styles.backText, { color: palette.accent }]}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { color: palette.text }]}>Create a polished university event</Text>
            <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
              Keep the setup concise and production-ready with clean ticketing, entry, and organizer details.
            </Text>
            <View style={styles.heroPillRow}>
              <View style={[styles.heroPill, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.heroPillText, { color: palette.accent }]}>Paystack ready</Text>
              </View>
              <View style={[styles.heroPill, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.heroPillText, { color: palette.accent }]}>QR ticket flow</Text>
              </View>
              <View style={[styles.heroPill, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.heroPillText, { color: palette.accent }]}>Cleaner event cards</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(420)}>
          <SectionCard title="Overview" subtitle="Set the headline and summary students will see first." palette={palette}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Campus innovation summit 2026"
              placeholderTextColor={palette.subtext}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />
            <TextInput
              value={summary}
              onChangeText={setSummary}
              placeholder="One-line summary for cards and previews"
              placeholderTextColor={palette.subtext}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Describe agenda, speakers, entry notes, dress code, or what attendees should bring."
              placeholderTextColor={palette.subtext}
              multiline
              style={[styles.textArea, { color: palette.text, borderColor: palette.border }]}
            />
            <SelectionRow
              options={EVENT_CATEGORY_OPTIONS}
              value={category}
              onChange={(next) => setCategory(next as EventCategory)}
              accent={palette.accent}
              text={palette.text}
              border={palette.border}
            />
            <SelectionRow
              options={EVENT_AUDIENCE_OPTIONS}
              value={audience}
              onChange={(next) => setAudience(next as EventAudience)}
              accent={palette.accent}
              text={palette.text}
              border={palette.border}
            />
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(420)}>
          <SectionCard title="Schedule and venue" subtitle="Lock in timing, format, and where attendees should join." palette={palette}>
            <SelectionRow
              options={EVENT_FORMAT_OPTIONS}
              value={format}
              onChange={(next) => setFormat(next as EventFormat)}
              accent={palette.accent}
              text={palette.text}
              border={palette.border}
            />
            {format !== 'virtual' ? (
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Main auditorium, engineering block"
                placeholderTextColor={palette.subtext}
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              />
            ) : null}
            {format !== 'in-person' ? (
              <TextInput
                value={streamUrl}
                onChangeText={setStreamUrl}
                placeholder="https://meet.google.com/..."
                placeholderTextColor={palette.subtext}
                autoCapitalize="none"
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              />
            ) : null}

            <View style={styles.dateGrid}>
              <Pressable onPress={() => openPicker('start')} style={[styles.dateCard, { borderColor: palette.border }]}>
                <Text style={[styles.dateLabel, { color: palette.subtext }]}>Starts</Text>
                <Text style={[styles.dateValue, { color: palette.text }]}>{formatEventDateTime(startsAt.toISOString())}</Text>
              </Pressable>
              <Pressable onPress={() => openPicker('end')} style={[styles.dateCard, { borderColor: palette.border }]}>
                <Text style={[styles.dateLabel, { color: palette.subtext }]}>Ends</Text>
                <Text style={[styles.dateValue, { color: palette.text }]}>{formatEventDateTime(endsAt.toISOString())}</Text>
              </Pressable>
              <Pressable onPress={() => openPicker('close')} style={[styles.dateCard, { borderColor: palette.border }]}>
                <Text style={[styles.dateLabel, { color: palette.subtext }]}>Registration closes</Text>
                <Text style={[styles.dateValue, { color: palette.text }]}>{formatEventDateTime(registrationClosesAt.toISOString())}</Text>
              </Pressable>
            </View>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(420)}>
          <SectionCard title="Tickets and access" subtitle="Define price, capacity, and attendee limits without extra noise." palette={palette}>
            <View style={[styles.toggleRow, { borderColor: palette.border }]}>
              <View style={styles.toggleCopy}>
                <Text style={[styles.toggleTitle, { color: palette.text }]}>Free event</Text>
                <Text style={[styles.toggleSubtitle, { color: palette.subtext }]}>Switch off if students need to buy tickets.</Text>
              </View>
              <Switch value={isFree} onValueChange={setIsFree} trackColor={{ true: '#64B5F6', false: '#9DB6CE' }} thumbColor={isFree ? '#1976D2' : '#FFFFFF'} />
            </View>

            {!isFree ? (
              <TextInput
                value={ticketPrice}
                onChangeText={setTicketPrice}
                keyboardType="decimal-pad"
                placeholder="Ticket price in naira, e.g. 2500"
                placeholderTextColor={palette.subtext}
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              />
            ) : null}

            <View style={styles.inlineInputs}>
              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="number-pad"
                placeholder="Capacity"
                placeholderTextColor={palette.subtext}
                style={[styles.input, styles.inlineInput, { color: palette.text, borderColor: palette.border }]}
              />
              <TextInput
                value={maxTicketsPerUser}
                onChangeText={setMaxTicketsPerUser}
                keyboardType="number-pad"
                placeholder="Max per user"
                placeholderTextColor={palette.subtext}
                style={[styles.input, styles.inlineInput, { color: palette.text, borderColor: palette.border }]}
              />
            </View>

            <TextInput
              value={ticketInstructions}
              onChangeText={setTicketInstructions}
              placeholder="Optional ticket note, e.g. present school ID at the gate"
              placeholderTextColor={palette.subtext}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />

            <View style={[styles.previewCard, { backgroundColor: palette.accentSoft }]}>
              <Text style={[styles.previewLabel, { color: palette.subtext }]}>Admission preview</Text>
              <Text style={[styles.previewValue, { color: palette.text }]}>{ticketPreview}</Text>
            </View>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(420)}>
          <SectionCard title="Organizer details" subtitle="Add the contact identity attendees should trust for support." palette={palette}>
            <TextInput
              value={organizerName}
              onChangeText={setOrganizerName}
              placeholder="Student affairs office"
              placeholderTextColor={palette.subtext}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />
            <TextInput
              value={contactEmail}
              onChangeText={setContactEmail}
              autoCapitalize="none"
              placeholder="events@school.edu"
              placeholderTextColor={palette.subtext}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />
            <TextInput
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="Support phone"
              placeholderTextColor={palette.subtext}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />
            <View style={[styles.toggleRow, { borderColor: palette.border }]}>
              <View style={styles.toggleCopy}>
                <Text style={[styles.toggleTitle, { color: palette.text }]}>Feature this event</Text>
                <Text style={[styles.toggleSubtitle, { color: palette.subtext }]}>Featured events appear at the top of the events page.</Text>
              </View>
              <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ true: '#64B5F6', false: '#9DB6CE' }} thumbColor={isFeatured ? '#1976D2' : '#FFFFFF'} />
            </View>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(420)}>
          <SectionCard title="Cover image" subtitle="Finish with a clean banner that elevates the event presentation." palette={palette}>
            {imageBase64 ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: imageBase64 }} style={styles.imagePreview} contentFit="cover" />
              </View>
            ) : null}
            <TouchableOpacity onPress={pickImage} style={[styles.imageButton, { borderColor: palette.border }]}>
              <Ionicons name="image-outline" size={18} color={palette.accent} />
              <Text style={[styles.imageButtonText, { color: palette.accent }]}>{imageBase64 ? 'Change cover image' : 'Upload cover image'}</Text>
            </TouchableOpacity>
          </SectionCard>
        </Animated.View>

        <TouchableOpacity disabled={submitting} onPress={submit} style={[styles.submitButton, { backgroundColor: palette.accent, opacity: submitting ? 0.7 : 1 }]}>
          <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
          <Text style={styles.submitText}>{submitting ? 'Publishing...' : 'Publish event'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <DateTimePickerModal
        isVisible={pickerVisible}
        mode="datetime"
        date={pickerTarget === 'start' ? startsAt : pickerTarget === 'end' ? endsAt : registrationClosesAt}
        onConfirm={handlePickerConfirm}
        onCancel={() => setPickerVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 42,
    gap: 16,
  },
  lockedWrap: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  lockedCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
  },
  heroGradient: {
    padding: 18,
    gap: 14,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  heroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroPill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  sectionBody: {
    gap: 12,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 130,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  selectionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dateGrid: {
    gap: 10,
  },
  dateCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    gap: 7,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateValue: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  toggleRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleCopy: {
    flex: 1,
    gap: 6,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  toggleSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineInput: {
    flex: 1,
  },
  previewCard: {
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewValue: {
    fontSize: 19,
    fontWeight: '900',
  },
  imagePreviewWrap: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
  },
  imageButton: {
    borderWidth: 1,
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  submitButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  primaryButton: {
    minWidth: 160,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
