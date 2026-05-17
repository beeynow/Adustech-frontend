import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { showToast } from '../utils/toast';
import { isValidEmail, normalizeEmail } from '../utils/validation';

export default function CreateAdminScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const palette = {
    page: isDark ? ['#06131F', '#0B2034'] as const : ['#F4FAFF', '#E4F1FF'] as const,
    card: isDark ? 'rgba(8, 28, 45, 0.96)' : 'rgba(255, 255, 255, 0.98)',
    border: isDark ? 'rgba(110, 166, 245, 0.2)' : 'rgba(24, 96, 168, 0.13)',
    text: isDark ? '#F6FAFF' : '#09233B',
    subtext: isDark ? '#A8C6E6' : '#607488',
    accent: '#1976D2',
    accentSoft: isDark ? 'rgba(25,118,210,0.2)' : 'rgba(25,118,210,0.1)',
  };

  const handleSubmit = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      showToast.error('Enter a valid admin email address.', 'Invalid Email');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.createAdmin({ email: normalizedEmail });
      if (response.success) {
        showToast.success(response.data?.message || 'Admin email saved.');
        router.back();
        return;
      }

      showToast.error(response.message || 'Failed to save admin email.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'power') {
    return (
      <LinearGradient colors={palette.page} style={styles.center}>
        <Ionicons name="shield-outline" size={34} color={palette.accent} />
        <Text style={[styles.restrictedTitle, { color: palette.text }]}>Power admin only</Text>
        <Text style={[styles.restrictedText, { color: palette.subtext }]}>
          Only the protected power admin can add emails to the admin allowlist.
        </Text>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <LinearGradient colors={palette.page} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={[styles.iconShell, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name="person-add-outline" size={30} color={palette.accent} />
            </View>

            <Text style={[styles.title, { color: palette.text }]}>Add Admin Email</Text>
            <Text style={[styles.subtitle, { color: palette.subtext }]}>
              Save a trusted email to the admin allowlist. If the user already exists, they become an admin immediately. If not, they become admin automatically when they register with this email.
            </Text>

            <View style={[styles.inputGroup, { backgroundColor: isDark ? '#102A43' : '#F8FBFF', borderColor: palette.border }]}>
              <Ionicons name="mail-outline" size={20} color={palette.subtext} />
              <TextInput
                style={[styles.input, { color: palette.text }]}
                placeholder="newadmin@school.edu"
                placeholderTextColor={palette.subtext}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={[styles.notice, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name="checkmark-done-outline" size={18} color={palette.accent} />
              <Text style={[styles.noticeText, { color: palette.text }]}>
                No password is created here. The user keeps their own registration and verification flow, while the backend safely assigns the admin role from the allowlist.
              </Text>
            </View>

            <Pressable disabled={loading} onPress={handleSubmit} style={styles.buttonWrap}>
              <LinearGradient colors={['#1976D2', '#42A5F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Save admin email</Text>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  restrictedTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  restrictedText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    gap: 16,
    shadowColor: '#06223B',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  iconShell: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
  inputGroup: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  notice: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  buttonWrap: {
    marginTop: 2,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
