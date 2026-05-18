import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { eventsAPI, type EventRecord } from '../../services/eventsApi';
import { showToast } from '../../utils/toast';
import {
  canAccessSecurePaidTicket,
  formatEventCurrency,
  formatEventDateTime,
  formatEventTimeRange,
  getEventTicketStatusLabel,
  getEventTicketStatusTone,
  getEventTicketSupportText,
} from '../../utils/events';

const pickParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';
};

const TicketMetric = ({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: { text: string; subtext: string; accentSoft: string };
}) => {
  return (
    <View style={[styles.metricCard, { backgroundColor: palette.accentSoft }]}>
      <Text style={[styles.metricLabel, { color: palette.subtext }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: palette.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
};

export default function PaidTicketScreen() {
  usePreventScreenCapture('paid-ticket-pass');

  const params = useLocalSearchParams<{ eventId?: string | string[] }>();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const checkoutRefreshTimers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const eventId = pickParam(params.eventId);

  const palette = {
    page: isDark ? ['#05111D', '#0B2034', '#12314C'] as const : ['#F7FBFF', '#E5F2FF', '#DAECFF'] as const,
    card: isDark ? 'rgba(7, 24, 38, 0.96)' : 'rgba(255, 255, 255, 0.97)',
    border: isDark ? 'rgba(108, 167, 247, 0.2)' : 'rgba(24, 96, 168, 0.12)',
    text: isDark ? '#F6FAFF' : '#09233B',
    subtext: isDark ? '#A8C6E6' : '#607488',
    accent: '#1976D2',
    accentSoft: isDark ? 'rgba(25,118,210,0.18)' : 'rgba(25,118,210,0.1)',
    success: '#0F9D58',
    warn: '#8A4B00',
  };

  const loadTicket = React.useCallback(async () => {
    if (!eventId) {
      setEvent(null);
      setLoading(false);
      return;
    }

    try {
      const response = await eventsAPI.get(eventId);
      setEvent(response.event);
    } catch {
      setEvent(null);
      showToast.error('Unable to load this paid ticket right now.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const refreshAfterCheckoutSignal = React.useCallback(() => {
    checkoutRefreshTimers.current.forEach(clearTimeout);
    checkoutRefreshTimers.current = [1500, 5000, 10000].map((delay) =>
      setTimeout(() => {
        void loadTicket();
      }, delay)
    );
  }, [loadTicket]);

  React.useEffect(() => {
    return () => {
      checkoutRefreshTimers.current.forEach(clearTimeout);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      loadTicket();
    }, [loadTicket])
  );

  const openCheckout = async () => {
    const checkoutUrl = event?.viewerTicket?.payment?.checkoutUrl;
    if (!checkoutUrl) {
      showToast.error('No checkout link is available for this ticket.');
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
            transactionId:
              typeof parsed.queryParams?.transaction_id === 'string'
                ? parsed.queryParams.transaction_id
                : typeof parsed.queryParams?.transactionId === 'string'
                  ? parsed.queryParams.transactionId
                  : '',
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

  if (loading) {
    return (
      <LinearGradient colors={palette.page} style={styles.centered}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={[styles.loadingText, { color: palette.subtext }]}>Loading paid ticket…</Text>
      </LinearGradient>
    );
  }

  const ticket = event?.viewerTicket || null;
  const secureTicketAvailable = !event?.isFree && canAccessSecurePaidTicket(ticket);

  if (!event || !ticket || event.isFree || !secureTicketAvailable) {
    const hasFailedOrExpiredPurchase = !!ticket && !canAccessSecurePaidTicket(ticket);

    return (
      <LinearGradient colors={palette.page} style={styles.centered}>
        <Text style={[styles.emptyTitle, { color: palette.text }]}>Paid ticket not available</Text>
        <Text style={[styles.emptySubtitle, { color: palette.subtext }]}>
          {hasFailedOrExpiredPurchase
            ? 'Failed, cancelled, or expired payment attempts stay on the event page until you start a fresh checkout.'
            : 'This secure page only opens for ticketed paid events with an active purchase record.'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (event?.id) {
              router.replace({ pathname: '/event/[id]' as any, params: { id: event.id } });
              return;
            }

            router.back();
          }}
          style={[styles.primaryButton, { backgroundColor: palette.accent }]}
        >
          <Text style={styles.primaryButtonText}>{event?.id ? 'Back to event' : 'Go back'}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const statusTone = getEventTicketStatusTone(ticket);
  const canShowQr = ticket.status === 'paid' && !!ticket.qrPayload;
  const paymentPending = ticket.status === 'pending';

  return (
    <LinearGradient colors={palette.page} style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity style={[styles.circleButton, { backgroundColor: palette.card, borderColor: palette.border }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={palette.accent} />
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>Secure Paid Ticket</Text>
            <Text style={[styles.heroTitle, { color: palette.text }]}>QR entry pass</Text>
            <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
              Screenshots and screen recording are blocked on this page for ticket security.
            </Text>
          </View>
          {!!event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.heroImage} contentFit="cover" />
          ) : null}
        </View>

        <View style={[styles.ticketCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.ticketHeader}>
            <View style={styles.ticketHeaderCopy}>
              <Text style={[styles.ticketEventTitle, { color: palette.text }]}>{event.title}</Text>
              <Text style={[styles.ticketMeta, { color: palette.subtext }]}>
                {formatEventDateTime(event.startsAt)} • {formatEventTimeRange(event.startsAt, event.endsAt)}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusTone.background }]}>
              <Text style={[styles.statusText, { color: statusTone.accent }]}>{getEventTicketStatusLabel(ticket)}</Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <TicketMetric label="Ticket ID" value={ticket.ticketId} palette={palette} />
            <TicketMetric label="Amount" value={formatEventCurrency(ticket.amountCents, ticket.currency)} palette={palette} />
          </View>

          <View style={styles.metricGrid}>
            <TicketMetric label="Quantity" value={`${ticket.quantity}`} palette={palette} />
            <TicketMetric label="Payment" value={ticket.payment?.status || 'pending'} palette={palette} />
          </View>

          <View style={[styles.noticeCard, { backgroundColor: palette.accentSoft }]}>
            <Ionicons
              name={canShowQr ? 'shield-checkmark-outline' : ticket.status === 'checked-in' ? 'ban-outline' : 'information-circle-outline'}
              size={18}
              color={ticket.status === 'checked-in' ? palette.warn : palette.accent}
            />
            <Text style={[styles.noticeText, { color: palette.text }]}>{getEventTicketSupportText(ticket)}</Text>
          </View>

          {canShowQr ? (
            <View style={styles.qrSection}>
              <View style={styles.qrShell}>
                <QRCode value={ticket.qrPayload} size={210} />
              </View>
              <Text style={[styles.qrCaption, { color: palette.subtext }]}>
                Present this QR code live at the venue gate for admin verification.
              </Text>
            </View>
          ) : null}

          {paymentPending ? (
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: palette.accent }]} onPress={openCheckout}>
              <Ionicons name="card-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Complete payment</Text>
            </TouchableOpacity>
          ) : null}

          {ticket.status === 'checked-in' ? (
            <View style={[styles.expiredCard, { borderColor: palette.border }]}>
              <Ionicons name="checkmark-done-circle-outline" size={22} color={palette.success} />
              <Text style={[styles.expiredText, { color: palette.text }]}>
                This paid pass has already been used at the venue gate and is now expired.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 42,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  heroCopy: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
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
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
  },
  ticketCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 16,
  },
  ticketHeader: {
    gap: 10,
  },
  ticketHeaderCopy: {
    gap: 5,
  },
  ticketEventTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  ticketMeta: {
    fontSize: 13,
    lineHeight: 20,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  noticeCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  qrSection: {
    alignItems: 'center',
    gap: 12,
  },
  qrShell: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
  },
  qrCaption: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  expiredCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expiredText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
});
