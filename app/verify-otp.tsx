import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useColorScheme,
  Pressable,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { showToast } from '../utils/toast';

const OTP_EXPIRY_TIME = 600; // 10 minutes in seconds
const RESEND_COOLDOWN = 60; // 60 seconds cooldown

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_TIME);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const { verifyOTP, resendOTP } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      showToast.error('No email provided. Please try again.', 'Error');
      router.replace('/login');
    }
  }, [email, router]);

  // OTP Expiry countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          showToast.error('OTP expired. Please request a new one.', 'Expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Shake animation for errors
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleVerifyOTPWith = useCallback(async (code: string) => {
    if (!code || code.length !== 6) {
      triggerShake();
      showToast.error('Please enter a complete 6-digit code', 'Invalid Input');
      return;
    }
    
    if (loading || resending) return;
    
    // Check if OTP expired
    if (timeLeft <= 0) {
      triggerShake();
      showToast.error('OTP has expired. Please request a new one.', 'Expired');
      return;
    }

    // Rate limiting - max 5 attempts
    if (attempts >= 5) {
      triggerShake();
      showToast.error('Too many attempts. Please request a new OTP.', 'Rate Limited');
      return;
    }

    setLoading(true);
    setAttempts((prev) => prev + 1);
    
    try {
      const result = await verifyOTP(email, code);
      setLoading(false);
      
      if (result.success) {
        showToast.success('Email verified successfully! You can now log in. ✅', 'Success');
        // Small delay for user to see success message
        setTimeout(() => {
          router.replace('/login' as any);
        }, 500);
      } else {
        triggerShake();
        setOtp(''); // Clear OTP on failure
        showToast.error(result.message || 'Invalid or expired OTP', 'Verification Failed');
      }
    } catch (error) {
      setLoading(false);
      triggerShake();
      setOtp('');
      showToast.error('Network error. Please check your connection.', 'Error');
    }
  }, [email, loading, resending, verifyOTP, router, timeLeft, attempts]);

  const handleVerifyOTP = async () => {
    await handleVerifyOTPWith(otp);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      showToast.error(`Please wait ${resendCooldown} seconds before resending`, 'Too Soon');
      return;
    }

    if (loading || resending) return;
    
    setResending(true);
    
    try {
      const result = await resendOTP(email);
      setResending(false);
      
      if (result.success) {
        // Reset timers and attempts
        setTimeLeft(OTP_EXPIRY_TIME);
        setResendCooldown(RESEND_COOLDOWN);
        setAttempts(0);
        setOtp(''); // Clear current OTP input
        showToast.success('New OTP sent! Check your email. 📧', 'Success');
      } else {
        showToast.error(result.message || 'Failed to resend OTP', 'Error');
      }
    } catch (error) {
      setResending(false);
      showToast.error('Network error. Please check your connection.', 'Error');
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

        {/* Timer and Attempts Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons 
              name={timeLeft > 60 ? "time-outline" : "alert-circle-outline"} 
              size={16} 
              color={timeLeft > 60 ? (isDark ? '#90CAF9' : '#546E7A') : '#FF6B6B'} 
            />
            <Text style={[
              styles.infoText, 
              { color: timeLeft > 60 ? (isDark ? '#90CAF9' : '#546E7A') : '#FF6B6B' }
            ]}>
              {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'Expired'}
            </Text>
          </View>
          {attempts > 0 && (
            <View style={styles.infoItem}>
              <Text style={[styles.infoText, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
                Attempts: {attempts}/5
              </Text>
            </View>
          )}
        </View>

        {/* OTP Input with Animation */}
        <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnimation }] }]}>
          <TextInput
            style={[
              styles.otpInput,
              {
                backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF',
                color: isDark ? '#FFFFFF' : '#0A1929',
                borderColor: timeLeft <= 60 ? '#FF6B6B' : (isDark ? '#42A5F5' : '#1976D2'),
                borderWidth: 2,
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
            editable={!loading && !resending && timeLeft > 0}
            autoFocus
          />
        </Animated.View>

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
          <TouchableOpacity 
            onPress={handleResendOTP} 
            disabled={loading || resending || resendCooldown > 0}
            style={resendCooldown > 0 && styles.disabledLink}
          >
            {resending ? (
              <ActivityIndicator size="small" color={isDark ? '#42A5F5' : '#1976D2'} />
            ) : (
              <Text style={[
                styles.linkText, 
                { color: resendCooldown > 0 ? '#999' : (isDark ? '#42A5F5' : '#1976D2') }
              ]}>
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
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
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  disabledLink: {
    opacity: 0.5,
  },
});
