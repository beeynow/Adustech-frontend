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
import { formatEventDate, formatEventTimeRange, getEventAdmissionLabel, getEventCategoryLabel, getEventCountdown, getEventSeatLabel } from '../utils/events';

type FilterValue = 'all' | 'featured' | 'free' | 'paid';

const FILTERS: Array<{ label: string; value: FilterValue }> = [
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

            <Text style={[styles.heroTitle, { color: palette.text }]}>Campus events that feel organized before they even begin.</Text>
            <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
              Discover lectures, orientations, sports, and paid ticketed experiences with clear timing, seats, and booking state.
            </Text>

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
                {!!heroEvent.imageUrl ? (
                  <Image source={{ uri: heroEvent.imageUrl }} style={styles.heroImage} contentFit="cover" />
                ) : (
                  <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.heroImageFallback}>
                    <Ionicons name="calendar-outline" size={28} color="#FFFFFF" />
                  </LinearGradient>
                )}
                <View style={styles.heroHighlightContent}>
                  <View style={styles.heroHighlightRow}>
                    <View style={[styles.categoryChip, { backgroundColor: palette.accentSoft }]}>
                      <Text style={[styles.categoryChipText, { color: palette.accent }]}>{getEventCategoryLabel(heroEvent.category)}</Text>
                    </View>
                    <Text style={[styles.countdownText, { color: palette.subtext }]}>{getEventCountdown(heroEvent.startsAt)}</Text>
                  </View>
                  <Text style={[styles.heroEventTitle, { color: palette.text }]} numberOfLines={2}>{heroEvent.title}</Text>
                  <Text style={[styles.heroEventMeta, { color: palette.subtext }]}>
                    {formatEventDate(heroEvent.startsAt)} • {formatEventTimeRange(heroEvent.startsAt, heroEvent.endsAt)}
                  </Text>
                  <Text style={[styles.heroEventSummary, { color: palette.subtext }]} numberOfLines={2}>
                    {heroEvent.summary || heroEvent.details || 'Event details will be shared inside the event page.'}
                  </Text>
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
              <Pressable onPress={() => router.push(`/event/${event.id}`)} style={[styles.eventCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <View style={styles.eventCardHeader}>
                  <View style={styles.eventCardDate}>
                    <Text style={styles.eventDay}>{new Date(event.startsAt).getDate()}</Text>
                    <Text style={styles.eventMonth}>{new Date(event.startsAt).toLocaleDateString([], { month: 'short' }).toUpperCase()}</Text>
                  </View>
                  <View style={styles.eventCardBody}>
                    <View style={styles.eventCardTopMeta}>
                      <View style={[styles.inlineTag, { backgroundColor: palette.accentSoft }]}>
                        <Text style={[styles.inlineTagText, { color: palette.accent }]}>{getEventCategoryLabel(event.category)}</Text>
                      </View>
                      {event.isFeatured ? (
                        <View style={[styles.inlineTag, { backgroundColor: 'rgba(15, 157, 88, 0.12)' }]}>
                          <Text style={[styles.inlineTagText, { color: palette.accentAlt }]}>Featured</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.eventTitle, { color: palette.text }]} numberOfLines={2}>{event.title}</Text>
                    <Text style={[styles.eventSummary, { color: palette.subtext }]} numberOfLines={2}>
                      {event.summary || event.details || 'Event information will be available on the detail page.'}
                    </Text>
                    <View style={styles.eventMetaRow}>
                      <Ionicons name="time-outline" size={15} color={palette.accent} />
                      <Text style={[styles.eventMetaText, { color: palette.subtext }]}>
                        {formatEventDate(event.startsAt)} • {formatEventTimeRange(event.startsAt, event.endsAt)}
                      </Text>
                    </View>
                    {event.location ? (
                      <View style={styles.eventMetaRow}>
                        <Ionicons name="location-outline" size={15} color={palette.accent} />
                        <Text style={[styles.eventMetaText, { color: palette.subtext }]} numberOfLines={1}>{event.location}</Text>
                      </View>
                    ) : null}
                    <View style={styles.eventFootRow}>
                      <Text style={[styles.eventAdmission, { color: palette.text }]}>{getEventAdmissionLabel(event)}</Text>
                      <Text style={[styles.eventSeatText, { color: palette.subtext }]}>{getEventSeatLabel(event)}</Text>
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
    paddingTop: 18,
    paddingBottom: 120,
  },
  heroShell: {
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroCard: {
    padding: 18,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  createInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  createInlineText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    fontWeight: '500',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  heroHighlight: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroImageFallback: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHighlightContent: {
    padding: 16,
    gap: 10,
  },
  heroHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroEventTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  heroEventMeta: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroEventSummary: {
    fontSize: 14,
    lineHeight: 20,
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
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  eventCardHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  eventCardDate: {
    width: 68,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  eventMonth: {
    color: '#DDEEFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  eventCardBody: {
    flex: 1,
    gap: 10,
  },
  eventCardTopMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineTag: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  inlineTagText: {
    fontSize: 12,
    fontWeight: '800',
  },
  eventTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
  },
  eventSummary: {
    fontSize: 14,
    lineHeight: 20,
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
  eventFootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  eventAdmission: {
    fontSize: 15,
    fontWeight: '900',
  },
  eventSeatText: {
    fontSize: 13,
    fontWeight: '700',
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
