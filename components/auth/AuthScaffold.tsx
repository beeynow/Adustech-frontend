import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextStyle, useColorScheme, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

interface AuthScaffoldProps {
  badgeIcon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  helper?: React.ReactNode;
}

export function AuthScaffold({
  badgeIcon,
  title,
  subtitle,
  children,
  footer,
  helper,
}: AuthScaffoldProps) {
  const isDark = useColorScheme() === 'dark';

  const bgGradient = isDark
    ? ['#07111F', '#0C2540', '#0E3A5D']
    : ['#F7FBFF', '#E9F5FF', '#D5EBFF'];

  const cardBg = isDark ? 'rgba(8, 24, 43, 0.88)' : 'rgba(255, 255, 255, 0.92)';
  const border = isDark ? 'rgba(110, 180, 255, 0.18)' : 'rgba(25, 118, 210, 0.12)';
  const textPrimary = isDark ? '#F8FBFF' : '#0F172A';
  const textMuted = isDark ? '#A5C2E3' : '#5F7288';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <LinearGradient colors={bgGradient} style={styles.flex}>
        <View style={styles.ambientWrap} pointerEvents="none">
          <View style={[styles.ambientOrb, styles.ambientOrbOne]} />
          <View style={[styles.ambientOrb, styles.ambientOrbTwo]} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
          >
            <Animated.View entering={FadeInUp.delay(60).duration(420)} style={styles.header}>
              <View style={[styles.badge, { backgroundColor: isDark ? '#3B82F6' : '#1976D2' }]}>
                <Ionicons name={badgeIcon} size={28} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: textPrimary }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: textMuted }]}>{subtitle}</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(120).duration(420)}>
              {children}
            </Animated.View>

            {helper ? (
              <Animated.View entering={FadeInUp.delay(180).duration(420)} style={styles.helperWrap}>
                {helper}
              </Animated.View>
            ) : null}

            {footer ? (
              <Animated.View entering={FadeInUp.delay(220).duration(420)} style={styles.footer}>
                {footer}
              </Animated.View>
            ) : null}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

export const authInputColors = (isDark: boolean) => ({
  textPrimary: isDark ? '#F8FBFF' : '#0F172A',
  muted: isDark ? '#A5C2E3' : '#6B7F93',
  inputBg: isDark ? '#10243D' : '#F7FAFC',
  border: isDark ? 'rgba(110, 180, 255, 0.18)' : 'rgba(15, 23, 42, 0.08)',
  active: isDark ? '#6EB4FF' : '#1976D2',
});

export const authTypography = StyleSheet.create({
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '500',
  } satisfies TextStyle,
  linkText: {
    fontWeight: '800',
    fontSize: 14,
  } satisfies TextStyle,
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  ambientWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
  },
  ambientOrbOne: {
    width: 220,
    height: 220,
    top: 60,
    right: -70,
  },
  ambientOrbTwo: {
    width: 180,
    height: 180,
    bottom: 90,
    left: -60,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  badge: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  helperWrap: {
    marginTop: 14,
  },
  footer: {
    marginTop: 18,
    alignItems: 'center',
  },
});
