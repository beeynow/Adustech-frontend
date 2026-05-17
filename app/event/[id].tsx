import React, { useState } from 'react';
import { ActivityIndicator, Linking as RNLinking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Calendar from 'expo-calendar';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { eventsAPI, type EventRecord } from '../../services/eventsApi';
import { useAuth } from '../../context/AuthContext';
import { canVerifyEventTickets } from '../../utils/permissions';
import { showToast } from '../../utils/toast';
import {
  canAccessSecurePaidTicket,
  formatEventCurrency,
  formatEventDate,
  formatEventDateTime,
  formatEventTimeRange,
  getEventAdmissionLabel,
  getEventAudienceLabel,
  getEventCategoryLabel,
  getEventCountdown,
  getEventFormatLabel,
  getEventSeatLabel,
  getEventTicketStatusLabel,
  getEventTicketStatusTone,
  getEventTicketSupportText,
  isRetryablePaidTicketStatus,
} from '../../utils/events';

const pickParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';
};

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
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const checkoutRefreshTimers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const id = pickParam(params.id);

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

  const loadEvent = React.useCallback(async () => {
    if (!id) {
      setEvent(null);
      setLoading(false);
      return;
    }

    try {
      const response = await eventsAPI.get(id);
      setEvent(response.event);
      setQuantity(1);
    } catch {
      setEvent(null);
      showToast.error('Unable to load this event right now.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refreshAfterCheckoutSignal = React.useCallback(() => {
    checkoutRefreshTimers.current.forEach(clearTimeout);
    checkoutRefreshTimers.current = [1500, 5000, 10000].map((delay) =>
      setTimeout(() => {
        void loadEvent();
      }, delay)
    );
  }, [loadEvent]);

  React.useEffect(() => {
    return () => {
      checkoutRefreshTimers.current.forEach(clearTimeout);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      loadEvent();
    }, [loadEvent])
  );

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
      await RNLinking.openURL(event.streamUrl);
    } catch {
      showToast.error('Unable to open the event link.');
    }
  };

  const openCheckout = async (checkoutUrl?: string) => {
    if (!checkoutUrl) {
      showToast.error('No checkout link is available for this ticket yet.');
      return;
    }

    try {
      const appRedirectUrl = ExpoLinking.createURL('/payments/paystack-callback');
      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, appRedirectUrl);

      if (result.type === 'success' && result.url) {
        const parsed = ExpoLinking.parse(result.url);
        router.replace({
          pathname: '/payments/paystack-callback' as any,
          params: {
            status: typeof parsed.queryParams?.status === 'string' ? parsed.queryParams.status : '',
            reference: typeof parsed.queryParams?.reference === 'string' ? parsed.queryParams.reference : '',
            trxref: typeof parsed.queryParams?.trxref === 'string' ? parsed.queryParams.trxref : '',
          },
        });
        return;
      }

      showToast.info('Checking ticket status from Paystack webhook signal.');
      refreshAfterCheckoutSignal();
    } catch {
      showToast.error('Unable to open Paystack checkout right now.');
      refreshAfterCheckoutSignal();
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
      const response = await eventsAPI.purchase(event.id, {
        quantity,
        redirectUrl: ExpoLinking.createURL('/payments/paystack-callback'),
      });

      setEvent(response.event);

      if (response.requiresPayment && response.checkoutUrl) {
        showToast.info('Secure Paystack checkout is ready.', 'Checkout Ready');
        await openCheckout(response.checkoutUrl);
        return;
      }

      showToast.success(response.message);
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || error?.message || 'Unable to complete the ticket request.');
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
  const ticket = event.viewerTicket || null;
  const ticketTone = getEventTicketStatusTone(ticket);
  const hasValidTicket = !!ticket?.isEntryReady;
  const pendingPayment = ticket?.status === 'pending';
  const canRetryPayment = isRetryablePaidTicketStatus(ticket?.status);
  const maxQuantity = Math.max(1, event.maxTicketsPerUser || 1);
  const totalPriceCents = event.isFree ? 0 : event.ticketPriceCents * quantity;
  const canVerifyTickets = canVerifyEventTickets(user?.role);
  const canOpenPaidTicketPage = !event.isFree && canAccessSecurePaidTicket(ticket);
  const paidTicketActionLabel = ticket?.status === 'paid'
    ? 'Open secure QR ticket'
    : ticket?.status === 'checked-in'
      ? 'View used ticket'
      : 'Open payment ticket details';

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

          <LinearGradient colors={isDark ? ['rgba(6,19,31,0.12)', 'rgba(6,19,31,0.96)'] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.98)']} style={styles.heroContent}>
            <View style={styles.badgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.heroBadgeText, { color: palette.accent }]}>{getEventCategoryLabel(event.category)}</Text>
              </View>
              <View style={[styles.heroBadge, { backgroundColor: event.isFree ? 'rgba(15,157,88,0.12)' : palette.accentSoft }]}>
                <Text style={[styles.heroBadgeText, { color: event.isFree ? palette.accentAlt : palette.accent }]}>{getEventAdmissionLabel(event)}</Text>
              </View>
              {ticket ? (
                <View style={[styles.heroBadge, { backgroundColor: ticketTone.background }]}>
                  <Text style={[styles.heroBadgeText, { color: ticketTone.accent }]}>{getEventTicketStatusLabel(ticket)}</Text>
                </View>
              ) : null}
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

        {ticket ? (
          <Animated.View entering={FadeInDown.delay(70).duration(420)} style={[styles.ticketCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <LinearGradient colors={isDark ? ['rgba(12,34,54,0.98)', 'rgba(14,58,92,0.95)'] : ['#FFFFFF', '#EDF7FF']} style={styles.ticketPass}>
              <View style={styles.ticketHeader}>
                <View style={styles.ticketHeaderCopy}>
                  <Text style={[styles.ticketEyebrow, { color: palette.subtext }]}>
                    {event.isFree ? 'Event Pass' : 'Paid Ticket Summary'}
                  </Text>
                  <Text style={[styles.ticketTitle, { color: palette.text }]}>{ticket.ticketId}</Text>
                  <Text style={[styles.ticketSubtitle, { color: palette.subtext }]}>
                    {getEventTicketSupportText(ticket)}
                  </Text>
                </View>
                <View style={[styles.ticketStatusPill, { backgroundColor: ticketTone.background }]}>
                  <Text style={[styles.ticketStatusText, { color: ticketTone.accent }]}>{getEventTicketStatusLabel(ticket)}</Text>
                </View>
              </View>

              <View style={styles.ticketSummaryRow}>
                <View style={[styles.ticketSummaryPill, { backgroundColor: palette.accentSoft }]}>
                  <Ionicons name="person-outline" size={15} color={palette.accent} />
                  <Text style={[styles.ticketSummaryText, { color: palette.text }]} numberOfLines={1}>{user?.name || 'Attendee'}</Text>
                </View>
                <View style={[styles.ticketSummaryPill, { backgroundColor: palette.accentSoft }]}>
                  <Ionicons name="layers-outline" size={15} color={palette.accent} />
                  <Text style={[styles.ticketSummaryText, { color: palette.text }]}>{ticket.quantity} ticket{ticket.quantity === 1 ? '' : 's'}</Text>
                </View>
              </View>

              {pendingPayment && ticket.payment?.checkoutUrl ? (
                <TouchableOpacity style={[styles.primaryAction, { backgroundColor: palette.accent }]} onPress={() => openCheckout(ticket.payment?.checkoutUrl)}>
                  <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Complete payment</Text>
                </TouchableOpacity>
              ) : null}

              {canOpenPaidTicketPage ? (
                <TouchableOpacity
                  style={[styles.secondaryTicketAction, { borderColor: palette.border, backgroundColor: palette.card }]}
                  onPress={() => router.push({ pathname: '/paid-ticket/[eventId]' as any, params: { eventId: event.id } })}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color={palette.accent} />
                  <Text style={[styles.secondaryTicketActionText, { color: palette.text }]}>{paidTicketActionLabel}</Text>
                </TouchableOpacity>
              ) : null}
            </LinearGradient>
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

        {!hasValidTicket && !pendingPayment ? (
          <Animated.View entering={FadeInDown.delay(160).duration(420)} style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {event.isFree ? 'Reserve your place' : canRetryPayment ? 'Reactivate this ticket' : 'Get your ticket'}
            </Text>
            <Text style={[styles.purchaseSummary, { color: palette.subtext }]}>
              {soldOut
                ? 'This event has reached capacity.'
                : bookingClosed
                  ? 'Ticketing is closed for this event.'
                    : event.isFree
                      ? 'Reserve your place now and receive a live QR pass instantly.'
                    : canRetryPayment
                      ? 'Create a fresh Paystack checkout session to finish this ticket.'
                      : `Tickets are ${formatEventCurrency(event.ticketPriceCents, event.currency)} each with secure Paystack checkout.`}
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

            <TouchableOpacity
              disabled={buying || soldOut || bookingClosed}
              onPress={handlePurchase}
              style={[styles.primaryAction, { backgroundColor: buying || soldOut || bookingClosed ? '#8FA7BE' : palette.accent }]}
            >
              <Ionicons name={event.isFree ? 'checkmark-circle-outline' : 'card-outline'} size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>
                {buying
                  ? 'Processing...'
                  : event.isFree
                    ? 'Reserve spot'
                    : canRetryPayment
                      ? 'Create new checkout'
                      : 'Secure checkout'}
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
          {canVerifyTickets ? (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/event-ticket-verifier' as any, params: { eventTitle: event.title } })}
              style={[styles.secondaryAction, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Ionicons name="scan-outline" size={18} color={palette.accent} />
              <Text style={[styles.secondaryActionText, { color: palette.text }]}>Verify tickets</Text>
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
    paddingHorizontal: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  notFoundTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  backToListButton: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  backToListText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 120,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 999,
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
    height: 300,
  },
  heroFallback: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    fontSize: 15,
    lineHeight: 22,
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
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  metaSubvalue: {
    fontSize: 13,
    lineHeight: 18,
  },
  ticketCard: {
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  ticketPass: {
    padding: 18,
    gap: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  ticketHeaderCopy: {
    flex: 1,
    gap: 5,
  },
  ticketEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ticketTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  ticketSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  ticketStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ticketStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ticketSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ticketSummaryPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketSummaryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    gap: 10,
    alignItems: 'flex-start',
  },
  detailRowText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  organizerName: {
    fontSize: 18,
    fontWeight: '800',
  },
  organizerMeta: {
    fontSize: 14,
  },
  instructionsBox: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  instructionsLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  purchaseSummary: {
    fontSize: 14,
    lineHeight: 21,
  },
  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 6,
    minWidth: 124,
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  totalBox: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  primaryAction: {
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryTicketAction: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryTicketActionText: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
