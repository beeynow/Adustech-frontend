import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { AuthScaffold, authInputColors, authTypography } from '../components/auth/AuthScaffold';
import { showToast } from '../utils/toast';
import { getPasswordValidationErrors } from '../utils/validation';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const { changePassword } = useAuth();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const colors = authInputColors(isDark);
  const passwordErrors = useMemo(() => getPasswordValidationErrors(newPassword), [newPassword]);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword) {
      showToast.warning('Complete both password fields.');
      return;
    }

    if (currentPassword === newPassword) {
      showToast.error('Choose a new password that is different from the current one.');
      return;
    }

    if (passwordErrors.length > 0) {
      showToast.error(passwordErrors[0], 'Password Too Weak');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (!res.success) {
        showToast.error(res.message || 'Unable to update your password yet.', 'Update Failed');
        return;
      }

      showToast.success(res.message || 'Password changed successfully.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      badgeIcon="shield-checkmark-outline"
      title="Change password"
      subtitle="Keep your account protected with a stronger credential."
      helper={(
        <Text style={[authTypography.helperText, { color: colors.muted }]}>
          Your backend account is updated immediately after a successful password change.
        </Text>
      )}
      footer={(
        <Pressable onPress={() => router.back()} disabled={loading}>
          <Text style={[authTypography.linkText, { color: colors.active }]}>Back</Text>
        </Pressable>
      )}
    >
      <View style={[styles.inputGroup, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Current password"
          placeholderTextColor={colors.muted}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showCurrent}
          editable={!loading}
        />
        <Pressable onPress={() => setShowCurrent((value) => !value)} disabled={loading} hitSlop={8}>
          <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
        </Pressable>
      </View>

      <View style={[styles.inputGroup, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="key-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="New password"
          placeholderTextColor={colors.muted}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNew}
          editable={!loading}
        />
        <Pressable onPress={() => setShowNew((value) => !value)} disabled={loading} hitSlop={8}>
          <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
        </Pressable>
      </View>

      {newPassword.length > 0 ? (
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
              <Text style={styles.buttonText}>Update password</Text>
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
