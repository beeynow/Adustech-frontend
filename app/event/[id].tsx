import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Calendar from 'expo-calendar';
import { eventsAPI, type EventRecord } from '../../services/eventsApi';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { formatEventCurrency, formatEventDate, formatEventDateTime, formatEventTimeRange, getEventAdmissionLabel, getEventAudienceLabel, getEventCategoryLabel, getEventCountdown, getEventFormatLabel, getEventSeatLabel } from '../../utils/events';

const QuantityStepper = ({
  value,
  max,
  onChange,
  palette,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  palette: { border: string; text: string; accent: string; card: string };
}) => {
  return (
    <View style={[styles.stepper, { borderColor: palette.border, backgroundColor: palette.card }]}>
      <TouchableOpacity disabled={value <= 1} onPress={() => onChange(Math.max(1, value - 1))} style={styles.stepperButton}>
        <Ionicons name="remove" size={18} color={palette.accent} />
      </TouchableOpacity>
      <Text style={[styles.stepperValue, { color: palette.text }]}>{value}</Text>
      <TouchableOpacity disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepperButton}>
        <Ionicons name="add" size={18} color={palette.accent} />
      </TouchableOpacity>
    </View>
  );
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const palette = {
    page: isDark ? '#06131F' : '#EAF5FF',
    card: isDark ? 'rgba(9, 28, 44, 0.95)' : 'rgba(255, 255, 255, 0.97)',
    border: isDark ? 'rgba(110, 166, 245, 0.18)' : 'rgba(34, 95, 160, 0.12)',
    text: isDark ? '#F4FAFF' : '#08253F',
    subtext: isDark ? '#A7C4E6' : '#5F748A',
    accent: '#1976D2',
    accentSoft: isDark ? 'rgba(25,118,210,0.18)' : 'rgba(25,118,210,0.1)',
    accentAlt: '#0F9D58',
  };

  const loadEvent = async () => {
    try {
      const response = await eventsAPI.get(String(id));
      setEvent(response.event);
      setQuantity(1);
    } catch {
      setEvent(null);
      showToast.error('Unable to load this event right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  const addToCalendar = async () => {
    if (!event) {
      return;
    }

    try {
      const permission = await Calendar.requestCalendarPermissionsAsync();
      if (permission.status !== 'granted') {
        showToast.warning('Calendar access is required to save this event.');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writableCalendar = calendars.find((calendar) => calendar.allowsModifications) || calendars[0];

      if (!writableCalendar) {
        showToast.error('No writable calendar was found on this device.');
        return;
      }

      await Calendar.createEventAsync(writableCalendar.id, {
        title: event.title,
        notes: event.details || event.summary || '',
        location: event.location || undefined,
        startDate: new Date(event.startsAt),
        endDate: new Date(event.endsAt),
        timeZone: event.timezone || undefined,
      });

      showToast.success('Event added to your calendar.');
    } catch (error: any) {
      showToast.error(error?.message || 'Unable to add this event to your calendar.');
    }
  };

  const shareEvent = async () => {
    if (!event) {
      return;
    }

    try {
      await Share.share({
        title: event.title,
        message: `${event.title}\n${formatEventDateTime(event.startsAt)}\nhttps://adustech.app/event/${event.id}`,
      });
    } catch {
      showToast.error('Unable to share this event right now.');
    }
  };

  const openStream = async () => {
    if (!event?.streamUrl) {
      return;
    }

    try {
      await Linking.openURL(event.streamUrl);
    } catch {
      showToast.error('Unable to open the event link.');
    }
  };

  const handlePurchase = async () => {
    if (!event) {
      return;
    }

    if (!user) {
      showToast.info('Sign in first to reserve or buy a ticket.');
      router.push('/login');
      return;
    }

    try {
      setBuying(true);
      const response = await eventsAPI.purchase(event.id, { quantity });
      setEvent(response.event);
      showToast.success(response.message);
    } catch (error: any) {
      showToast.error(error?.message || error?.response?.data?.message || 'Unable to complete the booking.');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={isDark ? ['#06131F', '#0C2035'] : ['#F4FAFF', '#E4F1FF']} style={styles.centered}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={[styles.loadingText, { color: palette.subtext }]}>Loading event…</Text>
      </LinearGradient>
    );
  }

  if (!event) {
    return (
      <LinearGradient colors={isDark ? ['#06131F', '#0C2035'] : ['#F4FAFF', '#E4F1FF']} style={styles.centered}>
        <Text style={[styles.notFoundTitle, { color: palette.text }]}>Event not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backToListButton, { backgroundColor: palette.accent }]}>
          <Text style={styles.backToListText}>Go back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const registrationDeadline = event.registrationClosesAt || event.startsAt;
  const bookingClosed = new Date(registrationDeadline).getTime() <= Date.now() || new Date(event.startsAt).getTime() <= Date.now();
  const soldOut = !!event.isSoldOut;
  const hasTicket = !!event.viewerTicket;
  const buyDisabled = buying || soldOut || bookingClosed || hasTicket;
  const maxQuantity = Math.max(1, event.maxTicketsPerUser || 1);
  const totalPriceCents = event.isFree ? 0 : event.ticketPriceCents * quantity;

  return (
    <LinearGradient colors={isDark ? ['#06131F', '#0B2034', '#102A44'] : ['#F4FAFF', '#E5F2FF', '#D7EBFF']} style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInUp.duration(420)} style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Ionicons name="arrow-back" size={18} color={palette.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareEvent} style={[styles.backButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Ionicons name="share-social-outline" size={18} color={palette.accent} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(40).duration(420)} style={[styles.heroCard, { borderColor: palette.border }]}>
          {!!event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.heroFallback}>
              <Ionicons name="calendar-outline" size={34} color="#FFFFFF" />
            </LinearGradient>
          )}

          <LinearGradient colors={isDark ? ['rgba(6,19,31,0.12)', 'rgba(6,19,31,0.95)'] : ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.98)']} style={styles.heroContent}>
            <View style={styles.badgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.heroBadgeText, { color: palette.accent }]}>{getEventCategoryLabel(event.category)}</Text>
              </View>
              <View style={[styles.heroBadge, { backgroundColor: event.isFree ? 'rgba(15,157,88,0.12)' : palette.accentSoft }]}>
                <Text style={[styles.heroBadgeText, { color: event.isFree ? palette.accentAlt : palette.accent }]}>{getEventAdmissionLabel(event)}</Text>
              </View>
            </View>

            <Text style={[styles.heroTitle, { color: palette.text }]}>{event.title}</Text>
            <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
              {event.summary || event.details || 'Campus event information is available below.'}
            </Text>

            <View style={styles.metaCardGrid}>
              <View style={[styles.metaCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={[styles.metaLabel, { color: palette.subtext }]}>When</Text>
                <Text style={[styles.metaValue, { color: palette.text }]}>{formatEventDate(event.startsAt)}</Text>
                <Text style={[styles.metaSubvalue, { color: palette.subtext }]}>{formatEventTimeRange(event.startsAt, event.endsAt)}</Text>
              </View>
              <View style={[styles.metaCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={[styles.metaLabel, { color: palette.subtext }]}>Access</Text>
                <Text style={[styles.metaValue, { color: palette.text }]}>{getEventSeatLabel(event)}</Text>
                <Text style={[styles.metaSubvalue, { color: palette.subtext }]}>{getEventCountdown(event.startsAt)}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {hasTicket && event.viewerTicket ? (
          <Animated.View entering={FadeInDown.delay(70).duration(420)} style={[styles.ticketCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.ticketTopRow}>
              <View>
                <Text style={[styles.ticketTitle, { color: palette.text }]}>Your ticket is ready</Text>
                <Text style={[styles.ticketSubtitle, { color: palette.subtext }]}>
                  {event.isFree ? 'Reserved spot' : 'Booked ticket'} • {event.viewerTicket.quantity} ticket{event.viewerTicket.quantity === 1 ? '' : 's'}
                </Text>
              </View>
              <Ionicons name="ticket-outline" size={22} color={palette.accent} />
            </View>
            <View style={[styles.ticketCodeBox, { backgroundColor: palette.accentSoft }]}>
              <Text style={[styles.ticketCodeLabel, { color: palette.subtext }]}>Ticket code</Text>
              <Text style={[styles.ticketCodeValue, { color: palette.text }]}>{event.viewerTicket.ticketCode}</Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(100).duration(420)} style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Event details</Text>
          <Text style={[styles.detailText, { color: palette.subtext }]}>
            {event.details || event.summary || 'More event details will be shared by the organizer.'}
          </Text>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={18} color={palette.accent} />
              <Text style={[styles.detailRowText, { color: palette.text }]}>{getEventAudienceLabel(event.audience)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="desktop-outline" size={18} color={palette.accent} />
              <Text style={[styles.detailRowText, { color: palette.text }]}>{getEventFormatLabel(event.format)}</Text>
            </View>
            {event.location ? (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={palette.accent} />
                <Text style={[styles.detailRowText, { color: palette.text }]}>{event.location}</Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Ionicons name="hourglass-outline" size={18} color={palette.accent} />
              <Text style={[styles.detailRowText, { color: palette.text }]}>Booking closes {formatEventDateTime(registrationDeadline)}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(420)} style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Organizer</Text>
          <Text style={[styles.organizerName, { color: palette.text }]}>{event.organizerName || event.createdByName}</Text>
          <Text style={[styles.organizerMeta, { color: palette.subtext }]}>{event.contactEmail || event.User?.email}</Text>
          {event.contactPhone ? <Text style={[styles.organizerMeta, { color: palette.subtext }]}>{event.contactPhone}</Text> : null}
          {event.ticketInstructions ? (
            <View style={[styles.instructionsBox, { backgroundColor: palette.accentSoft }]}>
              <Text style={[styles.instructionsLabel, { color: palette.subtext }]}>Entry note</Text>
              <Text style={[styles.instructionsText, { color: palette.text }]}>{event.ticketInstructions}</Text>
            </View>
          ) : null}
        </Animated.View>

        {!hasTicket ? (
          <Animated.View entering={FadeInDown.delay(160).duration(420)} style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{event.isFree ? 'Reserve your spot' : 'Buy your ticket'}</Text>
            <Text style={[styles.purchaseSummary, { color: palette.subtext }]}>
              {soldOut
                ? 'This event has reached capacity.'
                : bookingClosed
                  ? 'Ticketing is closed for this event.'
                  : event.isFree
                    ? 'Reserve your place now and receive a ticket code instantly.'
                    : `Tickets are ${formatEventCurrency(event.ticketPriceCents, event.currency)} each.`}
            </Text>

            {maxQuantity > 1 ? (
              <View style={styles.purchaseRow}>
                <View style={styles.purchaseCopy}>
                  <Text style={[styles.purchaseLabel, { color: palette.text }]}>Quantity</Text>
                  <Text style={[styles.purchaseHelper, { color: palette.subtext }]}>Up to {maxQuantity} per user</Text>
                </View>
                <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} palette={palette} />
              </View>
            ) : null}

            {!event.isFree ? (
              <View style={[styles.totalBox, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.totalLabel, { color: palette.subtext }]}>Total</Text>
                <Text style={[styles.totalValue, { color: palette.text }]}>{formatEventCurrency(totalPriceCents, event.currency)}</Text>
              </View>
            ) : null}

            <TouchableOpacity disabled={buyDisabled} onPress={handlePurchase} style={[styles.primaryAction, { backgroundColor: buyDisabled ? '#8FA7BE' : palette.accent }]}>
              <Ionicons name={event.isFree ? 'checkmark-circle-outline' : 'card-outline'} size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>
                {buying ? 'Processing...' : event.isFree ? 'Reserve spot' : 'Buy ticket'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(190).duration(420)} style={styles.actionRow}>
          {!bookingClosed ? (
            <TouchableOpacity onPress={addToCalendar} style={[styles.secondaryAction, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Ionicons name="calendar-outline" size={18} color={palette.accent} />
              <Text style={[styles.secondaryActionText, { color: palette.text }]}>Add to calendar</Text>
            </TouchableOpacity>
          ) : null}
          {event.format !== 'in-person' && event.streamUrl ? (
            <TouchableOpacity onPress={openStream} style={[styles.secondaryAction, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Ionicons name="open-outline" size={18} color={palette.accent} />
              <Text style={[styles.secondaryActionText, { color: palette.text }]}>Open event link</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  backToListButton: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToListText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 38,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  heroFallback: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    padding: 18,
    gap: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 12,
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
  metaCardGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metaCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  metaSubvalue: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  ticketCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  ticketSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  ticketCodeBox: {
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  ticketCodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ticketCodeValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  infoCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
  },
  detailList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailRowText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  organizerName: {
    fontSize: 18,
    fontWeight: '900',
  },
  organizerMeta: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  instructionsBox: {
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  purchaseSummary: {
    fontSize: 14,
    lineHeight: 21,
  },
  purchaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  purchaseCopy: {
    flex: 1,
    gap: 4,
  },
  purchaseLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  purchaseHelper: {
    fontSize: 13,
    lineHeight: 19,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 8,
    height: 50,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
  },
  totalBox: {
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  primaryAction: {
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
