import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { departmentsAPI, Department } from '../services/departmentsApi';
import { Ionicons } from '@expo/vector-icons';

export default function DepartmentsScreen() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadDepartments = async () => {
    try {
      const data = await departmentsAPI.list({ isActive: true });
      setDepartments(data.departments || []);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDepartments();
  };

  const handleDepartmentPress = (department: Department) => {
    // Navigate to department channel/feed
    router.push(`/department/${department.id}`);
  };

  const renderDepartment = ({ item }: { item: Department }) => (
    <TouchableOpacity
      style={styles.departmentCard}
      onPress={() => handleDepartmentPress(item)}
    >
      <View style={styles.departmentIcon}>
        <Ionicons name="school" size={32} color="#667eea" />
      </View>
      <View style={styles.departmentInfo}>
        <Text style={styles.departmentName}>{item.name}</Text>
        <Text style={styles.departmentCode}>{item.code}</Text>
        {item.description && (
          <Text style={styles.departmentDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.faculty && (
          <Text style={styles.departmentFaculty}>{item.faculty}</Text>
        )}
        <View style={styles.levelsContainer}>
          {item.levels.map((level) => (
            <View key={level} style={styles.levelBadge}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
          ))}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Departments' }} />
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Department Channels',
          headerStyle: { backgroundColor: '#1976D2' },
          headerTintColor: '#fff',
        }} 
      />
      
      <FlatList
        data={departments}
        renderItem={renderDepartment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No departments available</Text>
            <Text style={styles.emptySubtext}>
              Departments will appear here once created by administrators
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  departmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  departmentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  departmentCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  departmentDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  departmentFaculty: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  levelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelBadge: {
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667eea',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
