import React, { useCallback, useMemo, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Chip,
  EmptyState,
  HeroCard,
  LoadingState,
  ScreenShell,
  SectionHeading,
  SegmentedControl,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { referralsAPI, type ReferralLeaderboardEntry, type ReferralLeaderboardResponse } from '@/services/referralsApi';
import { showToast } from '@/utils/toast';
import { useAppTheme } from '@/utils/theme';

type LeaderboardScope = 'all' | 'department' | 'weekly';

type PodiumVisuals = {
  colors: [string, string];
  badgeBg: string;
  accent: string;
  pedestalHeight: number;
  icon: keyof typeof Ionicons.glyphMap;
};

const getPodiumVisuals = (rank: number): PodiumVisuals => {
  if (rank === 1) {
    return {
      colors: ['#FFF6DB', '#FFD97A'],
      badgeBg: 'rgba(255,255,255,0.82)',
      accent: '#B7791F',
      pedestalHeight: 116,
      icon: 'trophy',
    };
  }

  if (rank === 2) {
    return {
      colors: ['#F3F7FD', '#D9E4F2'],
      badgeBg: 'rgba(255,255,255,0.8)',
      accent: '#5D6D7E',
      pedestalHeight: 86,
      icon: 'medal-outline',
    };
  }

  return {
    colors: ['#FFF1E4', '#F8C89C'],
    badgeBg: 'rgba(255,255,255,0.8)',
    accent: '#A45D24',
    pedestalHeight: 74,
    icon: 'ribbon-outline',
  };
};

export default function LeadersboardScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<LeaderboardScope>('all');
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<ReferralLeaderboardResponse | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const nextResponse = await referralsAPI.getLeaderboard(activeTab);
      setResponse(nextResponse);
    } catch (error) {
      setResponse(null);
      showToast.error(referralsAPI.extractErrorMessage(error, 'Unable to load the leaderboard right now.'));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      void loadLeaderboard();
    }, [loadLeaderboard])
  );

  const leaders = response?.leaders || [];
  const podiumLeaders = leaders.slice(0, 3);
  const podium = [podiumLeaders[1], podiumLeaders[0], podiumLeaders[2]].filter(Boolean) as ReferralLeaderboardEntry[];
  const rest = leaders.slice(3);
  const cardWidth = Math.max(92, Math.min(134, (width - 60) / 3));

  const boardLabel = useMemo(() => {
    if (activeTab === 'weekly') {
      return 'Weekly movers';
    }

    if (activeTab === 'department') {
      return 'Department board';
    }

    return 'All-time board';
  }, [activeTab]);

  if (loading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading leaderboard…" />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell scroll contentContainerStyle={{ paddingBottom: 120 }}>
      <HeroCard
        eyebrow="Leaderboard"
        title="Referral Ranking"
        subtitle={response?.program.qualificationRule || 'Every successful verified referral awards points, and those points drive the live leaderboard across the app.'}
        icon="trophy-outline"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
          <Chip label={`${leaders.length} ranked`} icon="people-outline" tone="accent" />
          <Chip label={boardLabel} icon="stats-chart-outline" tone="success" />
          <Chip label={response?.program.rewardLabel || '10 points per referral'} icon="star-outline" tone="warning" />
          {response?.currentUserRank ? (
            <Chip label={`You are #${response.currentUserRank}`} icon="person-outline" tone="danger" />
          ) : null}
        </View>
      </HeroCard>

      <SegmentedControl
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { label: 'All Time', value: 'all' },
          { label: 'Department', value: 'department' },
          { label: 'This Week', value: 'weekly' },
        ]}
      />

      {!leaders.length ? (
        <EmptyState
          title="No ranked users yet"
          subtitle={response?.scopeMessage || 'The leaderboard will fill automatically as verified referrals start earning points.'}
          icon="trophy-outline"
        />
      ) : (
        <>
          <SectionHeading title="Top Podium" subtitle="The strongest verified referral performers right now." />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            {podium.map((leader) => {
              const visuals = getPodiumVisuals(leader.rank);
              const isChampion = leader.rank === 1;

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
                          #{leader.rank}
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
                        {leader.department || 'ADUSTECH'}
                      </Text>

                      <View style={{ marginTop: 14, alignItems: 'center' }}>
                        <Text style={{ color: '#10263C', fontSize: isChampion ? 24 : 20, fontWeight: '900' }}>
                          {leader.points.toLocaleString()}
                        </Text>
                        <Text style={{ color: '#6E7F91', fontSize: 11, fontWeight: '800' }}>points</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  <View
                    style={{
                      marginTop: 12,
                      width: '100%',
                      height: visuals.pedestalHeight,
                      borderTopLeftRadius: 22,
                      borderTopRightRadius: 22,
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: theme.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 10,
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '900' }}>
                      {leader.completedReferrals} verified
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
                      {activeTab === 'weekly'
                        ? `${leader.weeklyPoints} pts this week`
                        : `${leader.weeklyPoints} weekly points`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <SectionHeading
            title="Full Ranking"
            subtitle={response?.scopeMessage || 'Referral points and verified invite totals update the board automatically.'}
          />

          <View style={{ gap: 12 }}>
            {rest.map((leader) => (
              <SurfaceCard key={leader.id} style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.surfaceMuted,
                    }}
                  >
                    <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>
                      {leader.rank}
                    </Text>
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>
                      {leader.name}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
                      {leader.department || 'ADUSTECH'} • {leader.completedReferrals} verified invites
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900' }}>
                      {leader.points.toLocaleString()}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>
                      {activeTab === 'weekly'
                        ? `${leader.weeklyPoints} this week`
                        : `${leader.weeklyPoints} weekly`}
                    </Text>
                  </View>
                </View>
              </SurfaceCard>
            ))}
          </View>
        </>
      )}
    </ScreenShell>
  );
}
