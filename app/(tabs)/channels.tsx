import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActionButton, Chip, HeroCard, LoadingState, ScreenShell, SectionHeading } from '@/components/ui/AppChrome';
import { formatPostCount, formatPostTimeAgo } from '@/components/posts/postUi';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile } from '@/services/profileApi';
import { profileAPI } from '@/services/profileApi';
import { postsAPI } from '@/services/postsApi';
import { showToast } from '@/utils/toast';
import { useAppTheme } from '@/utils/theme';

type RoomKey = 'department' | 'level' | 'timetable' | 'events';

type RoomSummary = {
  available: boolean;
  total: number;
  latestAt: string;
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
  route: string;
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
    subtitle: 'Event announcements and activity posts',
    icon: 'megaphone-outline',
    route: '/events-room',
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

    const response = await postsAPI.list({
      category: key === 'timetable' ? 'Timetable' : 'Event',
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
      available: key === 'timetable' || key === 'events',
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
    )} posts`, icon: 'document-text-outline' as const, tone: 'accent' as const });

    return items;
  }, [profile?.department, profile?.level, summaries.department.total, summaries.events.total, summaries.level.total, summaries.timetable.total]);

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
        title="A focused hub for academic post rooms"
        subtitle="Jump straight into the post spaces that matter most to you right now: your department, your class, timetable updates, and events."
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
        subtitle="Four dedicated post rooms arranged in a clean 2 by 2 grid."
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
                  pressed && styles.roomCardPressed,
                ]}
              >
                <LinearGradient colors={gradient} style={[styles.roomCard, { borderColor: theme.borderStrong }]}>
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
                      {summary.available ? `${formatPostCount(summary.total)} posts` : 'Profile needed'}
                    </Text>
                    <Text style={[styles.roomLatest, { color: theme.isDark ? 'rgba(244,250,255,0.78)' : '#4D6883' }]}>
                      {summary.latestAt ? `Latest ${formatPostTimeAgo(summary.latestAt)} ago` : (summary.available ? 'Ready for new updates' : 'Connect this room from your profile')}
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
