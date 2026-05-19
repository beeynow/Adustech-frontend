import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActionButton, Chip, HeroCard, LoadingState, ScreenShell, SectionHeading } from '@/components/ui/AppChrome';
import { formatPostCount, formatPostTimeAgo } from '@/components/posts/postUi';
import { useAuth } from '@/context/AuthContext';
import { eventsAPI } from '@/services/eventsApi';
import type { UserProfile } from '@/services/profileApi';
import { profileAPI } from '@/services/profileApi';
import { postsAPI } from '@/services/postsApi';
import { referralsAPI } from '@/services/referralsApi';
import { showToast } from '@/utils/toast';
import { useAppTheme } from '@/utils/theme';

type RoomKey = 'department' | 'level' | 'timetable' | 'events' | 'referrals';

type RoomSummary = {
  available: boolean;
  total: number;
  latestAt: string;
  headline?: string;
};

const EMPTY_SUMMARY: RoomSummary = {
  available: false,
  total: 0,
  latestAt: '',
};

const ROOM_META: Record<RoomKey, {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
}> = {
  department: {
    title: 'Department',
    subtitle: 'Posts for your current department',
    icon: 'business-outline',
    route: '/department-room',
  },
  level: {
    title: 'Class (Level)',
    subtitle: 'Posts for your level and class stream',
    icon: 'layers-outline',
    route: '/level-room',
  },
  timetable: {
    title: 'Timetable',
    subtitle: 'Timetable and schedule post room',
    icon: 'calendar-outline',
    route: '/timetable-room',
  },
  events: {
    title: 'Events',
    subtitle: 'All campus events and category browsing',
    icon: 'megaphone-outline',
    route: '/events',
  },
  referrals: {
    title: 'Invites',
    subtitle: 'Your referral code, invite links, and verified signup points',
    icon: 'gift-outline',
    route: '/invites',
  },
};

const getRoomGradient = (key: RoomKey, isDark: boolean): [string, string] => {
  if (key === 'department') {
    return isDark ? ['rgba(71, 46, 12, 0.96)', 'rgba(152, 101, 17, 0.92)'] : ['#FFF6E6', '#FFDFA9'];
  }

  if (key === 'level') {
    return isDark ? ['rgba(67, 21, 30, 0.96)', 'rgba(146, 53, 76, 0.92)'] : ['#FFF0F4', '#FFC9D4'];
  }

  if (key === 'timetable') {
    return isDark ? ['rgba(12, 45, 79, 0.96)', 'rgba(28, 112, 196, 0.92)'] : ['#EEF7FF', '#CFE6FF'];
  }

  if (key === 'referrals') {
    return isDark ? ['rgba(41, 20, 66, 0.98)', 'rgba(121, 49, 170, 0.92)'] : ['#FFF3E9', '#FFD6AE'];
  }

  return isDark ? ['rgba(8, 58, 45, 0.96)', 'rgba(16, 148, 107, 0.9)'] : ['#EAFBF5', '#BFEEDC'];
};

const getRoomAccent = (key: RoomKey, theme: ReturnType<typeof useAppTheme>) => {
  if (key === 'department') {
    return theme.warning;
  }

  if (key === 'level') {
    return theme.danger;
  }

  if (key === 'timetable') {
    return theme.accent;
  }

  if (key === 'referrals') {
    return '#B45B00';
  }

  return theme.success;
};

