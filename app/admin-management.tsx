import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

interface AdminItem {
  _id: string;
  name: string;
  email: string;
  role: 'power' | 'admin' | 'd-admin';
  createdAt?: string;
}

export default function AdminManagementScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [admins, setAdmins] = useState<AdminItem[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await authAPI.listAdmins();
    if (res.success) setAdmins(res.data.admins || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const res = await authAPI.listAdmins();
    if (res.success) setAdmins(res.data.admins || []);
    setRefreshing(false);
  }, []);

  const confirmDemote = (email: string, role: string) => {
    if (role === 'power') {
      Alert.alert('Not allowed', 'Cannot demote the primary power admin.');
      return;
    }
    Alert.alert(
      'Demote Admin',
      `Are you sure you want to demote ${email} to user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          style: 'destructive',
          onPress: async () => {
            const res = await authAPI.demoteAdmin(email);
            if (res.success) {
              Alert.alert('Success', res.data.message || 'Admin demoted');
              onRefresh();
            } else {
              Alert.alert('Error', res.message || 'Failed to demote');
            }
          }
        }
      ]
    );
  };

  if (user?.role !== 'power') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}> 
        <Text style={{ color: isDark ? '#FFFFFF' : '#0A1929' }}>Forbidden: Power admin only</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}> 
        <ActivityIndicator color={isDark ? '#42A5F5' : '#1976D2'} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>Admin Management</Text>
        <TouchableOpacity onPress={() => router.push('/create-admin')}>
          <Ionicons name="add-circle" size={28} color={isDark ? '#42A5F5' : '#1976D2'} />
        </TouchableOpacity>
      </View>

      {admins.map((a) => (
        <View key={a._id} style={[styles.item, { backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF' }]}>
          <View style={styles.itemLeft}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]}>
              <Text style={styles.avatarText}>{a.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View>
              <Text style={[styles.name, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>{a.name}</Text>
              <Text style={[styles.email, { color: isDark ? '#90CAF9' : '#546E7A' }]}>{a.email}</Text>
              <Text style={[styles.role, { color: isDark ? '#B2DFDB' : '#00897B' }]}>{a.role}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => confirmDemote(a.email, a.role)} style={styles.demoteBtn}>
              <Ionicons name="arrow-down-circle-outline" size={22} color={isDark ? '#FFCDD2' : '#C62828'} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 20, fontWeight: '800' },
  item: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold' },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 12 },
  role: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  demoteBtn: { padding: 6 },
});
