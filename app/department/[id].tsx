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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { departmentsAPI, Department } from '../../services/departmentsApi';
import { postsAPI } from '../../services/postsApi';
import { Ionicons } from '@expo/vector-icons';

export default function DepartmentFeedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadDepartment = async () => {
    try {
      const data = await departmentsAPI.get(id);
      setDepartment(data.department);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load department');
    }
  };

  const loadPosts = async () => {
    try {
      const params: any = {
        departmentId: id,
        page: 1,
        limit: 20,
      };
      
      if (selectedLevel) {
        params.level = selectedLevel;
      }

      const data = await postsAPI.list(params);
      setPosts(data.posts || []);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDepartment();
    loadPosts();
  }, [id, selectedLevel]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const renderLevelFilter = () => {
    if (!department) return null;

    return (
      <View style={styles.levelFilters}>
        <TouchableOpacity
          style={[styles.levelChip, selectedLevel === '' && styles.levelChipActive]}
          onPress={() => setSelectedLevel('')}
        >
          <Text style={[styles.levelChipText, selectedLevel === '' && styles.levelChipTextActive]}>
            All Levels
          </Text>
        </TouchableOpacity>
        {department.levels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.levelChip, selectedLevel === level && styles.levelChipActive]}
            onPress={() => setSelectedLevel(level)}
          >
            <Text style={[styles.levelChipText, selectedLevel === level && styles.levelChipTextActive]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPost = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      <View style={styles.postHeader}>
        <Text style={styles.postAuthor}>{item.userName}</Text>
        {item.level && (
          <View style={styles.postLevelBadge}>
            <Text style={styles.postLevelText}>{item.level}</Text>
          </View>
        )}
      </View>
      <Text style={styles.postText} numberOfLines={4}>
        {item.text}
      </Text>
      <View style={styles.postFooter}>
        <View style={styles.postStat}>
          <Ionicons name="heart-outline" size={16} color="#666" />
          <Text style={styles.postStatText}>{item.likes?.length || 0}</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.postStatText}>{item.comments?.length || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Department' }} />
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: department?.name || 'Department',
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
        }} 
      />
      
      {renderLevelFilter()}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              {selectedLevel 
                ? `No posts for level ${selectedLevel}` 
                : 'Be the first to post in this department'}
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
  levelFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  levelChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  levelChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  levelChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  postLevelBadge: {
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postLevelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667eea',
  },
  postText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 13,
    color: '#666',
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
