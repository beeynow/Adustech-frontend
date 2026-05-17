import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { getRuntimeConfig } from '@/services/config';
import { showToast } from '@/utils/toast';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const runtime = getRuntimeConfig();

  const handleLogout = async () => {
    await logout();
    showToast.success('You have been signed out.');
    router.replace('/login');
  };

  return (
    <LinearGradient colors={['#F8FBFF', '#E9F4FF', '#D9ECFF']} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={18} color="#0F172A" />
            </Pressable>
            <View style={styles.headerTextWrap}>
              <Text style={styles.eyebrow}>Settings</Text>
              <Text style={styles.title}>Account and connection</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Signed in as</Text>
            <Text style={styles.infoTitle}>{user?.name || 'ADUSTECH user'}</Text>
            <Text style={styles.infoText}>{user?.email}</Text>
            <Text style={styles.infoText}>Role: {user?.role || 'user'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Runtime</Text>
            <Text style={styles.infoTitle}>{runtime.environment}</Text>
            <Text style={styles.infoText}>Backend: {runtime.apiBaseUrl}</Text>
            <Text style={styles.infoHint}>
              This helps confirm which backend the app is currently targeting.
            </Text>
          </View>

          <Pressable style={styles.actionRow} onPress={() => router.push('/change-password')}>
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#1976D2" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Change password</Text>
              <Text style={styles.actionText}>Update your credential securely.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#60758A" />
          </Pressable>

          <Pressable style={styles.actionRow} onPress={() => router.push('/support')}>
            <View style={styles.actionIcon}>
              <Ionicons name="help-buoy-outline" size={18} color="#1976D2" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Support</Text>
              <Text style={styles.actionText}>Open help and support resources.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#60758A" />
          </Pressable>

          <Pressable style={styles.logoutButton} onPress={() => void handleLogout()}>
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <Text style={styles.logoutLabel}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(25,118,210,0.12)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 4,
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '900',
  },
  infoCard: {
    borderRadius: 20,
    backgroundColor: '#F5FAFF',
    padding: 16,
    marginBottom: 14,
  },
  infoLabel: {
    color: '#60758A',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  infoTitle: {
    marginTop: 6,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  infoText: {
    marginTop: 4,
    color: '#486274',
    fontSize: 14,
    lineHeight: 20,
  },
  infoHint: {
    marginTop: 8,
    color: '#6D8298',
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF4FF',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  actionText: {
    marginTop: 4,
    color: '#60758A',
    fontSize: 13,
    lineHeight: 18,
  },
  logoutButton: {
    marginTop: 6,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#D93025',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
