import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { eventsAPI, type EventRecord } from '../services/eventsApi';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { formatEventDate, formatEventTimeRange, getEventAdmissionLabel, getEventCategoryLabel, getEventCountdown, getEventSeatLabel, getEventTicketStatusLabel, getEventTicketStatusTone } from '../utils/events';

type FilterValue = 'all' | 'featured' | 'free' | 'paid';

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Featured', value: 'featured' },
  { label: 'Free', value: 'free' },
  { label: 'Paid', value: 'paid' },
];

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const canCreateEvents = ['power', 'admin'].includes(user?.role || '');

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterValue>('all');

  const palette = {
    page: isDark ? '#071421' : '#EAF5FF',
    card: isDark ? 'rgba(10, 29, 47, 0.94)' : 'rgba(255, 255, 255, 0.96)',
    border: isDark ? 'rgba(115, 174, 255, 0.18)' : 'rgba(34, 95, 160, 0.12)',
    text: isDark ? '#F5FAFF' : '#08253F',
    subtext: isDark ? '#A7C4E6' : '#5F748A',
    accent: '#1976D2',
    accentSoft: isDark ? 'rgba(25, 118, 210, 0.18)' : 'rgba(25, 118, 210, 0.1)',
    accentAlt: '#0F9D58',
  };

  const loadEvents = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await eventsAPI.list();
      setEvents(data.events || []);
    } catch {
      showToast.error('Unable to load campus events right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [])
  );

  const filteredEvents = events.filter((event) => {
    if (filter === 'featured') {
      return event.isFeatured;
    }
    if (filter === 'free') {
      return event.isFree;
    }
    if (filter === 'paid') {
      return !event.isFree;
    }
    return true;
  });

  const heroEvent = filteredEvents[0] || events[0] || null;
  const featuredCount = events.filter((event) => event.isFeatured).length;
  const paidCount = events.filter((event) => !event.isFree).length;

  return (
    <LinearGradient colors={isDark ? ['#04111D', '#0B2034', '#102A44'] : ['#F4FAFF', '#E5F2FF', '#D7EBFF']} style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEvents(true); }} tintColor={palette.accent} />
        }
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={[
              styles.pageBackButton,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                shadowColor: isDark ? '#020B14' : '#9BB8D8',
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color={palette.text} />
          </TouchableOpacity>

          <View style={styles.pageHeaderCopy}>
            <Text style={[styles.pageHeaderEyebrow, { color: palette.subtext }]}>Back to channels</Text>
            <Text style={[styles.pageHeaderTitle, { color: palette.text }]}>Event channel</Text>
          </View>
        </View>

        <Animated.View entering={FadeInUp.duration(420)} style={[styles.heroShell, { borderColor: palette.border }]}>
          <LinearGradient colors={isDark ? ['rgba(12,37,58,0.98)', 'rgba(16,60,108,0.98)'] : ['#FFFFFF', '#E9F4FF']} style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(148, 197, 255, 0.16)' : 'rgba(25,118,210,0.1)' }]}>
                <Ionicons name="sparkles-outline" size={14} color={palette.accent} />
                <Text style={[styles.badgeText, { color: palette.accent }]}>University events</Text>
              </View>
              {canCreateEvents ? (
                <TouchableOpacity style={[styles.createInlineButton, { backgroundColor: palette.accent }]} onPress={() => router.push('/create-event')}>
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.createInlineText}>Create</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.heroHeadingBlock}>
              <Text style={[styles.heroTitle, { color: palette.text }]}>Discover what is happening on campus.</Text>
              <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
                Professional event discovery with clear timing, access, and ticket state at a glance.
              </Text>
            </View>

            <View style={styles.statRow}>
              <View style={[styles.statPill, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.statValue, { color: palette.text }]}>{events.length}</Text>
                <Text style={[styles.statLabel, { color: palette.subtext }]}>Upcoming</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.statValue, { color: palette.text }]}>{featuredCount}</Text>
                <Text style={[styles.statLabel, { color: palette.subtext }]}>Featured</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.statValue, { color: palette.text }]}>{paidCount}</Text>
                <Text style={[styles.statLabel, { color: palette.subtext }]}>Ticketed</Text>
              </View>
            </View>

            {heroEvent ? (
              <Pressable onPress={() => router.push(`/event/${heroEvent.id}`)} style={[styles.heroHighlight, { borderColor: palette.border }]}>
                <View style={styles.heroHighlightMedia}>
                  {!!(heroEvent.imageUrl || heroEvent.imageBase64) ? (
                    <Image source={{ uri: heroEvent.imageUrl || heroEvent.imageBase64 || '' }} style={styles.heroImage} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.heroImageFallback}>
                      <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                </View>
                <View style={styles.heroHighlightContent}>
                  <View style={styles.heroHighlightRow}>
                    <View style={[styles.categoryChip, { backgroundColor: palette.accentSoft }]}>
                      <Text style={[styles.categoryChipText, { color: palette.accent }]}>{getEventCategoryLabel(heroEvent.category)}</Text>
                    </View>
                    <Text style={[styles.countdownText, { color: palette.subtext }]}>{getEventCountdown(heroEvent.startsAt)}</Text>
                  </View>
                  <Text style={[styles.heroEventTitle, { color: palette.text }]} numberOfLines={2}>{heroEvent.title}</Text>
                  <Text style={[styles.heroEventMeta, { color: palette.subtext }]} numberOfLines={1}>
                    {formatEventDate(heroEvent.startsAt)} • {formatEventTimeRange(heroEvent.startsAt, heroEvent.endsAt)}
                  </Text>
                  <View style={styles.heroHighlightFooter}>
                    <View style={styles.heroFooterLeft}>
                      <Text style={[styles.heroEventSummary, { color: palette.subtext }]} numberOfLines={1}>
                        {heroEvent.location || getEventAdmissionLabel(heroEvent)}
                      </Text>
                      {heroEvent.viewerTicket ? (
                        <View style={[styles.heroTicketPill, { backgroundColor: getEventTicketStatusTone(heroEvent.viewerTicket).background }]}>
                          <Text style={[styles.heroTicketText, { color: getEventTicketStatusTone(heroEvent.viewerTicket).accent }]}>
                            {getEventTicketStatusLabel(heroEvent.viewerTicket)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={[styles.heroOpenPill, { backgroundColor: palette.accentSoft }]}>
                      <Text style={[styles.heroOpenText, { color: palette.accent }]}>Open</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ) : null}
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(420)} style={styles.filterRow}>
          {FILTERS.map((item) => {
            const active = item.value === filter;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setFilter(item.value)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? palette.accent : palette.card,
                    borderColor: active ? palette.accent : palette.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: active ? '#FFFFFF' : palette.text }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.subtext }]}>Loading events…</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(100).duration(420)} style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Ionicons name="calendar-clear-outline" size={34} color={palette.accent} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>No events match this view yet</Text>
            <Text style={[styles.emptySubtitle, { color: palette.subtext }]}>
              Try another filter or create the next university event if you are a campus admin.
            </Text>
          </Animated.View>
        ) : (
          filteredEvents.map((event, index) => (
            <Animated.View key={event.id} entering={FadeInDown.delay(90 + index * 35).duration(420)}>
              <Pressable
                onPress={() => router.push(`/event/${event.id}`)}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                    shadowColor: isDark ? '#020B14' : '#9BB8D8',
                  },
                ]}
              >
                <View style={styles.eventMediaShell}>
                  {!!(event.imageUrl || event.imageBase64) ? (
                    <Image source={{ uri: event.imageUrl || event.imageBase64 || '' }} style={styles.eventMedia} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={['#1976D2', '#4FC3F7']} style={styles.eventMediaFallback}>
                      <Ionicons name="megaphone-outline" size={28} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  <LinearGradient
                    colors={isDark ? ['rgba(7,20,33,0.08)', 'rgba(7,20,33,0.82)'] : ['rgba(8,37,63,0.04)', 'rgba(8,37,63,0.62)']}
                    style={styles.eventMediaShade}
                  />

                  <View style={styles.eventTopBar}>
                    <View style={styles.eventTopTags}>
                      <View style={[styles.inlineTag, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                        <Text style={[styles.inlineTagText, { color: palette.accent }]}>{getEventCategoryLabel(event.category)}</Text>
                      </View>
                      {event.isFeatured ? (
                        <View style={[styles.inlineTag, { backgroundColor: 'rgba(15, 157, 88, 0.92)' }]}>
                          <Text style={[styles.inlineTagText, { color: '#FFFFFF' }]}>Featured</Text>
                        </View>
                      ) : null}
                      {event.viewerTicket ? (
                        <View style={[styles.inlineTag, { backgroundColor: getEventTicketStatusTone(event.viewerTicket).background }]}>
                          <Text style={[styles.inlineTagText, { color: getEventTicketStatusTone(event.viewerTicket).accent }]}>
                            {getEventTicketStatusLabel(event.viewerTicket)}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.eventQuickAction,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.9)' },
                      ]}
                    >
                      <Ionicons name="arrow-forward" size={16} color={isDark ? '#FFFFFF' : palette.accent} />
                    </View>
                  </View>

                  <View style={styles.eventOverlayFooter}>
                    <View style={styles.eventCardDate}>
                      <Text style={styles.eventDay}>{new Date(event.startsAt).getDate()}</Text>
                      <Text style={styles.eventMonth}>{new Date(event.startsAt).toLocaleDateString([], { month: 'short' }).toUpperCase()}</Text>
                    </View>

                    <View style={styles.eventCountdownPill}>
                      <Ionicons name="flash-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.eventCountdownText} numberOfLines={1}>{getEventCountdown(event.startsAt)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.eventCardBody}>
                  <Text style={[styles.eventTitle, { color: palette.text }]} numberOfLines={2}>{event.title}</Text>
                  <Text style={[styles.eventSummary, { color: palette.subtext }]} numberOfLines={2}>
                    {event.summary || event.details || 'Tap to open the full event details.'}
                  </Text>

                  <View style={styles.eventMetaStack}>
                    <View style={styles.eventMetaRow}>
                      <Ionicons name="time-outline" size={15} color={palette.accent} />
                      <Text style={[styles.eventMetaText, { color: palette.subtext }]} numberOfLines={1}>
                        {formatEventDate(event.startsAt)} • {formatEventTimeRange(event.startsAt, event.endsAt)}
                      </Text>
                    </View>

                    {event.location ? (
                      <View style={styles.eventMetaRow}>
                        <Ionicons name="location-outline" size={15} color={palette.accent} />
                        <Text style={[styles.eventMetaText, { color: palette.subtext }]} numberOfLines={1}>{event.location}</Text>
                      </View>
                    ) : null}
                    <View style={styles.eventMetaRow}>
                      <Ionicons name="person-outline" size={15} color={palette.accent} />
                      <Text style={[styles.eventMetaText, { color: palette.subtext }]} numberOfLines={1}>
                        {event.organizerName || event.createdByName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventBottomRow}>
                    <View style={[styles.eventInfoPill, { backgroundColor: palette.accentSoft }]}>
                      <Ionicons name="ticket-outline" size={14} color={palette.accent} />
                      <Text style={[styles.eventInfoText, { color: palette.accent }]} numberOfLines={1}>
                        {getEventAdmissionLabel(event)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.eventInfoPill,
                        { backgroundColor: isDark ? 'rgba(15, 157, 88, 0.18)' : 'rgba(15, 157, 88, 0.1)' },
                      ]}
                    >
                      <Ionicons name="people-outline" size={14} color={palette.accentAlt} />
                      <Text style={[styles.eventInfoText, { color: palette.accentAlt }]} numberOfLines={1}>
                        {getEventSeatLabel(event)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {canCreateEvents ? (
        <TouchableOpacity style={[styles.fab, { backgroundColor: palette.accent }]} onPress={() => router.push('/create-event')}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 120,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  pageBackButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  pageHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  pageHeaderEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pageHeaderTitle: {
    fontSize: 21,
    fontWeight: '900',
  },
  heroShell: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroCard: {
    padding: 16,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroHeadingBlock: {
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  createInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
  },
  createInlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '700',
  },
  heroHighlight: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  heroHighlightMedia: {
    width: 92,
    height: 96,
    borderRadius: 18,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHighlightContent: {
    flex: 1,
    gap: 8,
  },
  heroHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  heroEventTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  heroEventMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroHighlightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  heroFooterLeft: {
    flex: 1,
    gap: 8,
  },
  heroEventSummary: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  heroTicketPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroTicketText: {
    fontSize: 11,
    fontWeight: '800',
  },
  heroOpenPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroOpenText: {
    fontSize: 11,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  eventCard: {
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 9,
  },
  eventMediaShell: {
    height: 168,
    position: 'relative',
  },
  eventMedia: {
    width: '100%',
    height: '100%',
  },
  eventMediaFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMediaShade: {
    ...StyleSheet.absoluteFillObject,
  },
  eventTopBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  eventTopTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  eventQuickAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCardDate: {
    minWidth: 58,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  eventMonth: {
    color: '#DDEEFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  eventOverlayFooter: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  eventCardBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 17,
    gap: 12,
  },
  inlineTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  inlineTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  eventCountdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '68%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(7, 20, 33, 0.62)',
  },
  eventCountdownText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  eventTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  eventSummary: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  eventMetaStack: {
    gap: 8,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventMetaText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  eventBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  eventInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  eventInfoText: {
    fontSize: 12,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#03101D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
});
