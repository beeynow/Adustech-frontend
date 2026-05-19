import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { AuthScaffold, authInputColors } from '../../components/auth/AuthScaffold';
import { referralsAPI, type ReferralPreview } from '../../services/referralsApi';
import { clearPendingReferralCode, formatReferralCode, normalizeReferralCode, storePendingReferralCode } from '../../utils/referrals';
import { showToast } from '../../utils/toast';

export default function ReferralLinkScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const colors = authInputColors(isDark);

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ReferralPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const code = normalizeReferralCode(Array.isArray(params.code) ? params.code[0] || '' : params.code || '');

  useEffect(() => {
    let mounted = true;

    const loadPreview = async () => {
      if (!code) {
        if (mounted) {
          setErrorMessage('This referral link is incomplete.');
          setLoading(false);
        }
        return;
      }

      try {
        const response = await referralsAPI.getPreview(code);

        if (!mounted) {
          return;
        }

        if (!isAuthenticated) {
          await storePendingReferralCode(code);
        }

        setPreview(response);
      } catch (error) {
        if (!mounted) {
          return;
        }

        await clearPendingReferralCode();
        setPreview(null);
        setErrorMessage(referralsAPI.extractErrorMessage(error, 'This referral link could not be opened right now.'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      mounted = false;
    };
  }, [code, isAuthenticated]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      showToast.info('You are already signed in. Your referral center is ready to share from the invites page.');
      router.replace('/invites');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <AuthScaffold
      badgeIcon="gift-outline"
      title={loading ? 'Opening invite' : preview ? 'You were invited' : 'Invite unavailable'}
      subtitle={loading
        ? 'Checking this referral link and preparing the signup flow.'
        : preview
          ? `${preview.referrer.name} invited you to join ADUSTECH with a verified referral link.`
          : errorMessage || 'This invite could not be resolved.'}
      helper={preview ? (
        <View style={styles.helperStack}>
          <View style={[styles.previewCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[styles.previewLabel, { color: colors.muted }]}>Referral code</Text>
            <Text style={[styles.previewCode, { color: colors.textPrimary }]}>{formatReferralCode(preview.code)}</Text>
            <Text style={[styles.previewCopy, { color: colors.muted }]}>
              {preview.referrer.department || 'ADUSTECH community'} • {preview.program.rewardLabel}
            </Text>
          </View>
          <View style={[styles.programCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[styles.programTitle, { color: colors.textPrimary }]}>How this invite works</Text>
            <Text style={[styles.programText, { color: colors.muted }]}>
              {preview.program.qualificationRule}
            </Text>
            <Text style={[styles.programText, { color: colors.muted }]}>
              {preview.program.eligibilityRule}
            </Text>
          </View>
        </View>
      ) : undefined}
      footer={(
        <View style={styles.footerStack}>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={[styles.footerLink, { color: colors.active }]}>Already have an account? Sign in</Text>
          </Pressable>
        </View>
      )}
    >
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.active} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Verifying referral link…</Text>
        </View>
      ) : preview ? (
        <View style={styles.actionStack}>
          <Pressable
            onPress={() => router.replace({
              pathname: '/register' as any,
              params: {
                referralCode: preview.code,
                referrerName: preview.referrer.name,
              },
            })}
            style={styles.primaryWrap}
          >
            <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Continue to sign up</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/login')}
            style={[styles.secondaryButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>I already have an account</Text>
          </Pressable>

          <View style={[styles.codeOnlyCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[styles.previewLabel, { color: colors.muted }]}>Code only</Text>
            <Text selectable style={[styles.codeOnlyText, { color: colors.textPrimary }]}>
              {formatReferralCode(preview.code)}
            </Text>
            <Text style={[styles.codeOnlyHint, { color: colors.muted }]}>
              Use this during registration if you leave the invite link and return later.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.actionStack}>
          <Pressable onPress={() => router.replace('/register')} style={styles.primaryWrap}>
            <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Create account</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/login')}
            style={[styles.secondaryButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>Go to sign in</Text>
          </Pressable>
        </View>
      )}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  helperStack: {
    gap: 12,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  previewCode: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  previewCopy: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  programCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  programText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  centerState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionStack: {
    gap: 12,
  },
  primaryWrap: {
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  codeOnlyCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  codeOnlyText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  codeOnlyHint: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  footerStack: {
    gap: 12,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});