const buildRoomSummary = async (
  key: RoomKey,
  profile: UserProfile | null
): Promise<RoomSummary> => {
  try {
    if (key === 'department') {
      if (!profile?.departmentId) {
        return EMPTY_SUMMARY;
      }

      const response = await postsAPI.list({
        departmentId: profile.departmentId,
        limit: 1,
      });

      return {
        available: true,
        total: response.pagination.total,
        latestAt: response.posts[0]?.createdAt || '',
      };
    }

    if (key === 'level') {
      if (!profile?.departmentId || (!profile.levelId && !profile.level)) {
        return EMPTY_SUMMARY;
      }

      const response = await postsAPI.list({
        departmentId: profile.departmentId,
        ...(profile.levelId ? { levelId: profile.levelId } : {}),
        ...(profile.level ? { level: profile.level } : {}),
        limit: 1,
      });

      return {
        available: true,
        total: response.pagination.total,
        latestAt: response.posts[0]?.createdAt || '',
      };
    }

    if (key === 'events') {
      const response = await eventsAPI.list();
      const latestAt = response.events.reduce((latest, event) => {
        const candidate = event.updatedAt || event.createdAt || event.startsAt || '';
        if (!candidate) {
          return latest;
        }

        if (!latest) {
          return candidate;
        }

        return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest;
      }, '');

      return {
        available: true,
        total: response.events.length,
        latestAt,
      };
    }

    if (key === 'referrals') {
      const response = await referralsAPI.getOverview();
      const latestHistory = response.history.find((item) => item.status === 'completed') || response.history[0];
      const latestAt = latestHistory?.completedAt || latestHistory?.createdAt || '';

      return {
        available: true,
        total: response.summary.points,
        latestAt,
        headline: `${response.summary.completedReferrals} verified • ${response.summary.points} points`,
      };
    }

    const response = await postsAPI.list({
      category: 'Timetable',
      limit: 1,
    });

    return {
      available: true,
      total: response.pagination.total,
      latestAt: response.posts[0]?.createdAt || '',
    };
    } catch {
      return {
        ...EMPTY_SUMMARY,
      available: key === 'timetable' || key === 'events' || key === 'referrals',
    };
  }
};

