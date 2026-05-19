import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActionButton,
  Chip,
  EmptyState,
  HeroCard,
  InfoBanner,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { formatPostTimeAgo } from '@/components/posts/postUi';
import { referralsAPI, type ReferralOverview } from '@/services/referralsApi';
import { buildReferralShareMessage, formatReferralCode, formatReferralConversion } from '@/utils/referrals';
import { showToast } from '@/utils/toast';
import { useAppTheme } from '@/utils/theme';

const formatDateLabel = (value: string | null) => {
  if (!value) {
    return 'Pending verification';
  }

  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function InvitesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [overview, setOverview] = useState<ReferralOverview | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await referralsAPI.getOverview();
      setOverview(response);
    } catch (error) {
      setOverview(null);
      showToast.error(referralsAPI.extractErrorMessage(error, 'Unable to load your invite center right now.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOverview();
    }, [loadOverview])
  );

  const handleShare = async () => {
    if (!overview?.share.referralLink || sharing) {
      return;
    }

    try {
      setSharing(true);
      await Share.share({
        title: 'Join ADUSTECH',
        message: overview.share.message || buildReferralShareMessage(
          overview.share.referralLink,
          overview.share.referralCode,
          overview.program
        ),
      });
    } catch {
      showToast.error('Unable to open the share sheet right now.');
    } finally {
      setSharing(false);
    }
  };

  const handleOpenLink = async () => {
    if (!overview?.share.referralLink) {
      return;
    }

    try {
      await Linking.openURL(overview.share.referralLink);
    } catch {
      showToast.error('Unable to open your referral link right now.');
    }
  };

  return (
    <ScreenShell scroll contentContainerStyle={styles.content}>
      <View style={styles.pageHeader}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={18} color={theme.text} />
        </Pressable>

        <View style={styles.pageHeaderCopy}>
          <Text style={[styles.pageHeaderEyebrow, { color: theme.textMuted }]}>Back to channels</Text>
          <Text style={[styles.pageHeaderTitle, { color: theme.text }]}>Invite channel</Text>
        </View>
      </View>

      <HeroCard
        eyebrow="Invites"
        title="Invite and referral center"
        subtitle="Share your personal code, track verified signups, and climb the referral leaderboard with clean, production-ready invite links."
        icon="gift-outline"
        actions={(
          <View style={styles.heroAction}>
            <ActionButton label="Share" icon="share-social-outline" onPress={() => { void handleShare(); }} />
          </View>
        )}
      >
        <View style={styles.heroChips}>
          <Chip label={`${overview?.summary.points || 0} points`} icon="star-outline" tone="warning" />
          <Chip label={`${overview?.summary.completedReferrals || 0} verified`} icon="people-outline" tone="success" />
          <Chip label={overview?.summary.rank ? `Rank #${overview.summary.rank}` : 'Rank pending'} icon="trophy-outline" tone="accent" />
        </View>
      </HeroCard>

      {loading ? (
        <SurfaceCard style={styles.loadingCard}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading your invite program…</Text>
        </SurfaceCard>
      ) : overview ? (
        <>
          {overview.invitedBy ? (
            <InfoBanner
              icon="sparkles-outline"
              tone="success"
              message={`You joined through ${overview.invitedBy.name}'s referral. Your account is now part of their verified invite history.`}
            />
          ) : null}

          <InfoBanner
            icon="shield-checkmark-outline"
            tone="info"
            message={`${overview.program.qualificationRule} Tap and hold the code or link below to copy it anywhere.`}
          />

          <SectionHeading
            title="Share Assets"
            subtitle="Everything you need to invite new students into the app with one professional link and one clean code."
          />

          <SurfaceCard style={styles.shareCard}>
            <View style={styles.shareHeader}>
              <View style={[styles.shareIconWrap, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="qr-code-outline" size={20} color={theme.accent} />
              </View>
              <View style={styles.shareCopy}>
                <Text style={[styles.shareTitle, { color: theme.text }]}>Your referral code</Text>
                <Text style={[styles.shareSubtitle, { color: theme.textMuted }]}>
                  {overview.program.rewardLabel}
                </Text>
              </View>
            </View>

            <View style={[styles.codePill, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
              <Text selectable style={[styles.codeText, { color: theme.text }]}>
                {formatReferralCode(overview.share.referralCode)}
              </Text>
            </View>

            <View style={[styles.linkCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
              <Text style={[styles.linkLabel, { color: theme.textMuted }]}>Referral link</Text>
              <Text selectable style={[styles.linkValue, { color: theme.text }]}>
                {overview.share.referralLink}
              </Text>
            </View>

            <View style={[styles.messageCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
              <Text style={[styles.linkLabel, { color: theme.textMuted }]}>Share message</Text>
              <Text selectable style={[styles.messageValue, { color: theme.text }]}>
                {overview.share.message}
              </Text>
            </View>

            <View style={styles.shareActions}>
              <ActionButton
                label={sharing ? 'Sharing...' : 'Share Invite'}
                icon="share-social-outline"
                onPress={() => { void handleShare(); }}
                disabled={sharing}
                style={styles.actionFlex}
              />
              <ActionButton
                label="Open Link"
                icon="open-outline"
                variant="secondary"
                onPress={() => { void handleOpenLink(); }}
                style={styles.actionFlex}
              />
            </View>
          </SurfaceCard>

          <SectionHeading
            title="Performance"
            subtitle="Your leaderboard position is calculated directly from successful referral points."
            action={(
              <View style={styles.rankAction}>
                <ActionButton
                  label="Leaderboard"
                  icon="trophy-outline"
                  variant="secondary"
                  onPress={() => router.push('/leadersboard' as any)}
                />
              </View>
            )}
          />

          <View style={styles.metricsGrid}>
            <SurfaceCard style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Total points</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{overview.summary.points}</Text>
            </SurfaceCard>
            <SurfaceCard style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>This week</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{overview.summary.weeklyPoints}</Text>
            </SurfaceCard>
            <SurfaceCard style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Total invites</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{overview.summary.totalReferrals}</Text>
            </SurfaceCard>
            <SurfaceCard style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Verified invites</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{overview.summary.completedReferrals}</Text>
            </SurfaceCard>
            <SurfaceCard style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Pending invites</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{overview.summary.pendingReferrals}</Text>
            </SurfaceCard>
            <SurfaceCard style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Conversion rate</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{formatReferralConversion(overview.summary.conversionRate)}</Text>
            </SurfaceCard>
            <SurfaceCard style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Leaderboard rank</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>#{overview.summary.rank}</Text>
            </SurfaceCard>
          </View>

          <SectionHeading
            title="How Rewards Unlock"
            subtitle="The referral system stays fair by awarding points only after a complete verified onboarding flow."
          />

          <View style={styles.programGrid}>
            <SurfaceCard style={styles.programCard}>
              <View style={[styles.programBadge, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.programBadgeText, { color: theme.accent }]}>1</Text>
              </View>
              <Text style={[styles.programTitle, { color: theme.text }]}>Share your code</Text>
              <Text style={[styles.programBody, { color: theme.textMuted }]}>
                Send the verified invite link or the referral code to a new student.
              </Text>
            </SurfaceCard>
            <SurfaceCard style={styles.programCard}>
              <View style={[styles.programBadge, { backgroundColor: theme.successSoft }]}>
                <Text style={[styles.programBadgeText, { color: theme.success }]}>2</Text>
              </View>
              <Text style={[styles.programTitle, { color: theme.text }]}>They create an account</Text>
              <Text style={[styles.programBody, { color: theme.textMuted }]}>
                {overview.program.eligibilityRule}
              </Text>
            </SurfaceCard>
            <SurfaceCard style={styles.programCard}>
              <View style={[styles.programBadge, { backgroundColor: theme.warningSoft }]}>
                <Text style={[styles.programBadgeText, { color: theme.warning }]}>3</Text>
              </View>
              <Text style={[styles.programTitle, { color: theme.text }]}>Points are awarded</Text>
              <Text style={[styles.programBody, { color: theme.textMuted }]}>
                {overview.program.qualificationRule}
              </Text>
            </SurfaceCard>
          </View>

          <SectionHeading
            title="Invite History"
            subtitle="A clean record of who signed up with your code and whether the referral was fully verified."
          />

          {overview.history.length ? (
            <View style={styles.historyList}>
              {overview.history.map((item) => (
                <SurfaceCard key={item.id} style={styles.historyCard}>
                  <View style={styles.historyTopRow}>
                    <View style={styles.historyIdentity}>
                      <Text style={[styles.historyName, { color: theme.text }]}>{item.referredUser.name}</Text>
                      <Text style={[styles.historyMeta, { color: theme.textMuted }]}>
                        {item.referredUser.department || 'Department pending'} • {item.referredUser.email}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: item.status === 'completed' ? theme.successSoft : theme.warningSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: item.status === 'completed' ? theme.success : theme.warning,
                          },
                        ]}
                      >
                        {item.status === 'completed' ? 'Verified' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyBottomRow}>
                    <Text style={[styles.historyPoints, { color: theme.text }]}>
                      +{item.pointsAwarded} points
                    </Text>
                    <Text style={[styles.historyTimestamp, { color: theme.textMuted }]}>
                      {item.completedAt
                        ? `${formatDateLabel(item.completedAt)} • ${formatPostTimeAgo(item.completedAt)} ago`
                        : formatDateLabel(item.completedAt)}
                    </Text>
                  </View>
                </SurfaceCard>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No referrals yet"
              subtitle="Share your invite link to bring new students into ADUSTECH. Verified signups will appear here automatically."
              icon="people-outline"
              action={(
                <View style={styles.emptyAction}>
                  <ActionButton
                    label={sharing ? 'Sharing...' : 'Share Invite'}
                    icon="share-social-outline"
                    onPress={() => { void handleShare(); }}
                    disabled={sharing}
                  />
                </View>
              )}
            />
          )}
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 14,
    paddingBottom: 120,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
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
  heroAction: {
    width: 116,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 28,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  shareCard: {
    gap: 18,
  },
  shareHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  shareIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCopy: {
    flex: 1,
    gap: 4,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  shareSubtitle: {
    fontSize: 13,
    lineHeight: 20,
  },
  codePill: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  linkCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  linkValue: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  shareActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionFlex: {
    flex: 1,
  },
  rankAction: {
    width: 132,
  },
  messageCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  messageValue: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48.2%',
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  programGrid: {
    gap: 12,
  },
  programCard: {
    gap: 10,
  },
  programBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programBadgeText: {
    fontSize: 15,
    fontWeight: '900',
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  programBody: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    gap: 14,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyIdentity: {
    flex: 1,
    gap: 4,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '900',
  },
  historyMeta: {
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
  historyBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  historyPoints: {
    fontSize: 15,
    fontWeight: '900',
  },
  historyTimestamp: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyAction: {
    width: 180,
    marginTop: 10,
  },
});
