import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Platform,
  ToastAndroid,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // Lightweight fallback for iOS/web
      Alert.alert('', message);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}>
        <ActivityIndicator size="large" color={isDark ? '#42A5F5' : '#1976D2'} />
        <Text style={[styles.loadingText, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>Loading...</Text>
      </View>
    );
  }

  const bgGradient = isDark ? ['#0A1929', '#0B2742'] : ['#E6F4FE', '#DCEEFE'];
  const cardBg = isDark ? '#0F213A' : '#FFFFFF';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';

  return (
    <LinearGradient colors={bgGradient} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)' }]}>
          {/* Logo */}
          <View style={[styles.logoCircle, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]}>
            <Text style={styles.logoText}>AT</Text>
          </View>

          {/* Copy */}
          <Text style={[styles.title, { color: textPrimary }]}>ADUSTECH</Text>
          <Text style={[styles.subtitle, { color: muted }]}>Innovation Simplified</Text>
          <Text style={[styles.helperText, { color: muted }]}>Welcome! Get started by creating an account or logging in.</Text>

          {/* Actions */}
          <Pressable
            style={styles.buttonWrap}
            onPress={() => {
              showToast('Navigating to Sign in');
              router.push('/login');
            }}
          >
            <LinearGradient colors={['#1976D2', '#42A5F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
              <View style={styles.buttonContent}>
                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Sign in</Text>
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => {
              showToast('Navigating to Create account');
              router.push('/register');
            }}
            style={[styles.secondaryButton, { borderColor: isDark ? '#42A5F5' : '#1976D2' }]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="person-add-outline" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
              <Text style={[styles.secondaryText, { color: isDark ? '#64B5F6' : '#1976D2' }]}>Create account</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 16 },
  card: {
    alignItems: 'center',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  logoText: { fontSize: 40, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { marginTop: 4, fontSize: 14 },
  helperText: { marginTop: 12, textAlign: 'center' },
  buttonWrap: { width: '100%', marginTop: 24 },
  primaryButton: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, marginLeft: 8 },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginTop: 12,
  },
  secondaryText: { fontWeight: '700', fontSize: 16, marginLeft: 8 },
});