export default function ChannelsPage() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summaries, setSummaries] = useState<Record<RoomKey, RoomSummary>>({
    department: EMPTY_SUMMARY,
    level: EMPTY_SUMMARY,
    timetable: EMPTY_SUMMARY,
    events: EMPTY_SUMMARY,
    referrals: EMPTY_SUMMARY,
  });

  const canCreatePosts = ['power', 'admin', 'd-admin'].includes(user?.role || '');

  const loadRoomHub = useCallback(async () => {
    try {
      setLoading(true);

      const profileResponse = await profileAPI.getProfile();
      const nextProfile = profileResponse.success
        ? ((profileResponse.data?.user || null) as UserProfile | null)
        : null;

      setProfile(nextProfile);

      const roomEntries = await Promise.all(
        (Object.keys(ROOM_META) as RoomKey[]).map(async (key) => ([
          key,
          await buildRoomSummary(key, nextProfile),
        ] as const))
      );

      setSummaries(Object.fromEntries(roomEntries) as Record<RoomKey, RoomSummary>);

      if (!profileResponse.success) {
        showToast.error(profileResponse.message || 'Unable to load your room profile.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRoomHub();
    }, [loadRoomHub])
  );

  const heroChips = useMemo(() => {
    const items = [];

    if (profile?.department) {
      items.push({ label: profile.department, icon: 'business-outline' as const, tone: 'warning' as const });
    }

    if (profile?.level) {
      items.push({ label: `${profile.level} Level`, icon: 'layers-outline' as const, tone: 'danger' as const });
    }

    items.push({ label: `${formatPostCount(
      summaries.department.total + summaries.level.total + summaries.timetable.total + summaries.events.total
    )} updates`, icon: 'document-text-outline' as const, tone: 'accent' as const });

    items.push({ label: `${summaries.referrals.total || 0} referral points`, icon: 'gift-outline' as const, tone: 'warning' as const });

    return items;
  }, [profile?.department, profile?.level, summaries.department.total, summaries.events.total, summaries.level.total, summaries.referrals.total, summaries.timetable.total]);

  const handleOpenRoom = (key: RoomKey) => {
    const room = ROOM_META[key];
    const summary = summaries[key];

    if ((key === 'department' || key === 'level') && !summary.available) {
      showToast.info(`Add your ${key === 'department' ? 'department' : 'department and level'} to your profile first.`);
      return;
    }

    router.push(room.route);
  };

  return (
    <ScreenShell scroll contentContainerStyle={styles.content}>
      <HeroCard
        eyebrow="Rooms"
        title="A focused hub for rooms and live events"
        subtitle="Jump straight into your department, class, timetable updates, events, and invite rewards from one clean hub."
        icon="grid-outline"
        actions={canCreatePosts ? (
          <View style={styles.heroAction}>
            <ActionButton
              label="Create"
              icon="add"
              onPress={() => router.push('/(tabs)/upload')}
            />
          </View>
        ) : undefined}
      >
        <View style={styles.heroChips}>
          {heroChips.map((chip) => (
            <Chip
              key={`${chip.label}-${chip.icon}`}
              label={chip.label}
              icon={chip.icon}
              tone={chip.tone}
            />
          ))}
        </View>
      </HeroCard>

      <SectionHeading
        title="Your Rooms"
        subtitle="Four core campus rooms plus a dedicated invite and referral hub."
      />

      {loading ? (
        <View style={[styles.loadingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LoadingState label="Loading your rooms…" />
        </View>
      ) : (
        <View style={styles.grid}>
          {(Object.keys(ROOM_META) as RoomKey[]).map((key) => {
            const room = ROOM_META[key];
            const summary = summaries[key];
            const accent = getRoomAccent(key, theme);
            const gradient = getRoomGradient(key, theme.isDark);

            return (
              <Pressable
                key={key}
                onPress={() => handleOpenRoom(key)}
                style={({ pressed }) => [
                  styles.roomCardPressable,
                  key === 'referrals' && styles.roomCardPressableWide,
                  pressed && styles.roomCardPressed,
                ]}
              >
                <LinearGradient colors={gradient} style={[styles.roomCard, key === 'referrals' && styles.roomCardWide, { borderColor: theme.borderStrong }]}>
                  <View style={styles.roomCardTop}>
                    <View style={[styles.roomIconWrap, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.78)' }]}>
                      <Ionicons name={room.icon} size={20} color={accent} />
                    </View>
                    <Ionicons
                      name={summary.available ? 'arrow-forward' : 'lock-closed-outline'}
                      size={18}
                      color={theme.isDark ? '#F4FAFF' : '#23415E'}
                    />
                  </View>

                  <Text style={[styles.roomTitle, { color: theme.isDark ? '#F4FAFF' : '#10263C' }]}>
                    {room.title}
                  </Text>
                  <Text style={[styles.roomSubtitle, { color: theme.isDark ? 'rgba(244,250,255,0.78)' : '#4D6883' }]}>
                    {room.subtitle}
                  </Text>

                  <View style={styles.roomMetaBlock}>
                    <Text style={[styles.roomCount, { color: theme.isDark ? '#F4FAFF' : '#10263C' }]}>
                      {summary.available
                        ? key === 'events'
                          ? `${formatPostCount(summary.total)} events`
                          : key === 'referrals'
                            ? summary.headline || `${summary.total} points`
                            : `${formatPostCount(summary.total)} posts`
                        : 'Profile needed'}
                    </Text>
                    <Text style={[styles.roomLatest, { color: theme.isDark ? 'rgba(244,250,255,0.78)' : '#4D6883' }]}>
                      {key === 'referrals'
                        ? summary.latestAt
                          ? `Latest verified ${formatPostTimeAgo(summary.latestAt)} ago`
                          : (summary.available ? 'Share your code to start earning points' : 'Open your referral center')
                        : summary.latestAt
                          ? `Latest ${formatPostTimeAgo(summary.latestAt)} ago`
                          : (summary.available ? 'Ready for new updates' : 'Connect this room from your profile')}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },
  heroAction: {
    width: 118,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  roomCardPressable: {
    width: '48.2%',
  },
  roomCardPressableWide: {
    width: '100%',
  },
  roomCardPressed: {
    opacity: 0.95,
  },
  roomCard: {
    minHeight: 208,
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  roomCardWide: {
    minHeight: 188,
  },
  roomCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 18,
  },
  roomSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  roomMetaBlock: {
    marginTop: 18,
    gap: 4,
  },
  roomCount: {
    fontSize: 14,
    fontWeight: '900',
  },
  roomLatest: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
