import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { AuthScaffold, authInputColors, authTypography } from '../components/auth/AuthScaffold';
import { showToast } from '../utils/toast';
import { isValidEmail, normalizeEmail } from '../utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const colors = authInputColors(isDark);

  const handleLogin = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      showToast.warning('Enter your email and password to continue.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      showToast.error('Use a valid university or personal email address.', 'Invalid Email');
      return;
    }

    setLoading(true);
    try {
      const result = await login(normalizedEmail, password);

      if (!result.success) {
        if (result.message?.includes('verify')) {
          showToast.warning('Your account still needs email verification.');
          router.push({ pathname: '/verify-otp' as any, params: { email: normalizedEmail } });
          return;
        }

        showToast.error(result.message || 'Unable to sign you in right now.', 'Sign-in Failed');
        return;
      }

      showToast.success('Welcome back. Your session is ready.');
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      badgeIcon="log-in-outline"
      title="Welcome back"
      subtitle="Sign in to continue with secure access to your university dashboard."
      helper={(
        <Text style={[authTypography.helperText, { color: colors.muted }]}>
          Your session stays synced with the backend so announcements, posts, and role access remain accurate.
        </Text>
      )}
      footer={(
        <View style={styles.footerRow}>
          <Pressable onPress={() => router.push('/forgot-password')} disabled={loading}>
            <Text style={[authTypography.linkText, { color: colors.active }]}>Forgot password?</Text>
          </Pressable>
          <Text style={[styles.footerText, { color: colors.muted }]}>No account yet?</Text>
          <Pressable onPress={() => router.push('/register')} disabled={loading}>
            <Text style={[authTypography.linkText, { color: colors.active }]}>Create one</Text>
          </Pressable>
        </View>
      )}
    >
      <View style={[styles.inputGroup, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="mail-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Email address"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
      </View>

      <View style={[styles.inputGroup, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
        />
        <Pressable onPress={() => setShowPassword((value) => !value)} disabled={loading} hitSlop={8}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable disabled={loading} onPress={handleLogin} style={styles.buttonWrap}>
        <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.primaryButton}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Sign in</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonWrap: {
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footerRow: {
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
