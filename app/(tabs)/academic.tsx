/**
 * ============================================================================
 * ACADEMIC PAGE
 * Faculty and Department Level Navigation
 * Auto-displays user's academic structure and available levels
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import academicApi from '@/services/academicApi';

export default function AcademicPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [faculty, setFaculty] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [userLevel, setUserLevel] = useState<any>(null);

  useEffect(() => {
    loadAcademicStructure();
  }, []);

  const loadAcademicStructure = async () => {
    try {
      setLoading(true);
      const contextData = await academicApi.getUserAcademicContext();
      const academicContext = contextData?.context || {};

      setFaculty(academicContext.faculty || null);
      setDepartment(academicContext.department || null);
      setUserLevel(academicContext.level || null);

      if (academicContext.department?.id) {
        const levelsData = await academicApi.getDepartmentLevels(academicContext.department.id);
        setLevels(levelsData.levels || []);
      } else {
        setLevels([]);
      }

    } catch (error) {
      console.error('Error loading academic structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAcademicStructure();
    setRefreshing(false);
  };

  const navigateToGlobalPosts = () => {
    router.push('/academic/global');
  };

  const navigateToFacultyPosts = () => {
    if (faculty) {
      router.push(`/faculty-channel/${faculty.id}`);
    }
  };

  const navigateToLevelPosts = (level: any) => {
    router.push(`/academic/level/${level.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Loading academic structure...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academic Notice Board</Text>
        <Text style={styles.headerSubtitle}>Your Academic Structure</Text>
      </View>

      {/* Global Posts */}
      <TouchableOpacity style={styles.card} onPress={navigateToGlobalPosts}>
        <View style={styles.cardIcon}>
          <Ionicons name="globe" size={32} color="#1e88e5" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>🌍 Global Posts</Text>
          <Text style={styles.cardSubtitle}>University-wide announcements</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </TouchableOpacity>

      {/* Faculty Section */}
      {faculty && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Faculty</Text>
          <TouchableOpacity style={styles.card} onPress={navigateToFacultyPosts}>
            <View style={styles.cardIcon}>
              <Ionicons name="school" size={32} color="#4caf50" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{faculty.name}</Text>
              <Text style={styles.cardSubtitle}>{faculty.code}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Department Section */}
      {department && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Department</Text>
          <View style={styles.deptCard}>
            <View style={styles.deptHeader}>
              <Ionicons name="business" size={24} color="#ff9800" />
              <Text style={styles.deptName}>{department.name}</Text>
            </View>
            <Text style={styles.deptCode}>{department.code}</Text>
            {department.description && (
              <Text style={styles.deptDescription}>{department.description}</Text>
            )}
          </View>
        </View>
      )}

      {/* Levels Section (100-500) */}
      {levels.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Department Levels</Text>
          <Text style={styles.sectionSubtitle}>
            Tap on a level to view posts for that level
          </Text>

          <View style={styles.levelsGrid}>
            {levels.map((level) => {
              const isUserLevel = level.id === userLevel?.id;
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelCard,
                    isUserLevel && styles.levelCardActive
                  ]}
                  onPress={() => navigateToLevelPosts(level)}
                >
                  <View style={styles.levelIconContainer}>
                    <Ionicons
                      name={isUserLevel ? "bookmark" : "book-outline"}
                      size={28}
                      color={isUserLevel ? "#fff" : "#1e88e5"}
                    />
                  </View>
                  <Text style={[
                    styles.levelNumber,
                    isUserLevel && styles.levelNumberActive
                  ]}>
                    {level.levelNumber}
                  </Text>
                  <Text style={[
                    styles.levelName,
                    isUserLevel && styles.levelNameActive
                  ]}>
                    {level.displayName}
                  </Text>
                  {isUserLevel && (
                    <View style={styles.yourLevelBadge}>
                      <Text style={styles.yourLevelText}>YOUR LEVEL</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      {['admin', 'power', 'd-admin'].includes(user?.role || '') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/create-academic-post')}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You can view posts from your level and faculty
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  header: {
    backgroundColor: '#1e88e5',
    padding: 20,
    paddingTop: 40
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  card: {
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
    elevation: 3
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  cardContent: {
    flex: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  deptCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  deptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  deptName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8
  },
  deptCode: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: '600',
    marginBottom: 8
  },
  deptDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  levelCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  levelCardActive: {
    backgroundColor: '#1e88e5',
    borderColor: '#1565c0'
  },
  levelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e88e5'
  },
  levelNumberActive: {
    color: '#fff'
  },
  levelName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  levelNameActive: {
    color: '#fff'
  },
  yourLevelBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8
  },
  yourLevelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8
  },
  footer: {
    padding: 20,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center'
  }
});
