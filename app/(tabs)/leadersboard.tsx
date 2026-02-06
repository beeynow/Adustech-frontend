import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

interface LeaderboardUser {
  id: number;
  name: string;
  points: number;
  avatar?: string;
  department?: string;
  badge?: string;
  rank: number;
  change?: number; // Position change from last week (+1, -1, 0)
}

// Mock data - Replace with actual API call
const MOCK_LEADERS: LeaderboardUser[] = [
  { id: 1, name: 'Ahmed Ibrahim', points: 2850, rank: 1, department: 'Computer Science', badge: '🏆', change: 0 },
  { id: 2, name: 'Fatima Yusuf', points: 2720, rank: 2, department: 'Engineering', badge: '🥈', change: 1 },
  { id: 3, name: 'Usman Abdullahi', points: 2680, rank: 3, department: 'Business Admin', badge: '🥉', change: -1 },
  { id: 4, name: 'Aisha Mohammed', points: 2450, rank: 4, department: 'Computer Science', change: 2 },
  { id: 5, name: 'Ibrahim Sani', points: 2380, rank: 5, department: 'Engineering', change: 0 },
  { id: 6, name: 'Maryam Hassan', points: 2210, rank: 6, department: 'Sciences', change: -1 },
  { id: 7, name: 'Yusuf Bello', points: 2150, rank: 7, department: 'Computer Science', change: 3 },
  { id: 8, name: 'Hauwa Aliyu', points: 2090, rank: 8, department: 'Business Admin', change: -2 },
  { id: 9, name: 'Suleiman Garba', points: 2020, rank: 9, department: 'Engineering', change: 1 },
  { id: 10, name: 'Zainab Ahmad', points: 1980, rank: 10, department: 'Sciences', change: -1 },
];

