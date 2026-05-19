import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { AuthScaffold, authInputColors, authTypography } from '../components/auth/AuthScaffold';
import { showToast } from '../utils/toast';
import { normalizeEmail } from '../utils/validation';

const OTP_EXPIRY_TIME = 600;
const RESEND_COOLDOWN = 60;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams<{ email?: string; debugOtp?: string; mailPreviewUrl?: string }>();
  const [resolvedEmail, setResolvedEmail] = useState(normalizeEmail(params.email || ''));
  const email = resolvedEmail;
  const router = useRouter();
  const { verifyOTP, resendOTP } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const colors = authInputColors(isDark);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState(String(params.debugOtp || '').trim());
  const [mailPreviewUrl, setMailPreviewUrl] = useState(String(params.mailPreviewUrl || '').trim());
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_TIME);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let mounted = true;

    const hydratePendingEmail = async () => {
      const paramEmail = normalizeEmail(params.email || '');
      if (paramEmail) {
        if (mounted) {
          setResolvedEmail(paramEmail);
        }
        await AsyncStorage.setItem('pendingEmail', paramEmail);
        return;
      }

      const storedEmail = normalizeEmail((await AsyncStorage.getItem('pendingEmail')) || '');
      if (mounted) {
        setResolvedEmail(storedEmail);
      }
    };

    void hydratePendingEmail();

    return () => {
      mounted = false;
    };
  }, [params.email]);

  useEffect(() => {
    if (!email) {
      showToast.error('We could not find the email for this verification step.');
      router.replace('/login');
    }
  }, [email, router]);

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => current - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((current) => current - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnimation]);

  const handleVerify = useCallback(async (code: string) => {
    if (loading || resending) {
      return;
    }

    if (timeLeft <= 0) {
      triggerShake();
      showToast.warning('This code has expired. Request a new one.');
      return;
    }

    if (attempts >= 5) {
      triggerShake();
      showToast.error('Too many attempts. Request a new code to continue.');
      return;
    }

    if (code.length !== 6) {
      triggerShake();
      showToast.error('Enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setAttempts((value) => value + 1);
    try {
      const result = await verifyOTP(email, code);
      if (!result.success) {
        triggerShake();
        setOtp('');
        showToast.error(result.message || 'The code could not be verified.', 'Verification Failed');
        return;
      }

      showToast.success(
        result.referral?.applied
          ? `${result.message || 'Email verified successfully.'} ${result.referral.referrerName} earned ${result.referral.pointsAwarded} referral points.`
          : result.message || 'Email verified successfully. Your account is ready.'
      );
      router.replace(result.autoLoggedIn ? '/(tabs)/profile' : '/login');
    } finally {
      setLoading(false);
    }
  }, [attempts, email, loading, resending, router, timeLeft, triggerShake, verifyOTP]);

  const handleResend = async () => {
    if (resendCooldown > 0 || loading || resending) {
      return;
    }

    setResending(true);
    try {
      const result = await resendOTP(email);
      if (!result.success) {
        showToast.error(result.message || 'Unable to resend the verification code.');
        return;
      }

      setDebugOtp(result.debugOtp || '');
      setMailPreviewUrl(result.mailPreviewUrl || mailPreviewUrl);
      setOtp('');
      setAttempts(0);
      setTimeLeft(OTP_EXPIRY_TIME);
      setResendCooldown(RESEND_COOLDOWN);
      await AsyncStorage.setItem('pendingEmail', email);
      showToast.success(
        result.mailPreviewUrl
          ? 'A fresh verification code is waiting in Mailpit.'
          : 'A fresh verification code has been sent.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthScaffold
      badgeIcon="mail-open-outline"
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${email || 'your email address'}.`}
      helper={(
        <View style={styles.helperStack}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons
                name={timeLeft > 60 ? 'time-outline' : 'alert-circle-outline'}
                size={16}
                color={timeLeft > 60 ? colors.muted : '#D93025'}
              />
              <Text style={[styles.infoText, { color: timeLeft > 60 ? colors.muted : '#D93025' }]}>
                {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'Code expired'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoText, { color: colors.muted }]}>Attempts {attempts}/5</Text>
            </View>
          </View>

          {mailPreviewUrl || debugOtp ? (
            <View style={[styles.devHintCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.devHintTitle, { color: colors.textPrimary }]}>Development delivery</Text>
              {mailPreviewUrl ? (
                <Text style={[styles.devHintText, { color: colors.muted }]}>
                  OTP emails are landing in Mailpit: {mailPreviewUrl}
                </Text>
              ) : null}
              {debugOtp ? (
                <Text style={[styles.devHintCode, { color: colors.active }]}>Current OTP: {debugOtp}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      )}
      footer={(
        <View style={styles.footerWrap}>
          <Pressable
            onPress={handleResend}
            disabled={loading || resending || resendCooldown > 0}
          >
            <Text style={[authTypography.linkText, { color: resendCooldown > 0 ? colors.muted : colors.active }]}>
              {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/login')} disabled={loading || resending}>
            <Text style={[authTypography.linkText, { color: colors.active }]}>Back to sign in</Text>
          </Pressable>
        </View>
      )}
    >
      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
        <View style={[styles.otpWrap, { backgroundColor: colors.inputBg, borderColor: timeLeft <= 60 ? '#D93025' : colors.active }]}>
          <TextInput
            style={[styles.otpInput, { color: colors.textPrimary }]}
            placeholder="000000"
            placeholderTextColor={colors.muted}
            value={otp}
            onChangeText={(value) => {
              const next = value.replace(/[^0-9]/g, '').slice(0, 6);
              setOtp(next);
              if (next.length === 6) {
                void handleVerify(next);
              }
            }}
            keyboardType="number-pad"
            autoFocus
            editable={!loading && !resending && timeLeft > 0}
          />
        </View>
      </Animated.View>

      <Pressable disabled={loading || resending} onPress={() => handleVerify(otp)}>
        <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.primaryButton}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Verify email</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  otpWrap: {
    borderRadius: 22,
    borderWidth: 2,
    marginBottom: 16,
  },
  otpInput: {
    minHeight: 76,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 10,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  helperStack: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  devHintCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  devHintTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  devHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  devHintCode: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerWrap: {
    alignItems: 'center',
    gap: 10,
  },
});
