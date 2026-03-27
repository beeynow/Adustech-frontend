import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, useColorScheme, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { showToast } from '../utils/toast';
import { getPasswordValidationErrors, isValidEmail, normalizeEmail } from '../utils/validation';
import { departmentsAPI, Department } from '../services/departmentsApi';

export default function CreateAdminScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'd-admin'>('admin');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const passwordErrors = useMemo(() => getPasswordValidationErrors(password), [password]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const response = await departmentsAPI.list({ isActive: true });
        setDepartments(response.departments || []);
      } catch {
        showToast.error('Failed to load departments for admin assignment.');
      } finally {
        setDepartmentsLoading(false);
      }
    };

    loadDepartments();
  }, []);

  if (user?.role !== 'power') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}> 
        <Text style={{ color: isDark ? '#FFFFFF' : '#0A1929' }}>Forbidden: Power admin only</Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showToast.warning('Name, email, password, and role are required.');
      return;
    }
    if (!isValidEmail(email)) {
      showToast.error('Enter a valid email address.', 'Invalid Email');
      return;
    }
    if (passwordErrors.length > 0) {
      showToast.error(passwordErrors[0], 'Weak Password');
      return;
    }
    if (role === 'd-admin' && !selectedDepartmentId) {
      showToast.warning('Choose the department this admin will manage.');
      return;
    }
    setLoading(true);
    const res = await authAPI.createAdmin({
      name: name.trim(),
      email: normalizeEmail(email),
      password,
      role,
      departmentId: role === 'd-admin' ? selectedDepartmentId : undefined,
    });
    setLoading(false);
    if (res.success) {
      showToast.success(res.data.message || 'Admin created successfully.');
      router.back();
    } else {
      showToast.error(res.message || 'Failed to create admin.');
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
              <View style={styles.roleSwitch}>
                <TouchableOpacity
                  onPress={() => setRole('admin')}
                  style={[styles.roleChip, role === 'admin' && styles.roleChipActive]}
                  disabled={loading}
                >
                  <Text style={[styles.roleChipText, role === 'admin' && styles.roleChipTextActive]}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRole('d-admin')}
                  style={[styles.roleChip, role === 'd-admin' && styles.roleChipActive]}
                  disabled={loading}
                >
                  <Text style={[styles.roleChipText, role === 'd-admin' && styles.roleChipTextActive]}>Department Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            {role === 'd-admin' ? (
              <View style={[styles.departmentPicker, { backgroundColor: inputBg, borderColor: border }]}>
                <Text style={[styles.departmentLabel, { color: textPrimary }]}>Managed Department</Text>
                <Text style={[styles.departmentHint, { color: muted }]}>Each department can have at most 2 assigned admins.</Text>
                {departmentsLoading ? (
                  <ActivityIndicator color={isDark ? '#42A5F5' : '#1976D2'} style={styles.departmentLoading} />
                ) : (
                  <View style={styles.departmentChips}>
                    {departments.map((department) => {
                      const selected = selectedDepartmentId === department.id;
                      return (
                        <TouchableOpacity
                          key={department.id}
                          onPress={() => setSelectedDepartmentId(department.id)}
                          style={[styles.departmentChip, selected && styles.departmentChipActive]}
                          disabled={loading}
                        >
                          <Text style={[styles.departmentChipText, selected && styles.departmentChipTextActive]}>
                            {department.code}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                {selectedDepartmentId ? (
                  <Text style={[styles.departmentSelected, { color: muted }]}>
                    {departments.find((department) => department.id === selectedDepartmentId)?.name || 'Department selected'}
                  </Text>
                ) : null}
              </View>
            ) : null}

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
  roleSwitch: { flex: 1, flexDirection: 'row', gap: 8 },
  roleChip: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(148,163,184,0.16)', alignItems: 'center' },
  roleChipActive: { backgroundColor: '#1976D2' },
  roleChipText: { fontSize: 13, fontWeight: '700', color: '#5B7083' },
  roleChipTextActive: { color: '#FFFFFF' },
  departmentPicker: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  departmentLabel: { fontSize: 15, fontWeight: '800' },
  departmentHint: { fontSize: 12, marginTop: 4, marginBottom: 12 },
  departmentLoading: { marginVertical: 10 },
  departmentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  departmentChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(148,163,184,0.16)' },
  departmentChipActive: { backgroundColor: '#1976D2' },
  departmentChipText: { fontSize: 12, fontWeight: '800', color: '#5B7083' },
  departmentChipTextActive: { color: '#FFFFFF' },
  departmentSelected: { marginTop: 12, fontSize: 13, fontWeight: '600' },
  buttonWrap: { marginTop: 4 },
  primaryButton: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, marginRight: 8 },
});
