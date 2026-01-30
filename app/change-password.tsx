import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, useColorScheme, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const { changePassword } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setLoading(false);
    if (res.success) {
      Alert.alert('Success', res.message || 'Password changed successfully');
      router.back();
    } else {
      Alert.alert('Error', res.message || 'Failed to change password');
    }
  };

  const bgGradient = isDark ? ['#0A1929', '#0B2742'] : ['#E6F4FE', '#DCEEFE'];
  const cardBg = isDark ? '#0F213A' : '#FFFFFF';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const inputBg = isDark ? '#122A4A' : '#F8FAFC';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <LinearGradient colors={bgGradient} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.header}>
              <View style={[styles.logoCircle, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]}>
                <Text style={styles.logoText}>AT</Text>
              </View>
              <Text style={[styles.title, { color: textPrimary }]}>Change password</Text>
              <Text style={[styles.subtitle, { color: muted }]}>Keep your account secure</Text>
            </View>

            <View style={[styles.inputGroup, { backgroundColor: inputBg, borderColor: border }]}> 
              <Ionicons name="lock-closed-outline" size={20} color={muted} style={styles.leadingIcon} />
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="Current password"
                placeholderTextColor={muted}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                editable={!loading}
                returnKeyType="next"
              />
              <Pressable accessibilityRole="button" onPress={() => setShowCurrent(v => !v)} disabled={loading} style={styles.trailingIcon}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={muted} />
              </Pressable>
            </View>

            <View style={[styles.inputGroup, { backgroundColor: inputBg, borderColor: border }]}> 
              <Ionicons name="key-outline" size={20} color={muted} style={styles.leadingIcon} />
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="New password"
                placeholderTextColor={muted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                editable={!loading}
                returnKeyType="done"
              />
              <Pressable accessibilityRole="button" onPress={() => setShowNew(v => !v)} disabled={loading} style={styles.trailingIcon}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={muted} />
              </Pressable>
            </View>

            <Pressable disabled={loading} onPress={handleSubmit} style={styles.buttonWrap}>
              <LinearGradient colors={['#1976D2', '#42A5F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Update password</Text>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.footerRow}>
              <Pressable onPress={() => router.back()} disabled={loading}>
                <Text style={[styles.linkText, { color: isDark ? '#64B5F6' : '#1976D2' }]}>Back</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  card: { borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
  header: { alignItems: 'center', marginBottom: 24 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginBottom: 16 },
  logoText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { marginTop: 4, fontSize: 14 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, height: 56, marginBottom: 14 },
  leadingIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16 },
  trailingIcon: { padding: 8, marginLeft: 4 },
  buttonWrap: { marginTop: 4 },
  primaryButton: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, marginRight: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  linkText: { fontWeight: '700', fontSize: 14 },
});
