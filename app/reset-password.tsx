import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { AuthScaffold, authInputColors, authTypography } from '../components/auth/AuthScaffold';
import { showToast } from '../utils/toast';
import { getPasswordValidationErrors, isValidEmail, normalizeEmail } from '../utils/validation';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const colors = authInputColors(isDark);
  const passwordErrors = useMemo(() => getPasswordValidationErrors(password), [password]);

  useEffect(() => {
    AsyncStorage.getItem('resetEmail')
      .then((saved) => {
        if (saved) {
          setEmail(saved);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !token.trim() || !password) {
      showToast.warning('Enter your email, reset code, and new password.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      showToast.error('Enter a valid email address.', 'Invalid Email');
      return;
    }

    if (token.trim().length !== 6) {
      showToast.error('Use the 6-digit reset code from your email.', 'Invalid Code');
      return;
    }

    if (passwordErrors.length > 0) {
      showToast.error(passwordErrors[0], 'Password Too Weak');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(normalizedEmail, token.trim(), password);
      if (!res.success) {
        showToast.error(res.message || 'Unable to reset password yet.', 'Reset Failed');
        return;
      }

      showToast.success(res.message || 'Password updated successfully.');
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      badgeIcon="key-outline"
      title="Set a new password"
      subtitle="Use the reset code from your email and choose a stronger password."
      helper={(
        <Text style={[authTypography.helperText, { color: colors.muted }]}>
          Passwords must include uppercase, lowercase, a number, and a special character.
        </Text>
      )}
      footer={(
        <Pressable onPress={() => router.replace('/login')} disabled={loading}>
          <Text style={[authTypography.linkText, { color: colors.active }]}>Back to sign in</Text>
        </Pressable>
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
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="6-digit reset code"
          placeholderTextColor={colors.muted}
          value={token}
          onChangeText={(value) => setToken(value.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          editable={!loading}
        />
      </View>

      <View style={[styles.inputGroup, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="New password"
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
        <Text style={[styles.passwordHint, { color: passwordErrors.length ? '#C2410C' : '#0F9D58' }]}>
          {passwordErrors.length ? passwordErrors[0] : 'Strong password ready.'}
        </Text>
      ) : null}

      <Pressable disabled={loading} onPress={handleSubmit}>
        <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.primaryButton}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Reset password</Text>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
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
  passwordHint: {
    marginTop: -2,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '700',
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
});
