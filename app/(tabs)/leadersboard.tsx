import React, { useEffect, useMemo, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActionButton,
  Chip,
  HeroCard,
  LoadingState,
  ScreenShell,
  SectionHeading,
  SegmentedControl,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useAppTheme } from '@/utils/theme';

interface LeaderboardUser {
  id: number;
  name: string;
  points: number;
  department?: string;
  rank: number;
  change?: number;
}

type RankedLeader = LeaderboardUser & {
  displayRank: number;
};

type PodiumVisuals = {
  colors: [string, string];
  badgeBg: string;
  accent: string;
  pedestalHeight: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
};

const MOCK_LEADERS: LeaderboardUser[] = [
  { id: 1, name: 'Ahmed Ibrahim', points: 2850, rank: 1, department: 'Computer Science', change: 0 },
  { id: 2, name: 'Fatima Yusuf', points: 2720, rank: 2, department: 'Engineering', change: 1 },
  { id: 3, name: 'Usman Abdullahi', points: 2680, rank: 3, department: 'Business Admin', change: -1 },
  { id: 4, name: 'Aisha Mohammed', points: 2450, rank: 4, department: 'Computer Science', change: 2 },
  { id: 5, name: 'Ibrahim Sani', points: 2380, rank: 5, department: 'Engineering', change: 0 },
  { id: 6, name: 'Maryam Hassan', points: 2210, rank: 6, department: 'Sciences', change: -1 },
  { id: 7, name: 'Yusuf Bello', points: 2150, rank: 7, department: 'Computer Science', change: 3 },
  { id: 8, name: 'Hauwa Aliyu', points: 2090, rank: 8, department: 'Business Admin', change: -2 },
  { id: 9, name: 'Suleiman Garba', points: 2020, rank: 9, department: 'Engineering', change: 1 },
  { id: 10, name: 'Zainab Ahmad', points: 1980, rank: 10, department: 'Sciences', change: -1 },
];

const getPodiumVisuals = (rank: number): PodiumVisuals => {
  if (rank === 1) {
    return {
      colors: ['#FFF6DB', '#FFD97A'],
      badgeBg: 'rgba(255,255,255,0.8)',
      accent: '#B7791F',
      pedestalHeight: 116,
      icon: 'trophy',
      title: 'Champion',
    };
  }

  if (rank === 2) {
    return {
      colors: ['#F3F7FD', '#D9E4F2'],
      badgeBg: 'rgba(255,255,255,0.78)',
      accent: '#5D6D7E',
      pedestalHeight: 86,
      icon: 'medal-outline',
      title: 'Runner-up',
    };
  }

  return {
    colors: ['#FFF1E4', '#F8C89C'],
    badgeBg: 'rgba(255,255,255,0.78)',
    accent: '#A45D24',
    pedestalHeight: 74,
    icon: 'ribbon-outline',
    title: 'Third Place',
  };
};

