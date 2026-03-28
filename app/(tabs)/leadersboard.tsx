import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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

export default function LeadersboardScreen() {
  const theme = useAppTheme();
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

  const podium = filteredLeaders.slice(0, 3);
  const rest = filteredLeaders.slice(3);

  const getRankTone = (rank: number): 'warning' | 'neutral' | 'danger' => {
    if (rank === 1) {
      return 'warning';
    }
    if (rank === 2) {
      return 'neutral';
    }
    return 'danger';
  };

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
        subtitle="Top contributors, active students, and standout community members are showcased in a cleaner monthly view."
        icon="trophy-outline"
        actions={(
          <View style={{ width: 108 }}>
            <ActionButton label="How It Works" icon="information-circle-outline" variant="secondary" />
          </View>
        )}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Chip label={`${leaders.length} ranked`} icon="people-outline" tone="accent" />
          <Chip label="Monthly board" icon="calendar-outline" tone="success" />
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

      <SectionHeading title="Top Podium" subtitle="The highest ranked students in the current view." />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {podium.map((leader, index) => (
          <SurfaceCard key={leader.id} style={{ flex: 1, alignItems: 'center', paddingTop: 22 }}>
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: leader.rank === 1 ? theme.warningSoft : leader.rank === 2 ? theme.surfaceMuted : theme.dangerSoft,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900' }}>
                {leader.name.charAt(0)}
              </Text>
            </View>
            <Chip label={`#${leader.rank}`} icon="ribbon-outline" tone={getRankTone(leader.rank)} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '900', marginTop: 14, textAlign: 'center' }} numberOfLines={2}>
              {leader.name}
            </Text>
            <Text style={{ color: theme.textMuted, marginTop: 6, textAlign: 'center' }} numberOfLines={2}>
              {leader.department}
            </Text>
            <Text style={{ color: theme.accent, marginTop: 10, fontSize: index === 0 ? 22 : 18, fontWeight: '900' }}>
              {leader.points.toLocaleString()}
            </Text>
            <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '700' }}>points</Text>
          </SurfaceCard>
        ))}
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
                <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '800' }}>#{leader.rank}</Text>
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
