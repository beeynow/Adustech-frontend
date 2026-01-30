import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { verifyOTP, resendOTP } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleVerifyOTPWith = useCallback(async (code: string) => {
    if (!code || code.length !== 6) return;
    if (loading || resending) return;
    setLoading(true);
    const result = await verifyOTP(email, code);
    setLoading(false);
    if (result.success) {
      Alert.alert('Success', 'Email verified successfully! You can now log in.');
      router.replace('/login');
    } else {
      Alert.alert('Verification Failed', result.message || 'Invalid or expired OTP');
    }
  }, [email, loading, resending, verifyOTP, router]);

  const handleVerifyOTP = async () => {
    await handleVerifyOTPWith(otp);
  };

  const handleResendOTP = async () => {
    if (loading || resending) return;
    setResending(true);
    const result = await resendOTP(email);
    setResending(false);

    if (result.success) {
      Alert.alert('Success', 'OTP has been resent to your email');
      setOtp('');
    } else {
      Alert.alert('Error', result.message || 'Failed to resend OTP');
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconCircle, isDark ? styles.iconDark : styles.iconLight]}>
          <Text style={styles.iconText}>📧</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
          Enter the 6-digit code sent to
        </Text>
        <Text style={[styles.email, { color: isDark ? '#42A5F5' : '#1976D2' }]}>
          {email}
        </Text>

        {/* OTP Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.otpInput,
              {
                backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF',
                color: isDark ? '#FFFFFF' : '#0A1929',
              },
            ]}
            placeholder="000000"
            placeholderTextColor={isDark ? '#90CAF9' : '#546E7A'}
            value={otp}
            onChangeText={(text) => {
              const next = text.replace(/[^0-9]/g, '').slice(0, 6);
              setOtp(next);
              if (next.length === 6) {
                // Auto submit when code is complete
                handleVerifyOTPWith(next);
              }
            }}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading && !resending}
          />
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDark ? '#42A5F5' : '#1976D2' },
            (loading || resending) && styles.buttonDisabled,
          ]}
          onPress={handleVerifyOTP}
          disabled={loading || resending}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
            Didn&apos;t receive the code?{' '}
          </Text>
          <TouchableOpacity onPress={handleResendOTP} disabled={loading || resending}>
            {resending ? (
              <ActivityIndicator size="small" color={isDark ? '#42A5F5' : '#1976D2'} />
            ) : (
              <Text style={[styles.linkText, { color: isDark ? '#42A5F5' : '#1976D2' }]}>
                Resend
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/login')}
          disabled={loading || resending}
        >
          <Text style={[styles.backText, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
            ← Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconLight: {
    backgroundColor: '#1976D2',
  },
  iconDark: {
    backgroundColor: '#42A5F5',
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  otpInput: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
  },
  backText: {
    fontSize: 16,
  },
});