export default function LeadersboardScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'dept' | 'weekly'>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaders(MOCK_LEADERS);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const filteredLeaders = useMemo(() => {
    if (activeTab === 'weekly') {
      return [...leaders].sort((a, b) => (b.change || 0) - (a.change || 0));
    }

    if (activeTab === 'dept') {
      return leaders.filter((leader) => leader.department === 'Computer Science');
    }

    return leaders;
  }, [activeTab, leaders]);

  const rankedLeaders = useMemo<RankedLeader[]>(() => (
    filteredLeaders.map((leader, index) => ({
      ...leader,
      displayRank: index + 1,
    }))
  ), [filteredLeaders]);

  const podiumLeaders = rankedLeaders.slice(0, 3);
  const podium = [podiumLeaders[1], podiumLeaders[0], podiumLeaders[2]].filter(Boolean) as RankedLeader[];
  const rest = rankedLeaders.slice(3);
  const cardWidth = Math.max(92, Math.min(134, (width - 60) / 3));

  if (loading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading leaderboard…" />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Leaderboard"
        title="Ranking"
        subtitle="Top contributors, standout students, and fast climbers are showcased in a stronger, more editorial monthly board."
        icon="trophy-outline"
        actions={(
          <View style={{ width: 108 }}>
            <ActionButton label="How It Works" icon="information-circle-outline" variant="secondary" />
          </View>
        )}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Chip label={`${leaders.length} ranked`} icon="people-outline" tone="accent" />
          <Chip label={activeTab === 'weekly' ? 'Weekly movers' : activeTab === 'dept' ? 'Department board' : 'Monthly board'} icon="stats-chart-outline" tone="success" />
          <Chip label="Merit based" icon="star-outline" tone="warning" />
        </View>
      </HeroCard>

      <SegmentedControl
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { label: 'All Time', value: 'all' },
          { label: 'Department', value: 'dept' },
          { label: 'This Week', value: 'weekly' },
        ]}
      />

      <SectionHeading title="Top Podium" subtitle="A clearer 1 to 3 finish with stronger visual hierarchy." />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {podium.map((leader) => {
          const visuals = getPodiumVisuals(leader.displayRank);
          const isChampion = leader.displayRank === 1;

          return (
            <View
              key={leader.id}
              style={{
                width: cardWidth,
                alignItems: 'center',
              }}
            >
              <LinearGradient
                colors={visuals.colors}
                style={{
                  width: '100%',
                  borderRadius: 26,
                  paddingHorizontal: 12,
                  paddingTop: isChampion ? 18 : 14,
                  paddingBottom: 14,
                  borderWidth: 1,
                  borderColor: isChampion ? 'rgba(183,121,31,0.22)' : theme.border,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 14 },
                  shadowOpacity: isChampion ? 0.16 : 0.1,
                  shadowRadius: 24,
                  elevation: isChampion ? 10 : 6,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: isChampion ? 66 : 58,
                      height: isChampion ? 66 : 58,
                      borderRadius: isChampion ? 24 : 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: visuals.badgeBg,
                    }}
                  >
                    <Text style={{ color: visuals.accent, fontSize: isChampion ? 28 : 24, fontWeight: '900' }}>
                      {leader.name.charAt(0)}
                    </Text>
                  </View>

                  <View
                    style={{
                      marginTop: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: visuals.badgeBg,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name={visuals.icon} size={14} color={visuals.accent} />
                    <Text style={{ color: visuals.accent, fontSize: 11, fontWeight: '900' }}>
                      #{leader.displayRank}
                    </Text>
                  </View>

                  <Text
                    style={{
                      marginTop: 12,
                      color: '#10263C',
                      fontSize: isChampion ? 16 : 14,
                      fontWeight: '900',
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                  >
                    {leader.name}
                  </Text>

                  <Text
                    style={{
                      marginTop: 4,
                      color: '#5A7188',
                      fontSize: 12,
                      fontWeight: '700',
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                  >
                    {leader.department}
                  </Text>

                  <Text
                    style={{
                      marginTop: 12,
                      color: visuals.accent,
                      fontSize: isChampion ? 24 : 20,
                      fontWeight: '900',
                    }}
                  >
                    {leader.points.toLocaleString()}
                  </Text>
                  <Text style={{ color: '#6E7F91', fontSize: 11, fontWeight: '800' }}>points</Text>

                  <View
                    style={{
                      marginTop: 10,
                      minHeight: 26,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {(leader.change || 0) !== 0 ? (
                      <>
                        <Ionicons
                          name={(leader.change || 0) > 0 ? 'trending-up' : 'trending-down'}
                          size={14}
                          color={(leader.change || 0) > 0 ? theme.success : theme.danger}
                        />
                        <Text style={{ color: (leader.change || 0) > 0 ? theme.success : theme.danger, fontSize: 12, fontWeight: '800' }}>
                          {Math.abs(leader.change || 0)} this view
                        </Text>
                      </>
                    ) : (
                      <Text style={{ color: '#6E7F91', fontSize: 12, fontWeight: '800' }}>{visuals.title}</Text>
                    )}
                  </View>
                </View>
              </LinearGradient>

              <View
                style={{
                  width: '88%',
                  height: visuals.pedestalHeight,
                  marginTop: 10,
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: theme.text, fontSize: isChampion ? 24 : 20, fontWeight: '900' }}>
                  {leader.displayRank}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <SectionHeading title="Other Top Performers" subtitle="Students still climbing hard and shaping the community." />
      <View style={{ gap: 12 }}>
        {rest.map((leader) => (
          <SurfaceCard key={leader.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.accentSoft,
                }}
              >
                <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '900' }}>
                  {leader.name.charAt(0)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>{leader.name}</Text>
                <Text style={{ color: theme.textMuted, marginTop: 4 }}>{leader.department}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '800' }}>#{leader.displayRank}</Text>
                <Text style={{ color: theme.accent, marginTop: 4, fontSize: 17, fontWeight: '900' }}>
                  {leader.points.toLocaleString()}
                </Text>
                {(leader.change || 0) !== 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons
                      name={(leader.change || 0) > 0 ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={(leader.change || 0) > 0 ? theme.success : theme.danger}
                    />
                    <Text style={{ color: (leader.change || 0) > 0 ? theme.success : theme.danger, fontWeight: '800' }}>
                      {Math.abs(leader.change || 0)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </SurfaceCard>
        ))}
      </View>

      <SurfaceCard>
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>How to earn points</Text>
        <Text style={{ color: theme.textMuted, marginTop: 8, lineHeight: 22 }}>
          Post quality content, contribute meaningfully in channels, attend university events, and support other students to improve your standing on the board.
        </Text>
      </SurfaceCard>
    </ScreenShell>
  );
}
