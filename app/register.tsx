import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { AuthScaffold, authInputColors, authTypography } from '../components/auth/AuthScaffold';
import { showToast } from '../utils/toast';
import { getPasswordValidationErrors, isValidEmail, normalizeEmail } from '../utils/validation';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const colors = authInputColors(isDark);

  const passwordErrors = useMemo(() => getPasswordValidationErrors(password), [password]);

  const handleRegister = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!name.trim() || !normalizedEmail || !password || !confirmPassword) {
      showToast.warning('Complete every field before creating your account.');
      return;
    }

    if (name.trim().length < 2) {
      showToast.error('Use at least 2 characters for your name.', 'Invalid Name');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      showToast.error('Enter a valid email address.', 'Invalid Email');
      return;
    }

    if (passwordErrors.length > 0) {
      showToast.error(passwordErrors[0], 'Password Too Weak');
      return;
    }

    if (password !== confirmPassword) {
      showToast.error('Your passwords do not match.', 'Mismatch');
      return;
    }

    setLoading(true);
    try {
      const result = await register(name.trim(), normalizedEmail, password);
      if (!result.success) {
        showToast.error(result.message || 'We could not create your account yet.', 'Registration Failed');
        return;
      }

      showToast.success(
        result.mailPreviewUrl
          ? 'Registration complete. OTP sent to local Mailpit for development.'
          : 'Registration complete. Check your email for the verification code.'
      );
      router.replace({
        pathname: '/verify-otp' as any,
        params: {
          email: normalizedEmail,
          ...(result.debugOtp ? { debugOtp: result.debugOtp } : {}),
          ...(result.mailPreviewUrl ? { mailPreviewUrl: result.mailPreviewUrl } : {}),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      badgeIcon="school-outline"
      title="Create your account"
      subtitle="Join the modern ADUSTECH experience with secure verification and role-aware access."
      helper={(
        <Text style={[authTypography.helperText, { color: colors.muted }]}>
          Strong passwords and email verification help keep your notices, channels, and academic profile protected.
        </Text>
      )}
      footer={(
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.muted }]}>Already registered?</Text>
          <Pressable onPress={() => router.push('/login')} disabled={loading}>
            <Text style={[authTypography.linkText, { color: colors.active }]}>Sign in</Text>
          </Pressable>
        </View>
      )}
    >
      <View style={[styles.inputGroup, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="person-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Full name"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
      </View>

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

      {password.length > 0 ? (
        <View style={styles.passwordHintWrap}>
          <Text style={[styles.passwordHint, { color: passwordErrors.length ? '#C2410C' : '#0F9D58' }]}>
            {passwordErrors.length ? passwordErrors[0] : 'Strong password ready.'}
          </Text>
        </View>
      ) : null}

      <View style={[styles.inputGroup, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Confirm password"
          placeholderTextColor={colors.muted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          editable={!loading}
        />
        <Pressable onPress={() => setShowConfirmPassword((value) => !value)} disabled={loading} hitSlop={8}>
          <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable disabled={loading} onPress={handleRegister} style={styles.buttonWrap}>
        <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.primaryButton}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Create account</Text>
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
  passwordHintWrap: {
    marginTop: -2,
    marginBottom: 12,
  },
  passwordHint: {
    fontSize: 12,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