export default function LeadersboardScreen() {
  const isDark = useColorScheme() === 'dark';
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'dept' | 'weekly'>('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLeaders(MOCK_LEADERS);
      setLoading(false);
    }, 500);
  }, []);

  const getRankColor = (rank: number) => {
    if (rank === 1) return ['#FFD700', '#FFA500']; // Gold gradient
    if (rank === 2) return ['#C0C0C0', '#A8A8A8']; // Silver gradient
    if (rank === 3) return ['#CD7F32', '#8B4513']; // Bronze gradient
    return isDark ? ['#1E3A5F', '#0F213A'] : ['#FFFFFF', '#F5F5F5'];
  };

  const renderTopThree = () => {
    const top3 = leaders.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <View style={styles.podiumContainer}>
        {/* Second Place */}
        {top3[1] && (
          <View style={[styles.podiumItem, styles.secondPlace]}>
            <LinearGradient
              colors={getRankColor(2)}
              style={styles.podiumCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, styles.avatarMedium, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]}>
                  <Text style={styles.avatarText}>{top3[1].name.charAt(0)}</Text>
                </View>
                <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}>
                  <Text style={styles.rankBadgeText}>2</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3[1].name}</Text>
              <Text style={styles.podiumPoints}>{top3[1].points.toLocaleString()}</Text>
              <Text style={styles.podiumLabel}>points</Text>
            </LinearGradient>
          </View>
        )}

        {/* First Place */}
        {top3[0] && (
          <View style={[styles.podiumItem, styles.firstPlace]}>
            <View style={styles.crownContainer}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            <LinearGradient
              colors={getRankColor(1)}
              style={[styles.podiumCard, styles.podiumCardTall]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, styles.avatarLarge, { backgroundColor: '#FFD700' }]}>
                  <Text style={[styles.avatarText, { fontSize: 32 }]}>{top3[0].name.charAt(0)}</Text>
                </View>
                <View style={[styles.rankBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={styles.rankBadgeText}>1</Text>
                </View>
              </View>
              <Text style={[styles.podiumName, { fontSize: 16, fontWeight: '800' }]} numberOfLines={1}>{top3[0].name}</Text>
              <Text style={[styles.podiumPoints, { fontSize: 24 }]}>{top3[0].points.toLocaleString()}</Text>
              <Text style={styles.podiumLabel}>points</Text>
            </LinearGradient>
          </View>
        )}

        {/* Third Place */}
        {top3[2] && (
          <View style={[styles.podiumItem, styles.thirdPlace]}>
            <LinearGradient
              colors={getRankColor(3)}
              style={styles.podiumCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, styles.avatarMedium, { backgroundColor: '#CD7F32' }]}>
                  <Text style={styles.avatarText}>{top3[2].name.charAt(0)}</Text>
                </View>
                <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                  <Text style={styles.rankBadgeText}>3</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3[2].name}</Text>
              <Text style={styles.podiumPoints}>{top3[2].points.toLocaleString()}</Text>
              <Text style={styles.podiumLabel}>points</Text>
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}>
        <ActivityIndicator size="large" color={isDark ? '#42A5F5' : '#1976D2'} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}> 
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>Leaderboard</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#90CAF9' : '#546E7A' }]}>Top performers this month</Text>
        </View>
        <TouchableOpacity style={[styles.infoButton, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="information-circle-outline" size={24} color={isDark ? '#42A5F5' : '#1976D2'} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && styles.tabActive,
            { backgroundColor: activeTab === 'all' ? (isDark ? '#42A5F5' : '#1976D2') : (isDark ? '#1E3A5F' : '#FFFFFF') }
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'all' ? '#FFFFFF' : (isDark ? '#90CAF9' : '#546E7A') }]}>
            All Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'dept' && styles.tabActive,
            { backgroundColor: activeTab === 'dept' ? (isDark ? '#42A5F5' : '#1976D2') : (isDark ? '#1E3A5F' : '#FFFFFF') }
          ]}
          onPress={() => setActiveTab('dept')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'dept' ? '#FFFFFF' : (isDark ? '#90CAF9' : '#546E7A') }]}>
            Department
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'weekly' && styles.tabActive,
            { backgroundColor: activeTab === 'weekly' ? (isDark ? '#42A5F5' : '#1976D2') : (isDark ? '#1E3A5F' : '#FFFFFF') }
          ]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'weekly' ? '#FFFFFF' : (isDark ? '#90CAF9' : '#546E7A') }]}>
            This Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Top 3 Podium */}
      {renderTopThree()}

      {/* Rest of Leaders */}
      <View style={styles.listContainer}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#90CAF9' : '#546E7A' }]}>Other Top Performers</Text>
        {leaders.slice(3).map((user) => (
          <View
            key={user.id}
            style={[
              styles.leaderCard,
              { 
                backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF',
                borderColor: isDark ? 'rgba(66,165,245,0.2)' : 'rgba(25,118,210,0.1)',
              }
            ]}
          >
            <View style={styles.leaderLeft}>
              <Text style={[styles.leaderRank, { color: isDark ? '#90CAF9' : '#546E7A' }]}>#{user.rank}</Text>
              <View style={[styles.avatar, styles.avatarSmall, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]}>
                <Text style={[styles.avatarText, { fontSize: 16 }]}>{user.name.charAt(0)}</Text>
              </View>
              <View style={styles.leaderInfo}>
                <Text style={[styles.leaderName, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>{user.name}</Text>
                <Text style={[styles.leaderDept, { color: isDark ? '#90CAF9' : '#546E7A' }]}>{user.department}</Text>
              </View>
            </View>
            <View style={styles.leaderRight}>
              {user.change !== undefined && user.change !== 0 && (
                <View style={styles.changeIndicator}>
                  <Ionicons 
                    name={user.change > 0 ? 'trending-up' : 'trending-down'} 
                    size={16} 
                    color={user.change > 0 ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={[styles.changeText, { color: user.change > 0 ? '#4CAF50' : '#F44336' }]}>
                    {Math.abs(user.change)}
                  </Text>
                </View>
              )}
              <Text style={[styles.leaderPoints, { color: isDark ? '#42A5F5' : '#1976D2' }]}>
                {user.points.toLocaleString()}
              </Text>
              <Text style={[styles.pointsLabel, { color: isDark ? '#546E7A' : '#B0BEC5' }]}>points</Text>
            </View>
          </View>
        ))}
      </View>

      {/* How to Earn Points Card */}
      <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD', borderColor: isDark ? 'rgba(66,165,245,0.3)' : 'rgba(25,118,210,0.2)' }]}>
        <Ionicons name="trophy" size={24} color={isDark ? '#FFD700' : '#FFA000'} />
        <View style={styles.infoCardContent}>
          <Text style={[styles.infoCardTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>How to Earn Points</Text>
          <Text style={[styles.infoCardText, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
            Post quality content, engage with discussions, attend events, and help fellow students to climb the leaderboard!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabActive: {
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  podiumItem: { flex: 1, alignItems: 'center' },
  firstPlace: { zIndex: 3 },
  secondPlace: { zIndex: 2 },
  thirdPlace: { zIndex: 1 },
  crownContainer: { marginBottom: -10, zIndex: 10 },
  crownEmoji: { fontSize: 32 },
  podiumCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  podiumCardTall: { paddingVertical: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  avatarSmall: { width: 40, height: 40 },
  avatarMedium: { width: 60, height: 60 },
  avatarLarge: { width: 80, height: 80 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 24 },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  rankBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  podiumName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  podiumPoints: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  podiumLabel: { fontSize: 11, color: '#FFFFFFCC', marginTop: 2 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  leaderRank: { fontSize: 16, fontWeight: '700', width: 32 },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  leaderDept: { fontSize: 12 },
  leaderRight: { alignItems: 'flex-end' },
  changeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  changeText: { fontSize: 12, fontWeight: '700' },
  leaderPoints: { fontSize: 18, fontWeight: '800' },
  pointsLabel: { fontSize: 11, marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 2,
  },
  infoCardContent: { flex: 1 },
  infoCardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  infoCardText: { fontSize: 13, lineHeight: 20 },
});
