import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#07111F' : '#F4FAFF' }]}>
        <ActivityIndicator size="large" color={isDark ? '#6EB4FF' : '#1976D2'} />
        <Text style={[styles.loadingText, { color: isDark ? '#F8FBFF' : '#0F172A' }]}>Preparing your campus experience...</Text>
      </View>
    );
  }

  const bgGradient: [string, string, string] = isDark
    ? ['#07111F', '#0D2540', '#104870']
    : ['#F8FCFF', '#E6F4FF', '#D2EBFF'];
  const cardBg = isDark ? 'rgba(8, 24, 43, 0.88)' : 'rgba(255,255,255,0.93)';
  const border = isDark ? 'rgba(110, 180, 255, 0.18)' : 'rgba(25, 118, 210, 0.12)';
  const textPrimary = isDark ? '#F8FBFF' : '#0F172A';
  const muted = isDark ? '#A5C2E3' : '#5F7288';

  return (
    <LinearGradient colors={bgGradient} style={styles.flex}>
      <View style={styles.ambientWrap} pointerEvents="none">
        <View style={[styles.orb, styles.orbOne]} />
        <View style={[styles.orb, styles.orbTwo]} />
      </View>

      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(500)} style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Animated.View entering={FadeInUp.delay(90).duration(420)} style={styles.heroBadge}>
            <View style={[styles.logoCircle, { backgroundColor: isDark ? '#3B82F6' : '#1976D2' }]}>
              <Text style={styles.logoText}>AT</Text>
            </View>
            <View style={styles.statusPill}>
              <Ionicons name="sparkles" size={14} color="#0B5CAD" />
              <Text style={styles.statusPillText}>Modern campus updates</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(150).duration(420)}>
            <Text style={[styles.title, { color: textPrimary }]}>ADUSTECH</Text>
            <Text style={[styles.subtitle, { color: muted }]}>University life, notices, channels, and academic updates in one polished space.</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(210).duration(420)} style={styles.featureList}>
            <View style={styles.featureRow}>
              <Ionicons name="notifications-outline" size={18} color={isDark ? '#6EB4FF' : '#1976D2'} />
              <Text style={[styles.featureText, { color: muted }]}>Verified announcements and academic posts</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="mail-open-outline" size={18} color={isDark ? '#6EB4FF' : '#1976D2'} />
              <Text style={[styles.featureText, { color: muted }]}>Secure email verification and password recovery</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="people-outline" size={18} color={isDark ? '#6EB4FF' : '#1976D2'} />
              <Text style={[styles.featureText, { color: muted }]}>Smooth admin, department, and student flows</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(260).duration(420)} style={styles.actions}>
            <Pressable style={styles.buttonWrap} onPress={() => router.push('/login')}>
              <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.primaryButton}>
                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryText}>Sign in</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => router.push('/register')}
              style={[styles.secondaryButton, { borderColor: isDark ? '#6EB4FF' : '#1976D2' }]}
            >
              <Ionicons name="person-add-outline" size={18} color={isDark ? '#6EB4FF' : '#1976D2'} />
              <Text style={[styles.secondaryText, { color: isDark ? '#6EB4FF' : '#1976D2' }]}>Create account</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  ambientWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
  },
  orbOne: {
    width: 240,
    height: 240,
    top: 72,
    right: -80,
  },
  orbTwo: {
    width: 190,
    height: 190,
    bottom: 80,
    left: -50,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 26,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 26,
    elevation: 10,
  },
  heroBadge: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillText: {
    color: '#0B5CAD',
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  featureList: {
    marginTop: 24,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  actions: {
    marginTop: 30,
    gap: 12,
  },
  buttonWrap: {
    width: '100%',
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
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
