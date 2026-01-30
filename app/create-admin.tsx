import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, useColorScheme, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import api, { authAPI } from '../services/api';

export default function CreateAdminScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'd-admin'>('admin');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  if (user?.role !== 'power') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}> 
        <Text style={{ color: isDark ? '#FFFFFF' : '#0A1929' }}>Forbidden: Power admin only</Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    setLoading(true);
    const res = await authAPI.createAdmin({ name, email, password, role });
    setLoading(false);
    if (res.success) {
      Alert.alert('Success', res.data.message || 'Admin created');
      router.back();
    } else {
      Alert.alert('Error', res.message || 'Failed to create admin');
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
              <Text style={[styles.title, { color: textPrimary }]}>Create Admin</Text>
              <Text style={[styles.subtitle, { color: muted }]}>Only 
                <Text style={{ fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#0A1929' }}> Power Admin </Text>
                can create admin positions
              </Text>
            </View>

            {/* Name */}
            <View style={[styles.inputGroup, { backgroundColor: inputBg, borderColor: border }]}> 
              <Ionicons name="person-outline" size={20} color={muted} style={styles.leadingIcon} />
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="Full name"
                placeholderTextColor={muted}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            {/* Email */}
            <View style={[styles.inputGroup, { backgroundColor: inputBg, borderColor: border }]}> 
              <Ionicons name="mail-outline" size={20} color={muted} style={styles.leadingIcon} />
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="Email"
                placeholderTextColor={muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputGroup, { backgroundColor: inputBg, borderColor: border }]}> 
              <Ionicons name="lock-closed-outline" size={20} color={muted} style={styles.leadingIcon} />
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="Temporary password"
                placeholderTextColor={muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Role */}
            <View style={[styles.inputGroup, { backgroundColor: inputBg, borderColor: border }]}> 
              <Ionicons name="ribbon-outline" size={20} color={muted} style={styles.leadingIcon} />
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="Role: admin or d-admin"
                placeholderTextColor={muted}
                value={role}
                onChangeText={(val) => setRole((val.trim() as 'admin' | 'd-admin') || 'admin')}
                editable={!loading}
              />
            </View>

            <Pressable disabled={loading} onPress={handleSubmit} style={styles.buttonWrap}>
              <LinearGradient colors={['#1976D2', '#42A5F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Create admin</Text>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
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
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  card: { borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
  header: { alignItems: 'center', marginBottom: 24 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginBottom: 16 },
  logoText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { marginTop: 4, fontSize: 14, textAlign: 'center' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, height: 56, marginBottom: 14 },
  leadingIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16 },
  buttonWrap: { marginTop: 4 },
  primaryButton: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, marginRight: 8 },
});
