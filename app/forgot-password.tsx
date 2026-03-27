import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { AuthScaffold, authInputColors, authTypography } from '../components/auth/AuthScaffold';
import { showToast } from '../utils/toast';
import { isValidEmail, normalizeEmail } from '../utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const colors = authInputColors(isDark);

  const handleSubmit = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      showToast.warning('Enter the email tied to your account.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      showToast.error('Enter a valid email address.', 'Invalid Email');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(normalizedEmail);
      if (!res.success) {
        showToast.error(res.message || 'We could not start the password reset flow.', 'Request Failed');
        return;
      }

      showToast.success(res.message || 'A reset code has been sent if the email exists.');
      router.push('/reset-password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      badgeIcon="mail-open-outline"
      title="Reset access"
      subtitle="We will send a secure code so you can set a new password."
      helper={(
        <Text style={[authTypography.helperText, { color: colors.muted }]}>
          For privacy, the app uses the same response whether the account exists or not.
        </Text>
      )}
      footer={(
        <Pressable onPress={() => router.back()} disabled={loading}>
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

      <Pressable disabled={loading} onPress={handleSubmit}>
        <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.primaryButton}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Send reset code</Text>
              <Ionicons name="send-outline" size={18} color="#FFFFFF" />
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
